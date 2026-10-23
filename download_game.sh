#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
OUT="school-survival-game.zip"

if command -v zip >/dev/null 2>&1; then
  zip -qr "$OUT" . -x "$OUT" '.git/*' '.gitignore' 'download_game.sh' >/dev/null
elif command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY'
import os, zipfile
base = os.getcwd()
out = os.path.join(base, 'school-survival-game.zip')
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d != '.git' and d != '__pycache__']
        for file in files:
            if file in {'school-survival-game.zip', 'download_game.sh'}:
                continue
            full = os.path.join(root, file)
            arc = os.path.relpath(full, base)
            z.write(full, arc)
print(f'Created {out}')
PY
else
  echo "Neither zip nor python3 is available on this system." >&2
  exit 1
fi

echo "Download ready: $OUT"
