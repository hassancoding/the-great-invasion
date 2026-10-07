export type SquadOrder =
  | 'FOLLOW'
  | 'ADVANCE'
  | 'FLANK_LEFT'
  | 'DEFEND'
  | 'SECURE_BRIDGE'
  | 'HOLD';

export type SquadId = 'ALPHA' | 'BRAVO';

export const DEFAULT_ORDERS: Record<SquadId, SquadOrder> = {
  ALPHA: 'FOLLOW',
  BRAVO: 'ADVANCE',
};

/** Keys 3–8 for squad (1–2 reserved for weapons AR / SG) */
export const ORDER_KEYS: Record<string, readonly [SquadId, SquadOrder]> = {
  Digit3: ['ALPHA', 'FOLLOW'],
  Digit4: ['ALPHA', 'FLANK_LEFT'],
  Digit5: ['ALPHA', 'DEFEND'],
  Digit6: ['BRAVO', 'ADVANCE'],
  Digit7: ['BRAVO', 'SECURE_BRIDGE'],
  Digit8: ['BRAVO', 'HOLD'],
};

export function applySquadOrder(
  orders: Record<SquadId, SquadOrder>,
  key: string
): Record<SquadId, SquadOrder> {
  const next = ORDER_KEYS[key];
  if (!next) return orders;
  return { ...orders, [next[0]]: next[1] };
}
