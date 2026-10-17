import { startRiftlands } from "./rift/engine";

const root = document.querySelector<HTMLElement>("#game-root");
if (root) startRiftlands(root);
