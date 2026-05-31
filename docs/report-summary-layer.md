# Report Summary Layer

這份文件說明 report 預先計算資料層的第一階段設計。

## 目標

原始刷卡資料仍然以 `access_log` 作為 source of truth。當 worker 寫入新的
`access_log` 後，PostgreSQL trigger 會自動維護 report 可以查的 summary 資料。

流程：

```text
access service -> SQS -> worker -> INSERT access_log
  -> PostgreSQL trigger
  -> employee_access_state
  -> employee_daily_attendance_summary
```

## 新增資料表

### `employee_access_state`

每個員工目前最新的進出狀態。

用途：

- `GET /api/manager/reports/presence/summary`
- `GET /api/manager/reports/presence/employees`
- `GET /api/employees/:employeeId/access-status`

更新規則：

- 只處理 `result = 'Accept'`
- `direction = 'In'` -> `current_state = 'INSIDE'`
- `direction = 'Out'` -> `current_state = 'OUTSIDE'`
- `Deny` 不會改變目前狀態

### `employee_daily_attendance_summary`

每個員工每天一筆工時計算結果。

欄位包含：

- `first_in_time`
- `last_out_time`
- `working_minutes`
- `overtime_minutes`
- `denied_log_count`
- `is_complete`

用途：

- `GET /api/me/attendance/summary`
- `GET /api/me/attendance/daily`
- `GET /api/manager/reports/employees/:employeeId/monthly-attendance`
- `GET /api/manager/reports/team/monthly-statistics`
- `GET /api/manager/reports/team/stay-hour-distribution`
- `GET /api/manager/reports/team/workload-trend`

目前 migration 會在 `access_log` insert 後即時重算該員工當天資料。

### `report_refresh_queue`

記錄哪些員工日期需要重算。現在 trigger 會即時重算並標成 processed；之後如果
trigger 內計算太重，可以改成只寫 queue，再由 batch job 呼叫
`process_report_refresh_queue()` 批次處理。

## 新增 DB function / trigger

### `refresh_employee_daily_attendance_summary(employee_id, work_date)`

重算某個員工某一天的 summary。

### `process_report_refresh_queue(limit)`

處理尚未 processed 的 refresh queue。

### `trg_access_log_report_summary`

`AFTER INSERT ON access_log` trigger。

做的事情：

1. 將該員工日期寫入 `report_refresh_queue`
2. 若是 `Accept` log，更新 `employee_access_state`
3. 重算該員工當天 `employee_daily_attendance_summary`

## 權限

summary table 不存 manager 專屬資料。Report API 查詢時仍要先根據 JWT 算出
current user 可看的 employee / department scope，再用這些 scope 去篩選 summary。

也就是：

```text
JWT -> visible employeeIds / departmentIds -> query summary table
```

## 不改的部分

以下 API 仍建議直接查 `access_log`：

- `GET /api/access-logs`
- `GET /api/me/attendance/denied-access-logs`
- `GET /api/manager/reports/denied-access-logs`
- `GET /api/manager/reports/denied-access-logs/:logId`
- `PATCH /api/manager/access-logs/:logId/status`
- `PATCH /api/manager/access-logs/:logId/note`

這些 API 查的是事件明細，不是聚合報表。

## 目前已接上 summary layer 的 API

### `employee_access_state`

以下 API 已改成查 `employee_access_state`：

- `GET /api/manager/reports/presence/summary`
- `GET /api/manager/reports/presence/employees`
- `GET /api/employees/:employeeId/access-status`

### `employee_daily_attendance_summary`

以下 API 已改成以 `employee_daily_attendance_summary` 作為統計計算來源：

- `GET /api/me/attendance/summary`
- `GET /api/me/attendance/daily`
- `GET /api/me/attendance/today-status`
- `GET /api/manager/reports/employees/:employeeId/monthly-attendance`
- `GET /api/manager/reports/team/monthly-statistics`
- `GET /api/manager/reports/team/stay-hour-distribution`
- `GET /api/manager/reports/team/workload-trend`

需要 access log 明細的 response，例如 `accessEvents` 或 denied log list，仍會額外查
`access_log` 補齊事件資料；但工時、加班、完整性、team average 等統計值會來自 summary
table。
