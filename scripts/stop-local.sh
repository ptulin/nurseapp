#!/bin/zsh
set -euo pipefail
PID_FILE="/tmp/nurseapp.pid"
if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${PID}" ]] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    echo "stopped pid=$PID"
  else
    echo "not-running"
  fi
  rm -f "$PID_FILE"
else
  echo "not-running"
fi
