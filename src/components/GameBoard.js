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
  const [bestTimes, setBestTimes]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(BEST_TIMES_KEY)) || {}; }
    catch { return {}; }
  });

  // Timeout refs — cleared on unmount and on level restart to prevent stale updates
  const flipBackTimeoutRef     = useRef(null);
  const confettiTimeoutRef     = useRef(null);
  const levelAdvanceTimeoutRef = useRef(null);

  // Stable refs so handleClick (useCallback with []) can read latest state
  const cardsRef   = useRef(cards);
  const flippedRef = useRef(flipped);
  useEffect(() => { cardsRef.current = cards; },   [cards]);
  useEffect(() => { flippedRef.current = flipped; }, [flipped]);

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

  // Re-init when cardCount changes (level advance or reset)
  useEffect(() => {
    initializeGame(cardCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardCount]);

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
    levelStartTimeRef.current = Date.now();
  }

  function getLevelDuration(level) {
    if (level <= 3) return GAME_CONFIG.TIME_LIMIT_LOW;
    if (level <= 8) return GAME_CONFIG.TIME_LIMIT_MID;
    return GAME_CONFIG.TIME_LIMIT_HIGH;
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
      initializeGame(cardCount);
      setResetTimerKey(prev => prev + 1);
    } else if (type === 'victory') {
      // Reset to level 1; cardCount change triggers initializeGame via useEffect
      setLevelNumber(1);
      setCardCount(GAME_CONFIG.INITIAL_CARDS);
      setResetTimerKey(prev => prev + 1);
    }
  }

  // ── Card interaction ───────────────────────────────────────────────────────

  // Stable callback (no deps) — reads latest state from refs
  const handleClick = useCallback((cardId, event) => {
    const cards   = cardsRef.current;
    const flipped = flippedRef.current;

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
        setCardCount(prev => prev + 2);
        setLevelNumber(prev => prev + 1);
        setResetTimerKey(prev => prev + 1);
      } else {
        setModal({ type: 'victory' });
      }
    }, GAME_CONFIG.LEVEL_ADVANCE_DELAY);
  }, [matchedPairs, cardCount, cards.length]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const cols      = gridMap[cardCount] ? gridMap[cardCount][1] : Math.ceil(Math.sqrt(cardCount));
  const totalPairs = cardCount / 2;
  const bestTime  = bestTimes[levelNumber];

  return (
    <div>
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
        {bestTime !== undefined && (
          <span className="best-time">Best: {bestTime}s</span>
        )}
      </div>

      <Timer
        duration={getLevelDuration(levelNumber)}
        onTimeUp={handleTimeUp}
        resetTrigger={resetTimerKey}
      />

      {/* ── Board ── */}
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
  );
}
