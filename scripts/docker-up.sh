#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT/infra/docker/docker-compose.deps.yml"

run_compose() {
  docker-compose -f "$COMPOSE_FILE" up -d
}

if docker info &>/dev/null 2>&1; then
  run_compose
  exit 0
fi

if sudo -n docker info &>/dev/null 2>&1; then
  sudo -n docker-compose -f "$COMPOSE_FILE" up -d
  exit 0
fi

echo "Erro: sem permissão para o Docker."
echo ""
echo "O usuário já está no grupo 'docker', mas este terminal foi aberto antes disso."
echo "Solução (escolha uma):"
echo "  1) Abra um terminal NOVO e rode: pnpm docker:up"
echo "  2) Neste terminal: newgrp docker   (depois pnpm docker:up)"
echo "  3) Uma vez com sudo: sudo docker-compose -f infra/docker/docker-compose.deps.yml up -d"
exit 1
