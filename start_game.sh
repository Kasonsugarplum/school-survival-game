#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"
PORT="8000"
URL="http://localhost:$PORT"

if command -v python3 >/dev/null 2>&1; then
  PYTHON="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON="python"
else
  echo "Python was not found. Please install Python to run the game."
  exit 1
fi

if command -v xdg-open >/dev/null 2>&1; then
  OPEN_CMD="xdg-open"
elif command -v open >/dev/null 2>&1; then
  OPEN_CMD="open"
else
  OPEN_CMD=""
fi

if ! curl -sf "$URL" >/dev/null 2>&1; then
  echo "Starting local server on $URL..."
  $PYTHON -m http.server "$PORT" >/tmp/school_escape_server.log 2>&1 &
  SERVER_PID=$!
  sleep 2
else
  echo "A server is already running on $URL"
  SERVER_PID=""
fi

if [ -n "$OPEN_CMD" ]; then
  echo "Opening the game in your browser..."
  "$OPEN_CMD" "$URL" >/dev/null 2>&1 || true
fi

printf "\nGame is running at: %s\n" "$URL"
printf "Press Ctrl+C to stop the server.\n"

if [ -n "$SERVER_PID" ]; then
  wait "$SERVER_PID"
fi
