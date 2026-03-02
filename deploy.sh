#!/usr/bin/env bash
set -euo pipefail

# ─── Bastion Twin — deploy & run ───────────────────────────────────
# One command to pull, build, start, and verify everything.
#
#   ./deploy.sh          full deploy (pull + build + start + verify)
#   ./deploy.sh start    just start containers
#   ./deploy.sh stop     stop everything
#   ./deploy.sh restart  restart all services
#   ./deploy.sh status   show container status + health checks
#   ./deploy.sh logs     tail all logs
#   ./deploy.sh logs proxy   tail specific service
# ────────────────────────────────────────────────────────────────────

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[bastion]${NC} $*"; }
ok()   { echo -e "${GREEN}  ✓${NC} $*"; }
warn() { echo -e "${YELLOW}  !${NC} $*"; }
fail() { echo -e "${RED}  ✗${NC} $*"; }

# ─── Health check helper ───────────────────────────────────────────
check_health() {
  local name="$1" url="$2" retries="${3:-10}" delay="${4:-2}"
  for i in $(seq 1 "$retries"); do
    if curl -sf --max-time 3 "$url" > /dev/null 2>&1; then
      ok "$name is up  ($url)"
      return 0
    fi
    sleep "$delay"
  done
  fail "$name not responding after $((retries * delay))s  ($url)"
  return 1
}

# ─── Commands ──────────────────────────────────────────────────────
cmd_deploy() {
  log "Pulling latest changes..."
  git pull --ff-only || warn "git pull failed — continuing with local code"

  log "Building & starting all services..."
  docker compose up --build -d

  log "Waiting for services..."
  sleep 3

  cmd_verify
  echo ""
  cmd_status
}

cmd_start() {
  log "Starting services..."
  docker compose up -d
  sleep 3
  cmd_verify
}

cmd_stop() {
  log "Stopping all services..."
  docker compose down
  ok "All services stopped"
}

cmd_restart() {
  log "Restarting all services..."
  docker compose down
  docker compose up -d
  sleep 3
  cmd_verify
}

cmd_status() {
  log "Container status:"
  echo ""
  docker compose ps
  echo ""
  cmd_verify
}

cmd_verify() {
  log "Health checks:"
  local all_ok=true

  check_health "Frontend (nginx)"   "http://localhost:4089"            8 2 || all_ok=false
  check_health "Defense proxy"      "http://localhost:4089/api/health" 8 2 || all_ok=false

  if $all_ok; then
    echo ""
    ok "All services healthy"
  else
    echo ""
    fail "Some services are down — run: ./deploy.sh logs"
  fi
}

cmd_logs() {
  local service="${1:-}"
  if [ -n "$service" ]; then
    docker compose logs -f "$service"
  else
    docker compose logs -f
  fi
}

# ─── Router ────────────────────────────────────────────────────────
case "${1:-deploy}" in
  deploy)  cmd_deploy ;;
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_restart ;;
  status)  cmd_status ;;
  verify)  cmd_verify ;;
  logs)    cmd_logs "${2:-}" ;;
  *)
    echo "Usage: ./deploy.sh [deploy|start|stop|restart|status|logs [service]]"
    exit 1
    ;;
esac
