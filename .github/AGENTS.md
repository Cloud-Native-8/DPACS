# GitHub AGENTS.md

## Scope

- `.github/workflows/`

## Rules

- Keep CI simple and useful for the current project stage.
- Prefer checks that match local developer workflow.
- Do not add deployment automation that assumes real AWS credentials by default.
- CI should validate code, app buildability, and Docker image buildability.

## Current Expectation

- Install dependencies with pnpm workspace
- Run `./scripts/test-all.sh`
- Run local app build checks with `pnpm app:build`
- Build Docker images with `pnpm docker:build`
