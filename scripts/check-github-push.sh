#!/usr/bin/env bash
# Stage gate: verify local main matches origin/main and working tree is clean.
# Run at the end of every development stage before declaring the stage complete.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== GitHub push check ==="

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "FAIL: not a git repository"
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "main" ]; then
  echo "WARN: on branch '$BRANCH' (expected main)"
fi

git fetch origin main 2>/dev/null || git fetch origin 2>/dev/null || true

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main 2>/dev/null || git rev-parse origin/HEAD 2>/dev/null || echo '')"

if [ -z "$REMOTE" ]; then
  echo "FAIL: cannot resolve origin/main"
  exit 1
fi

DIRTY="$(git status --porcelain)"
if [ -n "$DIRTY" ]; then
  echo "FAIL: working tree not clean — commit and push before ending the stage"
  echo "$DIRTY" | head -40
  exit 1
fi

AHEAD="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"
BEHIND="$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)"

echo "branch:  $BRANCH"
echo "local:   $LOCAL"
echo "origin:  $REMOTE"
echo "ahead:   $AHEAD"
echo "behind:  $BEHIND"

if [ "$AHEAD" != "0" ]; then
  echo "FAIL: $AHEAD local commit(s) not pushed — run: git push origin main"
  exit 1
fi

if [ "$BEHIND" != "0" ]; then
  echo "FAIL: local is behind origin by $BEHIND commit(s) — pull/rebase then re-check"
  exit 1
fi

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "FAIL: HEAD does not match origin/main"
  exit 1
fi

echo "PASS: GitHub main is up to date (nothing to push)"
exit 0
