# Cluster Autoscaler 操作文件

## 目的

讓 EKS 在 Pod 因為 node 資源或 pod capacity 不足而 Pending 時，可以自動增加 node；當負載下降且 node 空閒後，再自動縮回較少的 node 數。

目前 develop 環境的目標是：

```txt
平常省錢：node group 維持 1 台 node
測 HPA / 負載時：必要時自動擴到最多 3 台 node
負載結束後：自動或手動縮回 1 台 node
```

---

## 一、基本概念

### HPA 與 Cluster Autoscaler 的差異

```txt
HPA：調整 Pod 數量
Cluster Autoscaler：調整 Node 數量
```

流程：

```txt
access CPU 變高
  ↓
HPA 增加 access replicas
  ↓
新 Pod 先嘗試排到現有 node
  ↓
如果現有 node 放不下，Pod 變 Pending
  ↓
Cluster Autoscaler 看到 Pending Pod
  ↓
呼叫 AWS API 調高 node group desiredSize
  ↓
AWS 開新的 EC2 node
  ↓
Pending Pod 被排到新 node
```

### node group 的 min / desired / max

```txt
minSize：node group 最少保留幾台 node
desiredSize：目前希望維持幾台 node
maxSize：最多允許擴到幾台 node
```

注意：

```txt
maxSize 只是上限，不代表會自動擴容。
沒有 Cluster Autoscaler 時，即使 maxSize=3，只要 desiredSize=1，就仍然只有 1 台 node。
```

---

## 二、目前建議設定

develop 省錢但允許 autoscale 的設定：

```txt
minSize = 1
desiredSize = 1
maxSize = 3
```

意思是：

```txt
平常只跑 1 台 node
Pod 放不下時，Cluster Autoscaler 最多可以加到 3 台 node
```

如果要完全鎖死成本，可以改回：

```txt
minSize = 1
desiredSize = 1
maxSize = 1
```

但這樣 Cluster Autoscaler 即使有安裝，也無法新增 node。

---

## 三、常用變數

建議先設定：

```bash
export AWS_REGION=ap-northeast-1
export EKS_CLUSTER_NAME=DPACS
```

查 node group name：

```bash
aws eks list-nodegroups \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME"
```

設定 node group name：

```bash
export NODEGROUP_NAME=<your-nodegroup-name>
```

例如：

```bash
export NODEGROUP_NAME=dpacs-node-group
```

---

## 四、查看 node group 狀態

查看 scaling config：

```bash
aws eks describe-nodegroup \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME" \
  --nodegroup-name "$NODEGROUP_NAME" \
  --query "nodegroup.scalingConfig"
```

查看 node group 重點資訊：

```bash
aws eks describe-nodegroup \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME" \
  --nodegroup-name "$NODEGROUP_NAME" \
  --query "nodegroup.{name:nodegroupName,status:status,instanceTypes:instanceTypes,scalingConfig:scalingConfig}"
```

---

## 五、調整 node group 範圍

### 允許自動擴到最多 3 台

```bash
aws eks update-nodegroup-config \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME" \
  --nodegroup-name "$NODEGROUP_NAME" \
  --scaling-config minSize=1,maxSize=3,desiredSize=1
```

這是 develop + autoscaling 測試建議設定。

---

### 手動開到 2 台 node

如果只是想手動測 HA / HPA，不靠 Cluster Autoscaler：

```bash
aws eks update-nodegroup-config \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME" \
  --nodegroup-name "$NODEGROUP_NAME" \
  --scaling-config minSize=1,maxSize=2,desiredSize=2
```

觀察 node：

```bash
kubectl get nodes -w
```

---

### 縮回 1 台 node

測完後省錢：

```bash
aws eks update-nodegroup-config \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME" \
  --nodegroup-name "$NODEGROUP_NAME" \
  --scaling-config minSize=1,maxSize=1,desiredSize=1
```

觀察 node 被移除：

```bash
kubectl get nodes -w
```

---

## 六、Cluster Autoscaler 啟動 / 停止

### 查看 Cluster Autoscaler Deployment

```bash
kubectl -n kube-system get deploy cluster-autoscaler
```

查看 Pod：

```bash
kubectl -n kube-system get pods | grep autoscaler
```

---

### 啟動 Cluster Autoscaler

```bash
kubectl -n kube-system scale deployment/cluster-autoscaler --replicas=1
```

確認：

```bash
kubectl -n kube-system rollout status deployment/cluster-autoscaler --timeout=180s
```

---

### 暫停 Cluster Autoscaler

```bash
kubectl -n kube-system scale deployment/cluster-autoscaler --replicas=0
```

確認：

```bash
kubectl -n kube-system get deploy cluster-autoscaler
```

注意：

```txt
暫停 Cluster Autoscaler 不會自動刪掉已經開出的 node。
如果要省錢，還需要把 node group desiredSize / maxSize 調回 1。
```

---

## 七、觀察 Cluster Autoscaler

### 看 autoscaler logs

```bash
kubectl -n kube-system logs -f deployment/cluster-autoscaler
```

查看最近 30 分鐘 logs：

```bash
kubectl -n kube-system logs deployment/cluster-autoscaler --since=30m
```

搜尋 scale up / scale down 關鍵字：

```bash
kubectl -n kube-system logs deployment/cluster-autoscaler --since=30m \
  | grep -Ei "scale.up|scale-up|triggered|upcoming|node group|asg|scale.down|scale down|unneeded|removing|delete|drain"
```

---

### 監看 nodes

```bash
kubectl get nodes -w
```

查看 node 詳細資訊：

```bash
kubectl get nodes -o wide
```

查看每台 node 的 capacity：

```bash
kubectl get nodes \
  -o custom-columns=NAME:.metadata.name,CPU:.status.capacity.cpu,MEM:.status.capacity.memory,PODS:.status.capacity.pods
```

---

### 查看 Pod 分布在哪些 node

```bash
kubectl get pods -A -o wide
```

統計每台 node 上有幾個 Pod：

```bash
kubectl get pods -A -o wide \
  | awk 'NR>1 {count[$8]++} END {for (node in count) print node, count[node]}'
```

查看 access Pods 分布：

```bash
kubectl -n test get pods -l app=access -o wide
```

---

## 八、測試 Cluster Autoscaler

### 1. 確認 node group 有 scale out 空間

```bash
aws eks describe-nodegroup \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME" \
  --nodegroup-name "$NODEGROUP_NAME" \
  --query "nodegroup.scalingConfig"
```

應該要是：

```json
{
  "minSize": 1,
  "maxSize": 3,
  "desiredSize": 1
}
```

如果 `maxSize=1`，Cluster Autoscaler 無法新增 node。

---

### 2. 啟動 Cluster Autoscaler

```bash
kubectl -n kube-system scale deployment/cluster-autoscaler --replicas=1
kubectl -n kube-system rollout status deployment/cluster-autoscaler --timeout=180s
```

---

### 3. 開啟監看視窗

Terminal 1：看 Cluster Autoscaler logs

```bash
kubectl -n kube-system logs -f deployment/cluster-autoscaler
```

Terminal 2：看 nodes

```bash
kubectl get nodes -w
```

Terminal 3：看 HPA

```bash
kubectl -n test get hpa access -w
```

Terminal 4：看 access Pods

```bash
kubectl -n test get pods -l app=access -o wide -w
```

---

### 4. 執行 loadgen

```bash
kubectl apply -f deploy/k8s/test-tools/access-loadgen.yaml
```

預期流程：

```txt
access CPU 上升
HPA replicas 2 → 3 → 5
新 access Pod 如果排不下會 Pending
Cluster Autoscaler 偵測 Pending Pod
node group desiredSize 1 → 2
新 node 加入 EKS
Pending Pod 排到新 node
```

---

### 5. 驗證 node 有新增

```bash
kubectl get nodes -o wide
```

如果成功，會看到 2 台以上 node。

查看 node group desiredSize 是否增加：

```bash
aws eks describe-nodegroup \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME" \
  --nodegroup-name "$NODEGROUP_NAME" \
  --query "nodegroup.scalingConfig"
```

可能會看到：

```json
{
  "minSize": 1,
  "maxSize": 3,
  "desiredSize": 2
}
```

---

## 九、測試完成後清理

### 1. 刪掉 loadgen

```bash
kubectl -n test delete deployment access-loadgen --ignore-not-found
```

---

### 2. 等 HPA scale down

```bash
kubectl -n test get hpa access -w
```

```bash
kubectl -n test get deploy access -w
```

HPA 不會立刻 scale down，通常會等幾分鐘後才慢慢降回 `minReplicas`。

---

### 3. 等 Cluster Autoscaler scale down

```bash
kubectl get nodes -w
```

Cluster Autoscaler 也不會立刻刪 node，會先判斷 node 是否空閒、Pod 是否能搬走，再縮回去。

---

## 十、立即省錢收尾流程

如果不想等自動縮回，可以手動收乾淨。

刪 loadgen：

```bash
kubectl -n test delete deployment access-loadgen --ignore-not-found
```

如果不想讓 HPA 繼續拉高 Pod：

```bash
kubectl -n test delete hpa access report --ignore-not-found
```

調整 replicas：

```bash
kubectl -n test scale deployment/access --replicas=1
kubectl -n test scale deployment/report --replicas=1
```

暫停 Cluster Autoscaler：

```bash
kubectl -n kube-system scale deployment/cluster-autoscaler --replicas=0
```

縮回 1 台 node：

```bash
aws eks update-nodegroup-config \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME" \
  --nodegroup-name "$NODEGROUP_NAME" \
  --scaling-config minSize=1,maxSize=1,desiredSize=1
```

觀察：

```bash
kubectl get nodes -w
```

---

## 十一、常見問題

### 1. HPA 有增加 replicas，但 node 沒變多

檢查 node group maxSize：

```bash
aws eks describe-nodegroup \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME" \
  --nodegroup-name "$NODEGROUP_NAME" \
  --query "nodegroup.scalingConfig"
```

如果是：

```txt
maxSize = 1
```

Cluster Autoscaler 無法新增 node。

---

### 2. Pod Pending，但 autoscaler 沒有 scale up

看 Pending 原因：

```bash
kubectl -n test describe pod <pending-pod-name>
```

如果是：

```txt
Too many pods
Insufficient cpu
Insufficient memory
```

通常可以靠新增 node 解決。

如果是 image pull、secret、PVC、nodeSelector、affinity 等問題，Cluster Autoscaler 不一定能解。

---

### 3. 停掉 autoscaler 後 node 會消失嗎？

不會。

```txt
暫停 Cluster Autoscaler 只是不再自動調整 desiredSize。
已經開出來的 node 不會因為 autoscaler 被停掉而自動消失。
```

要省錢，需要另外把 node group 改回：

```txt
minSize=1,maxSize=1,desiredSize=1
```

---

### 4. 關掉 loadgen 後 node 會縮回嗎？

會，但不是立刻。

流程：

```txt
loadgen 停止
access CPU 下降
HPA 降 replicas
node 變空閒
Cluster Autoscaler 判斷可移除
node group desiredSize 降回 1
多餘 node 被終止
```

如果想立刻省錢，請使用「立即省錢收尾流程」。

---

## 十二、測試成功範例

成功時會看到：

```txt
HPA：access replicas 2 → 5
Pods：部分 access Pod 先 Pending，之後 Running
Nodes：1 台 node → 2 台 node
Node group：desiredSize 1 → 2
```

代表：

```txt
HPA 成功調整 Pod 數量
Cluster Autoscaler 成功調整 node 數量
EKS 可以在負載增加時完成 Pod + Node 兩層 autoscaling
```
