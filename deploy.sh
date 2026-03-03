#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[bastion]${NC} $*"; }
ok()   { echo -e "${GREEN}  ✓${NC} $*"; }
fail() { echo -e "${RED}  ✗${NC} $*"; }

check() {
  local name="$1" url="$2"
  for i in $(seq 1 10); do
    curl -sf --max-time 3 "$url" > /dev/null 2>&1 && { ok "$name"; return 0; }
    sleep 2
  done
  fail "$name not responding ($url)"; return 1
}

case "${1:-deploy}" in
  deploy)
    log "Pulling latest..."
    git pull --ff-only 2>/dev/null || true
    log "Building & starting..."
    docker compose up --build -d
    sleep 4
    log "Health checks:"
    check "Frontend"      "http://localhost:4089"
    check "Defense proxy"  "http://localhost:4089/api/health"
    ;;
  stop)    docker compose down ;;
  restart) docker compose down && docker compose up -d ;;
  status)  docker compose ps; echo ""; check "Frontend" "http://localhost:4089"; check "Proxy" "http://localhost:4089/api/health" ;;
  logs)    docker compose logs -f "${2:-}" ;;
  *)       echo "Usage: ./deploy.sh [deploy|stop|restart|status|logs]" ;;
esac
