# Sector I Master Development Specification
## The Great Invasion: Riftlands — Halcyon Spire
**Status:** Living implementation contract  
**Engine baseline:** Phaser 3 + TypeScript + Vite; verify actual repository state before implementation  
**Scope:** Sector I only  
**Release standard:** Complete, replayable, visually cohesive, tested campaign—not a prototype or asset gallery

---

## 0. Mission and non-negotiable outcome

Build Halcyon Spire as a complete 2D action-platformer campaign with a beginning, rising middle, climax, and satisfying resolution. It must include coherent traversal, responsive character control, combat, enemy archetypes, boss encounters, secrets, collectibles, checkpoints, environmental storytelling, varied environments, camera direction, audio, UI, save/resume, accessibility options, and a final objective that works reliably.

The target is **25–35 hours for a first-time player exploring the main route and a meaningful portion of side content**, distributed across at least **eight substantial play sessions/days**. This is a content-design target, not a mechanic that blocks players for real-world time. Never require waiting 24 hours, daily login streaks, artificial energy limits, or grinding the same encounter to reach the next area. Skilled players taking a direct route may finish faster; the campaign must still contain the specified amount of authored content and optional mastery.

### Definition of done
Sector I is complete only when:
1. The campaign can be started from a clean install and completed without developer tools or manual state edits.
2. Every main-path objective, encounter, traversal gate, checkpoint, boss, and ending is functional.
3. Every required asset is loaded in-game, inspected at gameplay scale, and marked with an honest verification status.
4. Player and enemy movement, hitboxes, attacks, hazards, moving platforms, camera, and death recovery behave predictably.
5. Save/resume, pause, settings, audio, UI feedback, and progression persistence work.
6. Build and automated checks pass, and a recorded full playthrough plus targeted regression tests show no critical blockers.
7. No other sector is unlocked or implemented without explicit authorization.

## 1. Repository reconnaissance before implementation

Before changing code, inspect:
- `package.json`, TypeScript/Vite configuration, entry point, Phaser game configuration, current scene list and scene transitions.
- Existing hero/character definitions, enemy definitions, environment/sector definitions, combat, threat/wave director, Aether Well, environment builder, input handling, HUD, and persistence systems.
- Every asset directory and manifest. Verify actual files against references in loaders; do not assume a manifest path exists.
- Existing animation creation and sprite dimensions, physics world bounds, collision groups, resize behaviour, and camera settings.
- Current build output and TypeScript errors.

Produce a short architecture map and a gap list. Keep working code where possible. Do not blindly follow stale comments or plans if the code differs. The existing `PlayScene` may currently own too many responsibilities; refactor incrementally into systems rather than replacing the game in one risky change.

## 2. Campaign size and session structure

Plan for at least eight substantial sessions. Each session should have a distinct play objective, new mastery challenge, story/context beat, checkpoint or return point, and clear end-of-session stopping point. Use the following as the content target; tune after playtesting.

| Session | Campaign chapter | Target time | Core content and exit condition |
|---|---|---:|---|
| 1 | The Breachline | 2–3 h | Controls, movement, first combat, safe practice, first route choice, first checkpoint, basic enemy tells. End after the first breach is stabilized. |
| 2 | Broken Approach | 3–4 h | Ruined bridges, layered vertical traversal, moving platforms, wind/Aether currents, first secrets, two enemy combinations. |
| 3 | The Hanging Gardens | 3–4 h | Foreground vegetation and overgrowth, vertical routes, hidden chambers, traversal challenge, environmental puzzle, optional elite. |
| 4 | The Shattered Aqueduct | 3–4 h | Water/energy channels, timed hazards, rotating or moving machinery where supported, ranged enemies, mid-chapter boss. |
| 5 | The Citadel Undercroft | 3–4 h | Indoor lighting and occlusion, tight combat arenas, breakable barriers, lore collectibles, advanced enemy mix, checkpoint gauntlet. |
| 6 | Aether Foundry | 3–4 h | Moving machinery, lift platforms, energy routing puzzle, hazards with clear telegraphs, elite encounter, upgrade/ability mastery. |
| 7 | The Crown Approach | 3–4 h | Hardest traversal, combined enemy squads, optional challenge rooms, pre-boss preparation, narrative reveal and final checkpoint. |
| 8 | The Aether Well | 4–6 h | Multi-phase sector boss, arena transformation, final objective activation, aftermath, rewards, credits/sector-complete state, post-game exploration if intended. |

Times are planning estimates, not hard gates. Use exploration, secrets, puzzle solving, boss learning, and varied encounters to create depth. Do not pad with repeated enemy waves. Ensure a direct main-path route is shorter than full completion but still substantial; add optional challenge routes and collectibles for players seeking the full 25–35 hour experience.

### Content-count targets (minimum planning baseline)
These are starting targets to validate during design; increase or adjust if level flow requires it, but document changes:
- 8 named chapter/session beats as above.
- 12–16 distinct traversal/combat spaces, including connected sub-areas and at least 4 optional branches or challenge rooms.
- 6 or more enemy archetypes with meaningfully different AI, plus elite variants that alter patterns rather than only health.
- 3 major boss encounters or boss-level set pieces, with the final encounter at the Aether Well.
- 8 checkpoint/rest points, at least one per chapter, plus fair checkpoint placement before long or difficult sequences.
- 20+ secrets/collectible discoveries across lore, upgrade materials, caches, and challenge rewards.
- 10+ meaningful environmental hazard/traversal patterns; combine patterns thoughtfully rather than reusing the same spike pit.
- At least 3 ability or combat upgrades that alter player choices, not just a tiny numeric buff.
- A complete tutorial/onboarding, pause/settings, game-over/retry, save/resume, completion, and post-completion state.
All content must be represented in a trackable content manifest or issue checklist; do not count a placeholder as completed content.

## 3. World map, route, and level grammar

### World structure
Create a readable macro-map for Halcyon Spire showing the main route, optional branches, checkpoints, shortcuts, secrets, boss gates, and return links. The player must understand their current objective and where a newly unlocked route leads without requiring a wiki.

Organize spaces into authored level segments instead of one long corridor. Each segment should define:
- Stable segment ID, name, narrative purpose, entry/exit, dimensions and bounds.
- Main route and optional branch paths.
- Ground/platform geometry and collision material.
- Camera boundaries and camera composition notes.
- Encounter triggers, spawn locations, enemy caps, and recovery/exit conditions.
- Checkpoint and respawn transform.
- Hazards, moving platforms, switches, breakables, collectibles, doors, secrets, and objective links.
- Lighting/fog/audio zones and visual theme.
- Expected completion time, intended difficulty, required abilities, and playtest results.

Use a pacing rhythm: teach a mechanic safely, test it with one pressure source, combine it with known mechanics, then offer a mastery challenge or optional reward. Do not introduce several lethal mechanics at once without safe observation time. Use landmarks and silhouette to make routes readable.

### Traversal and accessibility
- Provide safe floors or recoverable routes after most jumps; use instant-death drops sparingly and signal them clearly.
- Make jump distances consistent with documented player acceleration, jump velocity, gravity, air control, and platform spacing.
- Ensure mandatory paths do not require optional upgrades.
- Optional secrets can demand advanced movement, but communicate their existence through framing, lighting, props, sound, or environmental clues.
- Use checkpoints to protect progress without removing tension.
- Provide an alternate route or recovery mechanic for any difficult mandatory traversal where reasonable.
- Keep interactive elements visually distinct from decoration; use more than colour alone to indicate interaction.

## 4. Character controller and behaviour

Implement movement as a coherent controller with explicit, testable states. Separate input intent, movement physics, animation selection, combat, and damage reactions.

### Required states
- Idle, start/run, brake/turn, walk if supported, jump start, rising, falling, landing, coyote-time window, jump-buffer window.
- Wall contact, wall slide, wall cling if included in the final moveset, wall jump.
- Dash start, dash sustain, dash recovery, dash cancel/interruption rules.
- Attack wind-up, active frames, recovery, combo continuation, hit-confirm, whiff, interruption.
- Hurt/stagger, knockback, invulnerability, death, respawn, checkpoint restoration, victory/interaction.
- Ability/special activation and recovery, including resource/cooldown rules if used.

States must have explicit entry/exit behavior and interruption priority. Death and scene shutdown cancel active attacks, timers, dashes, and input buffers. Respawn resets transient state and restores the checkpoint consistently.

### Movement engineering
- Use a single centralized tuning configuration for acceleration, max horizontal speed, ground/air acceleration, friction, gravity, jump impulse, variable jump height, coyote time, input buffering, dash distance/duration/cooldown, wall-slide speed, and knockback.
- Choose units in pixels and seconds and document them. Prefer velocity/acceleration values that are frame-rate independent.
- Use grounded checks based on the physics body and stable contact rules, not animation frame alone.
- Implement jump buffering and coyote time as small measured windows; expose tunable values and test their boundaries.
- Avoid changing body size/origin mid-jump unless collision is updated safely.
- Set world bounds intentionally. Handle falling out of the world as a controlled fail/recovery path.
- Prevent infinite wall jumps, dash resets, attack loops, or repeated bounce triggers unless explicitly designed.
- Use deterministic reset paths for control lock, hit stun, death, pause, and scene transitions.
- Ensure facing direction and attack direction remain correct during turns, knockback, and aerial combat.

### Animation and hitboxes
Create or verify separate animation clips for all states above where visually appropriate. Every animation definition must specify key, frame sequence, frame rate, repeat policy, origin, expected duration, and gameplay event timing.
- The feet baseline should remain stable through idle/run/jump/land animations.
- Keep collision body independent from changing visual frame dimensions.
- Attack hitboxes should exist only during active frames, follow the character's facing direction, and be destroyed/disabled reliably.
- Hurtboxes should not extend far beyond visible body art without deliberate reason.
- Use animation events or state timing for hit activation, but keep damage authoritative in combat logic.
- Add clear anticipatory frames and recovery windows so enemies and players can read combat.
- Test repeated attack input, attacks during landing, attack interruption by damage, and scene restarts.

## 5. Combat, upgrades, and damage rules

Define a central combat contract:
- Health, damage, stagger/poise if used, knockback, invulnerability duration, hit stop, resource use, cooldowns, and status effects are data-driven.
- Resolve each hit once with a stable attack/hit identifier. Prevent one attack from damaging the same target every frame unless explicitly a damage-over-time volume.
- Define faction/team filtering, friendly fire policy, armor/resistance, and damage source.
- Provide visible and audible hit confirmation, damage feedback, and enemy state changes.
- Make invulnerability feedback visible without hiding the player.
- Use consistent rules for enemies, bosses, player, destructible props, and hazards.
- Do not use camera shake as the only impact cue; provide animation, sound, particles, and/or UI feedback.
- Ensure combat remains playable with reduced screen shake and muted audio.
- Upgrades must have a clear description, cost/requirement, UI presentation, persistence rule, and measurable effect. Avoid upgrades that make mandatory traversal impossible to balance.
- Death/retry must not duplicate rewards or allow boss phases to become stuck.

## 6. Enemy AI and encounter design

Build enemies as explicit state machines or similarly inspectable behavior modules. Required common states: spawn/intro, idle/patrol, detect, approach, telegraph, attack, recovery, hurt/stagger, knockback, investigate, return/leash, death, despawn/cleanup.

Every enemy definition must state:
- Health, movement speeds, detection and leash ranges, attack range, cooldown, damage, hitbox, hurtbox, knockback response, collision category, animation keys, sound/effect keys, drops, and AI parameters.
- What the player sees/hears before each dangerous attack.
- How the attack can be avoided or interrupted, and how much recovery follows it.
- How it behaves near ledges, platforms, moving lifts, walls, hazards, and off-camera spawn boundaries.
- How it is cleaned up when a room unloads or the player dies.

### Minimum enemy roster
Design at least six distinct archetypes. Suggested roles (adapt to existing art/lore):
1. **Graveling** — basic ground melee; teaches approach and attack recovery.
2. **Rift Skirmisher** — fast flanker with a readable dash/lunge and clear cooldown.
3. **Aether Sentry** — ranged projectile pressure with visible aim/charge and safe counterplay.
4. **Gloom Warden** — defensive elite that rewards positioning, jump attacks, or interruption.
5. **Rift Mender** — support enemy that changes target priority and must not heal indefinitely.
6. **Skybreaker** — aerial or elevated threat that teaches vertical awareness.
Use named elites to introduce altered combinations, movement, or attack sequences, not merely larger health totals. All enemies need correct collision, ledge behavior, telegraphs, death cleanup, drops, and tests.

### Encounter rules
- Use authored encounter definitions rather than scattered hard-coded spawn coordinates.
- Each encounter has a trigger, spawn list, caps, pacing, objective condition, completion event, fail/retry handling, and exit unlock.
- Never spawn enemies directly on the player or inside solid geometry.
- Off-camera spawns must be communicated through a door/gate, sound cue, landing animation, or visible entrance.
- Prevent infinite enemy spawning and orphaned enemies after death/reload.
- Add anti-softlock recovery if an enemy falls off-world or becomes unreachable.
- Use combat arenas with enough space for attack patterns and escape options.
- Introduce one new challenge at a time, then combine known challenges deliberately.

## 7. Boss encounters

Deliver at least three major boss-level encounters, with the sector finale centered on the Aether Well. Each boss needs a distinct silhouette, introduction, arena, phase state machine, telegraphs, vulnerable windows, transition animation, defeat sequence, reward, checkpoint recovery, and narrative consequence.

For each phase document:
- Entry condition and exit condition.
- Movement and arena bounds.
- Attack sequence and telegraph duration.
- Hitbox and damage window.
- Counterplay, safe area, and recovery duration.
- Enrage or fallback behavior if the fight stalls.
- Reset behavior after player death and scene reload.

The final boss must have at least three mechanically distinct phases. Arena changes must be communicated and collision must update atomically so the player is not trapped inside new geometry. Boss health/UI must not obscure hazards. Avoid unavoidable damage, invisible hitboxes, and long unskippable repeated intros. Add a retry option and a checkpoint close enough to keep retries fair.

## 8. Physics, collisions, and hazards

### Physics policy
- Use Phaser Arcade Physics for the primary platforming model unless repository evidence demonstrates a different engine. Document Arcade Physics limitations and avoid implying it provides rigid-body simulation.
- Define gravity, body dimensions, world bounds, collision categories, collider/overlap pairs, fixed/static geometry, moving platforms, and reset behavior in one documented system.
- Keep sprite origin, body offset, feet baseline, and display scale aligned.
- Collision must be authored explicitly; art pixels and SVG paths do not define physical collision.
- Static geometry should use static bodies; moving objects need appropriate moving bodies and carry/relative-velocity behavior.
- Do not create redundant colliders or per-frame allocations in hot update loops.
- Ensure moving platforms can carry the player predictably; test landing, standing, jumping off, platform reversal, and player death during motion.
- Hazards must have a clearly visible danger volume and a hitbox that matches the telegraph. Repeated overlap must not apply damage every frame unless intentional.
- Use swept/overlap checks or conservative hitboxes for fast projectiles and dash interactions to reduce tunnelling.
- Keep bounce pads, wind currents, launchers, elevators, breakables, and switches as explicit interactable types with cooldowns and reset semantics.
- Separate collision surface from decoration: leaves, grass, cloth, crystals, particles, and background architecture should not block the player unless designated.
- Define safe spawn points and test that respawns cannot overlap enemies, hazards, or moving platforms.

### Required traversal patterns
Implement and test a varied set: static platforms and gaps, moving platforms, collapsing/breakable platforms, climbable or wall-jump surfaces if in moveset, spike/crystal hazards, falling debris with warning, timed gates, wind/Aether currents, bounce/launch pads, vertical lifts, one-way platforms where supported, hidden passages, and safe drop-down routes. Do not place all patterns in one room. Clearly signal any timed or lethal mechanic.

## 9. Camera direction and cinematic language

The camera is a gameplay system, not just a default follow call. Centralize camera tuning by context.

### Follow behaviour
- Use a bounded camera that respects level limits and avoids exposing areas outside authored backgrounds.
- Use configurable horizontal look-ahead based on facing and velocity, a vertical dead zone, smoothing, and a lead that reduces during precision platforming.
- Avoid camera lag so severe that a landing or hazard is off-screen; avoid snapping that causes motion sickness.
- Keep player visibility and landing surfaces readable. Camera motion must not conceal attack telegraphs or make the player appear to slide relative to terrain.
- Adjust zoom only at intentional, tested moments. Avoid constant zoom pulses.
- Resize/scale handling must preserve world bounds, HUD placement, and physics coordinates.
- HUD and critical prompts use fixed scroll factors and safe margins across aspect ratios.

### Camera beats
Author camera behaviours for: initial sector reveal, entering a new biome/room, discovering a landmark, boss arena entry, boss phase transition, death/respawn, checkpoint activation, Aether Well activation, and ending. Each beat specifies trigger, duration, easing, camera bounds/target, player control policy, skip behavior, and fallback if interrupted.
- Use short, skippable framing moves; never take control for long without a clear reason.
- Lock camera bounds only for a designed sequence and always release them on completion, death, pause, or scene shutdown.
- Use camera shake sparingly, with intensity scaled by event and a reduced-shake setting.
- Use camera flash sparingly and never as the only hazard warning.
- Never let a camera pan or zoom move collision geometry or alter the player's physics.
- Test with both smallest and largest supported viewports.

## 10. Environment art, backgrounds, foreground, and props

### Visual direction
Halcyon Spire is a floating citadel above an Aether sea. Use a coherent palette, material language, and lighting direction across all rooms. Distinguish regions through silhouette, architecture, vegetation, weather, particles, and audio—not only hue. Establish a visual hierarchy: gameplay-critical surfaces first, interactables second, background landmarks third, decoration last.

### Required layered environment stack
Implement distinct layers with documented depth and scroll factors. Exact values should be tuned after visual testing, not blindly copied.
1. Sky gradient/clouds/star or atmospheric layer.
2. Very distant Aether sea and floating island silhouettes.
3. Distant citadel towers, bridges, and large landmark silhouettes.
4. Mid-distance ruins, aqueducts, towers, broken bridges, and suspended structures.
5. Near background architecture, windows, hanging cables, and distant machinery.
6. Main terrain: platform tops, cliff faces, stone sides, edges, undersides, bridge tiles, and transition caps.
7. Gameplay props: arches, statues, banners, lanterns, crates, machinery, crystals, gates, lifts, Aether conduits, switches, shrines, and breakables.
8. Foreground frame elements: vines, leaves, branches, hanging roots, grass, flowers, crystal tips, rubble silhouettes, and broken masonry.
9. Particles/atmosphere: dust, mist, falling leaves, drifting motes, sparks, wind streaks, and localized energy effects.
10. Character/enemy/effects layer with controlled depth sorting.
11. HUD, dialogue, prompts, map, and menus in screen space.

Every layer must have an intentional depth and parallax factor. Far backgrounds move least; foreground framing moves most. Keep gameplay lanes clear. Do not use heavy foreground foliage across the player's feet, hazards, enemy telegraphs, or landing zones. Provide reduced particles and parallax options if performance/accessibility requires it.

### Foreground plants and natural detail
Even in a floating stone citadel, vegetation should tell a story of microclimates and reclaimed ruins. Create modular, reusable clusters:
- Small ground tufts and edge grass.
- Broad-leaf plants and ferns in sheltered cracks.
- Hanging vines and roots from cliffs/bridges.
- Small flowering plants near safe routes and checkpoints.
- Moss patches on damp stone and aqueduct edges.
- Sparse wind-bent grasses in exposed areas.
- Large framing branches/leaves for selected foreground silhouettes.
- Aether-touched plants with restrained emissive accents near energy sources.
- Dead or scorched plant variants around Rift corruption.

Specify scale variants, flip/rotation rules, density limits, biome placement, wind animation amplitude/speed, collision category (decorative by default), depth range, and LOD/reduced-motion behavior. Avoid identical repeated clusters; use weighted variants, controlled rotation, scale ranges, and authored placement. Plants must not obscure path edges or hide interactables.

### Prop inventory
Build a reusable prop library with documented dimensions, anchor/origin, visual state, interaction class, physics body, animation, audio, and placement rules:
- Architecture: archways, pillars, broken columns, stairs, railings, bridge sections, parapets, wall fragments, door frames, windows, statues, masonry piles.
- Citadel life: banners, ropes, lanterns, sign-like symbols without embedded text, benches, containers, abandoned tools, carts, storage crates.
- Aether technology: crystals, conduits, sockets, pumps, generators, switches, energy bridges, lift mechanisms, containment rings, sealed gates.
- Nature: grasses, flowers, ferns, moss, hanging vines, roots, shrubs, wind-bent plants, Aether-touched plants.
- Gameplay: checkpoints, collectible caches, breakable objects, pressure plates, switches, doors, elevators, bounce pads, hazard emitters, safe zones, quest markers.
- Atmosphere: fog banks, drifting motes, dust, falling debris, small birds/creatures if appropriate, sparks, leaves, light shafts.
- Story: abandoned equipment, battle damage, evacuation traces, destroyed defenses, memorials, environmental clues, readable non-text symbols.

For each prop define whether it is purely decorative, interactive, destructible, collectible, hazard, or collision-bearing. Decorative props must not unexpectedly collide. Interactive props need clear visual state changes, interaction feedback, and reset/persistence rules. Use a placement manifest or level data; avoid hundreds of unexplained hard-coded placements in a scene.

### Terrain art rules
Use modular tiles with consistent seams and scale. Provide platform top, middle, left/right edges, underside, cliff face, damaged variants, and transition pieces. Inspect all joins at actual zoom. Collision geometry must align with the visible top surface. No floating decorative edges that imply a false platform, and no invisible wall unless the art or level design clearly communicates it.

## 11. Art asset production specification

Every asset set needs a manifest record with:
- Stable ID and descriptive filename.
- Asset category and source path.
- Source format and target format.
- Pixel dimensions/viewBox, intended in-game display size, transparent/opaque status.
- Animation frames and order where relevant.
- Origin/anchor and intended depth.
- Intended scroll factor.
- Collision/interaction category and body dimensions/offset where relevant.
- Loader key and references to consumers.
- License/provenance for third-party resources.
- Status: planned, created, integrated, visually verified, release verified.

### Character sprite sheets
- One consistent character scale and feet baseline across states.
- Separate clips/sheets for idle, run, jump/fall/land, dash, wall interactions if supported, attacks, hit reactions, death, respawn, special, and victory.
- Attack animation timing must match active hitbox frames.
- Transparent padding should be consistent; avoid clipped weapons, hair, effects, or feet.
- Test SVG/raster texture loading and actual browser rendering.
- No embedded captions, labels, watermarks, or UI in sprite art.

### Environment and effects
- Produce assets in coherent packs with variants, not a single monolithic image that cannot be reused.
- Large backgrounds can be layered; props and foreground elements should be independent transparent assets.
- Effects should be short, readable, and pooled/reused where appropriate.
- Avoid excessive bloom or emissive colours that make platform edges hard to read.
- Use a consistent light direction and shadow language.

### QA gate
An asset is not integrated because it exists or loads. Verify it in the target scene, at target zoom, against nearby terrain and characters. Check alpha fringes, SVG rendering, animation timing, depth, scale, collisions, missing files, and memory/performance impact.

## 12. Objectives, narrative, collectibles, and progression

Create a data-driven objective graph. Each objective must have:
- Stable ID, title, short description, prerequisites, activation trigger, completion condition, failure/retry policy, reward, persistence, HUD state, and event/logging hooks.
- Main/optional classification and the reason it exists.
- A safe way to recover if a trigger fails or the player leaves the area.
- Explicitly idempotent completion and reward handling.

### Main objective arc
1. Survive the initial breach and learn movement/combat.
2. Restore route access through the broken approach.
3. Investigate the Hanging Gardens and recover an Aether key/component.
4. Stabilize the Shattered Aqueduct.
5. Enter the Citadel Undercroft and learn the source of the siege.
6. Reactivate the Aether Foundry.
7. Open the Crown Approach and prepare for the final breach.
8. Defeat the final threat and stabilize the Aether Well.
9. Show a clear ending, rewards, credits/completion state, and a route back to post-game exploration if designed.

The names and story details should be reconciled with existing lore rather than introduced as contradictory canon. Use short, purposeful dialogue and environmental storytelling. Provide readable captions for dialogue and important audio cues. Avoid blocking player control for long cutscenes; allow skip where practical.

### Collectibles and secrets
Use multiple purposeful categories: lore fragments, upgrade materials, caches, traversal challenges, hidden rooms, and elite/boss rewards. Each collectible has a unique ID, persistence key, reward, feedback, and map/discovery behavior. Never respawn a claimed one after reload. Optional rewards should encourage exploration but never be required for the main route unless clearly signposted and guaranteed to be obtainable.

## 13. Checkpoints, saving, and recovery

Checkpoint behavior must be specified and tested:
- Activation trigger, animation/audio/UI feedback, spawn position, facing, safe radius, and persistent progression snapshot.
- What persists: chapter, objective flags, collectibles, upgrades, boss state policy, opened shortcuts, and settings.
- What resets: transient enemies, projectiles, attack states, temporary hazards, local timers, and unclaimed temporary drops.
- On death, clear transient combat state, safely place the player, grant a brief fair protection window, restore the camera, and re-evaluate encounter/objective state.
- Never respawn the player inside a collider, hazard, enemy, or moving platform.
- Save writes must be versioned and validated. Handle missing, corrupt, or older save data with a safe fallback.
- Saving must not duplicate rewards or mark incomplete objectives complete.
- Pause and tab/window focus loss must not leave the player vulnerable while the simulation is unintentionally paused.
- Add a reset-save flow with clear confirmation.

If cloud save is not already supported, do not imply it exists. Use the current project's appropriate local persistence approach and document limitations.

## 14. UI, UX, audio, and accessibility

Required screens/states: title/menu, character select if retained, onboarding, HUD, objective update, interaction prompt, pause menu, settings, audio controls, controls reference, death/retry, checkpoint notification, boss health/phase, collectible feedback, completion screen, credits, and post-completion state.

HUD requirements:
- Health/lives/resources and current objective are legible and do not obscure action.
- Boss health is visible but does not overlap telegraphs or hazards.
- Prompts are contextual, dismiss when irrelevant, and support keyboard navigation.
- Avoid requiring colour perception alone to distinguish states.
- UI remains within safe margins at supported aspect ratios.

Audio requirements:
- Separate music, effects, and ambience volume controls.
- Distinct player/enemy/hazard telegraphs and hit confirmation.
- Area-specific ambience and musical escalation for major encounters.
- Avoid repetitive, excessively loud sounds and overlapping audio leaks after scene transitions.
- Add captions/visual cues for essential audio information.

Accessibility and comfort:
- Remappable or at minimum clearly documented controls.
- Pause, volume controls, reduced camera shake, and reduced flashing.
- Adjustable text size where practical; readable contrast and clear focus states.
- Optional control assistance or forgiving timing for demanding sequences where feasible.
- Test keyboard-only play and ensure focus/navigation is not trapped.

## 15. Performance, memory, and platform support

- Establish target platforms and minimum viewport/device assumptions before content optimization.
- Use object pooling for frequent projectiles/particles if profiling shows it is beneficial.
- Avoid creating/destroying large numbers of objects every frame.
- Cull or deactivate distant encounters and effects safely.
- Use texture atlases or suitable texture organization when it measurably improves load/performance; do not combine everything into an unmaintainable atlas.
- Dispose of listeners, timers, tweens, sounds, and objects on scene shutdown.
- Avoid repeated event subscriptions on scene restart.
- Check memory across multiple room transitions and repeated deaths.
- Test keyboard input, resize, browser refresh, pause/resume, and save restoration.
- Record real measurements where available; do not claim a frame rate that was not measured.

## 16. Automated and manual testing

### Automated coverage
Add tests or testable pure modules for:
- Objective prerequisites, completion idempotency, and persistence.
- Enemy state transitions and attack cooldowns.
- Damage resolution exactly once per attack/target.
- Checkpoint snapshot and respawn reset.
- Collectible persistence and duplicate-reward prevention.
- Boss phase transitions and defeat conditions.
- Camera/level-bound calculations where pure logic is involved.
- Asset manifest references and duplicate IDs.
- Save schema validation and migration fallback.

### Manual QA matrix
Test:
- Clean install/start, menu, character selection, first spawn, pause/resume, settings, save/reload.
- Run/jump/land, coyote time, buffered jump, dash, wall movement if supported, attack combos, interruption, knockback, death, respawn.
- Every hazard and moving platform; every checkpoint; all mandatory traversal gates.
- Each enemy type in flat ground, near ledges, on platforms, and after player death.
- Every boss phase, defeat/retry, arena reset, and final objective.
- Collectible pickup before and after save/reload.
- Camera boundaries, boss framing, death/respawn camera restoration, small and wide viewport.
- Reduced shake/flashing, muted audio, keyboard-only navigation.
- Full main-route playthrough and a separate optional-content pass.

### Build discipline
- Run `npm run build` after each major vertical slice.
- Run all tests and available lint/type checks; add scripts only when useful and documented.
- Keep a QA log with build commit/ref, browser/device, route tested, result, defects, and follow-up.
- A green build is necessary but not sufficient for completion.

## 17. Phased delivery plan and acceptance gates

Do not start the next major phase until the current phase has a working acceptance demonstration. Work can proceed in parallel only where interfaces are agreed and integration remains controlled.

### Phase 0 — Reconnaissance and design lock
Deliverables: architecture map, asset inventory, gameplay gap list, current build baseline, level macro-map, camera/physics convention, proposed data schemas.
Gate: no implementation assumptions left undocumented; baseline build result recorded.

### Phase 1 — Engineering foundation
Deliverables: scene lifecycle/cleanup, centralized tuning, input abstraction, player state model, physics policy, objective/event contracts, save schema, logging/debug overlays.
Gate: repeated scene entry/exit and death/retry do not duplicate listeners, enemies, rewards, or timers.

### Phase 2 — Player feel and combat vertical slice
Deliverables: complete locomotion states, core attacks, hurt/death/respawn, reliable hitboxes, first enemy, HUD feedback, reduced-shake option.
Gate: scripted movement/combat tests and a playable greybox room pass.

### Phase 3 — Asset pipeline and environment kit
Deliverables: validated manifest, modular terrain, parallax layers, prop library, foreground plants, character/enemy animations, effects, audio hooks.
Gate: sample room renders correctly; collision surfaces align; no missing references; performance baseline recorded.

### Phase 4 — Main-route level production
Deliverables: all eight chapter spaces and connections, objective graph, checkpoints, traversal patterns, encounter triggers, secrets and return paths.
Gate: greybox route is fully completable without cheats; every exit and fail/retry path works.

### Phase 5 — Enemy roster and encounters
Deliverables: minimum six archetypes, elite variations, authored encounter data, spawn/cleanup rules, combat arenas, rewards.
Gate: every encounter can be entered, cleared, reset, and exited without softlock.

### Phase 6 — Bosses and finale
Deliverables: three major boss-level encounters, final multi-phase boss, arena transitions, retry flow, Aether Well activation, ending.
Gate: all phases and player-death recovery work; completion triggers once and persists.

### Phase 7 — Story, secrets, upgrades, and polish
Deliverables: dialogue/environmental story beats, collectibles, optional rooms, meaningful upgrades, VFX/audio, camera beats, navigation feedback.
Gate: all optional rewards persist; no required route depends on optional content; polish supports readability.

### Phase 8 — UX, accessibility, performance, and compatibility
Deliverables: settings, keyboard navigation, safe UI layouts, reduced shake/flashes, audio mix, performance and memory checks, viewport testing.
Gate: documented target devices/browsers pass; no known critical performance or usability blockers.

### Phase 9 — Full regression and release candidate
Deliverables: full campaign QA log, automated test report, known-issues list, asset verification report, release notes, build artifact.
Gate: clean install to ending succeeds; all critical/high-severity defects resolved; build and tests pass; no missing required assets; sector completion can be independently verified.

## 18. Release checklist

Before declaring Sector I ready, confirm every item:
- [ ] Campaign start, chapter transitions, and ending work from a clean save.
- [ ] Main route and optional branches have real authored content.
- [ ] At least eight substantial session beats exist; no real-world waiting gates or filler grind.
- [ ] Player controller states, combat windows, hitboxes, damage, death, and respawn are tested.
- [ ] Every enemy has complete AI, telegraphs, recovery, collision, drops, and cleanup.
- [ ] Every boss has tested phase transitions and fair counterplay.
- [ ] Every hazard and moving platform has aligned visuals/physics and reset behavior.
- [ ] Camera follows, bounds, transitions, boss framing, and respawn behavior are verified.
- [ ] Background, midground, terrain, props, foreground plants, and atmosphere are integrated and depth-tested.
- [ ] No decorative asset creates accidental collision or hides gameplay-critical information.
- [ ] Objective, collectible, upgrade, checkpoint, and save states persist correctly.
- [ ] Pause, settings, audio controls, accessibility options, and UI navigation work.
- [ ] No missing texture/audio references, fatal runtime errors, progression blockers, or duplicated listeners.
- [ ] Build and automated tests pass; full campaign playthrough is documented.
- [ ] Asset provenance/licensing and verification status are recorded.
- [ ] Final report lists what is complete, what was tested, known issues, and evidence.

## 19. Required agent report after each task

Return:
1. **Scope:** requested feature and relevant phase.
2. **Repository findings:** existing systems reused and assumptions verified.
3. **Changes:** files and gameplay behavior added/changed.
4. **Assets:** new/reused assets, manifest/loader integration, verification status and provenance.
5. **Validation:** exact commands executed and pass/fail output summary; manual scenarios tested.
6. **Remaining risks:** defects, missing content, unsupported platforms, and unverified behavior.
7. **Next step:** the smallest dependency-respecting task that advances the campaign.

Never state “complete”, “production-ready”, “tested”, or “verified” solely because code was written. State the evidence.
