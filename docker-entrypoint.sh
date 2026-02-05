#!/bin/bash
set -e

# Railway compatibility: map PORT to OPENCLAW_GATEWAY_PORT
if [ -n "$PORT" ] && [ -z "$OPENCLAW_GATEWAY_PORT" ]; then
  export OPENCLAW_GATEWAY_PORT="$PORT"
fi

# Ensure data directories exist with correct permissions when volume is mounted
# This runs at container startup, after volumes are mounted
if [ -d "/data" ]; then
  # Create subdirectories if they don't exist
  mkdir -p /data/.openclaw /data/workspace 2>/dev/null || true
  
  # Fix permissions if running as root
  if [ "$(id -u)" = "0" ]; then
    chown -R node:node /data 2>/dev/null || true
    # Switch to node user and execute the main command
    exec gosu node "$@"
  fi
fi

# If not root or no /data directory, just execute the command
exec "$@"
