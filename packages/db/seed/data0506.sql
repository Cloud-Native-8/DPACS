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
  "password",
  "department_id",
  "is_active",
  "created_at",
  "updated_at"
)
VALUES
  (1, 'AliceLin', 'AliceLin@tsmc.tw', '7362', 'Corporate Services Director', 'Pass0001!', 2, TRUE, '2026-05-01T09:10:00', '2026-05-01T09:10:00'),
  (2, 'BobChen', 'BobChen@tsmc.tw', '4234', 'IT Manager', 'Pass0002!', 3, TRUE, '2026-05-01T09:15:00', '2026-05-01T09:15:00'),
  (3, 'CandiceTsai', 'CandiceTsai@tsmc.tw', '1893', 'Infrastructure Manager', 'Pass0003!', 4, TRUE, '2026-05-01T09:20:00', '2026-05-01T09:20:00'),
  (4, 'DavidLiu', 'DavidLiu@tsmc.tw', '2897', 'HR Manager', 'Pass0004!', 5, TRUE, '2026-05-01T09:25:00', '2026-05-01T09:25:00'),
  (5, 'EricWang', 'EricWang@tsmc.tw', '5521', 'Security Director', 'Pass0005!', 6, TRUE, '2026-05-01T09:30:00', '2026-05-01T09:30:00'),
  (6, 'FionaHsu', 'FionaHsu@tsmc.tw', '8842', 'Physical Security Manager', 'Pass0006!', 7, TRUE, '2026-05-01T09:35:00', '2026-05-01T09:35:00'),
  (7, 'GraceHuang', 'GraceHuang@tsmc.tw', '6710', 'Manufacturing Director', 'Pass0007!', 8, TRUE, '2026-05-01T09:40:00', '2026-05-01T09:40:00'),
  (8, 'HenryTseng', 'HenryTseng@tsmc.tw', '3358', 'Fab Operations Manager', 'Pass0008!', 9, TRUE, '2026-05-01T09:45:00', '2026-05-01T09:45:00'),
  (9, 'IvyWu', 'IvyWu@tsmc.tw', '9182', 'Clean Room Manager', 'Pass0009!', 10, TRUE, '2026-05-01T09:50:00', '2026-05-01T09:50:00'),
  (10, 'JackyLee', 'JackyLee@tsmc.tw', '2471', 'Quality Control Manager', 'Pass0010!', 11, TRUE, '2026-05-01T09:55:00', '2026-05-01T09:55:00'),
  (11, 'KarenChang', 'KarenChang@tsmc.tw', '6108', 'Company General Manager', 'Pass0011!', 1, TRUE, '2026-05-01T09:05:00', '2026-05-01T09:05:00'),

  (12, 'LeoYang', 'LeoYang@tsmc.tw', '1001', 'Corporate Services Specialist', 'Pass0012!', 2, TRUE, '2026-05-01T10:01:00', '2026-05-01T10:01:00'),
  (13, 'MiaHo', 'MiaHo@tsmc.tw', '1002', 'Corporate Services Analyst', 'Pass0013!', 2, TRUE, '2026-05-01T10:02:00', '2026-05-01T10:02:00'),
  (14, 'NathanKuo', 'NathanKuo@tsmc.tw', '1003', 'Corporate Services Coordinator', 'Pass0014!', 2, TRUE, '2026-05-01T10:03:00', '2026-05-01T10:03:00'),

  (15, 'OliviaShen', 'OliviaShen@tsmc.tw', '1004', 'IT Engineer', 'Pass0015!', 3, TRUE, '2026-05-01T10:04:00', '2026-05-01T10:04:00'),
  (16, 'PeterChou', 'PeterChou@tsmc.tw', '1005', 'System Administrator', 'Pass0016!', 3, TRUE, '2026-05-01T10:05:00', '2026-05-01T10:05:00'),
  (17, 'QueenieLai', 'QueenieLai@tsmc.tw', '1006', 'Network Engineer', 'Pass0017!', 3, TRUE, '2026-05-01T10:06:00', '2026-05-01T10:06:00'),
  (18, 'RyanWu', 'RyanWu@tsmc.tw', '1007', 'IT Support Engineer', 'Pass0018!', 3, TRUE, '2026-05-01T10:07:00', '2026-05-01T10:07:00'),

  (19, 'SandyLo', 'SandyLo@tsmc.tw', '1008', 'Infrastructure Engineer', 'Pass0019!', 4, TRUE, '2026-05-01T10:08:00', '2026-05-01T10:08:00'),
  (20, 'TonyHsieh', 'TonyHsieh@tsmc.tw', '1009', 'Cloud Infrastructure Engineer', 'Pass0020!', 4, TRUE, '2026-05-01T10:09:00', '2026-05-01T10:09:00'),
  (21, 'UmaWang', 'UmaWang@tsmc.tw', '1010', 'DevOps Engineer', 'Pass0021!', 4, TRUE, '2026-05-01T10:10:00', '2026-05-01T10:10:00'),
  (22, 'VictorLin', 'VictorLin@tsmc.tw', '1011', 'Platform Engineer', 'Pass0022!', 4, TRUE, '2026-05-01T10:11:00', '2026-05-01T10:11:00'),

  (23, 'WendyChen', 'WendyChen@tsmc.tw', '1012', 'HR Specialist', 'Pass0023!', 5, TRUE, '2026-05-01T10:12:00', '2026-05-01T10:12:00'),
  (24, 'XavierTseng', 'XavierTseng@tsmc.tw', '1013', 'Recruiting Specialist', 'Pass0024!', 5, TRUE, '2026-05-01T10:13:00', '2026-05-01T10:13:00'),
  (25, 'YvonneLee', 'YvonneLee@tsmc.tw', '1014', 'Training Specialist', 'Pass0025!', 5, TRUE, '2026-05-01T10:14:00', '2026-05-01T10:14:00'),

  (26, 'ZackHuang', 'ZackHuang@tsmc.tw', '1015', 'Security Analyst', 'Pass0026!', 6, TRUE, '2026-05-01T10:15:00', '2026-05-01T10:15:00'),
  (27, 'AmberLiao', 'AmberLiao@tsmc.tw', '1016', 'Security Operator', 'Pass0027!', 6, TRUE, '2026-05-01T10:16:00', '2026-05-01T10:16:00'),
  (28, 'BrianKo', 'BrianKo@tsmc.tw', '1017', 'Security Coordinator', 'Pass0028!', 6, TRUE, '2026-05-01T10:17:00', '2026-05-01T10:17:00'),
  (29, 'CindyYu', 'CindyYu@tsmc.tw', '1018', 'Security Auditor', 'Pass0029!', 6, TRUE, '2026-05-01T10:18:00', '2026-05-01T10:18:00'),

  (30, 'DerekPan', 'DerekPan@tsmc.tw', '1019', 'Physical Security Engineer', 'Pass0030!', 7, TRUE, '2026-05-01T10:19:00', '2026-05-01T10:19:00'),
  (31, 'EvaTang', 'EvaTang@tsmc.tw', '1020', 'Access Control Specialist', 'Pass0031!', 7, TRUE, '2026-05-01T10:20:00', '2026-05-01T10:20:00'),
  (32, 'FrankHsu', 'FrankHsu@tsmc.tw', '1021', 'Physical Security Technician', 'Pass0032!', 7, TRUE, '2026-05-01T10:21:00', '2026-05-01T10:21:00'),
  (33, 'GinaFang', 'GinaFang@tsmc.tw', '1022', 'Security Patrol Lead', 'Pass0033!', 7, TRUE, '2026-05-01T10:22:00', '2026-05-01T10:22:00'),

  (34, 'HowardLu', 'HowardLu@tsmc.tw', '1023', 'Manufacturing Engineer', 'Pass0034!', 8, TRUE, '2026-05-01T10:23:00', '2026-05-01T10:23:00'),
  (35, 'IsabelChiu', 'IsabelChiu@tsmc.tw', '1024', 'Manufacturing Planner', 'Pass0035!', 8, TRUE, '2026-05-01T10:24:00', '2026-05-01T10:24:00'),
  (36, 'JasonWei', 'JasonWei@tsmc.tw', '1025', 'Production Supervisor', 'Pass0036!', 8, TRUE, '2026-05-01T10:25:00', '2026-05-01T10:25:00'),
  (37, 'KellySun', 'KellySun@tsmc.tw', '1026', 'Manufacturing Specialist', 'Pass0037!', 8, TRUE, '2026-05-01T10:26:00', '2026-05-01T10:26:00'),

  (38, 'LouisChang', 'LouisChang@tsmc.tw', '1027', 'Fab Operations Engineer', 'Pass0038!', 9, TRUE, '2026-05-01T10:27:00', '2026-05-01T10:27:00'),
  (39, 'MandyKao', 'MandyKao@tsmc.tw', '1028', 'Fab Shift Lead', 'Pass0039!', 9, TRUE, '2026-05-01T10:28:00', '2026-05-01T10:28:00'),
  (40, 'NeilPeng', 'NeilPeng@tsmc.tw', '1029', 'Fab Technician', 'Pass0040!', 9, TRUE, '2026-05-01T10:29:00', '2026-05-01T10:29:00'),
  (41, 'OscarLiu', 'OscarLiu@tsmc.tw', '1030', 'Fab Maintenance Engineer', 'Pass0041!', 9, TRUE, '2026-05-01T10:30:00', '2026-05-01T10:30:00'),
  (42, 'PennyHsu', 'PennyHsu@tsmc.tw', '1031', 'Fab Operator', 'Pass0042!', 9, TRUE, '2026-05-01T10:31:00', '2026-05-01T10:31:00'),

  (43, 'QuentinYeh', 'QuentinYeh@tsmc.tw', '1032', 'Clean Room Engineer', 'Pass0043!', 10, TRUE, '2026-05-01T10:32:00', '2026-05-01T10:32:00'),
  (44, 'RachelLin', 'RachelLin@tsmc.tw', '1033', 'Clean Room Operator', 'Pass0044!', 10, TRUE, '2026-05-01T10:33:00', '2026-05-01T10:33:00'),
  (45, 'SamChen', 'SamChen@tsmc.tw', '1034', 'Clean Room Technician', 'Pass0045!', 10, TRUE, '2026-05-01T10:34:00', '2026-05-01T10:34:00'),
  (46, 'TinaWang', 'TinaWang@tsmc.tw', '1035', 'Clean Room Shift Lead', 'Pass0046!', 10, TRUE, '2026-05-01T10:35:00', '2026-05-01T10:35:00'),

  (47, 'UlrichKo', 'UlrichKo@tsmc.tw', '1036', 'Quality Engineer', 'Pass0047!', 11, TRUE, '2026-05-01T10:36:00', '2026-05-01T10:36:00'),
  (48, 'VickyYang', 'VickyYang@tsmc.tw', '1037', 'Quality Inspector', 'Pass0048!', 11, TRUE, '2026-05-01T10:37:00', '2026-05-01T10:37:00'),
  (49, 'WilliamTsai', 'WilliamTsai@tsmc.tw', '1038', 'Quality Analyst', 'Pass0049!', 11, TRUE, '2026-05-01T10:38:00', '2026-05-01T10:38:00'),
  (50, 'ZoeyLiu', 'ZoeyLiu@tsmc.tw', '1039', 'Quality Control Specialist', 'Pass0050!', 11, TRUE, '2026-05-01T10:39:00', '2026-05-01T10:39:00');

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

INSERT INTO "access_log" (
  "log_id",
  "employee_id",
  "site_id",
  "access_point_id",
  "direction",
  "result",
  "status",
  "reason",
  "event_time",
  "note",
  "created_at"
)
VALUES
  (1, 1, 1, 1, 'In', 'Accept', NULL, NULL, '2026-05-03T08:01:12', 'Morning entry', '2026-05-03T08:01:13'),
  (2, 1, 1, 2, 'Out', 'Accept', NULL, NULL, '2026-05-03T12:05:44', 'Lunch break', '2026-05-03T12:05:45'),
  (3, 2, 1, 1, 'In', 'Accept', NULL, NULL, '2026-05-03T08:15:20', NULL, '2026-05-03T08:15:21'),
  (4, 2, 3, 5, 'In', 'Accept', NULL, NULL, '2026-05-03T09:10:05', 'Security inspection', '2026-05-03T09:10:06'),
  (5, 3, 2, 3, 'In', 'Accept', NULL, NULL, '2026-05-03T07:55:30', 'Shift start', '2026-05-03T07:55:31'),
  (6, 4, 2, 3, 'In', 'Deny', FALSE, 'No site access permission', '2026-05-03T10:22:18', 'HR employee attempted clean room entry', '2026-05-03T10:22:19'),
  (7, 5, 3, 6, 'In', 'Deny', FALSE, 'Access point inactive', '2026-05-03T13:40:50', 'Control room door disabled', '2026-05-03T13:40:51'),
  (8, 6, 2, 4, 'Out', 'Accept', NULL, NULL, '2026-05-03T14:02:33', NULL, '2026-05-03T14:02:34'),
  (9, 3, 2, 4, 'Out', 'Accept', NULL, NULL, '2026-05-03T17:35:11', 'Shift end', '2026-05-03T17:35:12'),
  (10, 7, 2, 3, 'In', 'Deny', FALSE, 'No active site access permission', '2026-05-03T18:10:07', 'Manufacturing director access denied for clean room', '2026-05-03T18:10:08');

SET CONSTRAINTS ALL IMMEDIATE;
COMMIT;