# Report Service 測試說明

這份文件說明 `apps/report` 目前新增的後端測試。

## 如何執行

請在 repo root 執行：

```bash
pnpm --filter @repo/report test
```

實際執行的 script 是：

```bash
cd ../.. && node scripts/run-with-root-env.mjs node --test "apps/report/src/**/*.test.js"
```

代表測試會：

- 使用 Node 內建的 `node:test`
- 從 repo root 讀取 `.env`
- 不需要額外安裝 Jest、Vitest 或其他 test framework

## 測試檔案

```text
apps/report/src/server/jwt-auth.test.js
apps/report/src/server/access-api-service.test.js
```

## JWT Unit Tests

檔案：

```text
apps/report/src/server/jwt-auth.test.js
```

這組測試不需要連資料庫。

### `signJwt creates a token accepted by requireAuth`

確認 `signJwt()` 產生的 JWT 可以被 `requireAuth()` 正確解析。

預期結果：

```text
employeeId: 123
```

### `requireAuth rejects requests without a bearer token`

確認沒有帶 Bearer token 的 request 會被拒絕。

需要的 header 格式：

```http
Authorization: Bearer <token>
```

預期結果：

```text
401 UNAUTHORIZED
```

### `requireAuth rejects expired tokens`

確認過期 JWT 會被拒絕。

也就是 token 裡的 `exp` 小於目前時間時，應該回：

```text
401 UNAUTHORIZED
Token expired.
```

## Report API Integration Tests

檔案：

```text
apps/report/src/server/access-api-service.test.js
```

這組測試會真的連 PostgreSQL 和 Prisma。

如果沒有設定 `DATABASE_URL`，或是本機 PostgreSQL 沒有啟動，integration tests 會被 skip，不會讓整個測試失敗。

## 測試資料策略

Integration tests 不直接依賴大型 mock seed `data0506.sql`。

測試會自己建立一組小型且獨立的資料，並使用很大的 ID，避免和正式 seed 撞到：

```text
department: 910001, 910002, 910003
employee:   910001, 910002, 910003, 910004
access_log: 910001, 910002, 910003
```

測試用部門結構如下：

```text
Report Top Department
  manager: ReportTopManager

Report Child Department
  manager: ReportChildManager
  employee: ReportChildEmployee

Report Outside Department
  employee: ReportOutsideEmployee
```

測試用 access logs：

```text
910001 ACCEPT log
910002 DENY log, status=false
910003 outside DENY log
```

每個 integration test 結束後，會把這些測試資料清掉。

因為 `department.manager_id` 和 `employee.department_id` 之間有 foreign key 循環，所以測試建立和清理資料時會使用：

```sql
SET CONSTRAINTS ALL DEFERRED
```

這和 seed SQL 的處理方式一致。

## Integration Test Cases

### `manager report APIs enforce department scope and update denied status`

這個測試主要驗證 report API 的權限範圍和 denied access log 的狀態更新。

它會確認：

- top manager 可以看到自己管理部門和下層部門的員工
- 一般員工只能看到自己
- manager 不能查詢 scope 外的員工
- denied access logs 只會回傳 manager scope 內的資料
- denied log 的 `status` 可以被更新
- `ACCEPT` log 不能更新 denied status

重要預期值：

```text
Top manager 可見員工：
910001, 910002, 910003

一般員工可見員工：
910003

Scope 外員工：
910004 -> 403 FORBIDDEN

可見 denied log：
910002
```

狀態更新 request：

```json
{
  "status": true
}
```

預期更新後結果：

```json
{
  "status": true
}
```

### `team trend APIs respect department filters`

這個測試驗證 `apps/report/pages/trends.jsx` 使用的團隊趨勢 API。

它會確認：

- 不帶 `department_id` 時，代表目前使用者可見的全部部門
- 帶 `department_id` 時，只計算該部門
- `dailyAverages` 會從該月第一天開始
- `dailyAverages` 會到該月最後一天結束
- 平均進場時間不會被時區偏移

涵蓋 API：

```http
GET /api/manager/reports/team/stay-hour-distribution
GET /api/manager/reports/team/monthly-statistics
```

預期範例：

```text
不帶 department_id 的 employeeCount: 3
Child department 的 employeeCount: 2
dailyAverages 第一筆日期: 2026-05-01
dailyAverages 最後一筆日期: 2026-05-31
平均進場時間: 08:00
```

## 成功的測試輸出

成功時應該會看到類似：

```text
✔ manager report APIs enforce department scope and update denied status
✔ team trend APIs respect department filters
✔ signJwt creates a token accepted by requireAuth
✔ requireAuth rejects requests without a bearer token
✔ requireAuth rejects expired tokens

tests 5
pass 5
fail 0
skipped 0
```

代表：

- JWT 驗證正常
- 權限 scope 正常
- manager 不能越權看其他部門
- 一般員工只能看自己
- denied log status 可以更新
- `ACCEPT` log 不允許更新 status
- trends 的部門篩選正常
- trends 的日期範圍沒有時區偏移

## 資料庫沒有啟動時

如果 PostgreSQL 沒有啟動，integration tests 會被 skip：

```text
database is not reachable
```

啟動本地資料庫後可以重新執行：

```bash
pnpm local:up
pnpm db:reset
pnpm db:seed
pnpm --filter @repo/report test
```

## 已知 Warning

執行測試時可能會看到：

```text
DeprecationWarning: Calling client.query() when the client is already executing a query is deprecated
```

這是 Prisma PostgreSQL adapter / `pg` 底層產生的 warning，不代表測試失敗。

真正要看的重點是：

```text
fail 0
```

## 後續可補的測試

之後可以再補：

- `pages/api/[...path].js` 的 API route handler tests
- `POST /api/auth/login` 的 login integration tests
- attendance 計算測試，例如只有 IN 沒有 OUT 時是否 incomplete
- presence summary 測試，例如最新一筆 `IN` / `OUT` 狀態是否正確
- 如果測試時間仍然偏久，可以補 Prisma disconnect teardown
