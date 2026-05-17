#!/usr/bin/env bash

set -euo pipefail

docker compose exec -T valkey valkey-cli FLUSHALL

