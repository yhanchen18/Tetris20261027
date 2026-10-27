/**
 * Application Main Entry Point
 * Pure Vanilla JavaScript (No React, No TypeScript)
 */

import { GameEngine } from './game.js';
import { sound } from './audio.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const game = new GameEngine(canvas);

  // Wire up Button Controls
  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      game.startGame();
    });
  }

  const btnPause = document.getElementById('btn-pause');
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      game.togglePause();
    });
  }

  const btnResume = document.getElementById('btn-resume');
  if (btnResume) {
    btnResume.addEventListener('click', () => {
      game.togglePause();
    });
  }

  const btnRestart = document.getElementById('btn-restart');
  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      game.restartGame();
    });
  }

  const btnNextLevel = document.getElementById('btn-next-level');
  if (btnNextLevel) {
    btnNextLevel.addEventListener('click', () => {
      game.nextLevel();
    });
  }

  const btnPlayAgain = document.getElementById('btn-play-again');
  if (btnPlayAgain) {
    btnPlayAgain.addEventListener('click', () => {
      game.restartGame();
    });
  }

  const btnVicPlayAgain = document.getElementById('btn-vic-play-again');
  if (btnVicPlayAgain) {
    btnVicPlayAgain.addEventListener('click', () => {
      game.restartGame();
    });
  }

  const btnMute = document.getElementById('mute-btn');
  if (btnMute) {
    btnMute.addEventListener('click', () => {
      game.toggleMute();
    });
  }

  // Quick Help / Rules Modal toggle
  const btnHelp = document.getElementById('btn-help');
  const modalHelp = document.getElementById('modal-help');
  const btnCloseHelp = document.getElementById('btn-close-help');

  if (btnHelp && modalHelp) {
    btnHelp.addEventListener('click', () => {
      modalHelp.classList.toggle('hidden');
    });
  }
  if (btnCloseHelp && modalHelp) {
    btnCloseHelp.addEventListener('click', () => {
      modalHelp.classList.add('hidden');
    });
  }

  // Initial update
  game.updateHUD();
  game.updateUIOverlays();
});
