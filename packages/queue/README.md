# Queue Package

`@repo/queue` 是 shared queue package，負責集中管理 SQS client、event payload 解析，以及本地 LocalStack queue 初始化流程。

## 在做什麼

- 建立 SQS client
- 驗證與格式化 access event
- 提供 send / receive / delete queue 操作
- 提供本地 queue setup script

## 相關指令

手動建立本地 queue：

```bash
pnpm queue:setup
```

通常不需要手動執行，因為：

```bash
pnpm local:up
```

已經會自動等待 LocalStack ready 並建立 queue。

## 重要檔案

- [packages/queue/src/index.js](/Users/slowpoke/Documents/雲原生/cloud-native-8/packages/queue/src/index.js)
- [packages/queue/scripts/setup-local.sh](/Users/slowpoke/Documents/雲原生/cloud-native-8/packages/queue/scripts/setup-local.sh)

## 重要環境變數

- `AWS_REGION`
- `SQS_ENDPOINT`
- `SQS_QUEUE_URL`

## 上 AWS 需要調整

- 移除本地 `SQS_ENDPOINT`
- `SQS_QUEUE_URL` 改成正式 AWS SQS queue URL
- 不再需要 LocalStack queue setup script
- `access` 與 `worker` 改用 IRSA 取得 AWS 權限，不放靜態 AWS key
