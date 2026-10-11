import { SHEETS_ENEMIES } from './sheets_enemies';

/**
 * Embedded transparent sheets for enemies (multi-cell concept crops).
 * Heroes intentionally omitted — textureFactory draws genuine multi-pose frames
 * (idle / run / jump / attack) so we never fake-animate a single portrait.
 */
export const GAMEPLAY_SHEETS = { ...SHEETS_ENEMIES };
