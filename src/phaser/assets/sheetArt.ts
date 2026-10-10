import { ART as A } from './sheetArtA';
import { ART as B } from './sheetArtB';

export const SHEET_ART: Record<string, string> = { ...A, ...B };

export function registerSheetArt(scene: Phaser.Scene): void {
  for (const [key, uri] of Object.entries(SHEET_ART)) {
    if (!scene.textures.exists(key)) scene.textures.addBase64(key, uri);
  }
}
