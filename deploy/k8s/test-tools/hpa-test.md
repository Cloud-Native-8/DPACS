# HPA 測試文件：access

## 目的

驗證 `access` 的 HPA 是否可以根據 CPU 使用率自動擴充 Pod replicas。

測試重點：

- HPA 是否能讀到 metrics-server 的 CPU metrics
- access CPU 超過 target 後，是否會自動 scale out
- scale out 後是否會建立新的 access Pods
- 測試完成後如何清理 load generator
- 如果 Pod Pending，要如何判斷是否為 node capacity 問題

---

## 目前 access 設定

### Deployment resources

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

### HPA

```yaml
minReplicas: 2
maxReplicas: 10
averageUtilization: 60
```

代表：

- access 最少維持 2 個 Pods
- access 最多可擴到 10 個 Pods
- CPU target 是 `request.cpu` 的 60%
- 因為 `request.cpu = 100m`，所以 target 約等於每顆 Pod 平均 `60m CPU`

---

## 前置檢查

確認 metrics-server 正常：

```bash
kubectl get deployment metrics-server -n kube-system
```

確認可以取得 metrics：

```bash
kubectl top pods -n test
```

確認 access HPA 狀態：

```bash
kubectl -n test get hpa access
```

正常會看到類似：

```txt
NAME     REFERENCE           TARGETS       MINPODS   MAXPODS   REPLICAS
access   Deployment/access   cpu: 1%/60%   2         10        2
```

如果 `TARGETS` 是 `<unknown>/60%`，通常代表：

- metrics-server 還沒抓到資料
- Pod 還沒 ready
- container 沒有設定 `resources.requests.cpu`

---

## 測試前開啟監看視窗

### Terminal 1：監看 HPA

```bash
kubectl -n test get hpa access -w
```

觀察：

```txt
cpu: 1%/60%
cpu: 80%/60%
REPLICAS 2 → 3 → 4
```

---

### Terminal 2：監看 Deployment

```bash
kubectl -n test get deploy access -w
```

觀察：

```txt
access 2/2
access 2/3
access 3/3
access 4/4
```

---

### Terminal 3：監看 Pods

```bash
kubectl -n test get pods -l app=access -w
```

觀察新增 Pod 狀態：

```txt
Pending
ContainerCreating
Running
Ready
```

---

### 可選：查看 Pod CPU

```bash
kubectl top pods -n test -l app=access
```

查看 Node CPU / memory：

```bash
kubectl top nodes
```

---

## 執行 Load Generator

套用 load generator：

```bash
kubectl apply -f deploy/k8s/test-tools/access-loadgen.yaml
```

loadgen 會持續打：

```txt
http://access/healthz
```

用來製造 access CPU 負載。

---

## 成功判斷

HPA 成功時，會看到類似：

```txt
access   Deployment/access   cpu: 88%/60%   2   10   2
access   Deployment/access   cpu: 87%/60%   2   10   3
access   Deployment/access   cpu: 73%/60%   2   10   4
```

代表：

- CPU 超過 target 60%
- HPA 自動將 replicas 從 2 擴到 3、4
- HPA 機制正常

擴容後 CPU 下降，例如：

```txt
cpu: 48%/60%
```

代表新 Pods 分攤了負載，這是預期行為。

---

## CPU 60% 是什麼意思？

HPA 的 `averageUtilization: 60` 不是 node CPU 的 60%，也不是 CPU limit 的 60%。

它是：

```txt
Pod 實際 CPU 使用量 / Pod 的 CPU request
```

以 access 為例：

```yaml
requests:
  cpu: "100m"
limits:
  cpu: "500m"
```

所以：

```txt
HPA target 60% = 100m × 60% = 60m
```

也就是 HPA 希望每顆 access Pod 平均 CPU 約維持在 `60m`。

例如：

| 平均 CPU 使用量 | 對 request=100m 的使用率 | HPA 反應         |
| --------------: | -----------------------: | ---------------- |
|             10m |                      10% | 維持 minReplicas |
|             60m |                      60% | 接近目標         |
|             90m |                      90% | 可能 scale out   |
|            120m |                     120% | 明顯 scale out   |

---

## 測試完成後清理

刪掉 loadgen：

```bash
kubectl -n test delete deployment access-loadgen --ignore-not-found
```

HPA 不會立刻 scale down，通常會等幾分鐘後才慢慢降回 `minReplicas: 2`。

觀察：

```bash
kubectl -n test get hpa access -w
```

```bash
kubectl -n test get deploy access -w
```

---

## 如果想立即恢復 develop 狀態

刪掉 loadgen：

```bash
kubectl -n test delete deployment access-loadgen --ignore-not-found
```

如果不想讓 HPA 繼續控制 replicas，可以先刪掉 HPA：

```bash
kubectl -n test delete hpa access --ignore-not-found
```

手動調整 access replicas：

```bash
kubectl -n test scale deployment/access --replicas=2
```

如果要重新啟用 HPA：

```bash
kubectl apply -f deploy/k8s/test/10-hpa.yaml
```

---

## 常見狀況：Pod Pending

如果 HPA 有把 replicas 拉高，但新 Pod 卡在 Pending：

```bash
kubectl -n test describe pod <pending-pod-name>
```

如果看到：

```txt
Too many pods
```

代表不是 CPU / memory 不夠，而是單一 node 的 Pod 數量上限滿了。

查看 node pod capacity：

```bash
kubectl describe node <node-name> | grep -A10 "Capacity"
```

例如：

```txt
pods: 17
```

查看目前所有 Pods：

```bash
kubectl get pods -A -o wide
```

develop 環境如果 node group 是 `1 / 1 / 1`，Pod Pending 是合理的，因為 HPA 只會增加 Pod replicas，不會自己新增 node。

---

## Node group 與 HPA 的關係

HPA 管的是 Pod 數量：

```txt
access replicas 2 → 3 → 4
```

Node group 管的是 EC2 worker node 數量：

```txt
node 1 台 → 2 台
```

如果 node group 是：

```txt
min = 1
desired = 1
max = 1
```

代表永遠只有 1 台 node。

即使 HPA 想增加 Pods，如果 node 放不下，新 Pods 還是會 Pending。

如果要讓 cluster 有更多空間，可以手動把 node group 擴到 2 台：

```bash
aws eks update-nodegroup-config \
  --region ap-northeast-1 \
  --cluster-name DPACS \
  --nodegroup-name <nodegroup-name> \
  --scaling-config minSize=1,maxSize=2,desiredSize=2
```

測完後再縮回：

```bash
aws eks update-nodegroup-config \
  --region ap-northeast-1 \
  --cluster-name DPACS \
  --nodegroup-name <nodegroup-name> \
  --scaling-config minSize=1,maxSize=1,desiredSize=1
```

---

## 查詢 node group name

```bash
aws eks list-nodegroups \
  --region ap-northeast-1 \
  --cluster-name DPACS
```

查目前 scaling config：

```bash
aws eks describe-nodegroup \
  --region ap-northeast-1 \
  --cluster-name DPACS \
  --nodegroup-name <nodegroup-name> \
  --query "nodegroup.scalingConfig"
```

---

## develop 環境建議

目前為了省成本，可以維持：

```txt
node group:
min = 1
desired = 1
max = 1
```

這代表：

- HPA 可以增加 Pod replicas
- 但如果 node 放不下，新 Pod 會 Pending
- 不會自動新增 node

如果要正式讓 HPA scale out 時自動增加 node，需要另外導入：

- Cluster Autoscaler
- 或 Karpenter

---

## 測試結論範例

本次測試結果：

```txt
HPA 成功讀取 CPU metrics。
access CPU 超過 60% target 後，自動從 2 replicas 擴到 4 replicas。
擴容後 CPU utilization 下降。
HPA 功能正常。
```

補充：

```txt
若 Pod Pending 並顯示 Too many pods，原因是目前 develop node group 只有 1 node，且 node pod capacity 已滿。
這不是 HPA 錯誤，而是 node capacity 限制。
```
