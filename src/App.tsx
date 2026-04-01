import { Board } from './components/Board';
import { GameInfo } from './components/GameInfo';
import { useGame } from './hooks/useGame';
import './App.css';

function App() {
  const { state, handlePositionClick, resetGame, getMovablePositions, getEatablePositions } = useGame();

  return (
    <div className="app">
      <div className="game-container">
        <Board
          state={state}
          onPositionClick={handlePositionClick}
          movablePositions={getMovablePositions()}
          eatablePositions={getEatablePositions()}
        />
        <GameInfo state={state} onReset={resetGame} />
      </div>
    </div>
  );
}

export default App;
