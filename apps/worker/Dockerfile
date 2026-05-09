FROM node:22-alpine AS base

RUN apk add --no-cache ca-certificates openssl

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
WORKDIR /repo

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/package.json
COPY packages/queue/package.json packages/queue/package.json
COPY apps/worker/package.json apps/worker/package.json

RUN pnpm install --filter @repo/worker... --frozen-lockfile

FROM deps AS builder

COPY packages/db packages/db
COPY packages/queue packages/queue
COPY apps/worker apps/worker

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/app"

RUN pnpm --filter @repo/db generate

FROM base AS runner

ENV NODE_ENV=production
WORKDIR /repo

COPY --from=builder /repo /repo

CMD ["node", "apps/worker/src/index.js"]