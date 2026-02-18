import React, { useEffect, useState } from "react";

export default function Timer({ isActive, onTimeUp }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="timer">
      ⏱ {time}s
    </div>
  );
}
