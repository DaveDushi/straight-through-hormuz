import './css/index.css';
import './ui/pwa.js';
import { Game } from './game.js';

const game = new Game();
window.__game = game;
game.start();
