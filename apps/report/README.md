# Report Service

`report` 是 Next.js Page Router 服務，負責顯示報表頁和提供 read-only report API。它只讀資料庫，不碰 SQS。

## 在做什麼

- 提供 `GET /`
- 提供 `GET /report`
- 提供 `GET /api/report`
- 提供 report 自己的登入 API：`POST /api/auth/login`、`GET /api/auth/me`
- 提供 OpenAPI 查詢型 endpoints，例如 `GET /api/access-logs`、`GET /api/employees`、`GET /api/manager/reports/presence/summary`
- 從 PostgreSQL / Aurora 查詢 seeded access logs、employees、sites、access points 與 summary
- 本地 mock data 放在 `packages/db/seed/data0506.sql`

## API 路徑

OpenAPI 文件中的 `/employees`、`/access-logs`、`/manager/reports/*` 在 Next.js 內會掛在 `/api` 底下，例如：

- `/employees` -> `GET /api/employees`
- `/access-logs` -> `GET /api/access-logs`
- `/manager/reports/denied-access-logs` -> `GET /api/manager/reports/denied-access-logs`

Report 自己的登入 API 放在：

- `POST /api/auth/login`
- `GET /api/auth/me`

本地開發的 demo 密碼目前是 `password123`，例如：

```json
{
  "username": "BobChen@tsmc.tw",
  "password": "password123"
}
```

Device event submission 不在 report service 實作。

## JWT 權限

OpenAPI 查詢型 endpoints 需要：

```http
Authorization: Bearer <jwt>
```

目前 report service 會用 `JWT_SECRET` 驗證 HS256 token，並從 token 的 `employeeId` 或 `sub` 取得目前員工。一般員工只能看自己的資料；若該員工是 `department.manager_id`，則可看自己管理 department 和所有下層 department 的員工資料。

## 相關指令

啟動本地依賴：

```bash
pnpm local:up
pnpm db:migrate
docker compose exec -T postgres psql -U postgres -d app < packages/db/seed/data0506.sql
```

啟動服務：

```bash
pnpm dev:report
```

## 重要環境變數

- `DATABASE_URL`
- `DB_POOL_MAX`
- `JWT_SECRET`
- `PORT`

## 上 AWS 需要調整

- `DATABASE_URL` 改成 Aurora reader endpoint
- 使用 read-only DB user
- 不需要 SQS 與 AWS SDK 權限
- 用 [apps/report/Dockerfile](/Users/slowpoke/Documents/雲原生/cloud-native-8/apps/report/Dockerfile) build image
- 用 [deploy/k8s/report.yaml](/Users/slowpoke/Documents/雲原生/cloud-native-8/deploy/k8s/report.yaml) 部署
