# The Great Invasion

**Modern War Territory Control Game**

Expand your nation. Defend your borders. Conquer the map.

## Play Live

**https://the-great-invasion.vercel.app**

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Stack

- Next.js 15.5.7
- React 18
- TypeScript
- Tailwind CSS 3
- HTML5 Canvas map
- Web Audio API (zero-asset SFX)

## Features

- Fast territorial expansion vs rival AI nations
- Streak / contested / speed scoring
- Personal best (localStorage)
- Daily Challenge (deterministic UTC seed)
- Achievements (12) with unlock toasts
- Local leaderboard
- Share results (Web Share API + clipboard)
- How to Play + Settings (sound ON/OFF)
- Keyboard: Enter/Space start or replay, Escape pause/back
- AdService abstraction (banner slots reserved)
- Analytics abstraction
- Score API with basic anti-cheat
- Privacy & Terms pages
- PWA manifest + service worker
- SEO metadata (Open Graph, Twitter)

## Game loop

PLAY → claim adjacent territories → rivals expand → score rises with streaks → time runs out → results → share / play again

## Deploy

Connected to Vercel via GitHub (`hassancoding/the-great-invasion`).
Push to `main` triggers production deploy.
