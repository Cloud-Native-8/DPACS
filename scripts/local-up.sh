#!/usr/bin/env bash
set -euo pipefail

docker compose up -d postgres valkey localstack

for _ in $(seq 1 30); do
  if curl -fsS http://localhost:4566/_localstack/health >/dev/null 2>&1; then
    bash ./packages/queue/scripts/setup-local.sh
    echo "local services are ready"
    exit 0
  fi

  sleep 1
done

echo "localstack did not become ready in time" >&2
exit 1
