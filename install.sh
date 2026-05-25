#!/usr/bin/env bash
# Instala pnpm (se faltar) e dependências do monorepo IMUT
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Instalando pnpm em ~/.local ..."
  mkdir -p "$HOME/.local/bin"
  npm install -g pnpm@9.15.0 --prefix "$HOME/.local"
  export PATH="$HOME/.local/bin:$PATH"
fi

echo "pnpm $(pnpm -v)"
pnpm install
