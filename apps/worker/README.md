# Worker Service

`worker` 是 SQS consumer，負責 long polling `access-events` queue，驗證 message，並把 event 以 idempotent `upsert` 方式寫進 PostgreSQL / Aurora。

## 在做什麼

- 從 SQS 收取 message
- 驗證 event payload
- 寫入 `access_events`
- 成功後刪除 message
- 失敗時不刪除，讓 SQS retry / DLQ 接手

## 相關指令

啟動本地依賴：

```bash
pnpm local:up
pnpm db:migrate
```

啟動服務：

```bash
pnpm dev:worker
```

## 重要環境變數

- `DATABASE_URL`
- `DB_POOL_MAX`
- `AWS_REGION`
- `SQS_ENDPOINT`
- `SQS_QUEUE_URL`

## 上 AWS 需要調整

- `DATABASE_URL` 改成 Aurora writer endpoint
- 移除本地 `SQS_ENDPOINT`
- `SQS_QUEUE_URL` 改成正式 SQS queue URL
- Pod 不放 AWS key，改用 IRSA
- IAM 權限只給 `ReceiveMessage/DeleteMessage/ChangeMessageVisibility`
- 用 [apps/worker/Dockerfile](/Users/slowpoke/Documents/雲原生/cloud-native-8/apps/worker/Dockerfile) build image
- 用 [deploy/k8s/worker.yaml](/Users/slowpoke/Documents/雲原生/cloud-native-8/deploy/k8s/worker.yaml) 部署
