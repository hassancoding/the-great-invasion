/**
 * Curated Halcyon Spire asset registry.
 * Roles map to the target look: floating citadel, ivy cliffs, blue crystals, aether sea.
 *
 * MISSING (not in repo — called out for art):
 * - Continuous river/water surface tile or strip
 * - Animated waterfall sheet
 * - Seamless cliff wall tiles matching the target painting
 * - Gap-spanning stone bridge prop
 * - Full-bleed painterly background matching the reference plate exactly
 */

export type HalcyonRole =
  | 'sky'
  | 'far_citadel'
  | 'far_island'
  | 'mid_island'
  | 'near_island'
  | 'platform_deco'
  | 'tree'
  | 'arch'
  | 'plant'
  | 'crystal'
  | 'prop';

export interface HalcyonAssetRef {
  key: string;
  path: string;
  role: HalcyonRole;
}

/** BootScene loads these keys; envBuilder only places what exists. */
export const HALCYON_COMPOSITION: HalcyonAssetRef[] = [
  // Sky / panorama
  { key: 'sky_citadel', path: 'assets/env/sky_citadel.jpg', role: 'sky' },
  { key: 'halcyon_fortress_skyline', path: 'assets/env/halcyon/backgrounds/fortress/skyline.png', role: 'far_citadel' },
  { key: 'halcyon_fortress_skyline_layer', path: 'assets/env/halcyon/backgrounds/fortress/skyline-layer.png', role: 'far_citadel' },
  { key: 'halcyon_fortress_cloud', path: 'assets/env/halcyon/backgrounds/fortress/cloud-bank.png', role: 'far_island' },
  { key: 'halcyon_fortress_bridge', path: 'assets/env/halcyon/backgrounds/fortress/island-bridge.png', role: 'mid_island' },

  // Floating islands (celestial pack)
  { key: 'halcyon_island_a', path: 'assets/env/cel_00.png', role: 'far_island' },
  { key: 'halcyon_island_b', path: 'assets/env/cel_01.png', role: 'mid_island' },
  { key: 'halcyon_island_c', path: 'assets/env/flt_01.png', role: 'far_island' },
  { key: 'halcyon_island_d', path: 'assets/env/flt_02.png', role: 'mid_island' },
  { key: 'halcyon_island_e', path: 'assets/env/flt_04.png', role: 'near_island' },
  { key: 'halcyon_island_f', path: 'assets/env/cel_06.png', role: 'mid_island' },

  // Platform tops (gameplay decoration)
  { key: 'png_platform_a', path: 'assets/env/platforms/plat_03.png', role: 'platform_deco' },
  { key: 'png_platform_b', path: 'assets/env/platforms/plat_05.png', role: 'platform_deco' },
  { key: 'png_platform_c', path: 'assets/env/platforms/plat_07.png', role: 'platform_deco' },
  { key: 'png_platform_d', path: 'assets/env/platforms/plat_13.png', role: 'platform_deco' },

  // Trees for cliff framing
  { key: 'png_tree_a', path: 'assets/env/trees/foliage_00.png', role: 'tree' },
  { key: 'png_tree_b', path: 'assets/env/trees/foliage_01.png', role: 'tree' },
  { key: 'png_tree_c', path: 'assets/env/trees/foliage_02.png', role: 'tree' },

  // Arches / ruins
  { key: 'png_arch_a', path: 'assets/env/arches/foliage_06.png', role: 'arch' },
  { key: 'png_arch_b', path: 'assets/env/arches/foliage_07.png', role: 'arch' },
  { key: 'halcyon_fortress_arch', path: 'assets/env/halcyon/props/fortress/arch-island.png', role: 'arch' },

  // Plants / ivy edge dressing
  { key: 'png_plant_a', path: 'assets/env/plants/plat_17.png', role: 'plant' },
  { key: 'png_plant_b', path: 'assets/env/plants/plat_18.png', role: 'plant' },
  { key: 'png_plant_c', path: 'assets/env/plants/plat_21.png', role: 'plant' },

  // Crystals
  { key: 'png_crystal_a', path: 'assets/env/props/cel_03.png', role: 'crystal' },
  { key: 'png_crystal_b', path: 'assets/env/props/cel_04.png', role: 'crystal' },
  { key: 'halcyon_fortress_crystal', path: 'assets/env/halcyon/props/fortress/aether-crystal.png', role: 'crystal' },
];

export function assetsForRole(role: HalcyonRole): HalcyonAssetRef[] {
  return HALCYON_COMPOSITION.filter((a) => a.role === role);
}
