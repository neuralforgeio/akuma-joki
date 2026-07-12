#!/bin/bash
# Keep dev server alive — auto-restart jika mati
cd /home/z/my-project
while true; do
  if ! pgrep -f "next dev" > /dev/null 2>&1; then
    echo "[$(date)] Dev server not running, starting..."
    bun run dev >> /home/z/my-project/dev.log 2>&1 &
    DEV_PID=$!
    echo "[$(date)] Started dev server PID $DEV_PID"
    wait $DEV_PID
    echo "[$(date)] Dev server exited, restarting in 3s..."
    sleep 3
  else
    sleep 5
  fi
done
