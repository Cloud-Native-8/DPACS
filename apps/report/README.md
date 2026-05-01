# Report Service

`report` 是 Next.js Page Router 服務，負責顯示報表頁和提供 read-only report API。它只讀資料庫，不碰 SQS。

## 在做什麼

- 提供 `GET /`
- 提供 `GET /report`
- 提供 `GET /api/report`
- 從 PostgreSQL / Aurora 查詢最近 access event 與 summary

## 相關指令

啟動本地依賴：

```bash
pnpm db:up
pnpm db:migrate
```

啟動服務：

```bash
pnpm dev:report
```

## 重要環境變數

- `DATABASE_URL`
- `DB_POOL_MAX`
- `PORT`

## 上 AWS 需要調整

- `DATABASE_URL` 改成 Aurora reader endpoint
- 使用 read-only DB user
- 不需要 SQS 與 AWS SDK 權限
- 用 [apps/report/Dockerfile](/Users/slowpoke/Documents/雲原生/cloud-native-8/apps/report/Dockerfile) build image
- 用 [deploy/k8s/report.yaml](/Users/slowpoke/Documents/雲原生/cloud-native-8/deploy/k8s/report.yaml) 部署
