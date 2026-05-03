# GitHub Development Workflow

這份文件說明這個 repo 目前採用的 GitHub 分支策略、PR 流程，以及每個 CI job 在什麼時候會跑。

## 分支策略

- `main`: 發布分支。只有準備推送 ECR image 時才合進來。
- `dev`: 整合分支。日常功能整合先進 `dev`。
- `feature/*`: 功能分支。從 `dev` 開出，完成後發 PR 回 `dev`。

建議流程：

1. 從最新 `dev` 開功能分支。
2. 在功能分支開 PR 回 `dev`。
3. PR 綠燈後合進 `dev`。
4. 累積到一個發布批次後，再開 `dev -> main` 的 PR。
5. `dev -> main` PR 綠燈後，再合進 `main`。

## Merge 規則

- `feature/* -> dev`:
  - 可以使用 squash merge。
- `dev -> main`:
  - 不要使用 squash merge。
  - 使用 merge commit，避免 `dev` 和 `main` 的長期歷史關係被破壞。

如果 `dev -> main` 用 squash merge，之後通常還要把 `main` 再 merge 回 `dev`，不然下一個 PR 很容易重複帶出舊 commits 或產生額外 conflict。

## CI 觸發時機

目前 workflow 定義在 [ci.yml](/Users/slowpoke/Documents/雲原生/cloud-native-8/.github/workflows/ci.yml)。

### `pull_request`

任何 PR 都會觸發：

- `detect-changes`
- `test-build`

只有 PR 目標分支是 `dev` 或 `main` 時，才會另外觸發：

- `docker-build`

PR 階段不會觸發：

- `docker-push`

### `push`

推到 `dev` 或 `main` 都會觸發 workflow。

- `push -> dev`
  - 會跑 `detect-changes`
  - 會跑 `test-build`
  - 不會跑 `docker-build`
  - 不會跑 `docker-push`

- `push -> main`
  - 會跑 `detect-changes`
  - 會跑 `test-build`
  - 不會跑 `docker-build`
  - 若有受影響 images，且 AWS/ECR variables 已配置，會跑 `docker-push`

## CI Jobs 在做什麼

### `detect-changes`

根據這次 event 的 `git diff` 計算：

- `mode`
- `should_run`
- `packages`
- `images`

目前也會把這些結果直接印到 Actions log，方便 debug。

### `test-build`

只在 `detect-changes` 判定 `should_run=true` 時執行。

它會：

1. 啟動測試用 PostgreSQL service
2. 安裝依賴
3. 執行 DB migrate deploy
4. 對受影響的 packages 跑 test 與 build

### `docker-build`

只在 PR 到 `dev` 或 `main` 時執行。

它會：

1. 安裝依賴
2. 只 build 受影響的 Docker images

用途是驗證 image buildability，不會 push 到 ECR。

### `docker-push`

只在 `push -> main` 時執行，而且要同時滿足：

- `detect-changes` 算出 `images != ''`
- `ECR_REGISTRY` 已設定
- `ECR_NAMESPACE` 已設定
- `AWS_ROLE_TO_ASSUME` 已設定

它會把受影響 images push 到：

```txt
<ECR_REGISTRY>/<ECR_NAMESPACE>/<image>:<github.sha>
<ECR_REGISTRY>/<ECR_NAMESPACE>/<image>:latest
```

範例：

```txt
390402574827.dkr.ecr.ap-northeast-1.amazonaws.com/dpacs/access:<sha>
390402574827.dkr.ecr.ap-northeast-1.amazonaws.com/dpacs/access:latest
```

正式部署建議吃 `github.sha` 這種 immutable tag，不要依賴 `latest`。

## Affected CI 規則

`detect-changes` 目前採保守規則：

- `apps/access/**` -> `@repo/access` + `access`
- `apps/report/**` -> `@repo/report` + `report`
- `apps/worker/**` -> `@repo/worker` + `worker`
- `packages/db/**` -> `@repo/db`, `@repo/report`, `@repo/worker` + `db-migrate`, `report`, `worker`
- `packages/queue/**` -> `@repo/queue`, `@repo/access`, `@repo/worker` + `access`, `worker`
- 任何 `.md` -> 不觸發 app/image build
- `scripts/**`, `.github/workflows/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `deploy/**` -> 全量 fallback

## 團隊操作建議

- 功能開發優先在 `feature/* -> dev` 完成整合。
- 不要直接把功能分支 merge 到 `main`。
- `dev -> main` 視為發布 PR，主要確認這一批變更可以安全進入主線。
- `main` merge 後若 `docker-push` 失敗，merge 不會自動回滾，要修正後重新 push 或重新跑 workflow。
