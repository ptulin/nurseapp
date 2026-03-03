#!/bin/zsh
set -euo pipefail

ROOT="/Users/patu/Documents/CursorProjects/NurseApp"
PORT="${1:-8788}"
PID_FILE="/tmp/nurseapp.pid"
OUT_FILE="/tmp/nurseapp.out"
ERR_FILE="/tmp/nurseapp.err"

cd "$ROOT"

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${OLD_PID}" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null || true
    sleep 0.5
  fi
fi

nohup env PORT="$PORT" node scripts/serve.mjs >"$OUT_FILE" 2>"$ERR_FILE" < /dev/null &
PID="$!"
echo "$PID" > "$PID_FILE"

for i in {1..20}; do
  if curl -sS -I "http://127.0.0.1:${PORT}" >/dev/null 2>&1; then
    echo "ok pid=$PID url=http://127.0.0.1:${PORT}"
    exit 0
  fi
  sleep 0.2
done

echo "failed pid=$PID"
echo "---stderr---"
cat "$ERR_FILE" 2>/dev/null || true
exit 1
