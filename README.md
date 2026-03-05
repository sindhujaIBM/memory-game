# Memory Madness

A progressive card-matching memory game built with React, using a real 52-card playing-card deck.

**Live demo:** [sindhujaIBM.github.io/memory-game](https://sindhujaIBM.github.io/memory-game)

## How to Play

1. Click any card to flip it face-up.
2. Click a second card — if they match, they stay up. If not, both flip back.
3. Match all pairs before the timer runs out to advance to the next level.
4. 14 levels total, starting at 6 cards and adding 2 per level (up to 32).

## Features

- Progressive difficulty across 14 levels
- Countdown timer with escalating time limits
- Pause / Resume support
- Confetti burst on each matched pair
- Best-time tracking per level (saved in `localStorage`)
- Victory modal on game completion

See [FEATURES.md](FEATURES.md) for the full feature list.

## Getting Started

```bash
npm install
npm start        # dev server at http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm test` | Run tests |
| `npm run build` | Production build |
| `npm run deploy` | Deploy to GitHub Pages |

## Tech Stack

- React 19
- react-confetti
- gh-pages (deployment)
- Create React App
