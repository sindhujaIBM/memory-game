import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

const suitMap = {
  'H': { symbol: '♥', color: 'red' },
  'D': { symbol: '♦', color: 'red' },
  'C': { symbol: '♣', color: 'black' },
  'S': { symbol: '♠', color: 'black' },
};

const suitNames = { H: 'Hearts', D: 'Diamonds', C: 'Clubs', S: 'Spades' };

const Card = ({ id, rank, suit, isFaceUp, isMatched, isMismatched, onCardClick }) => {
  const { symbol, color } = suitMap[suit];

  const handleInteract = (e) => {
    if (!isMatched) onCardClick(id, e);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleInteract(e);
    }
  };

  const classes = [
    'card',
    color,
    isFaceUp ? 'face-up' : 'face-down',
    isMatched ? 'matched' : '',
    isMismatched ? 'mismatched' : '',
  ].filter(Boolean).join(' ');

  const ariaLabel = isFaceUp
    ? `${rank} of ${suitNames[suit]}${isMatched ? ', matched' : ''}`
    : 'Card face down';

  return (
    <div
      className={classes}
      onClick={handleInteract}
      onKeyDown={handleKeyDown}
      tabIndex={isMatched ? -1 : 0}
      role="button"
      aria-label={ariaLabel}
      aria-pressed={isFaceUp}
    >
      {isFaceUp ? (
        <>
          <div className="card-corner top-left">
            <span className="card-rank">{rank}</span>
            <span className="card-suit">{symbol}</span>
          </div>
          <div className="card-center">
            <span className="card-suit large">{symbol}</span>
          </div>
          <div className="card-corner bottom-right">
            <span className="card-rank">{rank}</span>
            <span className="card-suit">{symbol}</span>
          </div>
        </>
      ) : (
        <div className="card-back" />
      )}
    </div>
  );
};

Card.propTypes = {
  id: PropTypes.number.isRequired,
  rank: PropTypes.string.isRequired,
  suit: PropTypes.oneOf(['H', 'D', 'C', 'S']).isRequired,
  isFaceUp: PropTypes.bool.isRequired,
  isMatched: PropTypes.bool.isRequired,
  isMismatched: PropTypes.bool,
  onCardClick: PropTypes.func.isRequired,
};

Card.defaultProps = {
  isMismatched: false,
};

export default React.memo(Card);
