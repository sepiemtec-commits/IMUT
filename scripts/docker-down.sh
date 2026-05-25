#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT/infra/docker/docker-compose.deps.yml"

if docker info &>/dev/null 2>&1; then
  docker-compose -f "$COMPOSE_FILE" down
elif sudo -n docker info &>/dev/null 2>&1; then
  sudo -n docker-compose -f "$COMPOSE_FILE" down
else
  sudo docker-compose -f "$COMPOSE_FILE" down
fi
