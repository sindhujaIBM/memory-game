import React from "react";
import GameBoard from "./components/GameBoard";
import Timer from "./components/Timer";
import "./App.css";

function App() {
  return (
    <div className="App">
      <h1>🧠 Memory Madness</h1>
      <Timer isActive={true} />
      <GameBoard />
    </div>
  );
}

export default App;
