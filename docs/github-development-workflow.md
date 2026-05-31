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

## Test Deploy Workflows

目前另外有三個手動 workflow：

- [deploy-test.yaml](/Users/slowpoke/Documents/雲原生/cloud-native-8/.github/workflows/deploy-test.yaml)
- [release-test.yaml](/Users/slowpoke/Documents/雲原生/cloud-native-8/.github/workflows/release-test.yaml)
- [release-build-test.yaml](/Users/slowpoke/Documents/雲原生/cloud-native-8/.github/workflows/release-build-test.yaml)

### `deploy-test`

用途是 selective deploy 到 EKS `test` namespace。

它支援分別指定：

- `access_tag`
- `worker_tag`
- `report_tag`
- `db_migrate_tag`

規則：

- 沒填的 image 不會驗證，也不會更新 deployment
- `db_migrate_tag` 沒填就不會跑 migration job
- 至少要填一個 input，不然 workflow 會直接失敗

這個 workflow 適合：

- 只驗證 `access` 新版
- 只更新 `worker`
- 只跑一次 migration
- `report` 保持現況不動

`deploy/k8s/test/*.yaml` 內的 image 會保留 `:<tag>` placeholder，workflow 會在執行時替換成你填入的實際 tag。

### `release-test`

用途是整套 release deploy 到 EKS `test` namespace。

它只吃一個 `image_tag`，並要求這四個 image 都存在同一個 tag：

- `access`
- `worker`
- `report`
- `db-migrate`

流程是：

1. 驗證四個 images 都存在
2. 跑 `db-migrate:<image_tag>`
3. 把 `access`、`worker`、`report` 全部更新成同一個 tag
4. 等待 rollout 完成

同樣地，workflow 會在 apply 前把 `deploy/k8s/test/*.yaml` 內的 `:<tag>` placeholder 換成你輸入的 `image_tag`。

這個 workflow 適合：

- 驗證一整個 release 組合
- 測試 `main` push 後完整版本是否能一起工作

### `release-build-test`

用途是 full build + full push + full deploy 到 EKS `test` namespace。

它的流程是：

1. 跑完整 workspace test/build 檢查
2. 強制 build 四個 images
   - `access`
   - `worker`
   - `report`
   - `db-migrate`
3. 全部 push 成同一個 tag：
   - `github.sha`
   - 另外也補 `latest`
4. 跑 `db-migrate:<github.sha>`
5. 把 `access`、`worker`、`report` 全部更新成 `:<github.sha>`
6. 等待 rollout 完成

這條 workflow 也會在 apply 前把 `deploy/k8s/test/*.yaml` 中的 `:<tag>` placeholder 換成 `github.sha`。

這個 workflow 適合：

- 想從一個 commit 直接產出完整 release set
- 不想手動確認哪些 image 有沒有同 tag
- 想一次 build/push/deploy 到 test

### 三者差異

- `deploy-test`: selective deploy，適合日常單服務驗證
- `release-test`: full deploy，適合已存在完整 tag 的 release 驗證
- `release-build-test`: full build + push + deploy，適合從單一 commit 直接產出並部署完整 release

如果某次 CI 只 push 了 `access:<sha>`，那個 `sha` 通常只能拿去：

- `deploy-test` 的 `access_tag`

不能直接拿去 `release-test`，因為 `worker/report/db-migrate` 很可能沒有同一個 tag。

如果你希望從單一 commit 直接得到完整同版 images，應該改用 `release-build-test`。

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
