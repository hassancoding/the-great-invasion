export type ObjectiveRequirement =
  | { type: 'waves-cleared'; waveIndexes: readonly number[] }
  | { type: 'enemy-defeated'; enemyKind: string }
  | { type: 'all-waves-cleared' }
  | { type: 'well-stabilized' };

export interface ObjectiveDefinition {
  id: string;
  title: string;
  detail: string;
  classification: 'main';
  prerequisites: readonly string[];
  activation: 'run-start' | 'previous-objective-complete';
  requirement: ObjectiveRequirement;
  failurePolicy: 'fail-run-on-life-loss';
  retryPolicy: 'restart-sector';
  persistence: 'active-run-reset-on-retry';
  reward: 'none';
}

export const ARIN_HALCYON_OBJECTIVES: readonly ObjectiveDefinition[] = [
  {
    id: 'first-contact',
    title: 'Repel First Contact',
    detail: 'Defeat the scouts at the Spire gate.',
    classification: 'main',
    prerequisites: [],
    activation: 'run-start',
    requirement: { type: 'waves-cleared', waveIndexes: [0] },
    failurePolicy: 'fail-run-on-life-loss',
    retryPolicy: 'restart-sector',
    persistence: 'active-run-reset-on-retry',
    reward: 'none',
  },
  {
    id: 'break-vanguard',
    title: 'Break the Vanguard',
    detail: 'Clear the four following siege waves.',
    classification: 'main',
    prerequisites: ['first-contact'],
    activation: 'previous-objective-complete',
    requirement: { type: 'waves-cleared', waveIndexes: [1, 2, 3, 4] },
    failurePolicy: 'fail-run-on-life-loss',
    retryPolicy: 'restart-sector',
    persistence: 'active-run-reset-on-retry',
    reward: 'none',
  },
  {
    id: 'defeat-orun',
    title: 'Defeat Orun',
    detail: 'Bring down the Rift-bound Colossus.',
    classification: 'main',
    prerequisites: ['break-vanguard'],
    activation: 'previous-objective-complete',
    requirement: { type: 'enemy-defeated', enemyKind: 'ORUN' },
    failurePolicy: 'fail-run-on-life-loss',
    retryPolicy: 'restart-sector',
    persistence: 'active-run-reset-on-retry',
    reward: 'none',
  },
  {
    id: 'clear-final-breach',
    title: 'Clear the Final Breach',
    detail: 'Defeat every remaining attacker.',
    classification: 'main',
    prerequisites: ['defeat-orun'],
    activation: 'previous-objective-complete',
    requirement: { type: 'all-waves-cleared' },
    failurePolicy: 'fail-run-on-life-loss',
    retryPolicy: 'restart-sector',
    persistence: 'active-run-reset-on-retry',
    reward: 'none',
  },
  {
    id: 'stabilize-well',
    title: 'Stabilize the Aether Well',
    detail: 'Hold within the Well until it stabilizes.',
    classification: 'main',
    prerequisites: ['clear-final-breach'],
    activation: 'previous-objective-complete',
    requirement: { type: 'well-stabilized' },
    failurePolicy: 'fail-run-on-life-loss',
    retryPolicy: 'restart-sector',
    persistence: 'active-run-reset-on-retry',
    reward: 'none',
  },
];