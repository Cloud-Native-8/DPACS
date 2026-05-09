# DB Package

`@repo/db` 是 shared database package，負責集中管理 Prisma schema、migration、Prisma Client 建立方式，以及所有 app 共用的 DB 連線入口。

## 在做什麼

- 保存 Prisma schema
- 保存 migration 歷史
- 提供共用 Prisma Client
- 統一 `DATABASE_URL` 與連線池設定來源

## 相關指令

產生 Prisma Client：

```bash
pnpm db:generate
```

本地建立 migration：

```bash
pnpm db:migrate
```

本地重置資料庫並重新套用所有 migration：

```bash
pnpm db:reset
```

部署既有 migration：

```bash
pnpm db:migrate:deploy
```

打開 Prisma Studio：

```bash
pnpm db:studio
```

## 重要檔案

- [packages/db/prisma/schema.prisma](/Users/slowpoke/Documents/雲原生/cloud-native-8/packages/db/prisma/schema.prisma)
- [packages/db/prisma.config.ts](/Users/slowpoke/Documents/雲原生/cloud-native-8/packages/db/prisma.config.ts)
- [packages/db/src/client.js](/Users/slowpoke/Documents/雲原生/cloud-native-8/packages/db/src/client.js)
- [packages/db/Dockerfile.migrate](/Users/slowpoke/Documents/雲原生/cloud-native-8/packages/db/Dockerfile.migrate)

## 上 AWS 需要調整

- 本地 `DATABASE_URL` 改成 Aurora endpoint
- `report` 用 reader endpoint
- `worker` 和 migration job 用 writer endpoint
- migration 不放在 app startup，改用 one-off job 跑 `prisma migrate deploy`
- 正式環境用 Secret 注入 `DATABASE_URL`
