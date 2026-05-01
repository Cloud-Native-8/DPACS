# DPACS Final Project

這個 repo 已整理成單一 monorepo，只保留三個 runtime service 和兩個 shared package。

## 架構

```txt
access service -- SendMessage --> SQS events queue -- ReceiveMessage --> worker -- write --> Postgres
                                                                                   ^
report -------------------------------------------------------------------- read ---|
```

Valkey 沒有被拿掉。它仍然是 `access` 的 anti-passback cache，因為這是既有商業邏輯的一部分。

## Monorepo

```txt
.
├─ apps/
│  ├─ access/
│  ├─ worker/
│  └─ report/
├─ packages/
│  ├─ db/
│  └─ queue/
├─ deploy/k8s/
├─ docker-compose.yml
├─ .github/workflows/ci.yml
├─ .env.example
├─ scripts/
│  ├─ build-all.sh
│  ├─ check.sh
│  └─ test-all.sh
└─ docs/api.md
```

補充架構圖請看 [docs/architecture.md](/Users/slowpoke/Documents/雲原生/cloud-native-8/docs/architecture.md)。

## 本地開發

先做一次：

```bash
pnpm install
cp .env.example .env
```

本地 queue 走 LocalStack：

```txt
SQS_ENDPOINT=http://localhost:4566
SQS_QUEUE_URL=http://localhost:4566/000000000000/access-events
```

`pnpm local:up` 會自動啟動 `postgres`、`valkey`、`localstack`，並建立本地 queue。queue 初始化實作在 [packages/queue/scripts/setup-local.sh](/Users/slowpoke/Documents/雲原生/cloud-native-8/packages/queue/scripts/setup-local.sh)。

`pnpm local:up` 具體會做這些事：

1. 啟動 Docker Compose 裡的 `postgres`、`valkey`、`localstack`
2. 等 `localstack` 的 health endpoint ready
3. 自動建立本地 queue：
   - `access-events`
   - `access-events-dlq`

所以 `local:up` 不只是把 container 開起來，也會把 `access` 和 `worker` 需要的本地 SQS 資源一併準備好。

### 啟動 access

順序：

```bash
pnpm local:up
pnpm db:migrate
pnpm dev:access
```

需要的本地依賴：

- PostgreSQL
- Valkey
- LocalStack SQS

### 啟動 worker

順序：

```bash
pnpm local:up
pnpm db:migrate
pnpm dev:worker
```

需要的本地依賴：

- PostgreSQL
- LocalStack SQS

### 啟動 report

順序：

```bash
pnpm db:up
pnpm db:migrate
pnpm dev:report
```

需要的本地依賴：

- PostgreSQL

### 三個服務一起開

先開三個 terminal，再分別執行：

```bash
pnpm dev:access
pnpm dev:worker
pnpm dev:report
```

前提：

```bash
pnpm local:up
pnpm db:migrate
```

常用路徑：

- `GET /check`
- `POST /check`
- `GET /healthz`
- `GET /readyz`
- `GET /`
- `GET /report`
- `GET /api/report`

常用資料庫指令：

- `pnpm db:up`
- `pnpm db:stop`
- `pnpm db:remove`
- `pnpm db:logs`

## Build

- `pnpm build:app`
  - 建置 workspace app/package artifact
  - 會先跑 Prisma client generate
  - `report` 會產生 Next.js build output
- `pnpm build:image`
  - 建立 Docker images
  - 預設會建：
    - `dpacs/access:local`
    - `dpacs/report:local`
    - `dpacs/worker:local`
    - `dpacs/db-migrate:local`
- `pnpm image:ls`
  - 列出目前本地 `dpacs/*` images
- `pnpm image:clean`
  - 刪除目前本地 `dpacs/*` images
  - 再清掉 dangling images
- `pnpm build`
  - 目前等同 `pnpm build:app`

如果要覆蓋 image 名稱前綴或 tag，可以帶：

```bash
IMAGE_PREFIX=myorg IMAGE_TAG=dev pnpm build:image
```

`image:ls` 和 `image:clean` 也支援同樣的 `IMAGE_PREFIX`：

```bash
IMAGE_PREFIX=myorg pnpm image:ls
IMAGE_PREFIX=myorg pnpm image:clean
```

目前 CI 會在 PR 與 `main` / `dev` 驗證：

- `pnpm build:app`
- `pnpm build:image`

ECR push job 目前保留在 workflow 裡，但預設關閉，等 AWS / ECR 變數準備好再打開。

## Root Scripts 說明

root `scripts/` 目錄的用途與每支腳本的說明，請看 [scripts/README.md](/Users/slowpoke/Documents/雲原生/cloud-native-8/scripts/README.md)。

## 部署原則

- AWS 資源先在 Console 建好。
- GitHub Actions 只做 test/build、image push、deploy。
- migration 不放進 app startup，改用 `packages/db/Dockerfile.migrate` 搭配 one-off job。
- `access` 只碰 SQS 與 Valkey，不碰 DB。
- `worker` 才寫 DB。
- `report` 只讀 DB。

## 驗證

```bash
./scripts/test-all.sh
./scripts/build-all.sh
./scripts/check.sh
```
