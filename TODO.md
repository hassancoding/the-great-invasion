# Game Completion TODO

## Scope

This checklist covers Sector I: Halcyon Spire only, in keeping with the current project instructions. Other sectors remain locked and are not part of this completion pass.

## Integrated Baseline

- [x] Menu, champion selection, and Halcyon gameplay entry.
- [x] Arin movement, jumping, multi-attack combat, damage feedback, and lives.
- [x] Eleven-wave siege plan, including Gravelings, Rift Hounds, and Orun.
- [x] Ordered Arin objectives, final-breach gate, and Aether Well claim.
- [x] Halcyon parallax, modular platform visuals, environmental props, spikes, and bounce pad.
- [x] Retry, return-to-menu, and run-completion screens.

## P0: Complete the Playable Sector

- [ ] Give Kaela and Varkhul complete, distinct combat kits. Replace the generic attack fallback with authored animations, hit windows, recovery, and readable feedback.
- [ ] Give each regular enemy archetype a distinct combat behavior and telegraph. Most currently chase the player; Rift Hounds are the exception.
- [ ] Build Orun into a mechanically distinct boss with phase changes, readable attacks, recovery windows, and a clear defeat sequence.
- [ ] Balance the full eleven-wave run. Tune spawn timing, counts, health, speed, damage, and recovery windows so the opening is readable and the finale is challenging but completable.
- [ ] Play through the complete objective chain: first contact, vanguard, Orun, final breach, then Well stabilization. Confirm the Well cannot complete early and victory only triggers after all requirements are met.
- [ ] Verify defeat, retry, menu return, and victory flows over repeated runs. Ensure cleanup, timers, input listeners, and enemies do not leak or throw errors between runs.
- [ ] Add a pause/resume flow. Escape currently returns directly to the menu, so players cannot pause without abandoning their run.
- [ ] Decide whether mobile play is supported. If it is, add touch movement, jump, and attack controls and verify the HUD fits small screens; otherwise document keyboard-only support.

## P1: Polish and Production Readiness

- [ ] Visually QA all Halcyon terrain, enemy, and prop assets at gameplay scale and on target browser/device sizes. Confirm art alignment with independent physics bodies and hazard hitboxes.
- [ ] Update the Halcyon asset inventory after QA. Mark alpha and in-game status only for assets actually verified; resolve the upstream license status before distribution.
- [ ] Add sound effects and music for movement, attacks, hits, waves, boss cues, the Well, and victory/defeat, with volume controls.
- [ ] Add accessibility options for reduced motion, readable combat telegraphs, and remappable or clearly documented controls.
- [ ] Add automated checks for objective progression, wave dispatch/clear conditions, enemy damage, Well gating, and retry cleanup. Add a test command to the project scripts.
- [ ] Profile load time, memory, and frame rate through the full sector. Reduce the production bundle size and address the current Vite chunk-size warning if profiling shows it affects players.
- [ ] Run end-to-end browser QA at desktop and mobile viewport sizes, including menu navigation, combat, pause, failure, retry, and sector completion.

## Completion Gate

- [ ] A player can select any supported champion, finish Halcyon from first contact through Well stabilization, and receive a stable completion state.
- [ ] No missing assets, uncaught runtime errors, broken retries, or objective-order bypasses occur in the supported browsers and input modes.
- [ ] Build, automated tests, and the documented browser QA pass before Sector I is marked complete.