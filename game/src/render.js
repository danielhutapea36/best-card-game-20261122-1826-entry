// Lanternfall Duel — the table: every pixel the player sees.
// DOM rendering only; the engine owns the state, this file only shows it.

import { ELEMENTS, EFFECT_TEXT } from './cards.js';
import { START_LIFE } from './engine.js';

/** One face-up card. `opts` may mark it selected, playable or small. */
export function cardElement(card, opts = {}) {
  const div = document.createElement('div');
  div.className = 'card' + (opts.selected ? ' selected' : '') + (opts.small ? ' small' : '') + (opts.back ? ' back' : '');
  if (opts.back) {
    div.innerHTML = '<div class="card-back-glyph">🏮</div><div class="card-back-name">LANTERNFALL</div>';
    return div;
  }
  div.dataset.element = card.element;
  const el = ELEMENTS[card.element];
  const effect = EFFECT_TEXT[card.effect];
  div.innerHTML =
    `<div class="card-cost" title="Ember cost">${'●'.repeat(card.cost)}</div>` +
    `<div class="card-glyph" style="color:${el.color}">${el.glyph}</div>` +
    `<div class="card-element">${el.name.toUpperCase()}</div>` +
    `<div class="card-name">${card.name}</div>` +
    `<div class="card-power">${card.power}</div>` +
    (effect ? `<div class="card-effect">${effect}</div>` : '<div class="card-effect"></div>');
  if (opts.onClick) div.addEventListener('click', opts.onClick);
  return div;
}

/** A life bar with a big readable number. */
function lifeBar(side, label) {
  const wrap = document.createElement('div');
  wrap.className = 'life-wrap';
  const pct = Math.max(0, (side.life / START_LIFE) * 100);
  wrap.innerHTML =
    `<div class="life-label">${label}</div>` +
    `<div class="life-bar"><div class="life-fill" style="width:${pct}%"></div></div>` +
    `<div class="life-num">♥ ${side.life} / ${START_LIFE}</div>` +
    `<div class="ember">Ember ${'🔥'.repeat(side.ember)}<span class="ember-empty">${'○'.repeat(6 - side.ember)}</span></div>`;
  return wrap;
}

/** The element cycle, shown on the title screen and as a reminder. */
function cycleElement() {
  const div = document.createElement('div');
  div.className = 'cycle';
  div.innerHTML =
    '<div class="cycle-title">THE CYCLE — an element that beats the other doubles its power</div>' +
    '<div class="cycle-row">' +
    ['flame', 'leaf', 'tide', 'stone'].map((key) => {
      const el = ELEMENTS[key];
      return `<span class="cycle-chip" style="border-color:${el.color};color:${el.color}">${el.glyph} ${el.name}</span>`;
    }).join('<span class="cycle-arrow">›</span>') +
    '<span class="cycle-arrow">›</span><span class="cycle-chip">back to 🔥</span></div>';
  return div;
}

function logElement(state) {
  const div = document.createElement('div');
  div.className = 'log';
  div.innerHTML = '<div class="log-title">BATTLE LOG</div>' + state.log.map((l) => `<div class="log-line">${l}</div>`).join('');
  return div;
}

/** Title screen overlay. */
function titleScreen(root, onStart) {
  const div = document.createElement('div');
  div.className = 'screen title-screen';
  div.innerHTML =
    '<div class="game-title">🏮 LANTERNFALL<br>DUEL</div>' +
    '<div class="game-tag">A duel of lantern cards — outplay the Rival Keeper, round by round.</div>';
  div.appendChild(cycleElement());
  const how = document.createElement('div');
  how.className = 'howto';
  how.innerHTML =
    '<b>How to play</b><br>' +
    '• Each round, play one card from your hand. It costs ember; ember grows every round.<br>' +
    '• Both cards are revealed at once. Higher power wins the round; the loser loses life equal to the difference.<br>' +
    '• An element that beats the other doubles its power. Watch what the Rival plays — and counter it.<br>' +
    '• First to bring the other to 0 life wins. Keys: <b>1–4</b> select a card, <b>Enter</b> plays it, <b>M</b> meditates (+2 ember, +1 life).';
  div.appendChild(how);
  const btn = document.createElement('button');
  btn.className = 'big-btn';
  btn.textContent = '▶  START THE DUEL';
  btn.addEventListener('click', onStart);
  div.appendChild(btn);
  root.appendChild(div);
}

/** Win / loss overlay. */
function endScreen(root, state, onAgain, onTitle) {
  const won = state.winner === 'player';
  const div = document.createElement('div');
  div.className = 'screen end-screen ' + (won ? 'win' : 'lose');
  div.innerHTML =
    `<div class="end-title">${won ? '🏆 YOU WIN!' : '💔 YOU LOSE'}</div>` +
    `<div class="end-sub">${won ? 'The Rival Keeper bows. Every lantern in the hall burns for you.' : 'The Rival Keeper keeps the hall. Light your lantern and try again.'}</div>` +
    `<div class="end-score">Final life — You ${state.player.life} · Rival ${state.rival.life} · Rounds played ${state.round - 1}</div>`;
  const again = document.createElement('button');
  again.className = 'big-btn';
  again.textContent = '↻  PLAY AGAIN';
  again.addEventListener('click', onAgain);
  const title = document.createElement('button');
  title.className = 'ghost-btn';
  title.textContent = 'Back to title';
  title.addEventListener('click', onTitle);
  div.appendChild(again);
  div.appendChild(title);
  root.appendChild(div);
}

/** The whole table: rival row, arena, player row, log sidebar. */
export function renderGame(state, root, actions) {
  root.innerHTML = '';
  if (state.phase === 'title') {
    titleScreen(root, actions.start);
    return;
  }

  const table = document.createElement('div');
  table.className = 'table';

  const head = document.createElement('div');
  head.className = 'table-head';
  head.innerHTML = `<span class="brand">🏮 LANTERNFALL DUEL</span><span class="round">ROUND ${state.round}</span><span class="score">Rounds won — You ${state.playerWins} · Rival ${state.rivalWins}</span>`;
  table.appendChild(head);

  // Rival row: life, ember, face-down hand.
  const rivalRow = document.createElement('div');
  rivalRow.className = 'side-row rival-row';
  rivalRow.appendChild(lifeBar(state.rival, 'RIVAL KEEPER'));
  const rivalHand = document.createElement('div');
  rivalHand.className = 'hand rival-hand';
  state.rival.hand.forEach(() => rivalHand.appendChild(cardElement(null, { back: true, small: true })));
  rivalHand.insertAdjacentHTML('beforeend', `<div class="hand-count">${state.rival.hand.length} cards · ${state.rival.deck.length} in deck</div>`);
  rivalRow.appendChild(rivalHand);
  table.appendChild(rivalRow);

  // Arena: the two played cards and the round result.
  const arena = document.createElement('div');
  arena.className = 'arena';
  if (state.phase === 'reveal' && state.lastRound) {
    const lr = state.lastRound;
    const left = document.createElement('div');
    left.className = 'arena-slot';
    if (lr.playerCard) left.appendChild(cardElement(lr.playerCard));
    else left.innerHTML = '<div class="arena-empty">— meditated —</div>';
    const mid = document.createElement('div');
    mid.className = 'arena-mid';
    const verdict = lr.pDamage > lr.rDamage ? 'YOU TAKE THE HIT' : lr.rDamage > lr.pDamage ? 'RIVAL TAKES THE HIT' : 'EVEN';
    mid.innerHTML = `<div class="vs">VS</div><div class="arena-power">${lr.pPower} — ${lr.rPower}</div><div class="arena-verdict">${verdict}</div>`;
    const right = document.createElement('div');
    right.className = 'arena-slot';
    if (lr.rivalCard) right.appendChild(cardElement(lr.rivalCard));
    arena.append(left, mid, right);
  } else {
    arena.innerHTML = '<div class="arena-hint">Play a card — both lanterns are revealed at once.</div>';
  }
  table.appendChild(arena);

  // Player row: life, ember, face-up hand, action buttons.
  const playerRow = document.createElement('div');
  playerRow.className = 'side-row player-row';
  playerRow.appendChild(lifeBar(state.player, 'YOU'));
  const hand = document.createElement('div');
  hand.className = 'hand player-hand';
  state.player.hand.forEach((card, i) => {
    hand.appendChild(cardElement(card, {
      selected: state.selected === i,
      onClick: () => actions.select(i),
    }));
  });
  hand.insertAdjacentHTML('beforeend', `<div class="hand-count">${state.player.hand.length} cards · ${state.player.deck.length} in deck</div>`);
  playerRow.appendChild(hand);
  table.appendChild(playerRow);

  const controls = document.createElement('div');
  controls.className = 'controls';
  const playBtn = document.createElement('button');
  playBtn.className = 'big-btn play-btn';
  const sel = state.selected !== null ? state.player.hand[state.selected] : null;
  playBtn.textContent = sel ? `▶ PLAY ${sel.name.toUpperCase()} (cost ${sel.cost})` : '▶ PLAY A CARD — select one first';
  playBtn.disabled = state.phase !== 'playing' || sel === null || sel.cost > state.player.ember;
  playBtn.addEventListener('click', actions.play);
  const medBtn = document.createElement('button');
  medBtn.className = 'ghost-btn';
  medBtn.textContent = '🧘 MEDITATE (+2 ember, +1 life)';
  medBtn.disabled = state.phase !== 'playing';
  medBtn.addEventListener('click', actions.meditate);
  const nextBtn = document.createElement('button');
  nextBtn.className = 'ghost-btn';
  nextBtn.textContent = state.phase === 'reveal' ? 'NEXT ROUND →' : 'NEXT ROUND';
  nextBtn.disabled = state.phase !== 'reveal';
  nextBtn.addEventListener('click', actions.nextRound);
  controls.append(playBtn, medBtn, nextBtn);
  table.appendChild(controls);

  const wrap = document.createElement('div');
  wrap.className = 'game-wrap';
  wrap.appendChild(table);
  const side = document.createElement('aside');
  side.className = 'sidebar';
  side.appendChild(cycleElement());
  side.appendChild(logElement(state));
  wrap.appendChild(side);
  root.appendChild(wrap);

  if (state.phase === 'over') endScreen(root, state, actions.restart, actions.toTitle);
}
