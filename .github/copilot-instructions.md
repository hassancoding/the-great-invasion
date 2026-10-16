# The Great Invasion: Riftlands — Project Instructions

## Project Overview

- Game: The Great Invasion: Riftlands.
- Engine: Phaser 3.
- Language: TypeScript.
- Build tooling: Vite.
- Primary objective: Build an immersive, polished 2D action-platformer with challenging combat, distinct enemies, responsive controls, and cohesive environmental art.

## 1. Development Scope

- Work exclusively on Sector I: Halcyon Spire.
- Do not implement, unlock, or advance to other sectors without explicit authorization.
- Preserve the existing sector identity, gameplay architecture, and established asset conventions.
- Prioritize playable, integrated features over placeholder implementations.
- Maintain a lively environment with varied encounters, environmental hazards, meaningful combat, and a coherent progression.

## 2. Gameplay Architecture

- Inspect existing scene classes, data definitions, and entity implementations before modifying gameplay.
- Keep scene responsibilities clear: boot/loading, menu, character selection, and active gameplay.
- Keep sector definitions, enemy configurations, wave progression, and encounter data in their appropriate data modules.
- Separate rendering and animation from movement, collision, and damage logic.
- Use Phaser physics bodies for gameplay collision; never treat decorative artwork as a substitute for collision geometry.
- Keep player movement, jumping, attacks, damage reactions, death, respawning, dashing, and wall interactions consistent across animations and physics.
- Ensure enemy health, damage, attack ranges, movement, and difficulty are configurable.
- Make wave progression deterministic and ensure the objective cannot complete before all required encounters are cleared.
- Preserve keyboard controls and existing menu navigation unless a change is explicitly requested.

## 3. Asset Pipeline

- Inspect the existing asset directories, loading code, manifests, and naming conventions before creating assets.
- Reuse suitable existing assets before introducing replacements.
- Generate original assets that fit the established art direction and the world of Halcyon Spire.
- Keep character animations, enemy sprites, environmental backgrounds, props, effects, and interface assets organized by category.
- Prefer independently usable transparent sprite assets and scalable vector artwork where appropriate.
- Do not place labels, watermarks, captions, or unrelated text inside game artwork.
- Use consistent sprite dimensions, animation frame order, origin points, and transparent padding.
- Keep visual artwork separate from collision bodies, hitboxes, hurtboxes, and gameplay configuration.
- Update the asset manifest and loading code whenever new assets are introduced.
- Verify asset paths, file formats, dimensions, transparency, and animation consistency.
- Do not mark assets as verified until they have been loaded and visually inspected in the game.

## 4. Enemy and Combat Design

- Give each enemy archetype a distinct silhouette, movement pattern, attack style, and threat level.
- Introduce difficulty through enemy behavior, combinations, arena design, and encounter pacing—not simply inflated health.
- Implement readable attack telegraphs, hit reactions, attack interruptions, knockback where appropriate, and clear defeat states.
- Ensure combat animations match actual gameplay events.
- Test combat against enemies of different sizes and movement patterns.
- Make elite enemies and bosses mechanically distinct from ordinary enemies.

## 5. Asset Integration Workflow

For every new asset or asset set:

1. Inspect the repository and identify the correct integration location.
2. Check for existing assets that can be reused.
3. Create assets using the established conventions.
4. Update manifests, preloaders, and animation definitions as required.
5. Integrate the assets into the appropriate scene or entity.
6. Verify rendering, layering, scaling, animation, and physics alignment.
7. Run the available build and tests.
8. Record remaining issues and identify any unverified work.

Never stop at generating files when the task requires functional in-game integration.

## 6. Code Quality and Compatibility

- Follow the repository's existing coding style and module structure.
- Prefer small, focused, maintainable changes.
- Avoid unnecessary dependencies and unrelated refactoring.
- Preserve existing functionality when modifying scenes or shared systems.
- Handle missing assets and invalid configuration safely.
- Use descriptive names and meaningful error messages.
- Do not claim a build or test passed unless it was actually executed successfully.

## 7. Verification

Before completing a task:

- Run the available build and test commands.
- Check TypeScript errors and broken asset references.
- Verify relevant scene transitions and gameplay interactions.
- Confirm that new sprites animate correctly and align with their physics bodies.
- Test combat and encounter completion conditions where applicable.
- Report what changed, what was tested, and what remains incomplete.

## 8. Working Rules

- Inspect before modifying.
- Reuse before replacing.
- Integrate before declaring completion.
- Test before reporting success.
- Keep changes focused on the requested task.
- Never expand beyond Sector I without explicit authorization.
