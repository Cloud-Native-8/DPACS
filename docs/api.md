# API

## Access

### `GET /healthz`

```json
{ "ok": true, "service": "access" }
```

### `GET /readyz`

```json
{ "ready": true, "service": "access" }
```

### `GET /check`

回傳一個本地測試頁，直接在瀏覽器打 `POST /check`。

### `POST /check`

Request:

```json
{
  "userId": "E10001",
  "doorId": "FAB-A-01",
  "factoryId": "FAB-A",
  "in": true
}
```

Response:

```json
{
  "pass": true,
  "reason": "Access granted",
  "eventId": "4dff3c53-e5b4-4532-88bc-3f0d7fa2e1cb",
  "userId": "E10001",
  "doorId": "FAB-A-01",
  "factoryId": "FAB-A",
  "in": true,
  "processedAt": "2026-05-01T08:00:00.000Z"
}
```

行為：

- anti-passback 狀態保存在 Valkey。
- 每次 check 都會送一筆 `access.checked` event 到 SQS。
- `access` 不直接寫 DB。

## Report

### `GET /`

Report 首頁。

### `GET /report`

報表頁。

### `GET /api/report`

回傳 PostgreSQL / Aurora 中整理後的 summary 與 recent events。

## Local Commands

- `pnpm db:up`: 只啟動本地 PostgreSQL
- `pnpm local:up`: 啟動 PostgreSQL、Valkey、LocalStack
