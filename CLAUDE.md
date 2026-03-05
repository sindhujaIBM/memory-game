# Memory Madness — Claude Code Guide

## Project Overview

A React card-matching memory game with progressive difficulty, a countdown timer, and a playing-card deck theme.

## Stack

- **React 19** (Create React App)
- **react-confetti** for match celebrations
- **gh-pages** for deployment
- No TypeScript, no Redux — plain React state + hooks

## Key Files

| Path | Purpose |
|------|---------|
| `src/App.js` | Root component, renders `<GameBoard />` |
| `src/components/GameBoard.js` | All game logic (state, effects, handlers) |
| `src/components/Card.js` | Individual card flip component |
| `src/components/Timer.js` | Countdown timer, fires `onTimeUp` callback |
| `src/utils/shuffle.js` | Fisher-Yates shuffle utility |
| `src/App.css` | Global styles, board layout, modals, pause overlay |
| `src/components/Card.css` | Card flip animation styles |

## Game Constants (`GameBoard.js`)

```js
GAME_CONFIG = {
  INITIAL_CARDS: 6,     // cards on level 1
  MAX_CARDS: 32,        // cards on level 14 (final)
  FLIP_DELAY: 800,      // ms before mismatched cards flip back
  CONFETTI_DURATION: 1500,
  LEVEL_ADVANCE_DELAY: 1200,
  TIME_LIMIT_LOW: 30,   // seconds — levels 1–3
  TIME_LIMIT_MID: 40,   // levels 4–8
  TIME_LIMIT_HIGH: 50,  // levels 9+
}
```

Each level adds 2 cards. Cards are drawn from a real 52-card deck (rank + suit).

## Grid Layout

`gridMap` in `GameBoard.js` maps card count → `[rows, cols]` for a tidy CSS grid. Update this map if you change `INITIAL_CARDS` or `MAX_CARDS`.

## State Pattern

Stable `handleClick` callback uses `useRef` mirrors of state (`cardsRef`, `flippedRef`, `isPausedRef`) to avoid stale closures while keeping the callback identity stable (no deps array).

## Local Storage

Best times are persisted under key `memory-game-best-times` as a JSON object keyed by level number.

## Development

```bash
npm start       # dev server at localhost:3000
npm test        # Jest / React Testing Library
npm run build   # production build
npm run deploy  # build + push to gh-pages branch
```

## Deployment

Hosted on GitHub Pages. The `homepage` field in `package.json` is set to `https://sindhujaIBM.github.io/memory-game`. Run `npm run deploy` to publish.

## Coding Conventions

- Functional components only, no class components
- `useCallback` with `[]` deps + ref-based state access for stable event handlers
- All timeout refs cleaned up on unmount and on level restart
- Keep `GAME_CONFIG` constants at the top of `GameBoard.js` — do not scatter magic numbers
