#!/bin/bash
# Pre-push hook: fetch latest data/admin-data.json dari GitHub
# supaya game/items terbaru dari dashboard tidak hilang saat push kode baru.
#
# Cara kerja:
# 1. Sebelum git push, fetch data/admin-data.json terbaru dari GitHub
# 2. Jika remote lebih baru → update local file
# 3. Jika local lebih baru → biarkan (akan di-push)
# 4. Jika konflik → merge dengan prefer remote (data dashboard prioritas)

set -e

REPO="neuralforgeio/akuma-joki"
BRANCH="main"
FILE_PATH="data/admin-data.json"
LOCAL_FILE="data/admin-data.json"

# Cek apakah file local ada
if [ ! -f "$LOCAL_FILE" ]; then
  exit 0
fi

# Fetch remote version via GitHub raw
REMOTE_CONTENT=$(curl -sf "https://raw.githubusercontent.com/${REPO}/${BRANCH}/${FILE_PATH}" 2>/dev/null || echo "")

if [ -z "$REMOTE_CONTENT" ]; then
  # Remote tidak ada file (mungkin first push) → lanjut push
  exit 0
fi

# Bandingkan updatedAt timestamp
LOCAL_UPDATED=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$LOCAL_FILE','utf-8')).updatedAt||'')}catch{console.log('')}" 2>/dev/null || echo "")
REMOTE_UPDATED=$(echo "$REMOTE_CONTENT" | node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf-8')).updatedAt||'')}catch{console.log('')}" 2>/dev/null || echo "")

# Jika remote lebih baru → update local
if [ -n "$REMOTE_UPDATED" ] && [ -n "$LOCAL_UPDATED" ]; then
  if [ "$REMOTE_UPDATED" \> "$LOCAL_UPDATED" ]; then
    echo "[pre-push] Remote admin-data.json lebih baru ($REMOTE_UPDATED > $LOCAL_UPDATED)"
    echo "[pre-push] Updating local file dari GitHub..."
    echo "$REMOTE_CONTENT" > "$LOCAL_FILE"
    git add "$LOCAL_FILE"
    git commit --amend --no-edit 2>/dev/null || true
    echo "[pre-push] Local admin-data.json updated."
  else
    echo "[pre-push] Local admin-data.json sudah terbaru ($LOCAL_UPDATED). OK."
  fi
fi

exit 0
