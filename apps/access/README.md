# Access Service

`access` 是入口 API，負責接 access check request、執行 anti-passback 判斷、把狀態寫到 Valkey，最後送出 `access.checked` event 到 SQS。

## 在做什麼

- 提供 `GET /check` 測試頁
- 提供 `POST /check` access check API
- 使用 Valkey 保存使用者當前進出狀態
- 發送 event 到 SQS
- 不直接寫 PostgreSQL

## 相關指令

安裝依賴：

```bash
pnpm install
```

啟動本地依賴：

```bash
pnpm local:up
pnpm db:migrate
```

啟動服務：

```bash
pnpm dev:access
```

## 重要環境變數

- `ACCESS_PORT`
- `VALKEY_URL`
- `ANTI_PASSBACK_TTL_SECONDS`
- `AWS_REGION`
- `SQS_ENDPOINT`
- `SQS_QUEUE_URL`

## 上 AWS 需要調整

- `VALKEY_URL` 改成 AWS 上的 Valkey/Redis 端點
- 移除本地 `SQS_ENDPOINT`
- `SQS_QUEUE_URL` 改成正式 SQS queue URL
- Pod 不放 AWS key，改用 IRSA
- 用 [apps/access/Dockerfile](/Users/slowpoke/Documents/雲原生/cloud-native-8/apps/access/Dockerfile) build image
- 用 [deploy/k8s/access.yaml](/Users/slowpoke/Documents/雲原生/cloud-native-8/deploy/k8s/access.yaml) 部署
