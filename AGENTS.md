# Agent Instructions — The Great Invasion: Riftlands

These instructions apply to the entire repository. Read this file and `SECTOR_ONE_MASTER_SPEC.md` before implementing gameplay, art, content, physics, or release work.

## Product goal and scope
- Deliver a production-quality, end-to-end playable Sector I campaign: **Halcyon Spire**.
- The repository is currently a Phaser 3 + TypeScript + Vite project. Confirm the actual code before relying on older plans or assumptions.
- Sector I is the only sector in scope unless the user explicitly authorizes work beyond it. Other sector definitions may exist as data; do not build or unlock them as part of Sector I.
- Treat the master specification as the source of truth for campaign scope, implementation phases, quality gates, and completion criteria.
- The campaign must offer at least eight substantial play sessions and a target of roughly 25–35 hours for a first-time player pursuing the main path plus meaningful side content. Never inflate playtime through arbitrary waits, excessive health, repeated filler waves, or forced grinding.

## Required workflow
1. Inspect the repository, current branch, package scripts, existing scenes, data models, asset manifests, and systems before editing.
2. Write a brief implementation plan grounded in the code that exists. Identify dependencies and regression risks.
3. Implement in small vertical slices: data/content, assets, integration, UX feedback, tests, and documentation.
4. Reuse compatible assets and systems. Avoid duplicate systems or parallel manifests. Do not replace working code wholesale without clear need.
5. Integrate every asset into the actual game. Generated files alone do not count as implementation.
6. Run available checks, at minimum `npm run build`; run added tests and relevant browser/manual checks when possible. Never report a check as passed unless it was executed.
7. Report changed files, behavior delivered, checks run and their results, known limitations, and next dependency.

## Engineering rules
- Use TypeScript types and existing project conventions. Avoid `any` unless justified and narrowly scoped.
- Keep scene orchestration separate from reusable gameplay systems and data. Avoid concentrating all combat, quests, UI, camera, and world logic in one scene.
- Use a fixed, documented coordinate convention and centralized gameplay tuning values. Avoid unexplained magic numbers in movement, combat, camera, and encounter logic.
- Make scene transitions and cleanup safe: remove event listeners, timers, tweens, physics objects, and subscriptions owned by a scene; avoid duplicate keyboard callbacks after restarts.
- Use Phaser Arcade Physics only where its limitations are understood. If a mechanic requires reliable slopes, rotating bodies, complex polygon collisions, or deterministic rigid-body interactions, document and choose an appropriate implementation rather than faking it with decorative art.
- Gameplay collision must use explicit physics shapes and tuning, never texture alpha or sprite appearance as a collision authority.
- Separate visual layers from collision geometry. Make hazard hitboxes fair, readable, and testable.
- Use delta-time-aware movement and camera effects; clamp player/world/camera bounds intentionally.
- All player controls must work with keyboard and be designed so a gamepad can be added without rewriting gameplay logic. If gamepad support is delivered, test it and document the mapping.
- Respect accessibility: configurable or remappable controls where feasible, readable UI, distinct visual telegraphs, non-colour-only cues, reduced-shake option, pause, and volume controls.
- Do not add dependencies without explaining why they are needed.
- Do not invent asset paths or texture keys. Verify each path and key in the repository.
- Keep asset licensing and provenance recorded for any external art/audio/font. Do not copy assets with unclear usage rights.

## Art and asset pipeline
- Before creating assets, inspect the asset folders, current loader, animation definitions, manifest format, target display sizes, and existing visual style.
- Prefer original, clean, individually usable assets. Use transparent cutouts for props and sprites; use layered SVG or appropriate raster formats for environment artwork.
- Every character/enemy animation set must document frame order, dimensions, frame rate, origin, feet baseline, intended facing direction, and hitbox assumptions.
- Every environment prop must be categorized as decorative, interactive, destructible, collectible, hazard, or collision-bearing. Decorative props must not accidentally block the player.
- Register assets in the established loader and manifest. Avoid duplicate sources of truth.
- Inspect artwork at native size and gameplay scale; verify SVG rendering, alpha edges, texture dimensions, depth, scroll factor, and performance.
- Mark asset status as proposed, integrated, visually verified, or release verified. Do not mark verified merely because a file exists.

## Gameplay and content integrity
- Every quest/objective must have explicit start, active, success, failure/retry, persistence, and UI states as applicable.
- Every encounter must have entry conditions, spawn rules, telegraphs, win/fail conditions, exit conditions, and recovery behavior.
- The Aether Well cannot be claimed until the required objective conditions are satisfied. Completion must persist across the intended session and not trigger twice.
- Checkpoints must be fair and deterministic. Death must restore a known valid state without duplicating enemies, rewards, listeners, or objectives.
- Enemy behaviour must be driven by explicit state machines or similarly legible logic, with recovery windows and readable tells.
- Difficulty should come from patterns, combinations, traversal, and player mastery—not unavoidable damage or artificial time padding.
- All main-path routes must be completable without secrets or optional upgrades. Optional content can improve mastery and rewards but must not soft-lock completion.

## Master-spec completion gates
Do not call Sector I complete until all are true:
- All required campaign areas and meaningful optional branches are implemented and connected.
- Player locomotion, combat, enemy AI, boss phases, hazards, checkpoints, collectibles, objectives, save/resume, pause, and victory/defeat loops work end to end.
- All required art/audio/UI assets are integrated and visually inspected.
- No known progression blockers, fatal errors, missing production assets, or major collision defects remain.
- Build passes; automated checks pass; a full campaign playthrough and targeted regression suite are recorded.
- Performance, keyboard usability, accessibility options, and supported viewport sizes have been checked.
- The final report distinguishes verified facts from untested assumptions.

## Working principle
Inspect before modifying. Plan before large changes. Integrate before declaring completion. Test before reporting success. Prefer coherent, complete, playable slices over disconnected placeholder systems.
