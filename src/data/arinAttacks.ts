export type ArinAttackId = 'light' | 'heavy' | 'dash' | 'air' | 'charged' | 'spin' | 'combo';

export interface ArinAttackDefinition {
  id: ArinAttackId;
  label: string;
  animationKey: string;
  category: string;
  sourceFiles: readonly string[];
  playbackFiles: readonly string[];
  excludedFiles: readonly string[];
  frameRate: number;
  activeFrames: readonly string[];
  damage: number;
  hitRadius: number;
  recoveryMs: number;
  chargeMs?: number;
  dashSpeed?: number;
  dashDurationMs?: number;
  multiHit?: boolean;
}

export function getArinAttackTextureKey(category: string, file: string) {
  const frameNumber = file.replace(`${category}_`, '').replace('.png', '');
  return `arin_attack_${category}_${frameNumber}`;
}

function frameNames(prefix: string, numbers: readonly number[]) {
  return numbers.map((number) => `${prefix}_${String(number).padStart(2, '0')}.png`);
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => index + start);
}

type AttackDefinitionInput = Omit<ArinAttackDefinition, 'sourceFiles' | 'playbackFiles' | 'excludedFiles'> & {
  frameNumbers: readonly number[];
  playbackNumbers?: readonly number[];
  excludedFiles?: readonly string[];
};

function defineAttack(definition: AttackDefinitionInput): ArinAttackDefinition {
  const sourceFiles = frameNames(definition.category, definition.frameNumbers);
  const excluded = new Set(definition.excludedFiles);
  const playbackFiles = definition.playbackNumbers
    ? frameNames(definition.category, definition.playbackNumbers)
    : sourceFiles.filter((file) => !excluded.has(file));
  const { frameNumbers: _frameNumbers, playbackNumbers: _playbackNumbers, excludedFiles: _excludedFiles, ...fields } = definition;
  return {
    ...fields,
    sourceFiles,
    playbackFiles,
    excludedFiles: sourceFiles.filter((file) => !playbackFiles.includes(file)),
  };
}

export const ARIN_ATTACKS: Record<ArinAttackId, ArinAttackDefinition> = {
  light: defineAttack({
    id: 'light',
    label: 'Light Attack',
    animationKey: 'arin_attack_light',
    category: 'light',
    frameNumbers: range(1, 5),
    excludedFiles: [],
    frameRate: 14,
    activeFrames: ['light_02.png'],
    damage: 1,
    hitRadius: 58,
    recoveryMs: 160,
  }),
  heavy: defineAttack({
    id: 'heavy',
    label: 'Heavy Attack',
    animationKey: 'arin_attack_heavy',
    category: 'heavy',
    frameNumbers: range(1, 6),
    excludedFiles: ['heavy_06.png'],
    frameRate: 12,
    activeFrames: ['heavy_02.png', 'heavy_03.png'],
    damage: 2,
    hitRadius: 72,
    recoveryMs: 320,
  }),
  dash: defineAttack({
    id: 'dash',
    label: 'Dash Attack',
    animationKey: 'arin_attack_dash',
    category: 'dash',
    frameNumbers: [...range(2, 6), ...range(8, 29)],
    excludedFiles: ['dash_11.png', 'dash_16.png'],
    frameRate: 24,
    activeFrames: ['dash_10.png'],
    damage: 2,
    hitRadius: 78,
    recoveryMs: 360,
    dashSpeed: 520,
    dashDurationMs: 260,
  }),
  air: defineAttack({
    id: 'air',
    label: 'Aerial Attack',
    animationKey: 'arin_attack_air',
    category: 'air',
    frameNumbers: range(1, 10),
    excludedFiles: ['air_03.png'],
    frameRate: 16,
    activeFrames: ['air_02.png'],
    damage: 1,
    hitRadius: 64,
    recoveryMs: 220,
  }),
  charged: defineAttack({
    id: 'charged',
    label: 'Charged Attack',
    animationKey: 'arin_attack_charged',
    category: 'charged',
    frameNumbers: [...range(2, 6), ...range(8, 23)],
    excludedFiles: ['charged_09.png', 'charged_14.png'],
    frameRate: 16,
    activeFrames: ['charged_13.png'],
    damage: 3,
    hitRadius: 96,
    recoveryMs: 420,
    chargeMs: 600,
  }),
  spin: defineAttack({
    id: 'spin',
    label: 'Spin Attack',
    animationKey: 'arin_attack_spin',
    category: 'spin',
    frameNumbers: range(1, 8),
    excludedFiles: [],
    frameRate: 16,
    activeFrames: ['spin_03.png', 'spin_07.png'],
    damage: 1,
    hitRadius: 82,
    recoveryMs: 320,
    multiHit: true,
  }),
  combo: defineAttack({
    id: 'combo',
    label: 'Three-Stage Combo',
    animationKey: 'arin_attack_combo',
    category: 'combo',
    frameNumbers: range(1, 94),
    playbackNumbers: [1, 2, 3, 4, 5, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24],
    frameRate: 30,
    activeFrames: ['combo_02.png', 'combo_16.png', 'combo_21.png'],
    damage: 1,
    hitRadius: 66,
    recoveryMs: 360,
    multiHit: true,
  }),
};

export const ARIN_ATTACK_FRAME_FILES = Object.values(ARIN_ATTACKS).flatMap((attack) =>
  attack.playbackFiles.map((file) => ({ category: attack.category, file }))
);
