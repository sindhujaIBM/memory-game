import React, { useEffect, useState, useRef, useCallback } from "react";
import Card from "./Card";
import Timer from "./Timer";
import Confetti from "react-confetti";
import { shuffle } from "../utils/shuffle";

// ─── Constants ───────────────────────────────────────────────────────────────
const GAME_CONFIG = {
  INITIAL_CARDS: 6,
  MAX_CARDS: 32,
  FLIP_DELAY: 800,
  CONFETTI_DURATION: 1500,
  LEVEL_ADVANCE_DELAY: 1200,
  TIME_LIMIT_LOW: 30,   // levels 1–3
  TIME_LIMIT_MID: 40,   // levels 4–8
  TIME_LIMIT_HIGH: 50,  // levels 9+
};

const DIFFICULTY = {
  Easy:   { label: 'Easy',   emoji: '🌱', multiplier: 1.75, hint: '+75% time' },
  Medium: { label: 'Medium', emoji: '🔥', multiplier: 1.0,  hint: 'base time' },
  Hard:   { label: 'Hard',   emoji: '💀', multiplier: 0.6,  hint: '-40% time' },
};

const BEST_TIMES_KEY = 'memory-game-best-times';
const suits = ['H', 'D', 'C', 'S'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Precomputed row/col map for perfect layout
const gridMap = {
  6:  [2, 3],  8:  [2, 4],  10: [2, 5],  12: [3, 4],
  14: [2, 7],  16: [4, 4],  18: [3, 6],  20: [4, 5],
  22: [2, 11], 24: [4, 6],  26: [2, 13], 28: [4, 7],
  30: [5, 6],  32: [4, 8],
};

// ─── Window size hook ─────────────────────────────────────────────────────────
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GameBoard() {
  const { width, height } = useWindowSize();

  const [cardCount, setCardCount]       = useState(GAME_CONFIG.INITIAL_CARDS);
  const [levelNumber, setLevelNumber]   = useState(1);
  const [cards, setCards]               = useState([]);
  const [flipped, setFlipped]           = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [mismatchedIds, setMismatchedIds] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 });
  const [resetTimerKey, setResetTimerKey] = useState(0);
  const [modal, setModal]               = useState(null); // { type: 'timeup' | 'victory' }
  const [isPaused, setIsPaused]         = useState(false);
  const [bestTimes, setBestTimes]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(BEST_TIMES_KEY)) || {}; }
    catch { return {}; }
  });

  // Difficulty — null means picker is showing, selected value is the active difficulty key
  const [difficulty, setDifficulty]               = useState(null);
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(true);
  // Pending state for the level about to start (populated when picker opens mid-game)
  const pendingCardCountRef  = useRef(GAME_CONFIG.INITIAL_CARDS);
  const pendingLevelNumberRef = useRef(1);
  // Last chosen difficulty for pre-selection in picker
  const [lastDifficulty, setLastDifficulty]       = useState('Medium');

  // Timeout refs — cleared on unmount and on level restart to prevent stale updates
  const flipBackTimeoutRef     = useRef(null);
  const confettiTimeoutRef     = useRef(null);
  const levelAdvanceTimeoutRef = useRef(null);

  // Stable refs so handleClick (useCallback with []) can read latest state
  const cardsRef    = useRef(cards);
  const flippedRef  = useRef(flipped);
  const isPausedRef = useRef(isPaused);
  useEffect(() => { cardsRef.current = cards; },     [cards]);
  useEffect(() => { flippedRef.current = flipped; }, [flipped]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // Ref so matchedPairs effect can read levelNumber without adding it to deps
  const levelNumberRef = useRef(levelNumber);
  useEffect(() => { levelNumberRef.current = levelNumber; }, [levelNumber]);

  // Track when the current level started (for best-time calculation)
  const levelStartTimeRef = useRef(Date.now());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(flipBackTimeoutRef.current);
      clearTimeout(confettiTimeoutRef.current);
      clearTimeout(levelAdvanceTimeoutRef.current);
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function generateCards(count) {
    const deck = [];
    for (const suit of suits)
      for (const rank of ranks)
        deck.push({ rank, suit });

    const selected = shuffle(deck).slice(0, count / 2);
    return shuffle([...selected, ...selected]).map((card, idx) => ({
      id: idx,
      ...card,
      isFaceUp: false,
      isMatched: false,
    }));
  }

  function initializeGame(count) {
    clearTimeout(flipBackTimeoutRef.current);
    clearTimeout(confettiTimeoutRef.current);
    clearTimeout(levelAdvanceTimeoutRef.current);
    setCards(generateCards(count));
    setFlipped([]);
    setMatchedPairs(0);
    setMismatchedIds([]);
    setShowConfetti(false);
    setIsPaused(false);
    levelStartTimeRef.current = Date.now();
  }

  function getLevelDuration(level, diff) {
    const base = level <= 3
      ? GAME_CONFIG.TIME_LIMIT_LOW
      : level <= 8
        ? GAME_CONFIG.TIME_LIMIT_MID
        : GAME_CONFIG.TIME_LIMIT_HIGH;
    const multiplier = DIFFICULTY[diff]?.multiplier ?? 1;
    return Math.round(base * multiplier);
  }

  // ── Difficulty picker ──────────────────────────────────────────────────────

  function openDifficultyPicker(nextCardCount, nextLevel) {
    pendingCardCountRef.current  = nextCardCount;
    pendingLevelNumberRef.current = nextLevel;
    setShowDifficultyPicker(true);
  }

  function confirmDifficulty(key) {
    setDifficulty(key);
    setLastDifficulty(key);
    setShowDifficultyPicker(false);

    // Apply pending level state
    const nextCount = pendingCardCountRef.current;
    const nextLevel = pendingLevelNumberRef.current;
    setCardCount(nextCount);
    setLevelNumber(nextLevel);
    initializeGame(nextCount);
    setResetTimerKey(prev => prev + 1);
  }

  // ── Modal ──────────────────────────────────────────────────────────────────

  function handleTimeUp() {
    clearTimeout(flipBackTimeoutRef.current);
    clearTimeout(confettiTimeoutRef.current);
    clearTimeout(levelAdvanceTimeoutRef.current);
    setModal({ type: 'timeup' });
  }

  function dismissModal() {
    const type = modal?.type;
    setModal(null);

    if (type === 'timeup') {
      openDifficultyPicker(cardCount, levelNumber);
    } else if (type === 'victory') {
      openDifficultyPicker(GAME_CONFIG.INITIAL_CARDS, 1);
    }
  }

  // ── Card interaction ───────────────────────────────────────────────────────

  // Stable callback (no deps) — reads latest state from refs
  const handleClick = useCallback((cardId, event) => {
    const cards   = cardsRef.current;
    const flipped = flippedRef.current;

    if (isPausedRef.current) return;
    if (flipped.length === 2) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isMatched || card.isFaceUp) return;

    const updatedCards = cards.map(c =>
      c.id === cardId ? { ...c, isFaceUp: true } : c
    );
    const newFlipped = [...flipped, card];
    setCards(updatedCards);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;

      if (first.rank === second.rank && first.suit === second.suit) {
        // ✅ Match
        const rect = event.target.getBoundingClientRect();
        setConfettiPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        setShowConfetti(true);
        confettiTimeoutRef.current = setTimeout(
          () => setShowConfetti(false),
          GAME_CONFIG.CONFETTI_DURATION
        );
        setCards(prev =>
          prev.map(c =>
            c.id === first.id || c.id === second.id ? { ...c, isMatched: true } : c
          )
        );
        setMatchedPairs(prev => prev + 1);
        setFlipped([]);
      } else {
        // ❌ Mismatch — show red flash then flip back
        setMismatchedIds([first.id, second.id]);
        flipBackTimeoutRef.current = setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === first.id || c.id === second.id ? { ...c, isFaceUp: false } : c
            )
          );
          setMismatchedIds([]);
          setFlipped([]);
        }, GAME_CONFIG.FLIP_DELAY);
      }
    }
  }, []); // stable — deps accessed via refs

  // ── Level completion ───────────────────────────────────────────────────────

  useEffect(() => {
    if (cards.length === 0 || matchedPairs === 0) return;
    if (matchedPairs !== cardCount / 2) return;

    // Save best time (uses functional updater to avoid stale closure)
    const elapsed = Math.round((Date.now() - levelStartTimeRef.current) / 1000);
    const level = levelNumberRef.current;
    setBestTimes(prev => {
      const prevBest = prev[level];
      if (prevBest === undefined || elapsed < prevBest) {
        const updated = { ...prev, [level]: elapsed };
        localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(updated));
        return updated;
      }
      return prev;
    });

    levelAdvanceTimeoutRef.current = setTimeout(() => {
      if (cardCount < GAME_CONFIG.MAX_CARDS) {
        openDifficultyPicker(cardCount + 2, levelNumberRef.current + 1);
      } else {
        setModal({ type: 'victory' });
      }
    }, GAME_CONFIG.LEVEL_ADVANCE_DELAY);
  }, [matchedPairs, cardCount, cards.length]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const cols       = gridMap[cardCount] ? gridMap[cardCount][1] : Math.ceil(Math.sqrt(cardCount));
  const totalPairs = cardCount / 2;
  const bestTime   = bestTimes[levelNumber];
  const activeDiff = difficulty ?? lastDifficulty;

  return (
    <div>
      {/* ── Difficulty Picker Modal ── */}
      {showDifficultyPicker && (
        <div className="modal-overlay">
          <div className="modal difficulty-modal">
            <div className="modal-icon">🃏</div>
            <h2>Level {pendingLevelNumberRef.current}</h2>
            <p>Choose your difficulty</p>
            <div className="difficulty-picker">
              {Object.entries(DIFFICULTY).map(([key, { label, emoji, hint }]) => (
                <button
                  key={key}
                  className={`diff-btn ${key.toLowerCase()}${lastDifficulty === key ? ' selected' : ''}`}
                  onClick={() => confirmDifficulty(key)}
                >
                  <span className="diff-emoji">{emoji}</span>
                  <span className="diff-label">{label}</span>
                  <span className="diff-hint">{hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal overlay ── */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            {modal.type === 'timeup' && (
              <>
                <div className="modal-icon">⏰</div>
                <h2>Time's Up!</h2>
                <p>Don't give up — try again!</p>
                <button className="modal-btn" onClick={dismissModal}>Try Again</button>
              </>
            )}
            {modal.type === 'victory' && (
              <>
                <div className="modal-icon">🏆</div>
                <h2>You Won!</h2>
                <p>You completed all 14 levels!</p>
                <button className="modal-btn" onClick={dismissModal}>Play Again</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Confetti ── */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          initialVelocityX={{ min: -10, max: 10 }}
          initialVelocityY={{ min: -20, max: -10 }}
          confettiSource={{ x: confettiPosition.x, y: confettiPosition.y, w: 10, h: 10 }}
        />
      )}

      {/* ── Header ── */}
      <h2>Level {levelNumber} ({cardCount} cards)</h2>

      <div className="game-stats">
        <span className="pairs-tracker">{matchedPairs} / {totalPairs} pairs matched</span>
        {difficulty && (
          <span className={`difficulty-badge ${activeDiff.toLowerCase()}`}>
            {DIFFICULTY[activeDiff].emoji} {activeDiff}
          </span>
        )}
        {bestTime !== undefined && (
          <span className="best-time">Best: {bestTime}s</span>
        )}
      </div>

      <div className="timer-row">
        <Timer
          duration={getLevelDuration(levelNumber, activeDiff)}
          onTimeUp={handleTimeUp}
          resetTrigger={resetTimerKey}
          isPaused={isPaused}
        />
        <button
          className="pause-btn"
          onClick={() => setIsPaused(p => !p)}
          aria-label={isPaused ? "Resume game" : "Pause game"}
        >
          {isPaused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </div>

      {/* ── Board ── */}
      <div className="board-wrapper">
        {isPaused && (
          <div className="board-pause-overlay">
            <span>PAUSED</span>
          </div>
        )}
        <div
          className="board"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {cards.map(card => (
            <Card
              key={card.id}
              id={card.id}
              rank={card.rank}
              suit={card.suit}
              isFaceUp={card.isFaceUp}
              isMatched={card.isMatched}
              isMismatched={mismatchedIds.includes(card.id)}
              onCardClick={handleClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
