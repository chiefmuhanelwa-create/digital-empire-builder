#!/usr/bin/env bash
# Optimise static images in public/ in place — dependency-free (macOS `sips`).
# Run before committing new images or before a deploy. Filenames/extensions are
# preserved so no src= paths break. JPEGs recompress; PNGs only resize (lossless).
#
#   bun run optimize:images          # optimise anything over the threshold
#   THRESHOLD_KB=200 bun run optimize:images
#
# History: this took public/ from 149MB -> 12MB before launch (2026-06-21).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/public"
THRESHOLD_KB="${THRESHOLD_KB:-400}"   # only touch files larger than this
JPEG_MAX_EDGE="${JPEG_MAX_EDGE:-1600}"
JPEG_QUALITY="${JPEG_QUALITY:-68}"
PNG_MAX_EDGE="${PNG_MAX_EDGE:-1000}"

command -v sips >/dev/null || { echo "sips not found (macOS only)"; exit 1; }
[ -d "$PUBLIC" ] || { echo "no public/ dir at $PUBLIC"; exit 1; }

before=$(du -sk "$PUBLIC" | cut -f1)
count=0

while IFS= read -r -d '' f; do
  case "${f##*.}" in
    jpg|JPG|jpeg|JPEG) sips -Z "$JPEG_MAX_EDGE" -s formatOptions "$JPEG_QUALITY" "$f" >/dev/null ;;
    png|PNG)           sips -Z "$PNG_MAX_EDGE" "$f" >/dev/null ;;
    *) continue ;;
  esac
  count=$((count + 1))
  echo "  optimised: ${f#"$ROOT/"}"
done < <(find "$PUBLIC" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -size "+${THRESHOLD_KB}k" -print0)

after=$(du -sk "$PUBLIC" | cut -f1)
echo "Optimised $count file(s): $((before / 1024))MB -> $((after / 1024))MB"
