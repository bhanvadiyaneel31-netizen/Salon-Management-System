#!/usr/bin/env bash
# start-backend.sh — Auto-restarts the backend if it crashes or is killed by the OS

echo "🚀 Salon Backend Auto-Restart Daemon"
echo "   Press Ctrl+C to stop"
echo ""

ATTEMPTS=0
MAX_ATTEMPTS=5
DELAY=3

while true; do
  ATTEMPTS=$((ATTEMPTS + 1))

  if [ $ATTEMPTS -gt $MAX_ATTEMPTS ]; then
    echo "❌ Backend failed $MAX_ATTEMPTS times in a row. Stopping."
    echo "   Check for errors above or run:  lsof -i :5001"
    exit 1
  fi

  echo "[$(date '+%H:%M:%S')] ▶ Starting backend (attempt $ATTEMPTS)..."

  # Auto-clear any ghost process holding the port before starting
  EXISTING=$(lsof -t -i:5001 2>/dev/null)
  if [ -n "$EXISTING" ]; then
    echo "[$(date '+%H:%M:%S')] 🔧 Port 5001 already in use (PID $EXISTING) — clearing it..."
    kill -9 $EXISTING 2>/dev/null
    sleep 1
  fi

  START_TIME=$(date +%s)
  node server.js
  EXIT_CODE=$?
  END_TIME=$(date +%s)
  RUN_SECONDS=$((END_TIME - START_TIME))

  # Clean Ctrl+C (SIGINT = exit 130) — stop without restarting
  if [ $EXIT_CODE -eq 130 ]; then
    echo ""
    echo "👋 Stopped manually."
    exit 0
  fi

  # If it ran for more than 10 seconds, it was a healthy session — reset crash counter
  if [ $RUN_SECONDS -gt 10 ]; then
    ATTEMPTS=0
  fi

  echo "[$(date '+%H:%M:%S')] ⚠️  Backend stopped (exit $EXIT_CODE, ran ${RUN_SECONDS}s). Restarting in ${DELAY}s..."
  sleep $DELAY
done
