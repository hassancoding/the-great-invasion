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

export const ORDER_KEYS: Record<string, readonly [SquadId, SquadOrder]> = {
  Digit1: ['ALPHA', 'FOLLOW'],
  Digit2: ['ALPHA', 'FLANK_LEFT'],
  Digit3: ['ALPHA', 'DEFEND'],
  Digit4: ['BRAVO', 'ADVANCE'],
  Digit5: ['BRAVO', 'SECURE_BRIDGE'],
  Digit6: ['BRAVO', 'HOLD'],
};

export function applySquadOrder(
  orders: Record<SquadId, SquadOrder>,
  key: string
): Record<SquadId, SquadOrder> {
  const next = ORDER_KEYS[key];
  if (!next) return orders;
  return { ...orders, [next[0]]: next[1] };
}
