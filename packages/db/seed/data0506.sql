-- Defer constraint checking for INSERT
BEGIN;
SET CONSTRAINTS ALL DEFERRED;

INSERT INTO "department" (
  "department_id",
  "department_name",
  "manager_id",
  "created_at",
  "updated_at"
)
VALUES
  (1, 'Company', 11, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (2, 'Corporate Services', 1, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (3, 'IT', 2, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (4, 'Infrastructure', 3, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (5, 'HR', 4, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (6, 'Security Division', 5, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (7, 'Physical Security', 6, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (8, 'Manufacturing Division', 7, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (9, 'Fab Operations', 8, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (10, 'Clean Room Team', 9, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (11, 'Quality Control', 10, '2026-05-01T09:00:00', '2026-05-01T09:00:00');

INSERT INTO "department_hierarchy" ("ancestor_department_id", "descendant_department_id", "depth")
VALUES
  (1, 1, 0),
  (2, 2, 0),
  (3, 3, 0),
  (4, 4, 0),
  (5, 5, 0),
  (6, 6, 0),
  (7, 7, 0),
  (8, 8, 0),
  (9, 9, 0),
  (10, 10, 0),
  (11, 11, 0),
  (1, 2, 1),
  (1, 6, 1),
  (1, 8, 1),
  (2, 3, 1),
  (2, 5, 1),
  (3, 4, 1),
  (6, 7, 1),
  (8, 9, 1),
  (8, 11, 1),
  (9, 10, 1),
  (1, 3, 2),
  (1, 4, 3),
  (1, 5, 2),
  (1, 7, 2),
  (1, 9, 2),
  (1, 10, 3),
  (1, 11, 2),
  (2, 4, 2),
  (8, 10, 2);
INSERT INTO "employee" (
  "employee_id",
  "employee_name",
  "email",
  "phone",
  "job_title",
  "department_id",
  "is_active",
  "created_at",
  "updated_at"
)
VALUES
  (1, 'AliceLin', 'AliceLin@tsmc.tw', '7362', 'Corporate Services Director', 2, TRUE, '2026-05-01T09:10:00', '2026-05-01T09:10:00'),
  (2, 'BobChen', 'BobChen@tsmc.tw', '4234', 'IT Manager', 3, TRUE, '2026-05-01T09:15:00', '2026-05-01T09:15:00'),
  (3, 'CandiceTsai', 'CandiceTsai@tsmc.tw', '1893', 'Infrastructure Manager', 4, TRUE, '2026-05-01T09:20:00', '2026-05-01T09:20:00'),
  (4, 'DavidLiu', 'DavidLiu@tsmc.tw', '2897', 'HR Manager', 5, TRUE, '2026-05-01T09:25:00', '2026-05-01T09:25:00'),
  (5, 'EricWang', 'EricWang@tsmc.tw', '5521', 'Security Director', 6, TRUE, '2026-05-01T09:30:00', '2026-05-01T09:30:00'),
  (6, 'FionaHsu', 'FionaHsu@tsmc.tw', '8842', 'Physical Security Manager', 7, TRUE, '2026-05-01T09:35:00', '2026-05-01T09:35:00'),
  (7, 'GraceHuang', 'GraceHuang@tsmc.tw', '6710', 'Manufacturing Director', 8, TRUE, '2026-05-01T09:40:00', '2026-05-01T09:40:00'),
  (8, 'HenryTseng', 'HenryTseng@tsmc.tw', '3358', 'Fab Operations Manager', 9, TRUE, '2026-05-01T09:45:00', '2026-05-01T09:45:00'),
  (9, 'IvyWu', 'IvyWu@tsmc.tw', '9182', 'Clean Room Manager', 10, TRUE, '2026-05-01T09:50:00', '2026-05-01T09:50:00'),
  (10, 'JackyLee', 'JackyLee@tsmc.tw', '2471', 'Quality Control Manager', 11, TRUE, '2026-05-01T09:55:00', '2026-05-01T09:55:00'),
  (11, 'KarenChang', 'KarenChang@tsmc.tw', '6108', 'Company General Manager', 1, TRUE, '2026-05-01T09:05:00', '2026-05-01T09:05:00');
  
INSERT INTO "site" ("site_id", "site_name", "site_address", "created_at", "updated_at")
VALUES
  (1, 'Hsinchu Fab 12', 'No. 8, Li-Hsin Rd. 6, Hsinchu Science Park', '2026-05-01T10:00:00', '2026-05-01T10:00:00'),
  (2, 'Taichung Fab 15', 'No. 1, Keya Rd., Central Taiwan Science Park', '2026-05-01T10:05:00', '2026-05-01T10:05:00'),
  (3, 'Tainan Fab 18', 'No. 1, Nan-Ke North Rd., Southern Taiwan Science Park', '2026-05-01T10:10:00', '2026-05-01T10:10:00');
INSERT INTO "access_point" ("access_point_id", "access_point_name", "site_id", "location_description", "is_active", "created_at", "updated_at")
VALUES
  (1, 'Main Gate', 1, 'Front entrance near visitor center', TRUE, '2026-05-01T10:20:00', '2026-05-01T10:20:00'),
  (2, 'Office Entrance', 1, 'Office building first floor', TRUE, '2026-05-01T10:25:00', '2026-05-01T10:25:00'),
  (3, 'Clean Room Entrance', 2, 'Clean room access corridor', TRUE, '2026-05-01T10:30:00', '2026-05-01T10:30:00'),
  (4, 'Warehouse Gate', 2, 'Material warehouse side gate', TRUE, '2026-05-01T10:35:00', '2026-05-01T10:35:00'),
  (5, 'Visitor Entrance', 3, 'Visitor lobby entrance', TRUE, '2026-05-01T10:40:00', '2026-05-01T10:40:00'),
  (6, 'Control Room Door', 3, 'Control room restricted area', FALSE, '2026-05-01T10:45:00', '2026-05-01T10:45:00');
INSERT INTO "employee_site_access" ("employee_id", "site_id", "is_active", "granted_at", "expired_at", "created_at", "updated_at")
VALUES
  (1, 1, TRUE, '2026-05-01T11:00:00', NULL, '2026-05-01T11:00:00', '2026-05-01T11:00:00'),
  (1, 2, TRUE, '2026-05-01T11:00:00', NULL, '2026-05-01T11:00:00', '2026-05-01T11:00:00'),
  (2, 1, TRUE, '2026-05-01T11:05:00', NULL, '2026-05-01T11:05:00', '2026-05-01T11:05:00'),
  (2, 3, TRUE, '2026-05-01T11:05:00', NULL, '2026-05-01T11:05:00', '2026-05-01T11:05:00'),
  (3, 2, TRUE, '2026-05-01T11:10:00', NULL, '2026-05-01T11:10:00', '2026-05-01T11:10:00'),
  (4, 1, TRUE, '2026-05-01T11:15:00', '2026-08-01T00:00:00', '2026-05-01T11:15:00', '2026-05-01T11:15:00'),
  (5, 1, TRUE, '2026-05-01T11:20:00', NULL, '2026-05-01T11:20:00', '2026-05-01T11:20:00'),
  (5, 3, TRUE, '2026-05-01T11:20:00', NULL, '2026-05-01T11:20:00', '2026-05-01T11:20:00'),
  (6, 2, TRUE, '2026-05-01T11:25:00', NULL, '2026-05-01T11:25:00', '2026-05-01T11:25:00'),
  (6, 3, TRUE, '2026-05-01T11:25:00', NULL, '2026-05-01T11:25:00', '2026-05-01T11:25:00'),
  (7, 2, FALSE, '2026-05-01T11:30:00', '2026-05-15T00:00:00', '2026-05-01T11:30:00', '2026-05-15T00:00:00');
INSERT INTO "access_log" ("log_id", "employee_id", "site_id", "access_point_id", "direction", "result", "reason", "event_time", "note", "created_at")
VALUES
  (1, 1, 1, 1, 'In', 'Accept', NULL, '2026-05-03T08:01:12', 'Morning entry', '2026-05-03T08:01:13'),
  (2, 1, 1, 2, 'Out', 'Accept', NULL, '2026-05-03T12:05:44', 'Lunch break', '2026-05-03T12:05:45'),
  (3, 2, 1, 1, 'In', 'Accept', NULL, '2026-05-03T08:15:20', NULL, '2026-05-03T08:15:21'),
  (4, 2, 3, 5, 'In', 'Accept', NULL, '2026-05-03T09:10:05', 'Security inspection', '2026-05-03T09:10:06'),
  (5, 3, 2, 3, 'In', 'Accept', NULL, '2026-05-03T07:55:30', 'Shift start', '2026-05-03T07:55:31'),
  (6, 4, 2, 3, 'In', 'Deny', 'No site access permission', '2026-05-03T10:22:18', 'Intern attempted clean room entry', '2026-05-03T10:22:19'),
  (7, 5, 3, 6, 'In', 'Deny', 'Access point inactive', '2026-05-03T13:40:50', 'Control room door disabled', '2026-05-03T13:40:51'),
  (8, 6, 2, 4, 'Out', 'Accept', NULL, '2026-05-03T14:02:33', NULL, '2026-05-03T14:02:34'),
  (9, 3, 2, 4, 'Out', 'Accept', NULL, '2026-05-03T17:35:11', 'Shift end', '2026-05-03T17:35:12'),
  (10, 7, 2, 3, 'In', 'Deny', 'Employee inactive', '2026-05-03T18:10:07', 'Inactive employee access denied', '2026-05-03T18:10:08');

SET CONSTRAINTS ALL IMMEDIATE;
COMMIT;