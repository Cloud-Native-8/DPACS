#!/usr/bin/env bash

set -euo pipefail

SEED_DIR="packages/db/seed"

if [[ "${1:-}" == "--" ]]; then
  shift
fi

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "usage: pnpm db:seed [seed-file.sql]"
  echo
  echo "without arguments, imports all .sql files under $SEED_DIR in sorted order"
  echo "with one argument, imports only that seed file"
  exit 0
fi

if [[ $# -gt 1 ]]; then
  echo "usage: pnpm db:seed [seed-file.sql]" >&2
  exit 1
fi

if [[ $# -eq 1 ]]; then
  seed_file="$1"

  if [[ ! -f "$seed_file" ]]; then
    echo "seed file not found: $seed_file" >&2
    exit 1
  fi

  echo "seeding from $seed_file"
  docker compose exec -T postgres psql -U postgres -d app < "$seed_file"
  exit 0
fi

seed_files=()
while IFS= read -r seed_file; do
  seed_files+=("$seed_file")
done < <(find "$SEED_DIR" -maxdepth 1 -type f -name '*.sql' | sort)

if [[ ${#seed_files[@]} -eq 0 ]]; then
  echo "no seed files found in $SEED_DIR" >&2
  exit 1
fi

for seed_file in "${seed_files[@]}"; do
  echo "seeding from $seed_file"
  docker compose exec -T postgres psql -U postgres -d app < "$seed_file"
done
