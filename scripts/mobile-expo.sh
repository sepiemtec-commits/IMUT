#!/usr/bin/env bash
# Expo SDK 56 exige Node >= 20.19
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "nvm não encontrado. Rode: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
  echo "Depois: source ~/.bashrc && nvm install 20"
  exit 1
fi
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null 2>&1 || nvm install 20

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/mobile"

echo "Node: $(node -v) | Expo: $(node -e "console.log(require('expo/package.json').version)")"

exec pnpm exec expo start --clear --lan "$@"
