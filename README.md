# The Great Invasion

**Hold the line. Claim the Well.**

A fast Riftlands sector-runner for the browser: short runs, slash combat, adaptive Dominion surges, and shareable results.

**Live:** https://the-great-invasion.vercel.app  
**Repo:** https://github.com/hassancoding/the-great-invasion

---

## Play loop

1. Explore the floating sector as **Arin Solwright**
2. Reach the **Aether Well** and hold to stabilize (~1.6s)
3. Survive a **Threat Director** surge (swarm / wall / reaver)
4. Advance through sectors (Halcyon → Verdant → **Ashfall Reach**)
5. Results → stars → share

**Controls:** WASD / arrows · **J** light · **K** heavy · mobile on-screen buttons

---

## Stack (v4 — Stage 1)

| Layer | Choice |
|-------|--------|
| Engine | **Phaser 3** (Arcade Physics) |
| Language | TypeScript |
| Bundler | **Vite 5** |
| Delivery | Browser + **PWA** (`vite-plugin-pwa`) |
| Audio | OGG assets + Web Audio fallback |
| Visuals | Asset-sheet-matched procedural sprites |

Legacy **Next.js 15** Canvas runner remains available for reference (`npm run dev:next`).

See [STACK.md](./STACK.md) for distribution stages (PWA → Capacitor / Electron).

---

## Quick start

```bash
npm install --legacy-peer-deps
npm run dev          # Phaser game → http://localhost:5173
npm run build        # production → dist-game/
npm run preview      # serve production build
```

```bash
npm run dev:next     # legacy Next.js app → :3000
npm run build:next
```

---

## Project layout

```
src/phaser/
  main.ts                 Phaser entry
  config.ts               960×540, physics, combat constants
  scenes/                 Boot · Menu · Play · Results
  systems/                AudioManager · ThreatDirector
  utils/textureFactory.ts Multi-frame Arin / Dominion / biomes
  assets/                 Visual + audio manifests
  data/levels.ts          Sector ASCII layouts
public/assets/audio/      5 music loops + 22 SFX (OGG)
index.html                Vite shell
vite.config.ts
vercel.json               Vite production settings
```

---

## Assets

### Visual (Game Asset Sheet)
- **Arin** — Concord plate, energy blade (idle / run / jump / light / heavy)
- **Dominion** — Graveling, Shard Legionnaire, Obsidian Hulk, Aether Reaver
- **World** — skybound / verdant / obsidian / ashfall tiles + skies
- **Props** — Well beacon, crystals, slash FX, HUD icons


### Audio (Wave 1)
| Music | Role |
|-------|------|
| `echoes_of_the_riftlands` | Menu |
| `the_failing_well` | Explore |
| `wells_of_fate` | Well claim |
| `dominion_rising` | Surge / combat |
| `heart_of_the_rift` | Reaver / boss |

SFX cover movement, combat, Well, UI, and results. Manifest: `src/phaser/assets/audioManifest.json`.

---



## License / credits

Original Riftlands IP and Game Asset Sheet designs for **The Great Invasion**.  

