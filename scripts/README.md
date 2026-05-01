# Scripts

這個目錄放的是 root 層級的 orchestration script，主要負責本地開發啟動流程、workspace build/check 包裝，以及把 root `.env` 帶進各個 workspace command。

## 腳本說明

### `local-up.sh`

給 `pnpm local:up` 用。

它會：

1. 啟動 `postgres`、`valkey`、`localstack`
2. 等 `localstack` ready
3. 呼叫 [packages/queue/scripts/setup-local.sh](/Users/slowpoke/Documents/雲原生/cloud-native-8/packages/queue/scripts/setup-local.sh) 建立本地 queue

### `run-with-root-env.mjs`

給這類指令共用：

- `pnpm dev:access`
- `pnpm dev:worker`
- `pnpm dev:report`
- `pnpm db:*`

作用是先讀 root `.env`，再把同一份環境變數帶進後續 `pnpm --filter ...` 指令。這樣每個 service 本地開發都能統一吃 root `.env`。

### `workspace-build.mjs`

給 `pnpm build:app` 用。

它會先執行：

```bash
pnpm --filter @repo/db generate
```

再執行整個 workspace 的 build。

root 的 `pnpm build` 目前只是 `pnpm build:app` 的 alias。

### `workspace-build-image.mjs`

給 `pnpm build:image` 用。

它會依序執行 Docker build，建立這幾個 image：

- `access`
- `report`
- `worker`
- `db-migrate`

預設 tag 格式是：

```bash
dpacs/<service>:local
```

也可以用環境變數覆蓋：

```bash
IMAGE_PREFIX=myorg IMAGE_TAG=dev pnpm build:image
```

### `image-ls.sh`

給 `pnpm image:ls` 用。

它會列出目前本地 `dpacs/*` images，格式包含：

- repository
- tag
- image id
- size

也可以改 prefix：

```bash
IMAGE_PREFIX=myorg pnpm image:ls
```

### `image-clean.sh`

給 `pnpm image:clean` 用。

它會：

1. 刪掉目前 prefix 底下的 images
2. 再執行 `docker image prune -f` 清 dangling images

也可以改 prefix：

```bash
IMAGE_PREFIX=myorg pnpm image:clean
```

### `workspace-check.mjs`

給 `pnpm check` 用。

它會依序執行：

```bash
pnpm test
pnpm build
```

### `test-all.sh`

`pnpm test` 的簡單 shell 包裝，主要是保留 `./scripts/test-all.sh` 入口。

### `build-all.sh`

`pnpm build` 的簡單 shell 包裝，主要是保留 `./scripts/build-all.sh` 入口。

### `check.sh`

`pnpm check` 的簡單 shell 包裝，主要是保留 `./scripts/check.sh` 入口。

## 補充

queue 相關的本地初始化腳本不在 root `scripts/`，而是在：

- [packages/queue/scripts/setup-local.sh](/Users/slowpoke/Documents/雲原生/cloud-native-8/packages/queue/scripts/setup-local.sh)

這支腳本專門建立：

- `access-events`
- `access-events-dlq`

通常不需要手動跑，因為 `pnpm local:up` 會自動呼叫它；如果需要，也可以手動執行：

```bash
pnpm queue:setup
```
