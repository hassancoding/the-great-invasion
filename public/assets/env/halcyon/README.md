# Halcyon Spire environment assets

This directory contains individually authored SVG environment assets for the first integration pass. Artwork contains no labels or words. SVG is used for scalable source artwork and transparent cutouts; the sky and parallax layers are designed for the current Phaser 3 + Vite project.

## Files

- `sky.svg`, `far-islands.svg`, `distant-citadel.svg`, `midground-ruins.svg`, `foreground-crystals.svg`: independent scene layers.
- `platform-top.svg`, `platform-middle.svg`, `platform-edge-left.svg`, `platform-edge-right.svg`, `cliff-face.svg`: modular visual terrain pieces.
- `crystal-cluster.svg`, `ancient-arch.svg`, `aether-well.svg`: standalone props/objective artwork.
- `manifest.json`: dimensions, intended parallax values, depth order, and collision guidance.

## Integration requirements

1. Keep physics/collision data separate from these visual assets.
2. Register asset paths in the scene preload/boot flow before referencing texture keys.
3. Confirm SVG loading and pixel density in Chromium, Firefox, and mobile browsers; rasterize to PNG/WebP only if a target browser or performance profile requires it.
4. Preserve the independent layer depth and scroll factors listed in the manifest.
5. The Aether Well artwork is a visual; its state and interaction remain controlled by the existing `AetherWell` system.

## Status

Initial Halcyon Spire vector asset pass. This is not the complete five-region pack. Gameplay integration, visual QA, and device performance validation remain outstanding.
