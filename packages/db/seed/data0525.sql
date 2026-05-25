TRUNCATE TABLE
  "access_log",
  "employee_site_access",
  "access_point",
  "site",
  "department_hierarchy",
  "employee",
  "department",
  "access_events"
RESTART IDENTITY CASCADE;

-- 延遲外鍵約束檢查以利大量 INSERT
BEGIN;
SET CONSTRAINTS ALL DEFERRED;

-- 2. 匯入部門主檔
INSERT INTO "department" (
  "department_id",
  "department_name",
  "manager_id",
  "created_at",
  "updated_at"
)
VALUES
  (1, 'IT Department', 1, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (2, 'Application Department', 6, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (3, 'Backend Development Unit', 24, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (4, 'Frontend Development Unit', 74, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (5, 'QA & Testing Unit', 116, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (6, 'DevOps Unit', 148, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (7, 'Business Systems Unit', 171, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (8, 'Application Support Unit', 199, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (9, 'Infrastructure Department', 223, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (10, 'Cloud Infrastructure Unit', 231, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (11, 'Network Operations Unit', 239, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (12, 'Data Department', 246, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (13, 'Data Engineering Unit', 254, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (14, 'Business Intelligence Unit', 262, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (15, 'Cybersecurity Department', 268, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (16, 'Security Operations Unit', 274, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (17, 'Identity & Access Management Unit', 279, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (18, 'IT Service Department', 283, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (19, 'Service Desk Unit', 289, '2026-05-01T09:00:00', '2026-05-01T09:00:00'),
  (20, 'Endpoint Support Unit', 296, '2026-05-01T09:00:00', '2026-05-01T09:00:00');

-- 3. 匯入部門組織樹關係
INSERT INTO "department_hierarchy" (
  "ancestor_department_id",
  "descendant_department_id",
  "depth"
)
VALUES
  -- self
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
  (12, 12, 0),
  (13, 13, 0),
  (14, 14, 0),
  (15, 15, 0),
  (16, 16, 0),
  (17, 17, 0),
  (18, 18, 0),
  (19, 19, 0),
  (20, 20, 0),

  -- IT Department -> Departments
  (1, 2, 1),
  (1, 9, 1),
  (1, 12, 1),
  (1, 15, 1),
  (1, 18, 1),

  -- Application Department -> Units
  (2, 3, 1),
  (2, 4, 1),
  (2, 5, 1),
  (2, 6, 1),
  (2, 7, 1),
  (2, 8, 1),

  -- Infrastructure Department -> Units
  (9, 10, 1),
  (9, 11, 1),

  -- Data Department -> Units
  (12, 13, 1),
  (12, 14, 1),

  -- Cybersecurity Department -> Units
  (15, 16, 1),
  (15, 17, 1),

  -- IT Service Department -> Units
  (18, 19, 1),
  (18, 20, 1),

  -- IT Department -> all Units
  (1, 3, 2),
  (1, 4, 2),
  (1, 5, 2),
  (1, 6, 2),
  (1, 7, 2),
  (1, 8, 2),
  (1, 10, 2),
  (1, 11, 2),
  (1, 13, 2),
  (1, 14, 2),
  (1, 16, 2),
  (1, 17, 2),
  (1, 19, 2),
  (1, 20, 2);

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
  (1, 'AidenLin', 'AidenLin@tsmc.tw', '2001', 'Chief Information Officer', 'Pass0001!', 1, TRUE, '2026-05-01T09:06:00', '2026-05-01T09:06:00'),
  (2, 'BellaLee', 'BellaLee@tsmc.tw', '2002', 'Enterprise Architecture Lead', 'Pass0002!', 1, TRUE, '2026-05-01T09:07:00', '2026-05-01T09:07:00'),
  (3, 'CalebSun', 'CalebSun@tsmc.tw', '2003', 'IT Governance Specialist', 'Pass0003!', 1, TRUE, '2026-05-01T09:08:00', '2026-05-01T09:08:00'),
  (4, 'DaphnePeng', 'DaphnePeng@tsmc.tw', '2004', 'IT Portfolio Coordinator', 'Pass0004!', 1, TRUE, '2026-05-01T09:09:00', '2026-05-01T09:09:00'),
  (5, 'EthanKo', 'EthanKo@tsmc.tw', '2005', 'IT Strategy Manager', 'Pass0005!', 1, TRUE, '2026-05-01T09:10:00', '2026-05-01T09:10:00'),
  (6, 'FreyaChiang', 'FreyaChiang@tsmc.tw', '2006', 'Application Director', 'Pass0006!', 2, TRUE, '2026-05-01T09:11:00', '2026-05-01T09:11:00'),
  (7, 'GavinLan', 'GavinLan@tsmc.tw', '2007', 'Solution Architect', 'Pass0007!', 2, TRUE, '2026-05-01T09:12:00', '2026-05-01T09:12:00'),
  (8, 'HazelTeng', 'HazelTeng@tsmc.tw', '2008', 'Application Program Manager', 'Pass0008!', 2, TRUE, '2026-05-01T09:13:00', '2026-05-01T09:13:00'),
  (9, 'IanShao', 'IanShao@tsmc.tw', '2009', 'Product Operations Lead', 'Pass0009!', 2, TRUE, '2026-05-01T09:14:00', '2026-05-01T09:14:00'),
  (10, 'JadeChangwell', 'JadeChangwell@tsmc.tw', '2010', 'Release Manager', 'Pass0010!', 2, TRUE, '2026-05-01T09:15:00', '2026-05-01T09:15:00'),
  (11, 'KieranHsufield', 'KieranHsufield@tsmc.tw', '2011', 'Application Governance Specialist', 'Pass0011!', 2, TRUE, '2026-05-01T09:16:00', '2026-05-01T09:16:00'),
  (12, 'LaraChengford', 'LaraChengford@tsmc.tw', '2012', 'Vendor Coordinator', 'Pass0012!', 2, TRUE, '2026-05-01T09:17:00', '2026-05-01T09:17:00'),
  (13, 'MasonShenridge', 'MasonShenridge@tsmc.tw', '2013', 'Application Delivery Manager', 'Pass0013!', 2, TRUE, '2026-05-01T09:18:00', '2026-05-01T09:18:00'),
  (14, 'NoraChen', 'NoraChen@tsmc.tw', '2014', 'Solution Architect', 'Pass0014!', 2, TRUE, '2026-05-01T09:19:00', '2026-05-01T09:19:00'),
  (15, 'OwenTsai', 'OwenTsai@tsmc.tw', '2015', 'Application Program Manager', 'Pass0015!', 2, TRUE, '2026-05-01T09:20:00', '2026-05-01T09:20:00'),
  (16, 'PaigeHo', 'PaigeHo@tsmc.tw', '2016', 'Product Operations Lead', 'Pass0016!', 2, TRUE, '2026-05-01T09:21:00', '2026-05-01T09:21:00'),
  (17, 'QuentinPan', 'QuentinPan@tsmc.tw', '2017', 'Release Manager', 'Pass0017!', 2, TRUE, '2026-05-01T09:22:00', '2026-05-01T09:22:00'),
  (18, 'RileyLiao', 'RileyLiao@tsmc.tw', '2018', 'Application Governance Specialist', 'Pass0018!', 2, TRUE, '2026-05-01T09:23:00', '2026-05-01T09:23:00'),
  (19, 'SiennaYen', 'SiennaYen@tsmc.tw', '2019', 'Vendor Coordinator', 'Pass0019!', 2, TRUE, '2026-05-01T09:24:00', '2026-05-01T09:24:00'),
  (20, 'TheoWen', 'TheoWen@tsmc.tw', '2020', 'Application Delivery Manager', 'Pass0020!', 2, TRUE, '2026-05-01T09:25:00', '2026-05-01T09:25:00'),
  (21, 'UmaLiang', 'UmaLiang@tsmc.tw', '2021', 'Solution Architect', 'Pass0021!', 2, TRUE, '2026-05-01T09:26:00', '2026-05-01T09:26:00'),
  (22, 'VivianChao', 'VivianChao@tsmc.tw', '2022', 'Application Program Manager', 'Pass0022!', 2, TRUE, '2026-05-01T09:27:00', '2026-05-01T09:27:00'),
  (23, 'WyattLiuhart', 'WyattLiuhart@tsmc.tw', '2023', 'Product Operations Lead', 'Pass0023!', 2, TRUE, '2026-05-01T09:28:00', '2026-05-01T09:28:00'),
  (24, 'XeniaChoulin', 'XeniaChoulin@tsmc.tw', '2024', 'Backend Development Manager', 'Pass0024!', 3, TRUE, '2026-05-01T09:29:00', '2026-05-01T09:29:00'),
  (25, 'YaraFangwell', 'YaraFangwell@tsmc.tw', '2025', 'Backend Engineer', 'Pass0025!', 3, TRUE, '2026-05-01T09:30:00', '2026-05-01T09:30:00'),
  (26, 'ZaneKaowell', 'ZaneKaowell@tsmc.tw', '2026', 'API Engineer', 'Pass0026!', 3, TRUE, '2026-05-01T09:31:00', '2026-05-01T09:31:00'),
  (27, 'AaronWang', 'AaronWang@tsmc.tw', '2027', 'Microservices Engineer', 'Pass0027!', 3, TRUE, '2026-05-01T09:32:00', '2026-05-01T09:32:00'),
  (28, 'BrookeYang', 'BrookeYang@tsmc.tw', '2028', 'Integration Engineer', 'Pass0028!', 3, TRUE, '2026-05-01T09:33:00', '2026-05-01T09:33:00'),
  (29, 'CyrusLu', 'CyrusLu@tsmc.tw', '2029', 'Software Engineer', 'Pass0029!', 3, TRUE, '2026-05-01T09:34:00', '2026-05-01T09:34:00'),
  (30, 'DeliaLai', 'DeliaLai@tsmc.tw', '2030', 'Database Backend Engineer', 'Pass0030!', 3, TRUE, '2026-05-01T09:35:00', '2026-05-01T09:35:00'),
  (31, 'EliasSung', 'EliasSung@tsmc.tw', '2031', 'Senior Backend Engineer', 'Pass0031!', 3, TRUE, '2026-05-01T09:36:00', '2026-05-01T09:36:00'),
  (32, 'FionaHwang', 'FionaHwang@tsmc.tw', '2032', 'Backend Engineer', 'Pass0032!', 3, TRUE, '2026-05-01T09:37:00', '2026-05-01T09:37:00'),
  (33, 'GrantChien', 'GrantChien@tsmc.tw', '2033', 'API Engineer', 'Pass0033!', 3, TRUE, '2026-05-01T09:38:00', '2026-05-01T09:38:00'),
  (34, 'HeidiTzeng', 'HeidiTzeng@tsmc.tw', '2034', 'Microservices Engineer', 'Pass0034!', 3, TRUE, '2026-05-01T09:39:00', '2026-05-01T09:39:00'),
  (35, 'IsaacHsuang', 'IsaacHsuang@tsmc.tw', '2035', 'Integration Engineer', 'Pass0035!', 3, TRUE, '2026-05-01T09:40:00', '2026-05-01T09:40:00'),
  (36, 'JasmineHuangson', 'JasmineHuangson@tsmc.tw', '2036', 'Software Engineer', 'Pass0036!', 3, TRUE, '2026-05-01T09:41:00', '2026-05-01T09:41:00'),
  (37, 'KaiYehson', 'KaiYehson@tsmc.tw', '2037', 'Database Backend Engineer', 'Pass0037!', 3, TRUE, '2026-05-01T09:42:00', '2026-05-01T09:42:00'),
  (38, 'LeonaTangridge', 'LeonaTangridge@tsmc.tw', '2038', 'Senior Backend Engineer', 'Pass0038!', 3, TRUE, '2026-05-01T09:43:00', '2026-05-01T09:43:00'),
  (39, 'MilesWeiston', 'MilesWeiston@tsmc.tw', '2039', 'Backend Engineer', 'Pass0039!', 3, TRUE, '2026-05-01T09:44:00', '2026-05-01T09:44:00'),
  (40, 'NinaChang', 'NinaChang@tsmc.tw', '2040', 'API Engineer', 'Pass0040!', 3, TRUE, '2026-05-01T09:45:00', '2026-05-01T09:45:00'),
  (41, 'OscarHsu', 'OscarHsu@tsmc.tw', '2041', 'Microservices Engineer', 'Pass0041!', 3, TRUE, '2026-05-01T09:46:00', '2026-05-01T09:46:00'),
  (42, 'PearlCheng', 'PearlCheng@tsmc.tw', '2042', 'Integration Engineer', 'Pass0042!', 3, TRUE, '2026-05-01T09:47:00', '2026-05-01T09:47:00'),
  (43, 'RowanShen', 'RowanShen@tsmc.tw', '2043', 'Software Engineer', 'Pass0043!', 3, TRUE, '2026-05-01T09:48:00', '2026-05-01T09:48:00'),
  (44, 'SelenaHsia', 'SelenaHsia@tsmc.tw', '2044', 'Database Backend Engineer', 'Pass0044!', 3, TRUE, '2026-05-01T09:49:00', '2026-05-01T09:49:00'),
  (45, 'TobiasLo', 'TobiasLo@tsmc.tw', '2045', 'Senior Backend Engineer', 'Pass0045!', 3, TRUE, '2026-05-01T09:50:00', '2026-05-01T09:50:00'),
  (46, 'VeraFu', 'VeraFu@tsmc.tw', '2046', 'Backend Engineer', 'Pass0046!', 3, TRUE, '2026-05-01T09:51:00', '2026-05-01T09:51:00'),
  (47, 'WesleyJou', 'WesleyJou@tsmc.tw', '2047', 'API Engineer', 'Pass0047!', 3, TRUE, '2026-05-01T09:52:00', '2026-05-01T09:52:00'),
  (48, 'YvonneHsuChen', 'YvonneHsuChen@tsmc.tw', '2048', 'Microservices Engineer', 'Pass0048!', 3, TRUE, '2026-05-01T09:53:00', '2026-05-01T09:53:00'),
  (49, 'AdrianWuknight', 'AdrianWuknight@tsmc.tw', '2049', 'Integration Engineer', 'Pass0049!', 3, TRUE, '2026-05-01T09:54:00', '2026-05-01T09:54:00'),
  (50, 'BlairKuowell', 'BlairKuowell@tsmc.tw', '2050', 'Software Engineer', 'Pass0050!', 3, TRUE, '2026-05-01T09:55:00', '2026-05-01T09:55:00'),
  (51, 'ColinHsiehson', 'ColinHsiehson@tsmc.tw', '2051', 'Database Backend Engineer', 'Pass0051!', 3, TRUE, '2026-05-01T09:56:00', '2026-05-01T09:56:00'),
  (52, 'DianaYuwell', 'DianaYuwell@tsmc.tw', '2052', 'Senior Backend Engineer', 'Pass0052!', 3, TRUE, '2026-05-01T09:57:00', '2026-05-01T09:57:00'),
  (53, 'EvanLiu', 'EvanLiu@tsmc.tw', '2053', 'Backend Engineer', 'Pass0053!', 3, TRUE, '2026-05-01T09:58:00', '2026-05-01T09:58:00'),
  (54, 'GiselleChou', 'GiselleChou@tsmc.tw', '2054', 'API Engineer', 'Pass0054!', 3, TRUE, '2026-05-01T09:59:00', '2026-05-01T09:59:00'),
  (55, 'HugoFang', 'HugoFang@tsmc.tw', '2055', 'Microservices Engineer', 'Pass0055!', 3, TRUE, '2026-05-01T10:00:00', '2026-05-01T10:00:00'),
  (56, 'IrisKao', 'IrisKao@tsmc.tw', '2056', 'Integration Engineer', 'Pass0056!', 3, TRUE, '2026-05-01T10:01:00', '2026-05-01T10:01:00'),
  (57, 'JonahChiu', 'JonahChiu@tsmc.tw', '2057', 'Software Engineer', 'Pass0057!', 3, TRUE, '2026-05-01T10:02:00', '2026-05-01T10:02:00'),
  (58, 'KiaraHung', 'KiaraHung@tsmc.tw', '2058', 'Database Backend Engineer', 'Pass0058!', 3, TRUE, '2026-05-01T10:03:00', '2026-05-01T10:03:00'),
  (59, 'LucasHan', 'LucasHan@tsmc.tw', '2059', 'Senior Backend Engineer', 'Pass0059!', 3, TRUE, '2026-05-01T10:04:00', '2026-05-01T10:04:00'),
  (60, 'MayaKu', 'MayaKu@tsmc.tw', '2060', 'Backend Engineer', 'Pass0060!', 3, TRUE, '2026-05-01T10:05:00', '2026-05-01T10:05:00'),
  (61, 'NolanLinwood', 'NolanLinwood@tsmc.tw', '2061', 'API Engineer', 'Pass0061!', 3, TRUE, '2026-05-01T10:06:00', '2026-05-01T10:06:00'),
  (62, 'OliveLeewood', 'OliveLeewood@tsmc.tw', '2062', 'Microservices Engineer', 'Pass0062!', 3, TRUE, '2026-05-01T10:07:00', '2026-05-01T10:07:00'),
  (63, 'PrestonSunridge', 'PrestonSunridge@tsmc.tw', '2063', 'Integration Engineer', 'Pass0063!', 3, TRUE, '2026-05-01T10:08:00', '2026-05-01T10:08:00'),
  (64, 'QuinnPengton', 'QuinnPengton@tsmc.tw', '2064', 'Software Engineer', 'Pass0064!', 3, TRUE, '2026-05-01T10:09:00', '2026-05-01T10:09:00'),
  (65, 'RubyKofield', 'RubyKofield@tsmc.tw', '2065', 'Database Backend Engineer', 'Pass0065!', 3, TRUE, '2026-05-01T10:10:00', '2026-05-01T10:10:00'),
  (66, 'SimonHuang', 'SimonHuang@tsmc.tw', '2066', 'Senior Backend Engineer', 'Pass0066!', 3, TRUE, '2026-05-01T10:11:00', '2026-05-01T10:11:00'),
  (67, 'TessaYeh', 'TessaYeh@tsmc.tw', '2067', 'Backend Engineer', 'Pass0067!', 3, TRUE, '2026-05-01T10:12:00', '2026-05-01T10:12:00'),
  (68, 'UrielTang', 'UrielTang@tsmc.tw', '2068', 'API Engineer', 'Pass0068!', 3, TRUE, '2026-05-01T10:13:00', '2026-05-01T10:13:00'),
  (69, 'ValeriaWei', 'ValeriaWei@tsmc.tw', '2069', 'Microservices Engineer', 'Pass0069!', 3, TRUE, '2026-05-01T10:14:00', '2026-05-01T10:14:00'),
  (70, 'WarrenHsiao', 'WarrenHsiao@tsmc.tw', '2070', 'Integration Engineer', 'Pass0070!', 3, TRUE, '2026-05-01T10:15:00', '2026-05-01T10:15:00'),
  (71, 'YasminMa', 'YasminMa@tsmc.tw', '2071', 'Software Engineer', 'Pass0071!', 3, TRUE, '2026-05-01T10:16:00', '2026-05-01T10:16:00'),
  (72, 'ZacharyShih', 'ZacharyShih@tsmc.tw', '2072', 'Database Backend Engineer', 'Pass0072!', 3, TRUE, '2026-05-01T10:17:00', '2026-05-01T10:17:00'),
  (73, 'AmeliaPai', 'AmeliaPai@tsmc.tw', '2073', 'Senior Backend Engineer', 'Pass0073!', 3, TRUE, '2026-05-01T10:18:00', '2026-05-01T10:18:00'),
  (74, 'BennettChenfield', 'BennettChenfield@tsmc.tw', '2074', 'Frontend Development Manager', 'Pass0074!', 4, TRUE, '2026-05-01T10:19:00', '2026-05-01T10:19:00'),
  (75, 'ClaraTsaiton', 'ClaraTsaiton@tsmc.tw', '2075', 'Frontend Engineer', 'Pass0075!', 4, TRUE, '2026-05-01T10:20:00', '2026-05-01T10:20:00'),
  (76, 'DominicHoval', 'DominicHoval@tsmc.tw', '2076', 'UI Engineer', 'Pass0076!', 4, TRUE, '2026-05-01T10:21:00', '2026-05-01T10:21:00'),
  (77, 'ElisePanfield', 'ElisePanfield@tsmc.tw', '2077', 'Web Application Engineer', 'Pass0077!', 4, TRUE, '2026-05-01T10:22:00', '2026-05-01T10:22:00'),
  (78, 'FelixLiaoridge', 'FelixLiaoridge@tsmc.tw', '2078', 'Design System Engineer', 'Pass0078!', 4, TRUE, '2026-05-01T10:23:00', '2026-05-01T10:23:00'),
  (79, 'GemmaWu', 'GemmaWu@tsmc.tw', '2079', 'JavaScript Engineer', 'Pass0079!', 4, TRUE, '2026-05-01T10:24:00', '2026-05-01T10:24:00'),
  (80, 'HarperKuo', 'HarperKuo@tsmc.tw', '2080', 'Senior Frontend Engineer', 'Pass0080!', 4, TRUE, '2026-05-01T10:25:00', '2026-05-01T10:25:00'),
  (81, 'JulianHsieh', 'JulianHsieh@tsmc.tw', '2081', 'Frontend Engineer', 'Pass0081!', 4, TRUE, '2026-05-01T10:26:00', '2026-05-01T10:26:00'),
  (82, 'KeiraYu', 'KeiraYu@tsmc.tw', '2082', 'UI Engineer', 'Pass0082!', 4, TRUE, '2026-05-01T10:27:00', '2026-05-01T10:27:00'),
  (83, 'LiamFan', 'LiamFan@tsmc.tw', '2083', 'Web Application Engineer', 'Pass0083!', 4, TRUE, '2026-05-01T10:28:00', '2026-05-01T10:28:00'),
  (84, 'MilaTien', 'MilaTien@tsmc.tw', '2084', 'Design System Engineer', 'Pass0084!', 4, TRUE, '2026-05-01T10:29:00', '2026-05-01T10:29:00'),
  (85, 'NathanTuan', 'NathanTuan@tsmc.tw', '2085', 'JavaScript Engineer', 'Pass0085!', 4, TRUE, '2026-05-01T10:30:00', '2026-05-01T10:30:00'),
  (86, 'OliviaMou', 'OliviaMou@tsmc.tw', '2086', 'Senior Frontend Engineer', 'Pass0086!', 4, TRUE, '2026-05-01T10:31:00', '2026-05-01T10:31:00'),
  (87, 'ParkerWangston', 'ParkerWangston@tsmc.tw', '2087', 'Frontend Engineer', 'Pass0087!', 4, TRUE, '2026-05-01T10:32:00', '2026-05-01T10:32:00'),
  (88, 'ReinaYangford', 'ReinaYangford@tsmc.tw', '2088', 'UI Engineer', 'Pass0088!', 4, TRUE, '2026-05-01T10:33:00', '2026-05-01T10:33:00'),
  (89, 'SilasLuknight', 'SilasLuknight@tsmc.tw', '2089', 'Web Application Engineer', 'Pass0089!', 4, TRUE, '2026-05-01T10:34:00', '2026-05-01T10:34:00'),
  (90, 'TaliaLaiford', 'TaliaLaiford@tsmc.tw', '2090', 'Design System Engineer', 'Pass0090!', 4, TRUE, '2026-05-01T10:35:00', '2026-05-01T10:35:00'),
  (91, 'VincentLin', 'VincentLin@tsmc.tw', '2091', 'JavaScript Engineer', 'Pass0091!', 4, TRUE, '2026-05-01T10:36:00', '2026-05-01T10:36:00'),
  (92, 'WillowLee', 'WillowLee@tsmc.tw', '2092', 'Senior Frontend Engineer', 'Pass0092!', 4, TRUE, '2026-05-01T10:37:00', '2026-05-01T10:37:00'),
  (93, 'XavierSun', 'XavierSun@tsmc.tw', '2093', 'Frontend Engineer', 'Pass0093!', 4, TRUE, '2026-05-01T10:38:00', '2026-05-01T10:38:00'),
  (94, 'ZoeyPeng', 'ZoeyPeng@tsmc.tw', '2094', 'UI Engineer', 'Pass0094!', 4, TRUE, '2026-05-01T10:39:00', '2026-05-01T10:39:00'),
  (95, 'AndrewKo', 'AndrewKo@tsmc.tw', '2095', 'Web Application Engineer', 'Pass0095!', 4, TRUE, '2026-05-01T10:40:00', '2026-05-01T10:40:00'),
  (96, 'BiancaChiang', 'BiancaChiang@tsmc.tw', '2096', 'Design System Engineer', 'Pass0096!', 4, TRUE, '2026-05-01T10:41:00', '2026-05-01T10:41:00'),
  (97, 'ConnorLan', 'ConnorLan@tsmc.tw', '2097', 'JavaScript Engineer', 'Pass0097!', 4, TRUE, '2026-05-01T10:42:00', '2026-05-01T10:42:00'),
  (98, 'DaisyTeng', 'DaisyTeng@tsmc.tw', '2098', 'Senior Frontend Engineer', 'Pass0098!', 4, TRUE, '2026-05-01T10:43:00', '2026-05-01T10:43:00'),
  (99, 'EmersonShao', 'EmersonShao@tsmc.tw', '2099', 'Frontend Engineer', 'Pass0099!', 4, TRUE, '2026-05-01T10:44:00', '2026-05-01T10:44:00'),
  (100, 'FaithChangwell', 'FaithChangwell@tsmc.tw', '2100', 'UI Engineer', 'Pass0100!', 4, TRUE, '2026-05-01T10:45:00', '2026-05-01T10:45:00'),
  (101, 'GeorgeHsufield', 'GeorgeHsufield@tsmc.tw', '2101', 'Web Application Engineer', 'Pass0101!', 4, TRUE, '2026-05-01T10:46:00', '2026-05-01T10:46:00'),
  (102, 'HannahChengford', 'HannahChengford@tsmc.tw', '2102', 'Design System Engineer', 'Pass0102!', 4, TRUE, '2026-05-01T10:47:00', '2026-05-01T10:47:00'),
  (103, 'JasonShenridge', 'JasonShenridge@tsmc.tw', '2103', 'JavaScript Engineer', 'Pass0103!', 4, TRUE, '2026-05-01T10:48:00', '2026-05-01T10:48:00'),
  (104, 'KimberlyChen', 'KimberlyChen@tsmc.tw', '2104', 'Senior Frontend Engineer', 'Pass0104!', 4, TRUE, '2026-05-01T10:49:00', '2026-05-01T10:49:00'),
  (105, 'LoganTsai', 'LoganTsai@tsmc.tw', '2105', 'Frontend Engineer', 'Pass0105!', 4, TRUE, '2026-05-01T10:50:00', '2026-05-01T10:50:00'),
  (106, 'MelodyHo', 'MelodyHo@tsmc.tw', '2106', 'UI Engineer', 'Pass0106!', 4, TRUE, '2026-05-01T10:51:00', '2026-05-01T10:51:00'),
  (107, 'NicholasPan', 'NicholasPan@tsmc.tw', '2107', 'Web Application Engineer', 'Pass0107!', 4, TRUE, '2026-05-01T10:52:00', '2026-05-01T10:52:00'),
  (108, 'PhoebeLiao', 'PhoebeLiao@tsmc.tw', '2108', 'Design System Engineer', 'Pass0108!', 4, TRUE, '2026-05-01T10:53:00', '2026-05-01T10:53:00'),
  (109, 'RaymondYen', 'RaymondYen@tsmc.tw', '2109', 'JavaScript Engineer', 'Pass0109!', 4, TRUE, '2026-05-01T10:54:00', '2026-05-01T10:54:00'),
  (110, 'SabrinaWen', 'SabrinaWen@tsmc.tw', '2110', 'Senior Frontend Engineer', 'Pass0110!', 4, TRUE, '2026-05-01T10:55:00', '2026-05-01T10:55:00'),
  (111, 'TylerLiang', 'TylerLiang@tsmc.tw', '2111', 'Frontend Engineer', 'Pass0111!', 4, TRUE, '2026-05-01T10:56:00', '2026-05-01T10:56:00'),
  (112, 'VanessaChao', 'VanessaChao@tsmc.tw', '2112', 'UI Engineer', 'Pass0112!', 4, TRUE, '2026-05-01T10:57:00', '2026-05-01T10:57:00'),
  (113, 'WalterLiuhart', 'WalterLiuhart@tsmc.tw', '2113', 'Web Application Engineer', 'Pass0113!', 4, TRUE, '2026-05-01T10:58:00', '2026-05-01T10:58:00'),
  (114, 'YolandaChoulin', 'YolandaChoulin@tsmc.tw', '2114', 'Design System Engineer', 'Pass0114!', 4, TRUE, '2026-05-01T10:59:00', '2026-05-01T10:59:00'),
  (115, 'ArthurFangwell', 'ArthurFangwell@tsmc.tw', '2115', 'JavaScript Engineer', 'Pass0115!', 4, TRUE, '2026-05-01T11:00:00', '2026-05-01T11:00:00'),
  (116, 'CelesteKaowell', 'CelesteKaowell@tsmc.tw', '2116', 'QA & Testing Manager', 'Pass0116!', 5, TRUE, '2026-05-01T11:01:00', '2026-05-01T11:01:00'),
  (117, 'DerekWang', 'DerekWang@tsmc.tw', '2117', 'QA Engineer', 'Pass0117!', 5, TRUE, '2026-05-01T11:02:00', '2026-05-01T11:02:00'),
  (118, 'ElaineYang', 'ElaineYang@tsmc.tw', '2118', 'Automation Test Engineer', 'Pass0118!', 5, TRUE, '2026-05-01T11:03:00', '2026-05-01T11:03:00'),
  (119, 'FranklinLu', 'FranklinLu@tsmc.tw', '2119', 'Manual Test Engineer', 'Pass0119!', 5, TRUE, '2026-05-01T11:04:00', '2026-05-01T11:04:00'),
  (120, 'GloriaLai', 'GloriaLai@tsmc.tw', '2120', 'Performance Test Engineer', 'Pass0120!', 5, TRUE, '2026-05-01T11:05:00', '2026-05-01T11:05:00'),
  (121, 'HenrySung', 'HenrySung@tsmc.tw', '2121', 'Test Analyst', 'Pass0121!', 5, TRUE, '2026-05-01T11:06:00', '2026-05-01T11:06:00'),
  (122, 'IngridHwang', 'IngridHwang@tsmc.tw', '2122', 'QA Lead', 'Pass0122!', 5, TRUE, '2026-05-01T11:07:00', '2026-05-01T11:07:00'),
  (123, 'JustinChien', 'JustinChien@tsmc.tw', '2123', 'QA Engineer', 'Pass0123!', 5, TRUE, '2026-05-01T11:08:00', '2026-05-01T11:08:00'),
  (124, 'KatrinaTzeng', 'KatrinaTzeng@tsmc.tw', '2124', 'Automation Test Engineer', 'Pass0124!', 5, TRUE, '2026-05-01T11:09:00', '2026-05-01T11:09:00'),
  (125, 'MarcusHsuang', 'MarcusHsuang@tsmc.tw', '2125', 'Manual Test Engineer', 'Pass0125!', 5, TRUE, '2026-05-01T11:10:00', '2026-05-01T11:10:00'),
  (126, 'NatalieHuangson', 'NatalieHuangson@tsmc.tw', '2126', 'Performance Test Engineer', 'Pass0126!', 5, TRUE, '2026-05-01T11:11:00', '2026-05-01T11:11:00'),
  (127, 'PatrickYehson', 'PatrickYehson@tsmc.tw', '2127', 'Test Analyst', 'Pass0127!', 5, TRUE, '2026-05-01T11:12:00', '2026-05-01T11:12:00'),
  (128, 'ReneeTangridge', 'ReneeTangridge@tsmc.tw', '2128', 'QA Lead', 'Pass0128!', 5, TRUE, '2026-05-01T11:13:00', '2026-05-01T11:13:00'),
  (129, 'SamuelWeiston', 'SamuelWeiston@tsmc.tw', '2129', 'QA Engineer', 'Pass0129!', 5, TRUE, '2026-05-01T11:14:00', '2026-05-01T11:14:00'),
  (130, 'TeresaChang', 'TeresaChang@tsmc.tw', '2130', 'Automation Test Engineer', 'Pass0130!', 5, TRUE, '2026-05-01T11:15:00', '2026-05-01T11:15:00'),
  (131, 'VictorHsu', 'VictorHsu@tsmc.tw', '2131', 'Manual Test Engineer', 'Pass0131!', 5, TRUE, '2026-05-01T11:16:00', '2026-05-01T11:16:00'),
  (132, 'WendyCheng', 'WendyCheng@tsmc.tw', '2132', 'Performance Test Engineer', 'Pass0132!', 5, TRUE, '2026-05-01T11:17:00', '2026-05-01T11:17:00'),
  (133, 'AlbertShen', 'AlbertShen@tsmc.tw', '2133', 'Test Analyst', 'Pass0133!', 5, TRUE, '2026-05-01T11:18:00', '2026-05-01T11:18:00'),
  (134, 'BeatriceHsia', 'BeatriceHsia@tsmc.tw', '2134', 'QA Lead', 'Pass0134!', 5, TRUE, '2026-05-01T11:19:00', '2026-05-01T11:19:00'),
  (135, 'ClarkLo', 'ClarkLo@tsmc.tw', '2135', 'QA Engineer', 'Pass0135!', 5, TRUE, '2026-05-01T11:20:00', '2026-05-01T11:20:00'),
  (136, 'ElaineFu', 'ElaineFu@tsmc.tw', '2136', 'Automation Test Engineer', 'Pass0136!', 5, TRUE, '2026-05-01T11:21:00', '2026-05-01T11:21:00'),
  (137, 'ElliotJou', 'ElliotJou@tsmc.tw', '2137', 'Manual Test Engineer', 'Pass0137!', 5, TRUE, '2026-05-01T11:22:00', '2026-05-01T11:22:00'),
  (138, 'FrancescaHsuChen', 'FrancescaHsuChen@tsmc.tw', '2138', 'Performance Test Engineer', 'Pass0138!', 5, TRUE, '2026-05-01T11:23:00', '2026-05-01T11:23:00'),
  (139, 'GilbertWuknight', 'GilbertWuknight@tsmc.tw', '2139', 'Test Analyst', 'Pass0139!', 5, TRUE, '2026-05-01T11:24:00', '2026-05-01T11:24:00'),
  (140, 'HelenaKuowell', 'HelenaKuowell@tsmc.tw', '2140', 'QA Lead', 'Pass0140!', 5, TRUE, '2026-05-01T11:25:00', '2026-05-01T11:25:00'),
  (141, 'IvanHsiehson', 'IvanHsiehson@tsmc.tw', '2141', 'QA Engineer', 'Pass0141!', 5, TRUE, '2026-05-01T11:26:00', '2026-05-01T11:26:00'),
  (142, 'JocelynYuwell', 'JocelynYuwell@tsmc.tw', '2142', 'Automation Test Engineer', 'Pass0142!', 5, TRUE, '2026-05-01T11:27:00', '2026-05-01T11:27:00'),
  (143, 'KevinLiu', 'KevinLiu@tsmc.tw', '2143', 'Manual Test Engineer', 'Pass0143!', 5, TRUE, '2026-05-01T11:28:00', '2026-05-01T11:28:00'),
  (144, 'LillianChou', 'LillianChou@tsmc.tw', '2144', 'Performance Test Engineer', 'Pass0144!', 5, TRUE, '2026-05-01T11:29:00', '2026-05-01T11:29:00'),
  (145, 'MartinFang', 'MartinFang@tsmc.tw', '2145', 'Test Analyst', 'Pass0145!', 5, TRUE, '2026-05-01T11:30:00', '2026-05-01T11:30:00'),
  (146, 'NaomiKao', 'NaomiKao@tsmc.tw', '2146', 'QA Lead', 'Pass0146!', 5, TRUE, '2026-05-01T11:31:00', '2026-05-01T11:31:00'),
  (147, 'PhillipChiu', 'PhillipChiu@tsmc.tw', '2147', 'QA Engineer', 'Pass0147!', 5, TRUE, '2026-05-01T11:32:00', '2026-05-01T11:32:00'),
  (148, 'RosalieHung', 'RosalieHung@tsmc.tw', '2148', 'DevOps Manager', 'Pass0148!', 6, TRUE, '2026-05-01T11:33:00', '2026-05-01T11:33:00'),
  (149, 'StanleyHan', 'StanleyHan@tsmc.tw', '2149', 'DevOps Engineer', 'Pass0149!', 6, TRUE, '2026-05-01T11:34:00', '2026-05-01T11:34:00'),
  (150, 'TriciaKu', 'TriciaKu@tsmc.tw', '2150', 'Site Reliability Engineer', 'Pass0150!', 6, TRUE, '2026-05-01T11:35:00', '2026-05-01T11:35:00'),
  (151, 'VinceLinwood', 'VinceLinwood@tsmc.tw', '2151', 'CI/CD Engineer', 'Pass0151!', 6, TRUE, '2026-05-01T11:36:00', '2026-05-01T11:36:00'),
  (152, 'WinnieLeewood', 'WinnieLeewood@tsmc.tw', '2152', 'Platform Automation Engineer', 'Pass0152!', 6, TRUE, '2026-05-01T11:37:00', '2026-05-01T11:37:00'),
  (153, 'XavierSunridge', 'XavierSunridge@tsmc.tw', '2153', 'Senior DevOps Engineer', 'Pass0153!', 6, TRUE, '2026-05-01T11:38:00', '2026-05-01T11:38:00'),
  (154, 'YvettePengton', 'YvettePengton@tsmc.tw', '2154', 'DevOps Engineer', 'Pass0154!', 6, TRUE, '2026-05-01T11:39:00', '2026-05-01T11:39:00'),
  (155, 'AbelKofield', 'AbelKofield@tsmc.tw', '2155', 'Site Reliability Engineer', 'Pass0155!', 6, TRUE, '2026-05-01T11:40:00', '2026-05-01T11:40:00'),
  (156, 'BriannaHuang', 'BriannaHuang@tsmc.tw', '2156', 'CI/CD Engineer', 'Pass0156!', 6, TRUE, '2026-05-01T11:41:00', '2026-05-01T11:41:00'),
  (157, 'CarterYeh', 'CarterYeh@tsmc.tw', '2157', 'Platform Automation Engineer', 'Pass0157!', 6, TRUE, '2026-05-01T11:42:00', '2026-05-01T11:42:00'),
  (158, 'DanaTang', 'DanaTang@tsmc.tw', '2158', 'Senior DevOps Engineer', 'Pass0158!', 6, TRUE, '2026-05-01T11:43:00', '2026-05-01T11:43:00'),
  (159, 'EdisonWei', 'EdisonWei@tsmc.tw', '2159', 'DevOps Engineer', 'Pass0159!', 6, TRUE, '2026-05-01T11:44:00', '2026-05-01T11:44:00'),
  (160, 'FeliciaHsiao', 'FeliciaHsiao@tsmc.tw', '2160', 'Site Reliability Engineer', 'Pass0160!', 6, TRUE, '2026-05-01T11:45:00', '2026-05-01T11:45:00'),
  (161, 'GordonMa', 'GordonMa@tsmc.tw', '2161', 'CI/CD Engineer', 'Pass0161!', 6, TRUE, '2026-05-01T11:46:00', '2026-05-01T11:46:00'),
  (162, 'HildaShih', 'HildaShih@tsmc.tw', '2162', 'Platform Automation Engineer', 'Pass0162!', 6, TRUE, '2026-05-01T11:47:00', '2026-05-01T11:47:00'),
  (163, 'JeromePai', 'JeromePai@tsmc.tw', '2163', 'Senior DevOps Engineer', 'Pass0163!', 6, TRUE, '2026-05-01T11:48:00', '2026-05-01T11:48:00'),
  (164, 'KristaChenfield', 'KristaChenfield@tsmc.tw', '2164', 'DevOps Engineer', 'Pass0164!', 6, TRUE, '2026-05-01T11:49:00', '2026-05-01T11:49:00'),
  (165, 'LeonardTsaiton', 'LeonardTsaiton@tsmc.tw', '2165', 'Site Reliability Engineer', 'Pass0165!', 6, TRUE, '2026-05-01T11:50:00', '2026-05-01T11:50:00'),
  (166, 'MabelHoval', 'MabelHoval@tsmc.tw', '2166', 'CI/CD Engineer', 'Pass0166!', 6, TRUE, '2026-05-01T11:51:00', '2026-05-01T11:51:00'),
  (167, 'NelsonPanfield', 'NelsonPanfield@tsmc.tw', '2167', 'Platform Automation Engineer', 'Pass0167!', 6, TRUE, '2026-05-01T11:52:00', '2026-05-01T11:52:00'),
  (168, 'PriscillaLiaoridge', 'PriscillaLiaoridge@tsmc.tw', '2168', 'Senior DevOps Engineer', 'Pass0168!', 6, TRUE, '2026-05-01T11:53:00', '2026-05-01T11:53:00'),
  (169, 'RogerWu', 'RogerWu@tsmc.tw', '2169', 'DevOps Engineer', 'Pass0169!', 6, TRUE, '2026-05-01T11:54:00', '2026-05-01T11:54:00'),
  (170, 'StellaKuo', 'StellaKuo@tsmc.tw', '2170', 'Site Reliability Engineer', 'Pass0170!', 6, TRUE, '2026-05-01T11:55:00', '2026-05-01T11:55:00'),
  (171, 'TravisHsieh', 'TravisHsieh@tsmc.tw', '2171', 'Business Systems Manager', 'Pass0171!', 7, TRUE, '2026-05-01T11:56:00', '2026-05-01T11:56:00'),
  (172, 'ValerieYu', 'ValerieYu@tsmc.tw', '2172', 'Systems Analyst', 'Pass0172!', 7, TRUE, '2026-05-01T11:57:00', '2026-05-01T11:57:00'),
  (173, 'WayneFan', 'WayneFan@tsmc.tw', '2173', 'ERP Specialist', 'Pass0173!', 7, TRUE, '2026-05-01T11:58:00', '2026-05-01T11:58:00'),
  (174, 'YasminaTien', 'YasminaTien@tsmc.tw', '2174', 'CRM Specialist', 'Pass0174!', 7, TRUE, '2026-05-01T11:59:00', '2026-05-01T11:59:00'),
  (175, 'AlinaTuan', 'AlinaTuan@tsmc.tw', '2175', 'Workflow Analyst', 'Pass0175!', 7, TRUE, '2026-05-01T12:00:00', '2026-05-01T12:00:00'),
  (176, 'BrandonMou', 'BrandonMou@tsmc.tw', '2176', 'Product Analyst', 'Pass0176!', 7, TRUE, '2026-05-01T12:01:00', '2026-05-01T12:01:00'),
  (177, 'CedricWangston', 'CedricWangston@tsmc.tw', '2177', 'Business Analyst', 'Pass0177!', 7, TRUE, '2026-05-01T12:02:00', '2026-05-01T12:02:00'),
  (178, 'DoreenYangford', 'DoreenYangford@tsmc.tw', '2178', 'Systems Analyst', 'Pass0178!', 7, TRUE, '2026-05-01T12:03:00', '2026-05-01T12:03:00'),
  (179, 'EverettLuknight', 'EverettLuknight@tsmc.tw', '2179', 'ERP Specialist', 'Pass0179!', 7, TRUE, '2026-05-01T12:04:00', '2026-05-01T12:04:00'),
  (180, 'FarahLaiford', 'FarahLaiford@tsmc.tw', '2180', 'CRM Specialist', 'Pass0180!', 7, TRUE, '2026-05-01T12:05:00', '2026-05-01T12:05:00'),
  (181, 'GarethLin', 'GarethLin@tsmc.tw', '2181', 'Workflow Analyst', 'Pass0181!', 7, TRUE, '2026-05-01T12:06:00', '2026-05-01T12:06:00'),
  (182, 'HollyLee', 'HollyLee@tsmc.tw', '2182', 'Product Analyst', 'Pass0182!', 7, TRUE, '2026-05-01T12:07:00', '2026-05-01T12:07:00'),
  (183, 'IlyaSun', 'IlyaSun@tsmc.tw', '2183', 'Business Analyst', 'Pass0183!', 7, TRUE, '2026-05-01T12:08:00', '2026-05-01T12:08:00'),
  (184, 'JanicePeng', 'JanicePeng@tsmc.tw', '2184', 'Systems Analyst', 'Pass0184!', 7, TRUE, '2026-05-01T12:09:00', '2026-05-01T12:09:00'),
  (185, 'KelvinKo', 'KelvinKo@tsmc.tw', '2185', 'ERP Specialist', 'Pass0185!', 7, TRUE, '2026-05-01T12:10:00', '2026-05-01T12:10:00'),
  (186, 'LouiseChiang', 'LouiseChiang@tsmc.tw', '2186', 'CRM Specialist', 'Pass0186!', 7, TRUE, '2026-05-01T12:11:00', '2026-05-01T12:11:00'),
  (187, 'MalcolmLan', 'MalcolmLan@tsmc.tw', '2187', 'Workflow Analyst', 'Pass0187!', 7, TRUE, '2026-05-01T12:12:00', '2026-05-01T12:12:00'),
  (188, 'NoelleTeng', 'NoelleTeng@tsmc.tw', '2188', 'Product Analyst', 'Pass0188!', 7, TRUE, '2026-05-01T12:13:00', '2026-05-01T12:13:00'),
  (189, 'PercyShao', 'PercyShao@tsmc.tw', '2189', 'Business Analyst', 'Pass0189!', 7, TRUE, '2026-05-01T12:14:00', '2026-05-01T12:14:00'),
  (190, 'RachelChangwell', 'RachelChangwell@tsmc.tw', '2190', 'Systems Analyst', 'Pass0190!', 7, TRUE, '2026-05-01T12:15:00', '2026-05-01T12:15:00'),
  (191, 'ShawnHsufield', 'ShawnHsufield@tsmc.tw', '2191', 'ERP Specialist', 'Pass0191!', 7, TRUE, '2026-05-01T12:16:00', '2026-05-01T12:16:00'),
  (192, 'TiffanyChengford', 'TiffanyChengford@tsmc.tw', '2192', 'CRM Specialist', 'Pass0192!', 7, TRUE, '2026-05-01T12:17:00', '2026-05-01T12:17:00'),
  (193, 'VaughnShenridge', 'VaughnShenridge@tsmc.tw', '2193', 'Workflow Analyst', 'Pass0193!', 7, TRUE, '2026-05-01T12:18:00', '2026-05-01T12:18:00'),
  (194, 'WhitneyChen', 'WhitneyChen@tsmc.tw', '2194', 'Product Analyst', 'Pass0194!', 7, TRUE, '2026-05-01T12:19:00', '2026-05-01T12:19:00'),
  (195, 'XanderTsai', 'XanderTsai@tsmc.tw', '2195', 'Business Analyst', 'Pass0195!', 7, TRUE, '2026-05-01T12:20:00', '2026-05-01T12:20:00'),
  (196, 'YukiHo', 'YukiHo@tsmc.tw', '2196', 'Systems Analyst', 'Pass0196!', 7, TRUE, '2026-05-01T12:21:00', '2026-05-01T12:21:00'),
  (197, 'AshtonPan', 'AshtonPan@tsmc.tw', '2197', 'ERP Specialist', 'Pass0197!', 7, TRUE, '2026-05-01T12:22:00', '2026-05-01T12:22:00'),
  (198, 'BonnieLiao', 'BonnieLiao@tsmc.tw', '2198', 'CRM Specialist', 'Pass0198!', 7, TRUE, '2026-05-01T12:23:00', '2026-05-01T12:23:00'),
  (199, 'CurtisYen', 'CurtisYen@tsmc.tw', '2199', 'Application Support Manager', 'Pass0199!', 8, TRUE, '2026-05-01T12:24:00', '2026-05-01T12:24:00'),
  (200, 'ElinaWen', 'ElinaWen@tsmc.tw', '2200', 'Support Analyst', 'Pass0200!', 8, TRUE, '2026-05-01T12:25:00', '2026-05-01T12:25:00'),
  (201, 'FraserLiang', 'FraserLiang@tsmc.tw', '2201', 'Incident Coordinator', 'Pass0201!', 8, TRUE, '2026-05-01T12:26:00', '2026-05-01T12:26:00'),
  (202, 'GiaChao', 'GiaChao@tsmc.tw', '2202', 'L2 Support Specialist', 'Pass0202!', 8, TRUE, '2026-05-01T12:27:00', '2026-05-01T12:27:00'),
  (203, 'HaroldLiuhart', 'HaroldLiuhart@tsmc.tw', '2203', 'Production Support Engineer', 'Pass0203!', 8, TRUE, '2026-05-01T12:28:00', '2026-05-01T12:28:00'),
  (204, 'IlanaChoulin', 'IlanaChoulin@tsmc.tw', '2204', 'Application Support Engineer', 'Pass0204!', 8, TRUE, '2026-05-01T12:29:00', '2026-05-01T12:29:00'),
  (205, 'JoelFangwell', 'JoelFangwell@tsmc.tw', '2205', 'Support Analyst', 'Pass0205!', 8, TRUE, '2026-05-01T12:30:00', '2026-05-01T12:30:00'),
  (206, 'KarinaKaowell', 'KarinaKaowell@tsmc.tw', '2206', 'Incident Coordinator', 'Pass0206!', 8, TRUE, '2026-05-01T12:31:00', '2026-05-01T12:31:00'),
  (207, 'LionelWang', 'LionelWang@tsmc.tw', '2207', 'L2 Support Specialist', 'Pass0207!', 8, TRUE, '2026-05-01T12:32:00', '2026-05-01T12:32:00'),
  (208, 'MonicaYang', 'MonicaYang@tsmc.tw', '2208', 'Production Support Engineer', 'Pass0208!', 8, TRUE, '2026-05-01T12:33:00', '2026-05-01T12:33:00'),
  (209, 'NevilleLu', 'NevilleLu@tsmc.tw', '2209', 'Application Support Engineer', 'Pass0209!', 8, TRUE, '2026-05-01T12:34:00', '2026-05-01T12:34:00'),
  (210, 'OpalLai', 'OpalLai@tsmc.tw', '2210', 'Support Analyst', 'Pass0210!', 8, TRUE, '2026-05-01T12:35:00', '2026-05-01T12:35:00'),
  (211, 'PierceSung', 'PierceSung@tsmc.tw', '2211', 'Incident Coordinator', 'Pass0211!', 8, TRUE, '2026-05-01T12:36:00', '2026-05-01T12:36:00'),
  (212, 'RinaHwang', 'RinaHwang@tsmc.tw', '2212', 'L2 Support Specialist', 'Pass0212!', 8, TRUE, '2026-05-01T12:37:00', '2026-05-01T12:37:00'),
  (213, 'SpencerChien', 'SpencerChien@tsmc.tw', '2213', 'Production Support Engineer', 'Pass0213!', 8, TRUE, '2026-05-01T12:38:00', '2026-05-01T12:38:00'),
  (214, 'ToriTzeng', 'ToriTzeng@tsmc.tw', '2214', 'Application Support Engineer', 'Pass0214!', 8, TRUE, '2026-05-01T12:39:00', '2026-05-01T12:39:00'),
  (215, 'VernonHsuang', 'VernonHsuang@tsmc.tw', '2215', 'Support Analyst', 'Pass0215!', 8, TRUE, '2026-05-01T12:40:00', '2026-05-01T12:40:00'),
  (216, 'WilmaHuangson', 'WilmaHuangson@tsmc.tw', '2216', 'Incident Coordinator', 'Pass0216!', 8, TRUE, '2026-05-01T12:41:00', '2026-05-01T12:41:00'),
  (217, 'YorkYehson', 'YorkYehson@tsmc.tw', '2217', 'L2 Support Specialist', 'Pass0217!', 8, TRUE, '2026-05-01T12:42:00', '2026-05-01T12:42:00'),
  (218, 'ZaraTangridge', 'ZaraTangridge@tsmc.tw', '2218', 'Production Support Engineer', 'Pass0218!', 8, TRUE, '2026-05-01T12:43:00', '2026-05-01T12:43:00'),
  (219, 'AidenYuwell', 'AidenYuwell@tsmc.tw', '2219', 'Application Support Engineer', 'Pass0219!', 8, TRUE, '2026-05-01T12:44:00', '2026-05-01T12:44:00'),
  (220, 'BellaLiu', 'BellaLiu@tsmc.tw', '2220', 'Support Analyst', 'Pass0220!', 8, TRUE, '2026-05-01T12:45:00', '2026-05-01T12:45:00'),
  (221, 'CalebChou', 'CalebChou@tsmc.tw', '2221', 'Incident Coordinator', 'Pass0221!', 8, TRUE, '2026-05-01T12:46:00', '2026-05-01T12:46:00'),
  (222, 'DaphneFang', 'DaphneFang@tsmc.tw', '2222', 'L2 Support Specialist', 'Pass0222!', 8, TRUE, '2026-05-01T12:47:00', '2026-05-01T12:47:00'),
  (223, 'EthanKao', 'EthanKao@tsmc.tw', '2223', 'Infrastructure Director', 'Pass0223!', 9, TRUE, '2026-05-01T12:48:00', '2026-05-01T12:48:00'),
  (224, 'FreyaChiu', 'FreyaChiu@tsmc.tw', '2224', 'Infrastructure Architect', 'Pass0224!', 9, TRUE, '2026-05-01T12:49:00', '2026-05-01T12:49:00'),
  (225, 'GavinHung', 'GavinHung@tsmc.tw', '2225', 'IT Asset Coordinator', 'Pass0225!', 9, TRUE, '2026-05-01T12:50:00', '2026-05-01T12:50:00'),
  (226, 'HazelHan', 'HazelHan@tsmc.tw', '2226', 'Infrastructure Manager', 'Pass0226!', 9, TRUE, '2026-05-01T12:51:00', '2026-05-01T12:51:00'),
  (227, 'IanKu', 'IanKu@tsmc.tw', '2227', 'Infrastructure Architect', 'Pass0227!', 9, TRUE, '2026-05-01T12:52:00', '2026-05-01T12:52:00'),
  (228, 'JadeLinwood', 'JadeLinwood@tsmc.tw', '2228', 'IT Asset Coordinator', 'Pass0228!', 9, TRUE, '2026-05-01T12:53:00', '2026-05-01T12:53:00'),
  (229, 'KieranLeewood', 'KieranLeewood@tsmc.tw', '2229', 'Infrastructure Manager', 'Pass0229!', 9, TRUE, '2026-05-01T12:54:00', '2026-05-01T12:54:00'),
  (230, 'LaraSunridge', 'LaraSunridge@tsmc.tw', '2230', 'Infrastructure Architect', 'Pass0230!', 9, TRUE, '2026-05-01T12:55:00', '2026-05-01T12:55:00'),
  (231, 'MasonPengton', 'MasonPengton@tsmc.tw', '2231', 'Cloud Infrastructure Manager', 'Pass0231!', 10, TRUE, '2026-05-01T12:56:00', '2026-05-01T12:56:00'),
  (232, 'NoraKofield', 'NoraKofield@tsmc.tw', '2232', 'Cloud Operations Engineer', 'Pass0232!', 10, TRUE, '2026-05-01T12:57:00', '2026-05-01T12:57:00'),
  (233, 'OwenHuang', 'OwenHuang@tsmc.tw', '2233', 'Cloud Platform Engineer', 'Pass0233!', 10, TRUE, '2026-05-01T12:58:00', '2026-05-01T12:58:00'),
  (234, 'PaigeYeh', 'PaigeYeh@tsmc.tw', '2234', 'Cloud Engineer', 'Pass0234!', 10, TRUE, '2026-05-01T12:59:00', '2026-05-01T12:59:00'),
  (235, 'QuentinTang', 'QuentinTang@tsmc.tw', '2235', 'Cloud Operations Engineer', 'Pass0235!', 10, TRUE, '2026-05-01T13:00:00', '2026-05-01T13:00:00'),
  (236, 'RileyWei', 'RileyWei@tsmc.tw', '2236', 'Cloud Platform Engineer', 'Pass0236!', 10, TRUE, '2026-05-01T13:01:00', '2026-05-01T13:01:00'),
  (237, 'SiennaHsiao', 'SiennaHsiao@tsmc.tw', '2237', 'Cloud Engineer', 'Pass0237!', 10, TRUE, '2026-05-01T13:02:00', '2026-05-01T13:02:00'),
  (238, 'TheoMa', 'TheoMa@tsmc.tw', '2238', 'Cloud Operations Engineer', 'Pass0238!', 10, TRUE, '2026-05-01T13:03:00', '2026-05-01T13:03:00'),
  (239, 'UmaShih', 'UmaShih@tsmc.tw', '2239', 'Network Operations Manager', 'Pass0239!', 11, TRUE, '2026-05-01T13:04:00', '2026-05-01T13:04:00'),
  (240, 'VivianPai', 'VivianPai@tsmc.tw', '2240', 'NOC Engineer', 'Pass0240!', 11, TRUE, '2026-05-01T13:05:00', '2026-05-01T13:05:00'),
  (241, 'WyattChenfield', 'WyattChenfield@tsmc.tw', '2241', 'Network Administrator', 'Pass0241!', 11, TRUE, '2026-05-01T13:06:00', '2026-05-01T13:06:00'),
  (242, 'XeniaTsaiton', 'XeniaTsaiton@tsmc.tw', '2242', 'Network Engineer', 'Pass0242!', 11, TRUE, '2026-05-01T13:07:00', '2026-05-01T13:07:00'),
  (243, 'YaraHoval', 'YaraHoval@tsmc.tw', '2243', 'NOC Engineer', 'Pass0243!', 11, TRUE, '2026-05-01T13:08:00', '2026-05-01T13:08:00'),
  (244, 'ZanePanfield', 'ZanePanfield@tsmc.tw', '2244', 'Network Administrator', 'Pass0244!', 11, TRUE, '2026-05-01T13:09:00', '2026-05-01T13:09:00'),
  (245, 'AaronLiaoridge', 'AaronLiaoridge@tsmc.tw', '2245', 'Network Engineer', 'Pass0245!', 11, TRUE, '2026-05-01T13:10:00', '2026-05-01T13:10:00'),
  (246, 'BrookeWu', 'BrookeWu@tsmc.tw', '2246', 'Data Director', 'Pass0246!', 12, TRUE, '2026-05-01T13:11:00', '2026-05-01T13:11:00'),
  (247, 'CyrusKuo', 'CyrusKuo@tsmc.tw', '2247', 'Data Governance Specialist', 'Pass0247!', 12, TRUE, '2026-05-01T13:12:00', '2026-05-01T13:12:00'),
  (248, 'DeliaHsieh', 'DeliaHsieh@tsmc.tw', '2248', 'Data Program Coordinator', 'Pass0248!', 12, TRUE, '2026-05-01T13:13:00', '2026-05-01T13:13:00'),
  (249, 'EliasYu', 'EliasYu@tsmc.tw', '2249', 'Data Platform Manager', 'Pass0249!', 12, TRUE, '2026-05-01T13:14:00', '2026-05-01T13:14:00'),
  (250, 'FionaFan', 'FionaFan@tsmc.tw', '2250', 'Data Governance Specialist', 'Pass0250!', 12, TRUE, '2026-05-01T13:15:00', '2026-05-01T13:15:00'),
  (251, 'GrantTien', 'GrantTien@tsmc.tw', '2251', 'Data Program Coordinator', 'Pass0251!', 12, TRUE, '2026-05-01T13:16:00', '2026-05-01T13:16:00'),
  (252, 'HeidiTuan', 'HeidiTuan@tsmc.tw', '2252', 'Data Platform Manager', 'Pass0252!', 12, TRUE, '2026-05-01T13:17:00', '2026-05-01T13:17:00'),
  (253, 'IsaacMou', 'IsaacMou@tsmc.tw', '2253', 'Data Governance Specialist', 'Pass0253!', 12, TRUE, '2026-05-01T13:18:00', '2026-05-01T13:18:00'),
  (254, 'JasmineWangston', 'JasmineWangston@tsmc.tw', '2254', 'Data Engineering Manager', 'Pass0254!', 13, TRUE, '2026-05-01T13:19:00', '2026-05-01T13:19:00'),
  (255, 'KaiYangford', 'KaiYangford@tsmc.tw', '2255', 'ETL Engineer', 'Pass0255!', 13, TRUE, '2026-05-01T13:20:00', '2026-05-01T13:20:00'),
  (256, 'LeonaLuknight', 'LeonaLuknight@tsmc.tw', '2256', 'Analytics Engineer', 'Pass0256!', 13, TRUE, '2026-05-01T13:21:00', '2026-05-01T13:21:00'),
  (257, 'MilesLaiford', 'MilesLaiford@tsmc.tw', '2257', 'Data Engineer', 'Pass0257!', 13, TRUE, '2026-05-01T13:22:00', '2026-05-01T13:22:00'),
  (258, 'NinaLin', 'NinaLin@tsmc.tw', '2258', 'ETL Engineer', 'Pass0258!', 13, TRUE, '2026-05-01T13:23:00', '2026-05-01T13:23:00'),
  (259, 'OscarLee', 'OscarLee@tsmc.tw', '2259', 'Analytics Engineer', 'Pass0259!', 13, TRUE, '2026-05-01T13:24:00', '2026-05-01T13:24:00'),
  (260, 'PearlSun', 'PearlSun@tsmc.tw', '2260', 'Data Engineer', 'Pass0260!', 13, TRUE, '2026-05-01T13:25:00', '2026-05-01T13:25:00'),
  (261, 'RowanPeng', 'RowanPeng@tsmc.tw', '2261', 'ETL Engineer', 'Pass0261!', 13, TRUE, '2026-05-01T13:26:00', '2026-05-01T13:26:00'),
  (262, 'SelenaKo', 'SelenaKo@tsmc.tw', '2262', 'Business Intelligence Manager', 'Pass0262!', 14, TRUE, '2026-05-01T13:27:00', '2026-05-01T13:27:00'),
  (263, 'TobiasChiang', 'TobiasChiang@tsmc.tw', '2263', 'BI Developer', 'Pass0263!', 14, TRUE, '2026-05-01T13:28:00', '2026-05-01T13:28:00'),
  (264, 'VeraLan', 'VeraLan@tsmc.tw', '2264', 'Reporting Analyst', 'Pass0264!', 14, TRUE, '2026-05-01T13:29:00', '2026-05-01T13:29:00'),
  (265, 'WesleyTeng', 'WesleyTeng@tsmc.tw', '2265', 'BI Analyst', 'Pass0265!', 14, TRUE, '2026-05-01T13:30:00', '2026-05-01T13:30:00'),
  (266, 'YvonneShao', 'YvonneShao@tsmc.tw', '2266', 'BI Developer', 'Pass0266!', 14, TRUE, '2026-05-01T13:31:00', '2026-05-01T13:31:00'),
  (267, 'AdrianChangwell', 'AdrianChangwell@tsmc.tw', '2267', 'Reporting Analyst', 'Pass0267!', 14, TRUE, '2026-05-01T13:32:00', '2026-05-01T13:32:00'),
  (268, 'BlairHsufield', 'BlairHsufield@tsmc.tw', '2268', 'Cybersecurity Director', 'Pass0268!', 15, TRUE, '2026-05-01T13:33:00', '2026-05-01T13:33:00'),
  (269, 'ColinChengford', 'ColinChengford@tsmc.tw', '2269', 'Security Architect', 'Pass0269!', 15, TRUE, '2026-05-01T13:34:00', '2026-05-01T13:34:00'),
  (270, 'DianaShenridge', 'DianaShenridge@tsmc.tw', '2270', 'Risk Analyst', 'Pass0270!', 15, TRUE, '2026-05-01T13:35:00', '2026-05-01T13:35:00'),
  (271, 'EvanChen', 'EvanChen@tsmc.tw', '2271', 'Cybersecurity Manager', 'Pass0271!', 15, TRUE, '2026-05-01T13:36:00', '2026-05-01T13:36:00'),
  (272, 'GiselleTsai', 'GiselleTsai@tsmc.tw', '2272', 'Security Architect', 'Pass0272!', 15, TRUE, '2026-05-01T13:37:00', '2026-05-01T13:37:00'),
  (273, 'HugoHo', 'HugoHo@tsmc.tw', '2273', 'Risk Analyst', 'Pass0273!', 15, TRUE, '2026-05-01T13:38:00', '2026-05-01T13:38:00'),
  (274, 'IrisPan', 'IrisPan@tsmc.tw', '2274', 'Security Operations Manager', 'Pass0274!', 16, TRUE, '2026-05-01T13:39:00', '2026-05-01T13:39:00'),
  (275, 'JonahLiao', 'JonahLiao@tsmc.tw', '2275', 'Security Engineer', 'Pass0275!', 16, TRUE, '2026-05-01T13:40:00', '2026-05-01T13:40:00'),
  (276, 'KiaraYen', 'KiaraYen@tsmc.tw', '2276', 'Threat Analyst', 'Pass0276!', 16, TRUE, '2026-05-01T13:41:00', '2026-05-01T13:41:00'),
  (277, 'LucasWen', 'LucasWen@tsmc.tw', '2277', 'SOC Analyst', 'Pass0277!', 16, TRUE, '2026-05-01T13:42:00', '2026-05-01T13:42:00'),
  (278, 'MayaLiang', 'MayaLiang@tsmc.tw', '2278', 'Security Engineer', 'Pass0278!', 16, TRUE, '2026-05-01T13:43:00', '2026-05-01T13:43:00'),
  (279, 'NolanChao', 'NolanChao@tsmc.tw', '2279', 'IAM Manager', 'Pass0279!', 17, TRUE, '2026-05-01T13:44:00', '2026-05-01T13:44:00'),
  (280, 'OliveLiuhart', 'OliveLiuhart@tsmc.tw', '2280', 'Access Governance Specialist', 'Pass0280!', 17, TRUE, '2026-05-01T13:45:00', '2026-05-01T13:45:00'),
  (281, 'PrestonChoulin', 'PrestonChoulin@tsmc.tw', '2281', 'Identity Engineer', 'Pass0281!', 17, TRUE, '2026-05-01T13:46:00', '2026-05-01T13:46:00'),
  (282, 'QuinnFangwell', 'QuinnFangwell@tsmc.tw', '2282', 'IAM Analyst', 'Pass0282!', 17, TRUE, '2026-05-01T13:47:00', '2026-05-01T13:47:00'),
  (283, 'RubyKaowell', 'RubyKaowell@tsmc.tw', '2283', 'IT Service Manager', 'Pass0283!', 18, TRUE, '2026-05-01T13:48:00', '2026-05-01T13:48:00'),
  (284, 'SimonWang', 'SimonWang@tsmc.tw', '2284', 'ITIL Process Specialist', 'Pass0284!', 18, TRUE, '2026-05-01T13:49:00', '2026-05-01T13:49:00'),
  (285, 'TessaYang', 'TessaYang@tsmc.tw', '2285', 'Service Operations Coordinator', 'Pass0285!', 18, TRUE, '2026-05-01T13:50:00', '2026-05-01T13:50:00'),
  (286, 'UrielLu', 'UrielLu@tsmc.tw', '2286', 'Service Delivery Manager', 'Pass0286!', 18, TRUE, '2026-05-01T13:51:00', '2026-05-01T13:51:00'),
  (287, 'ValeriaLai', 'ValeriaLai@tsmc.tw', '2287', 'ITIL Process Specialist', 'Pass0287!', 18, TRUE, '2026-05-01T13:52:00', '2026-05-01T13:52:00'),
  (288, 'WarrenSung', 'WarrenSung@tsmc.tw', '2288', 'Service Operations Coordinator', 'Pass0288!', 18, TRUE, '2026-05-01T13:53:00', '2026-05-01T13:53:00'),
  (289, 'YasminHwang', 'YasminHwang@tsmc.tw', '2289', 'Service Desk Manager', 'Pass0289!', 19, TRUE, '2026-05-01T13:54:00', '2026-05-01T13:54:00'),
  (290, 'ZacharyChien', 'ZacharyChien@tsmc.tw', '2290', 'Helpdesk Specialist', 'Pass0290!', 19, TRUE, '2026-05-01T13:55:00', '2026-05-01T13:55:00'),
  (291, 'AmeliaTzeng', 'AmeliaTzeng@tsmc.tw', '2291', 'IT Support Analyst', 'Pass0291!', 19, TRUE, '2026-05-01T13:56:00', '2026-05-01T13:56:00'),
  (292, 'BennettHsuang', 'BennettHsuang@tsmc.tw', '2292', 'Service Desk Analyst', 'Pass0292!', 19, TRUE, '2026-05-01T13:57:00', '2026-05-01T13:57:00'),
  (293, 'ClaraHuangson', 'ClaraHuangson@tsmc.tw', '2293', 'Helpdesk Specialist', 'Pass0293!', 19, TRUE, '2026-05-01T13:58:00', '2026-05-01T13:58:00'),
  (294, 'DominicYehson', 'DominicYehson@tsmc.tw', '2294', 'IT Support Analyst', 'Pass0294!', 19, TRUE, '2026-05-01T13:59:00', '2026-05-01T13:59:00'),
  (295, 'EliseTangridge', 'EliseTangridge@tsmc.tw', '2295', 'Service Desk Analyst', 'Pass0295!', 19, TRUE, '2026-05-01T14:00:00', '2026-05-01T14:00:00'),
  (296, 'FelixWeiston', 'FelixWeiston@tsmc.tw', '2296', 'Endpoint Support Manager', 'Pass0296!', 20, TRUE, '2026-05-01T14:01:00', '2026-05-01T14:01:00'),
  (297, 'GemmaChang', 'GemmaChang@tsmc.tw', '2297', 'Desktop Support Engineer', 'Pass0297!', 20, TRUE, '2026-05-01T14:02:00', '2026-05-01T14:02:00'),
  (298, 'HarperHsu', 'HarperHsu@tsmc.tw', '2298', 'Device Management Specialist', 'Pass0298!', 20, TRUE, '2026-05-01T14:03:00', '2026-05-01T14:03:00'),
  (299, 'JulianCheng', 'JulianCheng@tsmc.tw', '2299', 'Endpoint Engineer', 'Pass0299!', 20, TRUE, '2026-05-01T14:04:00', '2026-05-01T14:04:00'),
  (300, 'KeiraShen', 'KeiraShen@tsmc.tw', '2300', 'Desktop Support Engineer', 'Pass0300!', 20, TRUE, '2026-05-01T14:05:00', '2026-05-01T14:05:00');


INSERT INTO "site" (
  "site_id",
  "site_name",
  "site_address",
  "created_at",
  "updated_at"
)
VALUES
  (1, 'TSMC Corporate Headquarters, Fab 12A', '8, Li-Hsin Rd. 6, Hsinchu Science Park, Hsinchu 300-096, Taiwan, R.O.C.', '2026-05-01T10:00:00', '2026-05-01T10:00:00'),
  (2, 'TSMC Fab 15', '1, Keya Rd. 6, Central Taiwan Science Park, Taichung 428-303, Taiwan, R.O.C.', '2026-05-01T10:05:00', '2026-05-01T10:05:00'),
  (3, 'TSMC Fab 18', '8, Beiyuan Rd. 2, Southern Taiwan Science Park, Tainan 745-093, Taiwan, R.O.C.', '2026-05-01T10:10:00', '2026-05-01T10:10:00');

INSERT INTO "access_point" (
  "access_point_id",
  "access_point_name",
  "site_id",
  "location_description",
  "is_active",
  "created_at",
  "updated_at"
)
VALUES
  -- TSMC Corporate Headquarters, Fab 12A / Hsinchu
  (1, 'Headquarters Main Lobby', 1, 'Main lobby entrance for employees and registered visitors', TRUE, '2026-05-01T10:20:00', '2026-05-01T10:20:00'),
  (2, 'Fab 12A Employee Entrance', 1, 'Employee entrance near the office building', TRUE, '2026-05-01T10:25:00', '2026-05-01T10:25:00'),
  (3, 'Fab 12A Data Center', 1, 'Restricted access point for the data center area', TRUE, '2026-05-01T10:30:00', '2026-05-01T10:30:00'),

  -- TSMC Fab 15 / Taichung
  (4, 'Fab 15 Front Gate', 2, 'Front gate access point of Fab 15', TRUE, '2026-05-01T10:35:00', '2026-05-01T10:35:00'),
  (5, 'Fab 15 Rear Gate', 2, 'Rear gate access point of Fab 15', TRUE, '2026-05-01T10:40:00', '2026-05-01T10:40:00'),
  (6, 'Fab 15 Side Gate', 2, 'Side gate access point of Fab 15', TRUE, '2026-05-01T10:45:00', '2026-05-01T10:45:00'),

  -- TSMC Fab 18 / Tainan
  (7, 'Fab 18 Front Gate', 3, 'Front gate access point of Fab 18', TRUE, '2026-05-01T10:50:00', '2026-05-01T10:50:00'),
  (8, 'Fab 18 Rear Gate', 3, 'Rear gate access point of Fab 18', TRUE, '2026-05-01T10:55:00', '2026-05-01T10:55:00'),
  (9, 'Fab 18 Side Gate', 3, 'Side gate access point of Fab 18', TRUE, '2026-05-01T11:00:00', '2026-05-01T11:00:00');

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


CREATE SEQUENCE IF NOT EXISTS access_log_log_id_seq START WITH 1;
ALTER TABLE "access_log" ALTER COLUMN "log_id" SET DEFAULT NEXTVAL('access_log_log_id_seq');

DO $$
DECLARE
    emp_record RECORD;
    current_day DATE;
    
    start_date DATE := '2026-04-01';
    end_date DATE := '2026-05-31';
    
    random_in_interval INTERVAL;
    random_out_interval INTERVAL;
    
    arrival_time TIMESTAMP;
    departure_time TIMESTAMP;
    
    -- 異常與處理狀態控制變數
    is_anomaly BOOLEAN;
    random_anomaly_type INT;
    
    -- 動態決定該異常是否「已處理」
    anomaly_status BOOLEAN;
BEGIN
    FOR current_day IN SELECT generate_series(start_date, end_date, '1 day'::interval)::date LOOP
        
        -- 自動過濾週末
        IF EXTRACT(DOW FROM current_day) NOT IN (0, 6) THEN
            
            FOR emp_record IN SELECT employee_id FROM "employee" WHERE is_active = TRUE LOOP
                
                is_anomaly := (random() < 0.03);
                
                -- 平均工時落在 7.95 ~ 8.05 小時之間
                random_in_interval := (random() * 89 || ' minutes')::interval + (random() * 59 || ' seconds')::interval;
                arrival_time := current_day + TIME '08:00:00' + random_in_interval;
                
                random_out_interval := (456 + (random() * 60))::int * '1 minute'::interval + (random() * 59 || ' seconds')::interval;
                departure_time := arrival_time + random_out_interval;

                -- ==========================================
                -- 情況一：觸發異常 (is_anomaly = TRUE)
                -- ==========================================
                IF is_anomaly THEN
                    random_anomaly_type := floor(random() * 3); -- 隨機分配 3 種錯誤
                    
                    -- 💡 50% 機率是已處理(true)，50% 機率是未處理(false)
                    anomaly_status := (random() < 0.5);
                    
                    -- 根據處理狀態，給予對應的模擬審核評語
                    IF anomaly_status = TRUE THEN
                        -- 隨機換兩種審核文字
                        IF random() < 0.5 THEN
                            anomaly_note := 'HR Approved: Valid off-site business assignment.';
                        ELSE
                            anomaly_note := 'Supervisor Cleared: System lag, card verified manually.';
                        END IF;
                    ELSE
                        anomaly_note := NULL; -- 未處理的話，評語通常是空的，等著被填寫
                    END IF;
                    
                    -- 【狀況 0】：找不到前次狀態，卻直接刷卡出去 (!previousState && !isEntry)
                    IF random_anomaly_type = 0 THEN
                        INSERT INTO "access_log" ("employee_id", "site_id", "access_point_id", "direction", "result", "status", "reason", "event_time", "note", "created_at")
                        VALUES (emp_record.employee_id, 1, 2, 'Out', 'Deny', anomaly_status, 'employee is not marked inside any site', arrival_time, anomaly_note, arrival_time + '2 seconds');
                    
                    -- 【狀況 1】：人在裡面了，卻又重複刷卡進入 (previousState && isEntry)
                    ELSIF random_anomaly_type = 1 THEN
                        -- 先讓他正常進去 (製造 previousState)
                        INSERT INTO "access_log" ("employee_id", "site_id", "access_point_id", "direction", "result", "status", "reason", "event_time", "note", "created_at")
                        VALUES (emp_record.employee_id, 1, 1, 'In', 'Accept', NULL, 'Access granted', arrival_time, NULL, arrival_time + '2 seconds');
                        
                        -- 10 分鐘後重複刷卡進門 -> 觸發重複進門攔截
                        INSERT INTO "access_log" ("employee_id", "site_id", "access_point_id", "direction", "result", "status", "reason", "event_time", "note", "created_at")
                        VALUES (emp_record.employee_id, 1, 1, 'In', 'Deny', anomaly_status, 'employee must exit site 1 before any new entry', arrival_time + '10 minutes'::interval, anomaly_note, arrival_time + '10 minutes 3 seconds'::interval);
                        
                        -- 傍晚正常出門
                        INSERT INTO "access_log" ("employee_id", "site_id", "access_point_id", "direction", "result", "status", "reason", "event_time", "note", "created_at")
                        VALUES (emp_record.employee_id, 1, 2, 'Out', 'Accept', NULL, 'Access granted', departure_time, NULL, departure_time + '2 seconds');

                    -- 【狀況 2】：在 A 廠進門，卻跑到 B 廠試圖出門 (previousState && !isEntry && !sameFactory)
                    ELSE
                        -- 早上在 1 號廠正常進門
                        INSERT INTO "access_log" ("employee_id", "site_id", "access_point_id", "direction", "result", "status", "reason", "event_time", "note", "created_at")
                        VALUES (emp_record.employee_id, 1, 1, 'In', 'Accept', NULL, 'Access granted', arrival_time, NULL, arrival_time + '2 seconds');
                        
                        -- 跨廠區錯誤
                        INSERT INTO "access_log" ("employee_id", "site_id", "access_point_id", "direction", "result", "status", "reason", "event_time", "note", "created_at")
                        VALUES (emp_record.employee_id, 2, 2, 'Out', 'Deny', anomaly_status, 'employee must exit the same site they entered (1)', departure_time, anomaly_note, departure_time + '2 seconds');
                        
                        -- 5分鐘後正常出門
                        INSERT INTO "access_log" ("employee_id", "site_id", "access_point_id", "direction", "result", "status", "reason", "event_time", "note", "created_at")
                        VALUES (emp_record.employee_id, 1, 2, 'Out', 'Accept', NULL, 'Access granted', departure_time + '5 minutes'::interval, NULL, departure_time + '5 minutes 2 seconds'::interval);
                    END IF;

                -- ==========================================
                -- 情況二：正常進出 (97% 機率，Accept，Status 為 NULL)
                -- ==========================================
                ELSE
                    -- 上班 In
                    INSERT INTO "access_log" ("employee_id", "site_id", "access_point_id", "direction", "result", "status", "reason", "event_time", "note", "created_at")
                    VALUES (emp_record.employee_id, 1, 1, 'In', 'Accept', NULL, 'Access granted', arrival_time, NULL, arrival_time + '5 seconds'::interval);
                    
                    -- 下班 Out
                    INSERT INTO "access_log" ("employee_id", "site_id", "access_point_id", "direction", "result", "status", "reason", "event_time", "note", "created_at")
                    VALUES (emp_record.employee_id, 1, 2, 'Out', 'Accept', NULL, 'Access granted', departure_time, NULL, departure_time + '4 seconds'::interval);
                END IF;
                
            END LOOP;
        END IF;
    END LOOP;
END $$;

SELECT setval('access_log_log_id_seq', COALESCE((SELECT MAX(log_id) FROM "access_log"), 1), true);

-- 提交事務
COMMIT;