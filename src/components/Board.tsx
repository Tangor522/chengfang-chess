import React from 'react';
import type { GameState, Position } from '../types/game';
import { POSITION_COORDS } from '../types/game';
import './Board.css';

interface BoardProps {
  state: GameState;
  onPositionClick: (pos: Position) => void;
  movablePositions: Position[];
  eatablePositions: Position[];
}

export const Board: React.FC<BoardProps> = ({
  state,
  onPositionClick,
  movablePositions,
  eatablePositions,
}) => {
  const isMovable = (pos: Position) => movablePositions.includes(pos);
  const isEatable = (pos: Position) => eatablePositions.includes(pos);
  const isSelected = (pos: Position) => state.selectedPosition === pos;

  const renderPiece = (piece: 'black' | 'white' | null, pos: Position) => {
    if (!piece) return null;

    return (
      <div
        className={`piece ${piece} ${isEatable(pos) ? 'eatable' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onPositionClick(pos);
        }}
      />
    );
  };

  const positions: Position[] = Array.from({ length: 12 }, (_, i) => i);

  // 坐标辅助函数
  const coord = (pos: Position) => POSITION_COORDS[pos];

  return (
    <div className="board-container">
      <div className="board">
        {/* 棋盘线条 */}
        <svg className="board-lines" viewBox="0 0 300 300">
          {/* 大正方形外框 */}
          <rect x="30" y="30" width="240" height="240" fill="none" stroke="#8B4513" strokeWidth="3" />

          {/* 边点连接线：边点到角 */}
          {/* 上边点(4)到左上角(0)和右上角(1) */}
          <line x1={coord(4).x} y1={coord(4).y} x2={coord(0).x} y2={coord(0).y} stroke="#8B4513" strokeWidth="2" />
          <line x1={coord(4).x} y1={coord(4).y} x2={coord(1).x} y2={coord(1).y} stroke="#8B4513" strokeWidth="2" />
          {/* 右边点(5)到右上角(1)和右下角(2) */}
          <line x1={coord(5).x} y1={coord(5).y} x2={coord(1).x} y2={coord(1).y} stroke="#8B4513" strokeWidth="2" />
          <line x1={coord(5).x} y1={coord(5).y} x2={coord(2).x} y2={coord(2).y} stroke="#8B4513" strokeWidth="2" />
          {/* 下边点(6)到右下角(2)和左下角(3) */}
          <line x1={coord(6).x} y1={coord(6).y} x2={coord(2).x} y2={coord(2).y} stroke="#8B4513" strokeWidth="2" />
          <line x1={coord(6).x} y1={coord(6).y} x2={coord(3).x} y2={coord(3).y} stroke="#8B4513" strokeWidth="2" />
          {/* 左边点(7)到左下角(3)和左上角(0) */}
          <line x1={coord(7).x} y1={coord(7).y} x2={coord(3).x} y2={coord(3).y} stroke="#8B4513" strokeWidth="2" />
          <line x1={coord(7).x} y1={coord(7).y} x2={coord(0).x} y2={coord(0).y} stroke="#8B4513" strokeWidth="2" />

          {/* 边点向内衍生线 */}
          {/* 上边点(4)向下衍生到内点3(10)，经过内点1(8) */}
          <line x1={coord(4).x} y1={coord(4).y} x2={coord(10).x} y2={coord(10).y} stroke="#8B4513" strokeWidth="2" />
          {/* 右边点(5)向左衍生到内点4(11)，经过内点1(8) */}
          <line x1={coord(5).x} y1={coord(5).y} x2={coord(11).x} y2={coord(11).y} stroke="#8B4513" strokeWidth="2" />
          {/* 下边点(6)向上衍生到内点4(11)，经过内点2(9) */}
          <line x1={coord(6).x} y1={coord(6).y} x2={coord(11).x} y2={coord(11).y} stroke="#8B4513" strokeWidth="2" />
          {/* 左边点(7)向右衍生到内点3(10)，经过内点2(9) */}
          <line x1={coord(7).x} y1={coord(7).y} x2={coord(10).x} y2={coord(10).y} stroke="#8B4513" strokeWidth="2" />


          {/* 内部小正方形四条边 */}
          {/* 上边: 11-8 */}
          <line x1={coord(11).x} y1={coord(11).y} x2={coord(8).x} y2={coord(8).y} stroke="#8B4513" strokeWidth="2" />
          {/* 右边: 8-10 */}
          <line x1={coord(8).x} y1={coord(8).y} x2={coord(10).x} y2={coord(10).y} stroke="#8B4513" strokeWidth="2" />
          {/* 下边: 10-9 */}
          <line x1={coord(10).x} y1={coord(10).y} x2={coord(9).x} y2={coord(9).y} stroke="#8B4513" strokeWidth="2" />
          {/* 左边: 9-11 */}
          <line x1={coord(9).x} y1={coord(9).y} x2={coord(11).x} y2={coord(11).y} stroke="#8B4513" strokeWidth="2" />
        </svg>

        {/* 交叉点 */}
        {positions.map((pos) => {
          const c = coord(pos);
          return (
            <div
              key={pos}
              className={`intersection
                ${isSelected(pos) ? 'selected' : ''}
                ${isMovable(pos) ? 'movable' : ''}`}
              style={{
                left: `${c.x}px`,
                top: `${c.y}px`,
              }}
              onClick={() => onPositionClick(pos)}
            >
              <div className="intersection-dot" />
              {renderPiece(state.board[pos], pos)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
