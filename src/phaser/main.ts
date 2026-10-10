import Phaser from 'phaser';
import { createGameConfig } from './config';

const parent = document.getElementById('game-root') ?? document.body;
const game = new Phaser.Game(createGameConfig(parent));

// Hot module support for Vite
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}

export default game;
