import React, { useEffect, useState } from "react";

export default function Timer({ duration, onTimeUp, resetTrigger }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [resetTrigger, duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const warning = timeLeft <= 5;

  return (
    <div className={`timer ${warning ? "warning" : ""}`}>
      ⏳ {timeLeft}s
    </div>
  );
}
