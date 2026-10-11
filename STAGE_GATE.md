# Stage gate — GitHub push check

**Rule:** At the end of every development stage, code must be committed and pushed to `origin/main` before the stage is marked complete.

## Check

```bash
npm run check:push
# or
bash scripts/check-github-push.sh
```

## Pass criteria

- On a git repo with `origin/main` reachable
- Working tree clean (no uncommitted changes)
- Local `HEAD` equals `origin/main` (nothing ahead or behind)

## If it fails

```bash
git add -A
git status
git commit -m "…"
git push origin main
npm run check:push
```

Do not claim a stage is done until `check:push` prints `PASS`.
