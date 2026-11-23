// Lanternfall Duel — boot and input: mouse, keyboard and screenshot setups.
// The game itself lives in engine.js (rules), ai.js (the rival) and
// render.js (the table); this file only wires them to the page.

import { newGame, playCards, playUnopposed, meditate, endRound, START_LIFE } from './engine.js';
import { chooseRivalCard } from './ai.js';
import { renderGame } from './render.js';
import { seededRandom } from './cards.js';

const root = document.getElementById('app');
let state = newGame();

function draw() {
  renderGame(state, root, actions);
}

const actions = {
  start() {
    state.phase = 'playing';
    draw();
  },
  select(i) {
    if (state.phase !== 'playing') return;
    state.selected = state.selected === i ? null : i;
    draw();
  },
  play() {
    if (state.phase !== 'playing' || state.selected === null) return;
    const rivalCard = chooseRivalCard(state);
    if (rivalCard === null) {
      // The rival meditates: a free round for the player.
      state.rival.ember = Math.min(6, state.rival.ember + 2);
      state.rival.life = Math.min(START_LIFE, state.rival.life + 1);
      state.log = ['The Rival Keeper meditates (+2 ember, +1 life). Your card strikes unopposed!', ...state.log].slice(0, 5);
      if (playUnopposed(state, state.selected)) draw();
      return;
    }
    if (playCards(state, state.selected, rivalCard)) draw();
  },
  meditate() {
    if (state.phase !== 'playing') return;
    const rivalCard = chooseRivalCard(state);
    if (rivalCard === null) {
      state.player.ember = Math.min(6, state.player.ember + 2);
      state.player.life = Math.min(START_LIFE, state.player.life + 1);
      state.rival.ember = Math.min(6, state.rival.ember + 2);
      state.log = ['Both lanterns dim — both sides meditate.', ...state.log].slice(0, 5);
      draw();
      return;
    }
    if (meditate(state, rivalCard)) draw();
  },
  nextRound() {
    if (state.phase !== 'reveal') return;
    endRound(state);
    draw();
  },
  restart() {
    state = newGame();
    state.phase = 'playing';
    draw();
  },
  toTitle() {
    state = newGame();
    draw();
  },
};

document.addEventListener('keydown', (event) => {
  if (state.phase === 'title' && (event.key === 'Enter' || event.key === ' ')) {
    actions.start();
    return;
  }
  if (state.phase === 'over' && (event.key === 'r' || event.key === 'R' || event.key === 'Enter')) {
    actions.restart();
    return;
  }
  if (state.phase === 'playing') {
    if (event.key >= '1' && event.key <= '9') {
      const i = Number(event.key) - 1;
      if (i < state.player.hand.length) actions.select(i);
    } else if (event.key === 'Enter') {
      actions.play();
    } else if (event.key === 'm' || event.key === 'M') {
      actions.meditate();
    }
  } else if (state.phase === 'reveal' && (event.key === 'Enter' || event.key === ' ')) {
    actions.nextRound();
  }
  if (event.key === 'Escape') actions.toTitle();
});

/**
 * Screenshot setups, the same pattern the kit's starter uses (?shot=…):
 * each one builds a real game state through the engine and renders it, so
 * the screenshots are true renders of the game's own code.
 *   ?shot=title — the title screen
 *   ?shot=table — a mid-duel table (round 4, hands dealt, one round played)
 *   ?shot=win   — the victory screen
 *   ?shot=lose  — the defeat screen
 */
function applyShot(shot, seed) {
  const random = seededRandom(seed);
  if (shot === 'title') {
    state = newGame(random);
    return;
  }
  if (shot === 'table') {
    // A mid-duel reveal: both lanterns just played, powers compared.
    state = newGame(random);
    state.phase = 'reveal';
    state.round = 4;
    state.player.life = 16;
    state.rival.life = 5;
    state.player.ember = 2;
    state.rival.ember = 3;
    state.playerWins = 2;
    state.rivalWins = 1;
    state.player.hand.splice(0, 1); // the played card left the hand
    state.rival.hand.splice(0, 1);
    state.lastRound = {
      playerCard: { name: 'Wildfire', element: 'flame', power: 8, cost: 3, effect: 'none', uid: 1 },
      rivalCard: { name: 'Thorn Whip', element: 'leaf', power: 5, cost: 2, effect: 'none', uid: 5 },
      pPower: 16, rPower: 5, pDamage: 0, rDamage: 11,
    };
    state.log = [
      'Wildfire (16) beats Thorn Whip (5) — Rival takes 11. Flame advantage doubled the power!',
      'Wave Crash (6) beats Pebble Toss (2) — Rival takes 4.',
      'Boulder Drop (7) beats Spark Imp (3) — You take 4.',
      'The lanterns are lit. Choose a card to open the duel.',
    ];
    return;
  }
  if (shot === 'win' || shot === 'lose') {
    state = newGame(random);
    state.phase = 'over';
    state.round = 9;
    if (shot === 'win') {
      state.playerWins = 5;
      state.rivalWins = 3;
      state.winner = 'player';
      state.player.life = 9;
      state.rival.life = 0;
    } else {
      state.playerWins = 3;
      state.rivalWins = 5;
      state.winner = 'rival';
      state.player.life = 0;
      state.rival.life = 7;
    }
  }
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) applyShot(shot, Number(params.get('seed') || 7));

draw();
