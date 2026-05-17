FROM node:22-alpine AS base

RUN apk add --no-cache ca-certificates openssl

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
WORKDIR /repo

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/package.json
COPY apps/report/package.json apps/report/package.json

RUN pnpm install --filter @repo/report... --frozen-lockfile

FROM deps AS builder

COPY packages/db packages/db
COPY apps/report apps/report

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/app"

RUN pnpm --filter @repo/db generate
RUN pnpm --filter @repo/report build

FROM node:22-alpine AS runner

RUN apk add --no-cache ca-certificates openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /repo/apps/report/.next/standalone ./
COPY --from=builder /repo/apps/report/.next/static ./apps/report/.next/static

EXPOSE 3000

CMD ["node", "apps/report/server.js"]