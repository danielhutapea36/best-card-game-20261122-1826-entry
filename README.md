# Lanternfall Duel — Make the best card game

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/danielhutapea36/best-card-game-20261122-1826-entry/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/danielhutapea36/best-card-game-20261122-1826-entry/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

A 1v1 lantern card duel against the Rival Keeper, played in a desktop
browser from static files, offline, with keyboard and mouse.

## The game

Both sides start with 20 life and 2 ember. Each round you play one card
from your hand (costs ember; ember grows every round), the Rival plays
one too, and both are revealed at once. Higher power wins the round; the
loser loses life equal to the difference. Four lantern elements run in a
cycle — Flame burns Leaf, Leaf drinks Tide, Tide wears Stone, Stone
smothers Flame — and an element that beats the other doubles its power,
so every hand is a read: what has the Rival been playing, and what
counters it?

Cards carry one effect each: heal (+3 life), shield (block the round's
damage), draw (an extra card), or surge (+2 power when you lost the last
round). Out of ember? Meditate: +2 ember and +1 life, but the Rival's
card still strikes. First to 0 life loses.

- `game/` — the game: `index.html` + `style.css` + `src/` (cards, engine,
  rival AI, renderer, boot/input). Vanilla HTML/CSS/JS, no libraries, no
  network requests.
- `screenshots/` — 4 real renders of the game's own code: title, mid-duel
  table, win screen, loss screen.
- `main.ts` — the hand-in program (Node 22 stdlib): copies `game/` and
  `screenshots/` to `/output` and writes `dossier.json` with the vendored
  `vendor/makefun-game.ts`.

## Play it

```sh
cd game && python3 -m http.server 8080   # or any static server over game/
# open http://localhost:8080
```

Keys: **1–4** select a card, **Enter** plays it, **M** meditates,
**Enter** next round, **Esc** back to title. Mouse works for everything.

Screenshot setups (the game's own code rendering real states):
`?shot=title`, `?shot=table`, `?shot=win`, `?shot=lose`.

## Decisions

- DOM cards instead of canvas: values, suits and costs stay legible when
  the judge shrinks the screenshots to a contact sheet.
- Elements told apart by colour *and* shape (glyph), never by text alone.
- The rival is readable on purpose: it counters the element you play
  most, so the counter-play is visible in the log and in its picks.
- No build step, no external files: everything the page loads lives under
  `game/`, so the gate's references check passes and the game runs on
  makefun.gg as handed in.

---

<sub>Entered on [make.fun](https://make.fun/?ref=d7fzh6a3&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
