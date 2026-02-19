import React, { useEffect, useState, useRef } from "react";
import Card from "./Card";
import Timer from "./Timer";
import Confetti from "react-confetti";
import { shuffle } from "../utils/shuffle";

const MAX_CARDS = 32;
const suits = ['H','D','C','S'];
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

// Hook to get window size
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
}

export default function GameBoard() {
  const { width, height } = useWindowSize();

  const [cardCount, setCardCount] = useState(6);
  const [levelNumber, setLevelNumber] = useState(1);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 });
  const [resetTimerKey, setResetTimerKey] = useState(0);

  const boardRef = useRef(null);

  useEffect(() => {
    initializeGame(cardCount);
  }, [cardCount]);

  function generateCards(count) {
    const deck = [];
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ rank, suit });
      }
    }
    const selected = shuffle(deck).slice(0, count / 2);
    const pairCards = shuffle([...selected, ...selected]).map((card, idx) => ({
      id: idx,
      ...card,
      isFaceUp: false,
      isMatched: false
    }));
    return pairCards;
  }

  function initializeGame(count) {
    setCards(generateCards(count));
    setFlipped([]);
    setMatchedPairs(0);
  }

  function getLevelDuration(level) {
    if(level <=3) return 30;
    if(level <=8) return 40;
    return 50;
  }

  function handleTimeUp() {
    alert("⏰ Time's up! Restarting level.");
    initializeGame(cardCount);
    setResetTimerKey(prev => prev + 1);
  }

  function handleClick(cardId, event) {
    if(flipped.length===2) return;

    const updatedCards = cards.map(c =>
      c.id === cardId ? {...c, isFaceUp:true} : c
    );

    const newFlipped = [...flipped, cards.find(c=>c.id===cardId)];
    setCards(updatedCards);
    setFlipped(newFlipped);

    if(newFlipped.length===2) checkMatch(newFlipped, event);
  }

  function checkMatch(flippedCards, event){
    const [first, second] = flippedCards;
    if(first.rank===second.rank && first.suit===second.suit) {
      // Get bounding rect to position confetti
      const rect = event.target.getBoundingClientRect();
      setConfettiPosition({ x: rect.left + rect.width/2, y: rect.top + rect.height/2 });
      setShowConfetti(true);
      setTimeout(()=>setShowConfetti(false),1500);

      setCards(prev=> prev.map(c=>
        c.id===first.id || c.id===second.id ? {...c,isMatched:true} : c
      ));
      setMatchedPairs(prev=>prev+1);
    } else {
      setTimeout(()=>{
        setCards(prev=>prev.map(c=>
          c.id===first.id || c.id===second.id ? {...c,isFaceUp:false} : c
        ));
      },800);
    }
    setTimeout(()=>setFlipped([]),800);
  }

  useEffect(()=>{
    if(matchedPairs===cardCount/2){
      setTimeout(()=>{
        if(cardCount<MAX_CARDS){
          setCardCount(prev=>prev+2);
          setLevelNumber(prev=>prev+1);
          setResetTimerKey(prev=>prev+1);
        } else {
          alert("🏆 You completed all levels!");
        }
      },1200);
    }
  },[matchedPairs]);

  return (
    <div ref={boardRef}>
      {showConfetti && 
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          initialVelocityX={{min:-10, max:10}}
          initialVelocityY={{min:-20, max:-10}}
          confettiSource={{x: confettiPosition.x, y: confettiPosition.y, w: 10, h: 10}}
        />
      }
      <h2>Level {levelNumber} ({cardCount} cards)</h2>

      <Timer
        duration={getLevelDuration(levelNumber)}
        onTimeUp={handleTimeUp}
        resetTrigger={resetTimerKey}
      />

      <div className="board">
        {cards.map(card=>(
          <Card
            key={card.id}
            rank={card.rank}
            suit={card.suit}
            isFaceUp={card.isFaceUp}
            onClick={(e)=>handleClick(card.id,e)}
          />
        ))}
      </div>
    </div>
  );
}
