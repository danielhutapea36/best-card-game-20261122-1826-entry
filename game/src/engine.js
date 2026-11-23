// Lanternfall Duel — the duel engine: state, rounds, damage, win and loss.
// Pure logic, no DOM: the renderer reads the state this module produces.

import { buildDeck, beats } from './cards.js';

export const START_LIFE = 20;
export const START_EMBER = 2;
export const MAX_EMBER = 6;
export const HAND_SIZE = 4;

/** A fresh side of the table: life, ember, deck, hand and discard pile. */
export function newSide(random) {
  const deck = buildDeck(random);
  return {
    life: START_LIFE,
    ember: START_EMBER,
    deck,
    hand: deck.splice(0, HAND_SIZE),
    discard: [],
    shield: false,
    lostLastRound: false,
  };
}

/** A fresh game state, before the title screen is dismissed. */
export function newGame(random = Math.random) {
  return {
    phase: 'title', // title | playing | reveal | over
    round: 1,
    player: newSide(random),
    rival: newSide(random),
    playerCard: null,
    rivalCard: null,
    selected: null, // index into the player's hand
    winner: null, // 'player' | 'rival' | null
    playerWins: 0,
    rivalWins: 0,
    log: ['The lanterns are lit. Choose a card to open the duel.'],
    lastRound: null,
  };
}

/** Effective power of a card in a round, with element advantage and surge. */
export function effectivePower(card, foeCard, side) {
  let power = card.power;
  if (foeCard && beats(card.element, foeCard.element)) power *= 2;
  if (card.effect === 'surge' && side.lostLastRound) power += 2;
  return power;
}

function drawOne(side) {
  if (side.deck.length === 0) {
    // Reshuffle the discard pile so a long duel never runs dry.
    side.deck = side.discard.splice(0).sort(() => Math.random() - 0.5);
  }
  const card = side.deck.shift();
  if (card) side.hand.push(card);
}

function applyEffect(card, side) {
  if (card.effect === 'heal') side.life = Math.min(START_LIFE, side.life + 3);
  if (card.effect === 'shield') side.shield = true;
  if (card.effect === 'draw') drawOne(side);
}

/**
 * Resolve one round after both sides have played a card.
 * Returns a list of human-readable lines for the battle log.
 */
export function resolveRound(state) {
  const p = state.playerCard;
  const r = state.rivalCard;
  const lines = [];
  const pPower = effectivePower(p, r, state.player);
  const rPower = effectivePower(r, p, state.rival);
  if (beats(p.element, r.element)) lines.push(`${p.name} burns ${r.name}: Flame advantage, power doubled!`);
  if (beats(r.element, p.element)) lines.push(`${r.name} smothers ${p.name}: ${r.element} advantage, power doubled!`);

  applyEffect(p, state.player);
  applyEffect(r, state.rival);

  let pDamage = 0;
  let rDamage = 0;
  if (pPower > rPower) {
    rDamage = pPower - rPower;
    state.rivalWins += 1;
    lines.push(`${p.name} (${pPower}) beats ${r.name} (${rPower}) — Rival takes ${rDamage}.`);
  } else if (rPower > pPower) {
    pDamage = rPower - pPower;
    state.playerWins += 1;
    lines.push(`${r.name} (${rPower}) beats ${p.name} (${pPower}) — You take ${pDamage}.`);
  } else {
    pDamage = 1;
    rDamage = 1;
    lines.push(`Equal strength (${pPower}) — both sides take 1.`);
  }

  if (pDamage > 0 && state.player.shield) {
    lines.push('Your shield blocks the damage!');
    pDamage = 0;
  }
  if (rDamage > 0 && state.rival.shield) {
    lines.push('The Rival shield blocks the damage!');
    rDamage = 0;
  }
  state.player.shield = false;
  state.rival.shield = false;

  state.player.life = Math.max(0, state.player.life - pDamage);
  state.rival.life = Math.max(0, state.rival.life - rDamage);
  state.player.lostLastRound = pDamage > rDamage;
  state.rival.lostLastRound = rDamage > pDamage;

  state.player.discard.push(p);
  state.rival.discard.push(r);
  state.lastRound = { playerCard: p, rivalCard: r, pPower, rPower, pDamage, rDamage };
  state.log = [...lines, ...state.log].slice(0, 5);
  return lines;
}

/** After a round, draw up, grow ember and check for a winner. */
export function endRound(state) {
  drawOne(state.player);
  drawOne(state.rival);
  state.player.ember = Math.min(MAX_EMBER, state.player.ember + 1);
  state.rival.ember = Math.min(MAX_EMBER, state.rival.ember + 1);
  state.playerCard = null;
  state.rivalCard = null;
  state.selected = null;
  state.round += 1;

  if (state.rival.life <= 0 && state.player.life <= 0) {
    state.winner = 'player'; // a double fall favours the challenger
  } else if (state.rival.life <= 0) {
    state.winner = 'player';
  } else if (state.player.life <= 0) {
    state.winner = 'rival';
  }
  if (state.winner) state.phase = 'over';
  else state.phase = 'playing';
}

/**
 * The player plays the selected hand card; the rival's card is chosen by the
 * caller and passed in. Moves the game into the reveal phase.
 */
export function playCards(state, playerIndex, rivalCard) {
  const card = state.player.hand[playerIndex];
  if (!card || state.phase !== 'playing') return false;
  if (card.cost > state.player.ember) return false;
  if (rivalCard.cost > state.rival.ember) return false;
  state.player.ember -= card.cost;
  state.rival.ember -= rivalCard.cost;
  state.player.hand.splice(playerIndex, 1);
  state.rival.hand.splice(state.rival.hand.indexOf(rivalCard), 1);
  state.playerCard = card;
  state.rivalCard = rivalCard;
  state.phase = 'reveal';
  resolveRound(state);
  return true;
}

/** The player plays a card while the rival meditates: full power, and the
 *  card's effect applies, exactly as the rival's does when the player
 *  meditates (see meditate, below). */
export function playUnopposed(state, playerIndex) {
  const card = state.player.hand[playerIndex];
  if (!card || state.phase !== 'playing') return false;
  if (card.cost > state.player.ember) return false;
  state.player.ember -= card.cost;
  state.player.hand.splice(playerIndex, 1);
  state.player.discard.push(card);
  applyEffect(card, state.player);
  const power = effectivePower(card, null, state.player);
  state.rival.life = Math.max(0, state.rival.life - power);
  state.playerWins += 1;
  state.player.lostLastRound = false;
  state.rival.lostLastRound = true;
  state.lastRound = { playerCard: card, rivalCard: null, pPower: power, rPower: 0, pDamage: 0, rDamage: power };
  state.phase = 'reveal';
  return true;
}

/** Skip playing a card: gain ember and a little life, but take the hit. */
export function meditate(state, rivalCard) {
  if (state.phase !== 'playing') return false;
  if (rivalCard.cost > state.rival.ember) return false;
  state.rival.ember -= rivalCard.cost;
  state.rival.hand.splice(state.rival.hand.indexOf(rivalCard), 1);
  state.playerCard = null;
  state.rivalCard = rivalCard;
  if (rivalCard.effect === 'heal') state.rival.life = Math.min(START_LIFE, state.rival.life + 3);
  if (rivalCard.effect === 'draw') drawOne(state.rival);
  if (rivalCard.effect === 'shield') state.rival.shield = true;
  state.player.ember = Math.min(MAX_EMBER, state.player.ember + 2);
  state.player.life = Math.min(START_LIFE, state.player.life + 1);
  const power = effectivePower(rivalCard, null, state.rival);
  let damage = power;
  if (state.player.shield) damage = 0;
  state.player.shield = false;
  state.player.life = Math.max(0, state.player.life - damage);
  state.player.lostLastRound = true;
  state.rival.lostLastRound = false;
  state.rivalWins += 1;
  state.rival.discard.push(rivalCard);
  state.lastRound = { playerCard: null, rivalCard, pPower: 0, rPower: power, pDamage: damage, rDamage: 0 };
  state.log = [`You meditate (+2 ember, +1 life) while ${rivalCard.name} strikes for ${damage}.`, ...state.log].slice(0, 5);
  state.phase = 'reveal';
  return true;
}
