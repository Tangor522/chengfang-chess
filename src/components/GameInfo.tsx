import React from 'react';
import type { GameState } from '../types/game';
import './GameInfo.css';

interface GameInfoProps {
  state: GameState;
  onReset: () => void;
}

export const GameInfo: React.FC<GameInfoProps> = ({ state, onReset }) => {
  const getPhaseText = () => {
    switch (state.phase) {
      case 'placing':
        return '布子阶段';
      case 'moving':
        return '走子阶段';
      case 'eating':
        return '成方！选择吃子';
      case 'ended':
        return '游戏结束';
      default:
        return '';
    }
  };

  return (
    <div className="game-info">
      <h1 className="game-title">成方棋</h1>

      <div className="status-bar">
        <div className={`player-indicator ${state.currentPlayer === 'black' ? 'active' : ''}`}>
          <div className="player-piece black" />
          <span>黑方</span>
          <span className="piece-count">{state.blackPieces}子</span>
        </div>
        <div className="phase-indicator">{getPhaseText()}</div>
        <div className={`player-indicator ${state.currentPlayer === 'white' ? 'active' : ''}`}>
          <div className="player-piece white" />
          <span>白方</span>
          <span className="piece-count">{state.whitePieces}子</span>
        </div>
      </div>

      <div className="message-box">
        <p>{state.message}</p>
      </div>

      {state.phase === 'ended' && (
        <div className="result-overlay">
          <div className="result-content">
            <h2>{state.winner === 'draw' ? '和棋！' : `${state.winner === 'black' ? '黑方' : '白方'}获胜！`}</h2>
            <button className="restart-btn" onClick={onReset}>
              再来一局
            </button>
          </div>
        </div>
      )}

      <button className="reset-btn" onClick={onReset}>
        重新开始
      </button>

      <div className="rules">
        <h3>游戏规则</h3>
        <ul>
          <li><strong>布子：</strong>黑棋先走，双方轮流把棋子布在空位上</li>
          <li><strong>走子：</strong>布子完成后，轮流移动棋子（每次一格）</li>
          <li><strong>成方：</strong>4个棋子排列在正方形4个顶点上</li>
          <li><strong>吃子：</strong>成方后可吃掉对方任意一子</li>
          <li><strong>胜负：</strong>吃掉对方2子获胜，被堵住判和棋</li>
        </ul>
      </div>
    </div>
  );
};
