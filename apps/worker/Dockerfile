FROM node:22-alpine AS base

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
RUN pnpm deploy --filter @repo/worker --prod /prod/worker

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /prod/worker ./

CMD ["node", "src/index.js"]
