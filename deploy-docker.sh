#!/bin/bash
# Update HR HUB running on Docker — run on the server inside the project folder: bash deploy-docker.sh
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "✗ .env not found. Copy .env.docker.example to .env and fill it in first (see docs/deploy-docker.md)."
  exit 1
fi

echo "=== [1/3] Pull latest code ==="
git pull origin main

echo "=== [2/3] Build images ==="
docker compose build

echo "=== [3/3] Restart containers ==="
docker compose up -d
docker image prune -f >/dev/null

echo ""
docker compose ps
echo ""
PORT=$(grep -E '^HTTP_PORT=' .env | cut -d= -f2)
echo "✓ Done. Check: curl -s http://localhost:${PORT:-80}/api/health"
