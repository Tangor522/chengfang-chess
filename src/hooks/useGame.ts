import { useState, useCallback } from 'react';
import type {
  GameState,
  BoardState,
  Position,
  Player,
} from '../types/game';
import { SQUARES, getAdjacentPositions } from '../types/game';

const INITIAL_BOARD: BoardState = Array(12).fill(null);

const createInitialState = (): GameState => ({
  board: INITIAL_BOARD,
  currentPlayer: 'black',
  phase: 'placing',
  blackPieces: 5,
  whitePieces: 5,
  blackPlaced: 0,
  whitePlaced: 0,
  selectedPosition: null,
  winner: null,
  message: '黑方布子',
  usedSquares: [],
});

export function useGame() {
  const [state, setState] = useState<GameState>(createInitialState);

  // 检查是否成方，返回成方的索引（如果有的话）
  // 排除已经使用过的成方
  const checkSquare = useCallback((board: BoardState, player: Player, usedSquares: string[]): number => {
    for (let i = 0; i < SQUARES.length; i++) {
      const square = SQUARES[i];
      const allSame = square.every(pos => board[pos] === player);
      if (allSame) {
        // 检查这个成方是否已经被使用过
        const squareKey = `${player}-${i}`;
        if (!usedSquares.includes(squareKey)) {
          return i; // 返回成方的索引
        }
      }
    }
    return -1; // 没有新的成方
  }, []);

  // 检查是否被堵住（无法移动）
  const isBlocked = useCallback((board: BoardState, player: Player): boolean => {
    for (let pos = 0; pos < 12; pos++) {
      if (board[pos] === player) {
        const adjacent = getAdjacentPositions(pos);
        const canMove = adjacent.some(p => board[p] === null);
        if (canMove) return false;
      }
    }
    return true;
  }, []);

  // 获取对方可吃的棋子位置
  const getEatablePieces = useCallback((board: BoardState, opponent: Player): Position[] => {
    const positions: Position[] = [];
    for (let pos = 0; pos < 12; pos++) {
      if (board[pos] === opponent) {
        positions.push(pos);
      }
    }
    return positions;
  }, []);

  // 检查胜负
  const checkWinCondition = useCallback((currentState: GameState): GameState => {
    const opponent = currentState.currentPlayer === 'black' ? 'white' : 'black';
    const opponentPieces = opponent === 'black' ? currentState.blackPieces : currentState.whitePieces;

    // 吃掉对方2子获胜 (初始5子，被吃2子后剩3子)
    if (opponentPieces <= 3) {
      return {
        ...currentState,
        phase: 'ended',
        winner: currentState.currentPlayer,
        message: `${currentState.currentPlayer === 'black' ? '黑方' : '白方'}获胜！`,
      };
    }

    // 检查当前玩家是否无法移动（和棋）
    if (currentState.phase === 'moving' && isBlocked(currentState.board, currentState.currentPlayer)) {
      return {
        ...currentState,
        phase: 'ended',
        winner: 'draw',
        message: '和棋！（无法移动）',
      };
    }

    return currentState;
  }, [isBlocked]);

  // 处理位置点击 - 统一处理所有阶段
  const handlePositionClick = useCallback((pos: Position) => {
    setState(prevState => {
      if (prevState.phase === 'ended') return prevState;

      // === 吃子阶段 ===
      if (prevState.phase === 'eating') {
        const opponent = prevState.currentPlayer === 'black' ? 'white' : 'black';
        if (prevState.board[pos] !== opponent) return prevState;

        const newBoard = [...prevState.board] as BoardState;
        newBoard[pos] = null;

        const isEatingBlack = opponent === 'black';
        const newState: GameState = {
          ...prevState,
          board: newBoard,
          blackPieces: isEatingBlack ? prevState.blackPieces - 1 : prevState.blackPieces,
          whitePieces: isEatingBlack ? prevState.whitePieces : prevState.whitePieces - 1,
          phase: prevState.blackPlaced >= 5 && prevState.whitePlaced >= 5 ? 'moving' : 'placing',
          currentPlayer: opponent,
        };

        // 检查胜负
        const checkedState = checkWinCondition({
          ...newState,
          currentPlayer: prevState.currentPlayer,
        });

        if (checkedState.phase === 'ended') {
          return checkedState;
        }

        newState.message = `${newState.currentPlayer === 'black' ? '黑方' : '白方'}${newState.phase === 'placing' ? '布子' : '走子'}`;
        return newState;
      }

      // === 布子阶段 ===
      if (prevState.phase === 'placing') {
        if (prevState.board[pos] !== null) return prevState;

        const newBoard = [...prevState.board] as BoardState;
        newBoard[pos] = prevState.currentPlayer;

        const isBlack = prevState.currentPlayer === 'black';
        const newPlaced = isBlack ? prevState.blackPlaced + 1 : prevState.whitePlaced + 1;

        // 检查是否成方（在切换玩家之前检查）
        const squareIndex = checkSquare(newBoard, prevState.currentPlayer, prevState.usedSquares);
        if (squareIndex >= 0) {
          const opponent = isBlack ? 'white' : 'black';
          const eatable = getEatablePieces(newBoard, opponent as Player);
          if (eatable.length > 0) {
            // 成方后保持当前玩家不变，让当前玩家吃子
            // 标记这个成方已经使用过
            const newUsedSquares = [...prevState.usedSquares, `${prevState.currentPlayer}-${squareIndex}`];
            return {
              ...prevState,
              board: newBoard,
              blackPlaced: isBlack ? newPlaced : prevState.blackPlaced,
              whitePlaced: isBlack ? prevState.whitePlaced : newPlaced,
              phase: 'eating',
              message: `${isBlack ? '黑方' : '白方'}成方！请选择吃掉对方一子`,
              usedSquares: newUsedSquares,
            };
          }
        }

        const newState: GameState = {
          ...prevState,
          board: newBoard,
          blackPlaced: isBlack ? newPlaced : prevState.blackPlaced,
          whitePlaced: isBlack ? prevState.whitePlaced : newPlaced,
          currentPlayer: isBlack ? 'white' : 'black',
        };

        // 检查布子是否完成
        if (newState.blackPlaced >= 5 && newState.whitePlaced >= 5) {
          newState.phase = 'moving';
          newState.message = '布子完成，黑方走子';
          newState.currentPlayer = 'black';
        } else {
          newState.message = `${newState.currentPlayer === 'black' ? '黑方' : '白方'}布子`;
        }

        return newState;
      }

      // === 走子阶段 ===
      if (prevState.phase === 'moving') {
        const clickedPiece = prevState.board[pos];

        // 如果点击的是自己的棋子，选中它
        if (clickedPiece === prevState.currentPlayer) {
          return {
            ...prevState,
            selectedPosition: pos,
            message: '请选择移动目标位置',
          };
        }

        // 如果已选中棋子且点击空位，尝试移动
        if (prevState.selectedPosition !== null && clickedPiece === null) {
          // 检查是否是相邻位置
          const adjacent = getAdjacentPositions(prevState.selectedPosition);
          if (!adjacent.includes(pos)) return prevState;

          const newBoard = [...prevState.board] as BoardState;
          newBoard[pos] = prevState.currentPlayer;
          newBoard[prevState.selectedPosition] = null;

          // 移动后清除该玩家已使用过的成方记录（因为棋子位置变了）
          const newUsedSquares = prevState.usedSquares.filter(key => !key.startsWith(prevState.currentPlayer));

          const newState: GameState = {
            ...prevState,
            board: newBoard,
            selectedPosition: null,
            usedSquares: newUsedSquares,
          };

          // 检查是否成方
          const squareIndex = checkSquare(newBoard, prevState.currentPlayer, newUsedSquares);
          if (squareIndex >= 0) {
            const opponent = prevState.currentPlayer === 'black' ? 'white' : 'black';
            const eatable = getEatablePieces(newBoard, opponent);
            if (eatable.length > 0) {
              // 标记这个成方已经使用过
              newState.usedSquares = [...newUsedSquares, `${prevState.currentPlayer}-${squareIndex}`];
              newState.phase = 'eating';
              newState.message = `${prevState.currentPlayer === 'black' ? '黑方' : '白方'}成方！请选择吃掉对方一子`;
              return newState;
            }
          }

          // 切换玩家
          newState.currentPlayer = prevState.currentPlayer === 'black' ? 'white' : 'black';
          newState.message = `${newState.currentPlayer === 'black' ? '黑方' : '白方'}走子`;

          // 检查胜负
          return checkWinCondition(newState);
        }
      }

      return prevState;
    });
  }, [checkSquare, getEatablePieces, checkWinCondition]);

  // 重新开始
  const resetGame = useCallback(() => {
    setState(createInitialState());
  }, []);

  // 获取可移动位置（用于高亮显示）
  const getMovablePositions = useCallback((): Position[] => {
    if (state.phase !== 'moving' || state.selectedPosition === null) return [];
    return getAdjacentPositions(state.selectedPosition).filter(
      pos => state.board[pos] === null
    );
  }, [state.phase, state.selectedPosition, state.board]);

  // 获取可吃的棋子位置
  const getEatablePositions = useCallback((): Position[] => {
    if (state.phase !== 'eating') return [];
    const opponent = state.currentPlayer === 'black' ? 'white' : 'black';
    return getEatablePieces(state.board, opponent);
  }, [state.phase, state.currentPlayer, state.board, getEatablePieces]);

  return {
    state,
    handlePositionClick,
    resetGame,
    getMovablePositions,
    getEatablePositions,
  };
}
