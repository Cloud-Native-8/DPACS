# DPACS Final Project - AGENTS.md

This repository is a monorepo for the DPACS final project.

## Scope

- `apps/access-service`: access-control API
- `apps/report-service`: report UI and report APIs
- `apps/event-processor`: internal SQS consumer
- `db/`: shared Prisma schema and migrations

```text
/                -> report-service
/report          -> report-service
/api/report      -> report-service
/access/*        -> access-service
```

Current phase is local development first. Do not spend effort on Kubernetes changes unless explicitly requested.

## Core Rules

- Do not commit real secrets, AWS keys, kubeconfig files, or passwords.
- Do not hardcode ALB DNS names, RDS endpoints, Redis endpoints, or SQS queue URLs.
- Use environment variables, ConfigMaps, Secrets, or placeholders.
- Keep changes scoped to the task.
- Update docs when routes, env vars, schema, or local run flow change.

## Update Together

- Route changes: app code and `docs/api.md`
- Env changes: `.env` or `.env.local`, config loading
- DB changes: migrations, service logic, Prisma client usage, docs if needed
- AWS changes: app code, env docs, `infra/aws/*.md` if needed

## Verification

```bash
./scripts/test-all.sh
./scripts/build-all.sh
./scripts/check.sh
```
