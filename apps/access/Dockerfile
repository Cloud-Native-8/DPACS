FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/queue/package.json packages/queue/package.json
COPY apps/access/package.json apps/access/package.json
RUN pnpm install --filter @repo/access... --frozen-lockfile

FROM deps AS builder
COPY packages/queue packages/queue
COPY apps/access apps/access
RUN pnpm deploy --filter @repo/access --prod /prod/access

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV ACCESS_PORT=4000

COPY --from=builder /prod/access ./

EXPOSE 4000
CMD ["node", "src/index.js"]
