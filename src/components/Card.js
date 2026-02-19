import React from 'react';
import './Card.css';

// Map suit codes to their Unicode characters and colors
const suitMap = {
  'H': { symbol: '♥', color: 'red' },
  'D': { symbol: '♦', color: 'red' },
  'C': { symbol: '♣', color: 'black' },
  'S': { symbol: '♠', color: 'black' },
};

const Card = ({ rank, suit, onClick, isFaceUp }) => {
  // Use a class for card back logic if not using a separate back component
  const cardContent = isFaceUp ? (
    <>
      <div className="card-corner top-left">
        <span className="card-rank">{rank}</span>
        <span className="card-suit">{suitMap[suit].symbol}</span>
      </div>
      <div className="card-center">
        <span className="card-suit large">{suitMap[suit].symbol}</span>
      </div>
      <div className="card-corner bottom-right">
        <span className="card-rank">{rank}</span>
        <span className="card-suit">{suitMap[suit].symbol}</span>
      </div>
    </>
  ) : (
    // Simple back design
    <div className="card-back"></div>
  );

  return (
    <div
      className={`card ${suitMap[suit].color} ${isFaceUp ? 'face-up' : 'face-down'}`}
      onClick={onClick}
    >
      {cardContent}
    </div>
  );
};

export default Card;
