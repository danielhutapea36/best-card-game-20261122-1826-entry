// Lanternfall Duel — the cards.
// Four lantern elements in a cycle: Flame burns Leaf, Leaf drinks Tide,
// Tide wears Stone, Stone smothers Flame. An element that beats the other
// doubles its card's power for the round.

export const ELEMENTS = {
  flame: { name: 'Flame', glyph: '🔥', color: '#ff6b35', dark: '#7a2400', beats: 'leaf' },
  leaf: { name: 'Leaf', glyph: '🍃', color: '#4ade80', dark: '#14532d', beats: 'tide' },
  tide: { name: 'Tide', glyph: '💧', color: '#38bdf8', dark: '#0c4a6e', beats: 'stone' },
  stone: { name: 'Stone', glyph: '🪨', color: '#c084fc', dark: '#4c1d95', beats: 'flame' },
};

export const ELEMENT_ORDER = ['flame', 'leaf', 'tide', 'stone'];

// One card: a name, an element, a power, an ember cost and one effect.
// effect: 'none' | 'heal' (+3 life) | 'shield' (block this round's damage)
//         | 'draw' (draw an extra card) | 'surge' (+2 power when you lost last round)
export const CARD_POOL = [
  { name: 'Ember Slash', element: 'flame', power: 6, cost: 2, effect: 'none' },
  { name: 'Wildfire', element: 'flame', power: 8, cost: 3, effect: 'none' },
  { name: 'Spark Imp', element: 'flame', power: 3, cost: 1, effect: 'none' },
  { name: 'Phoenix Dive', element: 'flame', power: 7, cost: 3, effect: 'surge' },
  { name: 'Cinder Flick', element: 'flame', power: 4, cost: 1, effect: 'surge' },
  { name: 'Thorn Whip', element: 'leaf', power: 5, cost: 2, effect: 'none' },
  { name: 'Seedling Guard', element: 'leaf', power: 3, cost: 1, effect: 'shield' },
  { name: 'Bloom Mend', element: 'leaf', power: 4, cost: 2, effect: 'heal' },
  { name: 'Vine Snare', element: 'leaf', power: 5, cost: 2, effect: 'surge' },
  { name: 'Canopy Bloom', element: 'leaf', power: 6, cost: 3, effect: 'heal' },
  { name: 'Wave Crash', element: 'tide', power: 6, cost: 2, effect: 'none' },
  { name: 'Mist Veil', element: 'tide', power: 3, cost: 1, effect: 'shield' },
  { name: 'Deep Current', element: 'tide', power: 4, cost: 2, effect: 'draw' },
  { name: 'Raincaller', element: 'tide', power: 7, cost: 3, effect: 'draw' },
  { name: 'Tidepool Trick', element: 'tide', power: 2, cost: 1, effect: 'draw' },
  { name: 'Boulder Drop', element: 'stone', power: 7, cost: 3, effect: 'none' },
  { name: 'Pebble Toss', element: 'stone', power: 2, cost: 1, effect: 'none' },
  { name: 'Mountain Stance', element: 'stone', power: 4, cost: 2, effect: 'shield' },
  { name: 'Quake Fist', element: 'stone', power: 6, cost: 2, effect: 'surge' },
  { name: 'Granite Wall', element: 'stone', power: 3, cost: 1, effect: 'shield' },
];

export const EFFECT_TEXT = {
  none: '',
  heal: 'Heal +3 life',
  shield: 'Shield: block damage this round',
  draw: 'Draw an extra card',
  surge: 'Surge: +2 power if you lost last round',
};

/** True when element a beats element b in the cycle. */
export function beats(a, b) {
  return ELEMENTS[a].beats === b;
}

/** A fresh shuffled deck: one copy of every card in the pool. */
export function buildDeck(random = Math.random) {
  const deck = CARD_POOL.map((c, i) => ({ ...c, uid: i }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** A small deterministic generator from a seed, for screenshot setups. */
export function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
