import React from "react";
import "../App.css";

export default function Card({ card, handleClick }) {
  return (
    <div
      className={`card ${card.isFlipped ? "flipped" : ""}`}
      onClick={() => !card.isMatched && handleClick(card)}
    >
      <div className="inner">
        <div className="front">{card.value}</div>
        <div className="back">🎴</div>
      </div>
    </div>
  );
}
