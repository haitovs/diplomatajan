#!/bin/sh
# Start all 3 services in one container

echo "[entrypoint] Starting target login server..."
node /app/server/target.js &

echo "[entrypoint] Starting defense proxy..."
node /app/server/proxy.js &

# Wait a moment for Node servers to bind
sleep 1

echo "[entrypoint] Starting nginx..."
nginx -g 'daemon off;'
