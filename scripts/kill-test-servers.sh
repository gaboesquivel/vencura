#!/bin/bash
# Kill any processes on test/dev ports (3000, 3001, 3002, 8081, 19000, 19001, 19002)
# This is useful for cleaning up after failed e2e tests

set -e

echo "Killing processes on test ports..."

kill_port() {
  local port=$1
  local pid=""
  
  # Try ss first (modern Linux)
  if command -v ss &> /dev/null; then
    pid=$(ss -tlnp 2>/dev/null | grep ":${port}" | grep -oP 'pid=\K\d+' | head -1)
    if [ -n "$pid" ]; then
      kill -9 "$pid" 2>/dev/null && echo "Killed process $pid on port $port (via ss)" || true
      return
    fi
  fi
  
  # Try netstat (fallback)
  if command -v netstat &> /dev/null; then
    pid=$(netstat -tlnp 2>/dev/null | grep ":${port}" | grep -oP '\s+\K\d+(?=/node)' | head -1)
    if [ -n "$pid" ]; then
      kill -9 "$pid" 2>/dev/null && echo "Killed process $pid on port $port (via netstat)" || true
      return
    fi
  fi
  
  # Try fuser (Linux)
  if command -v fuser &> /dev/null; then
    fuser -k "${port}/tcp" 2>/dev/null && echo "Killed processes on port $port (via fuser)" || echo "No process found on port $port"
    return
  fi
  
  # Try lsof (macOS/Linux)
  if command -v lsof &> /dev/null; then
    lsof -ti:${port} | xargs kill -9 2>/dev/null && echo "Killed processes on port $port (via lsof)" || echo "No process found on port $port"
    return
  fi
  
  echo "Warning: No suitable tool found (ss/netstat/fuser/lsof). Cannot kill processes on port $port"
}

# Kill port 3000 (Next.js web)
kill_port 3000

# Kill port 3001 (Fastify)
kill_port 3001

# Kill port 3002 (Mathler)
kill_port 3002

# Kill Expo/Metro ports (mobile dev servers)
kill_port 8081
kill_port 19000
kill_port 19001
kill_port 19002

echo "Done."
