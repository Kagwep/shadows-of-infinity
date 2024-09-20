import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import GameScene from './components/GameScene';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  return (
    <div className="w-screen h-screen">
      {!gameStarted ? (
        <HomePage onStartGame={handleStartGame} />
      ) : (
        <GameScene />
      )}
    </div>
  );
};

export default App;