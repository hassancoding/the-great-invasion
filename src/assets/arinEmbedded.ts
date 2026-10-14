import { ARIN_SHEET_B64_0 } from './arin_b64_0';
import { ARIN_SHEET_B64_1 } from './arin_b64_1';
import { ARIN_SHEET_B64_2 } from './arin_b64_2';
import { ARIN_PORTRAIT_B64 } from './arin_portrait_b64';
import { ARIN_ATLAS_JSON } from './arinAtlasJson';

export { ARIN_ATLAS_JSON };
export const ARIN_SHEET_DATA_URI =
  'data:image/png;base64,' + ARIN_SHEET_B64_0 + ARIN_SHEET_B64_1 + ARIN_SHEET_B64_2;
export const ARIN_PORTRAIT_DATA_URI = 'data:image/png;base64,' + ARIN_PORTRAIT_B64;
