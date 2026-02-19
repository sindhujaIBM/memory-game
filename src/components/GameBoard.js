import React, { useEffect, useState } from "react";
import Card from "./Card";
import Timer from "./Timer";
import Confetti from "react-confetti";
import { shuffle } from "../utils/shuffle";

const MAX_CARDS = 32;
const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export default function GameBoard() {
  const [cardCount, setCardCount] = useState(6);
  const [levelNumber, setLevelNumber] = useState(1);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [resetTimerKey, setResetTimerKey] = useState(0);

  useEffect(() => {
    initializeGame(cardCount);
  }, [cardCount]);

  function generateCards(count) {
    const deck = [];
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push(`${rank}${suit}`);
      }
    }

    const selected = shuffle(deck).slice(0, count / 2);

    return shuffle(
      [...selected, ...selected].map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
      }))
    );
  }

  function initializeGame(count) {
    setCards(generateCards(count));
    setFlipped([]);
    setMatchedPairs(0);
  }

  function getLevelDuration(level) {
    if (level <= 3) return 30;
    if (level <= 8) return 40;
    return 50;
  }

  function handleTimeUp() {
    alert("⏰ Time's up! Restarting level.");
    initializeGame(cardCount);
    setResetTimerKey((prev) => prev + 1);
  }

  function handleClick(card) {
    if (flipped.length === 2) return;

    const updatedCards = cards.map((c) =>
      c.id === card.id ? { ...c, isFlipped: true } : c
    );

    const newFlipped = [...flipped, card];
    setCards(updatedCards);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      checkMatch(newFlipped);
    }
  }

  function checkMatch(flippedCards) {
    const [first, second] = flippedCards;

    if (first.value === second.value) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 800);

      setCards((prev) =>
        prev.map((c) =>
          c.value === first.value ? { ...c, isMatched: true } : c
        )
      );

      setMatchedPairs((prev) => prev + 1);
    } else {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === first.id || c.id === second.id
              ? { ...c, isFlipped: false }
              : c
          )
        );
      }, 800);
    }

    setTimeout(() => setFlipped([]), 800);
  }

  useEffect(() => {
    if (matchedPairs === cardCount / 2) {
      setTimeout(() => {
        if (cardCount < MAX_CARDS) {
          setCardCount((prev) => prev + 2);
          setLevelNumber((prev) => prev + 1);
          setResetTimerKey((prev) => prev + 1);
        } else {
          alert("🏆 You completed all levels!");
        }
      }, 1200);
    }
  }, [matchedPairs]);

  return (
    <div>
      {showConfetti && <Confetti />}
      <h2>
        Level {levelNumber} ({cardCount} cards)
      </h2>

      <Timer
        duration={getLevelDuration(levelNumber)}
        onTimeUp={handleTimeUp}
        resetTrigger={resetTimerKey}
      />

      <div className="board">
        {cards.map((card) => (
          <Card key={card.id} card={card} handleClick={handleClick} />
        ))}
      </div>
    </div>
  );
}
