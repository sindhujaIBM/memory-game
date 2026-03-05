import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";

export default function Timer({ duration, onTimeUp, resetTrigger, isPaused }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onTimeUpRef  = useRef(onTimeUp);
  const isPausedRef  = useRef(isPaused);

  useEffect(() => { onTimeUpRef.current = onTimeUp; });
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // Single interval per level — pausing skips the decrement tick
  useEffect(() => {
    setTimeLeft(duration);
    let remaining = duration;

    const interval = setInterval(() => {
      if (isPausedRef.current) return;
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
  isPaused: PropTypes.bool,
};

Timer.defaultProps = {
  isPaused: false,
};
