# DPACS Final Project

DPACS Final Project 是一個雲原生門禁系統示範專案，採用 pnpm monorepo 管理。

此專案包含三個 runtime service 與兩個 shared package：

- `access`：接收門禁檢查請求，透過 Valkey 執行 anti-passback 快取邏輯，並將事件送到 SQS。
- `worker`：從 SQS 消費門禁事件，並寫入 PostgreSQL。
- `report`：從 PostgreSQL 讀取資料，提供報表頁面與 API。
- `packages/db`：共用資料庫 schema、client 與 migration 相關資源。
- `packages/queue`：共用 SQS queue helper 與本地 queue 初始化腳本。

Valkey 沒有被移除。它仍然是 `access` service 的 anti-passback cache，因為這是既有商業邏輯的一部分。

## 目錄

- [系統架構](#系統架構)
- [專案結構](#專案結構)
- [必要工具](#必要工具)
- [快速開始](#快速開始)
- [環境變數](#環境變數)
- [本地開發](#本地開發)
- [常用指令](#常用指令)
- [Health Check 與常用路徑](#health-check-與常用路徑)
- [Build](#build)
- [Docker Images](#docker-images)
- [CI/CD 原則](#cicd-原則)
- [部署原則](#部署原則)
- [疑難排解](#疑難排解)
- [更多文件](#更多文件)

## 系統架構

```txt
Client
  |
  v
access service
  |  使用 Valkey 作為 anti-passback cache
  |
  | SendMessage
  v
SQS access-events queue
  |
  | ReceiveMessage
  v
worker
  |
  | write
  v
PostgreSQL
  ^
  | read
report
```

### Service 職責

| Service  | 職責                                                | 依賴服務        | 資料庫存取 |
| -------- | --------------------------------------------------- | --------------- | ---------- |
| `access` | 處理門禁檢查請求、驗證 anti-passback 狀態、發布事件 | Valkey、SQS     | 不存取 DB  |
| `worker` | 消費 SQS 事件並寫入門禁紀錄                         | SQS、PostgreSQL | 寫入       |
| `report` | 提供報表頁面與 API                                  | PostgreSQL      | 讀取       |

### 本地依賴服務

| 服務       | 本地實作       | 用途                    |
| ---------- | -------------- | ----------------------- |
| PostgreSQL | Docker Compose | 儲存門禁事件資料        |
| Valkey     | Docker Compose | anti-passback cache     |
| SQS        | LocalStack     | 本地 AWS SQS 相容 queue |

完整架構說明請參考 [docs/architecture.md](docs/architecture.md)。

## 專案結構

```txt
.
├─ apps/
│  ├─ access/              # 門禁檢查 runtime service
│  ├─ worker/              # SQS consumer runtime service
│  └─ report/              # 報表 runtime service
├─ packages/
│  ├─ db/                  # 共用資料庫 package
│  └─ queue/               # 共用 queue package 與本地 queue 初始化腳本
├─ deploy/
│  └─ k8s/                 # Kubernetes manifests
├─ docs/
│  ├─ api.md
│  ├─ architecture.md
│  └─ github-development-workflow.md
├─ scripts/
│  ├─ build-all.sh
│  ├─ check.sh
│  └─ test-all.sh
├─ docker-compose.yml
├─ pnpm-workspace.yaml
├─ .env.example
└─ .github/
   └─ workflows/
      └─ ci.yml
```

## 必要工具

開始本地開發前，請先安裝：

- Git
- Node.js 22
- Corepack
- pnpm
- Docker
  - macOS：Docker Desktop 或 OrbStack
  - Windows：建議使用 Docker Desktop 並啟用 WSL 2 backend

確認版本：

```bash
node -v
corepack --version
pnpm -v
docker --version
docker compose version
```

若尚未啟用 pnpm，可以透過 Corepack 啟用：

```bash
corepack enable
```

## 快速開始

從乾淨環境開始：

```bash
git clone <repo-url>
cd cloud-native-8

corepack enable
pnpm install

cp .env.example .env

pnpm local:up
pnpm db:migrate
pnpm db:seed
```

Windows PowerShell 請使用：

```powershell
Copy-Item .env.example .env
```

接著開三個 terminal，分別啟動三個 runtime service：

```bash
pnpm dev:access
```

```bash
pnpm dev:worker
```

```bash
pnpm dev:report
```

確認本地依賴服務是否正常：

```bash
docker ps
```

停止本地依賴服務：

```bash
pnpm local:down
```

## 環境變數

請從 `.env.example` 建立本地 `.env`：

```bash
cp .env.example .env
```

請勿提交真實 `.env` 或 production secrets。  
共用預設值與說明請維護在 `.env.example`。

## 本地開發

### 啟動本地依賴服務

完整本地依賴 stack：

```bash
pnpm local:up
```

此指令會啟動：

- PostgreSQL
- Valkey （Redis Cache）
- LocalStack

並初始化本地 SQS queues：

- `access-events`
- `access-events-dlq`

queue 初始化腳本位於：

```txt
packages/queue/scripts/setup-local.sh
```

只需要 PostgreSQL 時，可以執行：

```bash
pnpm db:up
```

### 執行資料庫 migration

PostgreSQL 啟動後，執行：

```bash
pnpm db:migrate
```

### 單獨啟動 service

#### Access service

```bash
pnpm local:up
pnpm db:migrate
pnpm dev:access
```

需要的本地依賴：

- PostgreSQL
- Valkey
- LocalStack SQS

更多 access service 說明請看 [apps/access/README.md](/Users/slowpoke/Documents/雲原生/cloud-native-8/apps/access/README.md)。

#### Worker service

```bash
pnpm local:up
pnpm db:migrate
pnpm dev:worker
```

需要的本地依賴：

- PostgreSQL
- LocalStack SQS

更多 worker service 說明請看 [apps/worker/README.md](/Users/slowpoke/Documents/雲原生/cloud-native-8/apps/worker/README.md)。

#### Report service

```bash
pnpm db:up
pnpm db:migrate
pnpm dev:report
```

需要的本地依賴：

- PostgreSQL

更多 report service 說明請看 [apps/report/README.md](/Users/slowpoke/Documents/雲原生/cloud-native-8/apps/report/README.md)。

### 同時啟動全部 service

先啟動依賴服務並執行 migration：

```bash
pnpm local:up
pnpm db:migrate
```

接著在三個 terminal 中分別執行：

```bash
pnpm dev:access
```

```bash
pnpm dev:worker
```

```bash
pnpm dev:report
```

預設本地網址範例：

- access: [http://localhost:4000](http://localhost:4000)
- access health: [http://localhost:4000/healthz](http://localhost:4000/healthz)
- access ready: [http://localhost:4000/readyz](http://localhost:4000/readyz)
- access check page: [http://localhost:4000/check](http://localhost:4000/check)
- report home: [http://localhost:3000](http://localhost:3000)
- report page: [http://localhost:3000/report](http://localhost:3000/report)
- report API: [http://localhost:3000/api/report](http://localhost:3000/api/report)

## 常用指令

| 指令               | 說明                                                     |
| ------------------ | -------------------------------------------------------- |
| `pnpm local:up`    | 啟動 PostgreSQL、Valkey、LocalStack，並初始化本地 queues |
| `pnpm local:down`  | 停止整組本地依賴服務                                     |
| `pnpm db:up`       | 只啟動 PostgreSQL                                        |
| `pnpm db:stop`     | 停止 PostgreSQL container                                |
| `pnpm db:remove`   | 刪除 PostgreSQL container                                |
| `pnpm db:logs`     | 查看 PostgreSQL logs                                     |
| `pnpm db:migrate`  | 執行本地 database migrations                             |
| `pnpm db:seed`     | 匯入 report/access mock CSV data                         |
| `pnpm queue:setup` | 手動建立本地 SQS queues                                  |
| `pnpm dev:access`  | 啟動 access service                                      |
| `pnpm dev:worker`  | 啟動 worker service                                      |
| `pnpm dev:report`  | 啟動 report service                                      |

root scripts 的用途與詳細說明請看 [scripts/README.md](/Users/slowpoke/Documents/雲原生/cloud-native-8/scripts/README.md)。

## Health Check 與常用路徑

常用 health check 與應用路徑：

| Route             | 本地範例 URL                                                   | 用途             |
| ----------------- | -------------------------------------------------------------- | ---------------- |
| `GET /healthz`    | [http://localhost:4000/healthz](http://localhost:4000/healthz) | Liveness check   |
| `GET /readyz`     | [http://localhost:4000/readyz](http://localhost:4000/readyz)   | Readiness check  |
| `GET /check`      | [http://localhost:4000/check](http://localhost:4000/check)     | 門禁模擬頁面     |
| `POST /check`     | `http://localhost:4000/check`                                  | 送出門禁檢查請求 |
| `GET /`           | [http://localhost:3000](http://localhost:3000)                 | Report 首頁      |
| `GET /report`     | [http://localhost:3000/report](http://localhost:3000/report)   | 報表頁面         |
| `GET /api/report` | [http://localhost:3000/api/report](http://localhost:3000/api/report) | 報表 API    |

## Build

### 建置 application artifacts

```bash
pnpm build:app
```

此指令會建置 workspace app/package artifacts，並在需要時執行 Prisma client generation。

對 `report` 而言，這也會產生 Next.js build output。

### 建置 Docker images

```bash
pnpm build:image
```

預設會建置：

```txt
dpacs/access:local
dpacs/report:local
dpacs/worker:local
dpacs/db-migrate:local
```

覆蓋 image prefix 或 tag：

```bash
IMAGE_PREFIX=myorg IMAGE_TAG=dev pnpm build:image
```

## Docker Images

列出本地 images：

```bash
pnpm image:ls
```

使用自訂 prefix：

```bash
IMAGE_PREFIX=myorg pnpm image:ls
```

清除本地 images：

```bash
pnpm image:clean
```

使用自訂 prefix：

```bash
IMAGE_PREFIX=myorg pnpm image:clean
```

`image:clean` 預設會刪除本地 `dpacs/*` images，並清除 dangling images。

## CI/CD 原則

GitHub Actions workflow 採用以下原則：

- Pull request 階段執行 affected validation。
- `docker-build` 只在 PR 目標分支為 `dev` 或 `main` 時執行。
- `docker-push` 只在 merge 後的 `push -> main` 時執行。

完整 workflow、merge rules 與 CI job 說明請參考 [docs/github-development-workflow.md](docs/github-development-workflow.md)。

## 部署原則

部署遵守以下規則：

- AWS 資源在 application startup path 之外建立。
- GitHub Actions 負責 test/build 與 image push。
- Database migration 不放在一般 app startup 中執行。
- Migration 使用 `packages/db/Dockerfile.migrate`，並以 one-off job 方式執行。
- `access` 只與 SQS、Valkey 溝通。
- `worker` 是唯一寫入 PostgreSQL 的 service。
- `report` 只讀取 PostgreSQL。

Kubernetes manifests 位於：

```txt
deploy/k8s/
```

## 疑難排解

### Docker 沒有啟動

檢查：

```bash
docker ps
```

若指令失敗，請啟動 Docker Desktop 或 OrbStack，並等待 Docker engine ready。

### 本地依賴服務異常

重新啟動本地 stack：

```bash
pnpm local:down
pnpm local:up
```

查看 running containers：

```bash
docker ps
```

查看 PostgreSQL logs：

```bash
pnpm db:logs
```

### 本地 SQS queue 不存在

重新執行 queue setup：

```bash
pnpm queue:setup
```

預期會有以下本地 queues：

- `access-events`
- `access-events-dlq`

### Database schema 不是最新

重新執行 migration：

```bash
pnpm db:migrate
```

### Windows PowerShell 指令差異

Windows PowerShell 請使用對應指令。例如：

```powershell
Copy-Item .env.example .env
```

而不是：

```bash
cp .env.example .env
```

## 更多文件

- [系統架構](docs/architecture.md)
- [API 文件](docs/api.md)
- [GitHub 開發流程](docs/github-development-workflow.md)
- [Root scripts 說明](scripts/README.md)
