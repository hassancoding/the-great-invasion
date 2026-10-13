#!/usr/bin/env bash
set -euo pipefail
echo "=== GitHub push check ==="
branch=$(git rev-parse --abbrev-ref HEAD)
local=$(git rev-parse HEAD)
origin=$(git rev-parse origin/main 2>/dev/null || echo "none")
ahead=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
behind=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
echo "branch:  $branch"
echo "local:   $local"
echo "origin:  $origin"
echo "ahead:   $ahead"
echo "behind:  $behind"
if [ "$ahead" = "0" ] && [ "$behind" = "0" ]; then
  echo "PASS: GitHub main is up to date (nothing to push)"
  exit 0
fi
echo "FAIL: local and origin/main differ"
exit 1
