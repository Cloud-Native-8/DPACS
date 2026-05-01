#!/usr/bin/env bash
set -euo pipefail

IMAGE_PREFIX="${IMAGE_PREFIX:-dpacs}"

image_refs="$(docker images --format '{{.Repository}}:{{.Tag}}' "${IMAGE_PREFIX}/*")"

if [[ -n "${image_refs}" ]]; then
  # shellcheck disable=SC2086
  docker rmi ${image_refs}
fi

docker image prune -f
