// Lanternfall Duel — the rival's brain: a readable, counterable opponent.
// The rival prefers cards whose element beats the element you play most,
// spends ember only when the card is worth it, and meditates when broke.

import { beats, ELEMENT_ORDER } from './cards.js';

/** The element the player has played most often so far (null on round 1). */
export function playerFavouriteElement(state) {
  const counts = {};
  for (const card of state.player.discard) counts[card.element] = (counts[card.element] || 0) + 1;
  let best = null;
  let bestCount = 0;
  for (const el of ELEMENT_ORDER) {
    if ((counts[el] || 0) > bestCount) {
      best = el;
      bestCount = counts[el];
    }
  }
  return best;
}

/** The element that beats a given element. */
export function counterElement(element) {
  for (const el of ELEMENT_ORDER) {
    if (beats(el, element)) return el;
  }
  return null;
}

/**
 * Pick the rival's card for this round. Returns the card object, or null
 * when the rival should meditate instead (nothing affordable worth playing).
 */
export function chooseRivalCard(state) {
  const rival = state.rival;
  const affordable = rival.hand.filter((c) => c.cost <= rival.ember);
  if (affordable.length === 0) return null;

  const favourite = playerFavouriteElement(state);
  const counter = favourite ? counterElement(favourite) : null;

  const score = (card) => {
    let s = card.power * 2;
    if (counter && card.element === counter) s += 6; // read the player, counter them
    if (card.effect === 'shield' && rival.life <= 8) s += 5;
    if (card.effect === 'heal' && rival.life <= 12) s += 5;
    if (card.effect === 'draw') s += 2;
    if (card.effect === 'surge' && rival.lostLastRound) s += 3;
    if (card.cost >= 3 && rival.ember <= 3) s -= 3; // do not blow all ember early
    return s;
  };

  affordable.sort((a, b) => score(b) - score(a));
  const best = affordable[0];
  // A weak hand is not worth the ember: save it for a stronger round.
  if (score(best) < 5 && rival.ember < 4) return null;
  return best;
}
