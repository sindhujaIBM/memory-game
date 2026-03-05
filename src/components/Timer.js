import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";

export default function Timer({ duration, onTimeUp, resetTrigger }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep ref current so the interval never captures a stale onTimeUp
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  });

  // Single interval per level — recreated only when duration or resetTrigger changes
  useEffect(() => {
    setTimeLeft(duration);
    let remaining = duration;

    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        onTimeUpRef.current();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [resetTrigger, duration]);

  const warning = timeLeft <= 5;

  return (
    <div className={`timer ${warning ? "warning" : ""}`}>
      ⏳ {timeLeft}s
    </div>
  );
}

Timer.propTypes = {
  duration: PropTypes.number.isRequired,
  onTimeUp: PropTypes.func.isRequired,
  resetTrigger: PropTypes.number.isRequired,
};
