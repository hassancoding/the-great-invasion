# The Great Invasion — Technology Stack (v4)

## Stage 1 — Browser (current)

| Layer | Choice |
|-------|--------|
| Engine | **Phaser 3** (Arcade Physics) |
| Language | **TypeScript** |
| Bundler | **Vite 5** |
| Delivery | Web + **PWA** (`vite-plugin-pwa`) |
| Assets | Transparent PNG + JSON atlas (production); procedural sheet-matched textures until sheets land |

### Why Phaser 3
Platforming physics, combat timing, enemy AI, tile environments, cameras, and mobile multi-touch are first-class. Keeps the lightweight 2D architecture from the Master GDD without hand-rolling every system.

### Commands
```bash
npm install
npm run dev          # Vite + Phaser → http://localhost:5173
npm run build        # production → dist-game/
npm run preview      # serve production build
npm run dev:next     # legacy Next.js Canvas runner (fallback)
```

### Scene graph
- `Boot` — generate or load textures, hand off
- `Menu` — title, PB, start
- `Play` — sector runner (claim Well → surge → next)
- `Results` — score, stars, share

### Asset pipeline
See `src/phaser/assets/manifest.json` and `public/assets/README.md`.

Specs (initial):
- Character frames 96×96
- Small enemies 64×64
- Large / elite 128×128
- Tiles 32×32
- UI icons 64×64

Procedural textures in `textureFactory.ts` match the Game Asset Sheet palette (Arin Concord blue, Dominion purple, Aether cyan) so visuals stay consistent before production PNGs arrive.

## Stage 2 — Installable web
PWA caching, offline shell, save persistence (already scaffolded via `vite-plugin-pwa`).

## Stage 3 — Standalone
- **Mobile:** Capacitor wrapping `dist-game`
- **Desktop:** Electron or Tauri when store requirements are set

## Legacy
`src/game/platformer/*` + Next.js remain as the Canvas 2D reference implementation (`npm run dev:next`). Phaser is the primary path forward.

## Audio (Wave 1)

| Bus | Role | Default |
|-----|------|---------|
| master | Global | 1.0 |
| music | Beds / motifs | 0.45 |
| sfx | Combat / UI | 0.7 |
| ambience | Well hum, wind | 0.35 |

**Reactive map**
- Menu → *Echoes of the Riftlands* (procedural pad)
- Explore → *The Failing Well*
- Claiming → *Wells of Fate* + charge ticks
- Surge → *Dominion Rising* (+ tension layer); Reaver → *Heart of the Rift*
- Hit → SFX + music duck
- Results → victory/defeat sting + stars

Implementation: `src/phaser/systems/AudioManager.ts`  
Manifest: `src/phaser/assets/audioManifest.json`  
Production files: `public/assets/audio/{music,sfx}/`

Mobile unlock on first pointer/key. Swap synthesized tones for OGG without changing scene call sites.
