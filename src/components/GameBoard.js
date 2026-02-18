import React, { useEffect, useState } from "react";
import Card from "./Card";
import { shuffle } from "../utils/shuffle";
import Confetti from "react-confetti";

const MAX_CARDS = 32;

export default function GameBoard() {
  const [level, setLevel] = useState(6);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    initializeGame(level);
  }, [level]);

  function initializeGame(cardCount) {
    const pairCount = cardCount / 2;
    const values = Array.from({ length: pairCount }, (_, i) => i + 1);

    const cardData = shuffle(
      [...values, ...values].map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false,
      }))
    );

    setCards(cardData);
    setFlipped([]);
    setMatchedPairs(0);
  }

  function handleClick(card) {
    if (flipped.length === 2) return;

    const newCards = cards.map((c) =>
      c.id === card.id ? { ...c, isFlipped: true } : c
    );

    const newFlipped = [...flipped, card];
    setCards(newCards);
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
      }, 1000);
    }

    setTimeout(() => setFlipped([]), 1000);
  }

  useEffect(() => {
    if (matchedPairs === level / 2) {
      setTimeout(() => {
        if (level < MAX_CARDS) {
          setLevel((prev) => prev + 2);
        } else {
          alert("🏆 You completed all levels!");
        }
      }, 1200);
    }
  }, [matchedPairs]);

  return (
    <>
      {showConfetti && <Confetti />}
      <h2>Level: {level} cards</h2>
      <div className="board">
        {cards.map((card) => (
          <Card key={card.id} card={card} handleClick={handleClick} />
        ))}
      </div>
    </>
  );
}
