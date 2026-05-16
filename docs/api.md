# API

## Report Auth

### `POST /api/auth/login`

Report service login. The password is read from the `employee.password` field.

Request:

```json
{
  "username": "BobChen@tsmc.tw",
  "password": "Pass0002!"
}
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "employee": {
    "employeeId": 2,
    "employeeName": "BobChen",
    "email": "BobChen@tsmc.tw"
  }
}
```

### `GET /api/auth/me`

Returns the current employee profile.

```http
Authorization: Bearer <jwt>
```

The report service signs and validates HS256 tokens with `JWT_SECRET`. The token contains the current employee identity as `employeeId` and `sub`.

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

回傳 PostgreSQL / Aurora 中整理後的 summary 與 recent events。Report service 會讀取 seeded access-control tables：

- `access_log`
- `employee`
- `site`
- `access_point`

Response:

```json
{
  "service": "report",
  "route": "/api/report",
  "data": {
    "generatedAt": "2026-05-09T08:00:00.000Z",
    "summary": {
      "activeEmployees": 3,
      "checkedInToday": 4,
      "pendingReviews": 2
    },
    "recentEvents": [
      {
        "eventId": "10",
        "logId": 10,
        "employeeId": 1,
        "userId": "AliceLin",
        "doorId": "Main Gate",
        "factoryId": "Hsinchu Fab 12",
        "direction": "ENTER",
        "decision": "ALLOW",
        "in": true,
        "pass": true,
        "occurredAt": "2026-05-03T00:01:12.000Z",
        "time": "08:01"
      }
    ]
  }
}
```

### OpenAPI-backed report API routes

`apps/report` also exposes read/report endpoints under Next.js API routes. These routes map the provided OpenAPI paths to `/api/...` because Next.js API handlers live under `pages/api`.

These endpoints require a JWT:

```http
Authorization: Bearer <jwt>
```

The report service validates HS256 tokens with `JWT_SECRET` and reads the current employee from `employeeId` or `sub`. Employees can only see their own rows. Department managers can see employees in departments under their managed department hierarchy.

- `GET /api/employees`
- `GET /api/employees/:employeeId`
- `GET /api/departments`
- `GET /api/job-levels`
- `GET /api/sites`
- `GET /api/sites/:siteId/access-points`
- `GET /api/access-logs`
- `GET /api/employees/:employeeId/access-status`
- `GET /api/me/attendance/summary`
- `GET /api/me/attendance/daily`
- `GET /api/me/attendance/today-status`
- `GET /api/me/attendance/denied-access-logs`
- `GET /api/manager/reports/presence/summary`
- `GET /api/manager/reports/presence/employees`
- `GET /api/manager/reports/employees/:employeeId/monthly-attendance`
- `GET /api/manager/reports/team/workload-trend`
- `GET /api/manager/reports/team/monthly-statistics`
- `GET /api/manager/reports/team/stay-hour-distribution`
- `GET /api/manager/reports/denied-access-logs`
- `GET /api/manager/reports/denied-access-logs/:logId`
- `PATCH /api/manager/access-logs/:logId/note`

Denied access log responses include `status` when `result` is `DENY`:

- `status: false`: denied log is pending report handling
- `status: true`: denied log has been handled

`/api/manager/reports/team/workload-trend`, `/api/manager/reports/team/monthly-statistics`, and `/api/manager/reports/team/stay-hour-distribution` support optional department filtering:

- `department_id`: filter by department id
- `departmentId`: same filter, camelCase alias

The department filter is applied inside the current user's JWT authorization scope.

### `GET /api/me/attendance/summary`

Query:

- `startDate`: `YYYY-MM-DD`
- `endDate`: `YYYY-MM-DD`

Returns the current employee's attendance summary and all access logs in the selected date range.

Response includes:

```json
{
  "employeeId": 2,
  "startDate": "2026-05-01",
  "endDate": "2026-05-31",
  "totalWorkingHours": 168,
  "totalOvertimeHours": 4,
  "isComplete": true,
  "message": "Complete",
  "incompleteDates": [],
  "deniedAccessLogCount": 1,
  "accessLogs": [
    {
      "logId": 1,
      "employeeId": 2,
      "direction": "IN",
      "result": "ACCEPT",
      "eventTime": "2026-05-01T09:00:00.000Z"
    }
  ]
}
```

### `GET /api/manager/reports/team/stay-hour-distribution`

Query:

- `yearMonth`: `YYYY-MM`
- `department_id`: optional department id filter
- `departmentId`: optional camelCase alias for `department_id`

Returns daily average stay hours for all visible active employees in the selected month. The average uses all visible active employees as the denominator, so a day with no logs returns `averageStayHours: 0`.

Response:

```json
{
  "yearMonth": "2026-05",
  "employeeCount": 12,
  "dailyAverages": [
    {
      "date": "2026-05-01",
      "averageStayHours": 7.5,
      "totalStayHours": 90,
      "employeeCount": 12,
      "activeEmployeeCount": 11
    }
  ]
}
```

Device event submission is not implemented in `apps/report`; access decision events belong to `apps/access`.

## Local Commands

- `pnpm db:up`: 只啟動本地 PostgreSQL
- `pnpm local:up`: 啟動 PostgreSQL、Valkey、LocalStack
- `pnpm db:migrate`: 執行 Prisma migrations
- `pnpm db:reset`: 清空本地 PostgreSQL 並重新套用所有 Prisma migrations
- `pnpm db:seed`: 匯入 `packages/db/seed/` 內所有 `.sql` seed 檔
