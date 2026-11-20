#!/bin/sh
set -e

# -------------------------------------------------------------
# 1. Environment & Port Normalization for Render
# -------------------------------------------------------------
# Render automatically injects PORT (e.g. 10000).
# GitFolio requires SERVER_PORT and SERVER_HOST=0.0.0.0 in Docker.
if [ -n "$PORT" ] && [ -z "$SERVER_PORT" ]; then
  export SERVER_PORT="$PORT"
fi
export SERVER_HOST="${SERVER_HOST:-0.0.0.0}"
export NODE_ENV="${NODE_ENV:-production}"

echo "=========================================================="
echo "  GitFolio Production Backend (Render Free Tier)"
echo "  Host: $SERVER_HOST | Port: ${SERVER_PORT:-3001} | Node Env: $NODE_ENV"
echo "=========================================================="

# -------------------------------------------------------------
# 2. Redis Handling (Embedded vs. External)
# -------------------------------------------------------------
# On Render Free Tier, background services and Redis are not included for free.
# If REDIS_URL is not configured or points to localhost/127.0.0.1, we start an
# embedded, lightweight Redis instance memory-capped at 32MB to fit Render's 512MB RAM.
if [ -z "$REDIS_URL" ] || echo "$REDIS_URL" | grep -qE "127\.0\.0\.1|localhost"; then
  echo "=> [Redis] Starting embedded Redis daemon (maxmemory 32mb)..."
  export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"
  redis-server --daemonize yes --protected-mode no --port 6379 --maxmemory 32mb --maxmemory-policy allkeys-lru --save ""

  # Verify Redis readiness
  REDIS_READY=0
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if redis-cli -p 6379 ping 2>/dev/null | grep -q PONG; then
      REDIS_READY=1
      echo "=> [Redis] Embedded Redis is ready and responding."
      break
    fi
    sleep 0.5
  done

  if [ "$REDIS_READY" -eq 0 ]; then
    echo "=> [Redis] Warning: Embedded Redis did not respond to ping within 5 seconds."
  fi
else
  # Mask password in log output
  SAFE_REDIS_URL=$(echo "$REDIS_URL" | sed -E 's/:[^@]+@/:***@/')
  echo "=> [Redis] Connecting to external Redis: $SAFE_REDIS_URL"
fi

# -------------------------------------------------------------
# 3. Supabase Database Migration
# -------------------------------------------------------------
# Automatically applies pending Prisma migrations on startup.
# Can be skipped if AUTO_MIGRATE=false.
if [ "$AUTO_MIGRATE" != "false" ] && [ -n "$DATABASE_URL" ]; then
  echo "=> [Prisma] Checking and applying migrations to Supabase..."
  if node ./server/scripts/prisma.mjs migrate deploy; then
    echo "=> [Prisma] Migrations are up to date."
  else
    echo "=> [Prisma] Warning: Migration deploy encountered an issue. Server will attempt startup."
  fi
elif [ -z "$DATABASE_URL" ]; then
  echo "=> [Prisma] Warning: DATABASE_URL is not set. Ensure Supabase credentials are configured."
fi

# -------------------------------------------------------------
# 4. Process Execution
# -------------------------------------------------------------
# If a custom command was passed to docker run (e.g. sh or npm run ...), run that.
if [ "$#" -gt 0 ] && [ "$1" != "node" ]; then
  exec "$@"
fi

# Default: start API server and deployment worker under process supervisor
echo "=> [GitFolio] Launching services under runner supervisor..."
exec node scripts/start-runner.mjs
