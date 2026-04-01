// 棋子类型
export type PieceType = 'black' | 'white' | null;

// 位置 (12个点，编号0-11)
export type Position = number;

// 棋盘状态 (12个位置)
export type BoardState = PieceType[];

// 游戏阶段
export type GamePhase = 'placing' | 'moving' | 'eating' | 'ended';

// 玩家
export type Player = 'black' | 'white';

// 游戏状态
export interface GameState {
  board: BoardState;
  currentPlayer: Player;
  phase: GamePhase;
  blackPieces: number;
  whitePieces: number;
  blackPlaced: number;
  whitePlaced: number;
  selectedPosition: Position | null;
  winner: Player | 'draw' | null;
  message: string;
  // 记录已经使用过的成方（防止连续吃子）
  // 格式: "玩家-正方形索引"，如 "black-0" 表示黑方在大正方形上已经用过成方
  usedSquares: string[];
}

// 棋盘参数
const MARGIN = 30;           // 边距
const BOARD_SIZE = 240;      // 棋盘大小 (270-30)
const THIRD = BOARD_SIZE / 3;    // 边长的1/3 = 80
const TWO_THIRDS = BOARD_SIZE * 2 / 3; // 边长的2/3 = 160

// 每个点在画布上的坐标 (用于渲染)
// 棋盘结构：1个大正方形 + 2个部分重叠的小正方形（右上和左下）
//
// 布局示意（300x300画布）：
//
//  0(左上)-----------P1(上边)----------1(右上)
//    |                 |                 |
//    |                 |                 |
//    |           I3(内右上)-------P2(右边)
//    |                 |                 |
//  P4(左边)------I4(内左下)-------I1(内右下)
//    |                 |                 |
//    |                 |                 |
//  3(左下)-----------P3(下边)----------2(右下)
//
// 12个点分布：
// - 大正方形4角 (0-3)
// - 边长1/3处的4个点 (4-7)：靠近右上和左下
// - 内部4个交点 (8-11)：由边点向内衍生2L/3形成的交点

export const POSITION_COORDS: { x: number; y: number }[] = [
  // 大正方形4角 (0-3)
  { x: MARGIN, y: MARGIN },                    // 0: 左上角 (30, 30)
  { x: MARGIN + BOARD_SIZE, y: MARGIN },       // 1: 右上角 (270, 30)
  { x: MARGIN + BOARD_SIZE, y: MARGIN + BOARD_SIZE }, // 2: 右下角 (270, 270)
  { x: MARGIN, y: MARGIN + BOARD_SIZE },       // 3: 左下角 (30, 270)

  // 边长1/3处的4个点 (4-7)
  // 上边点：靠近右上角1/3，从右上角往左走80
  { x: MARGIN + TWO_THIRDS, y: MARGIN },       // 4: 上边点 (190, 30)
  // 右边点：靠近右上角1/3，从右上角往下走80
  { x: MARGIN + BOARD_SIZE, y: MARGIN + THIRD }, // 5: 右边点 (270, 110)
  // 下边点：靠近左下角1/3，从左下角往右走80
  { x: MARGIN + THIRD, y: MARGIN + BOARD_SIZE }, // 6: 下边点 (110, 270)
  // 左边点：靠近左下角1/3，从左下角往上走80
  { x: MARGIN, y: MARGIN + TWO_THIRDS },       // 7: 左边点 (30, 190)

  // 内部4个交点 (8-11)：边点向内衍生2L/3形成的交点
  // 上边点(190,30)向下衍生160 -> (190,190)
  // 右边点(270,110)向左衍生160 -> (110,110)
  // 交叉点：(190,110) - 上边点衍生线与右边点衍生线的交点
  { x: MARGIN + TWO_THIRDS, y: MARGIN + THIRD }, // 8: 内部交点1 (190, 110)

  // 左边点(30,190)向右衍生160 -> (190,190)
  // 下边点(110,270)向上衍生160 -> (110,110)
  // 交叉点：(110,190) - 左边点衍生线与下边点衍生线的交点
  { x: MARGIN + THIRD, y: MARGIN + TWO_THIRDS }, // 9: 内部交点2 (110, 190)

  // 上边点衍生线终点：(190,190)
  { x: MARGIN + TWO_THIRDS, y: MARGIN + TWO_THIRDS }, // 10: 内部点3 (190, 190)

  // 右边点衍生线终点：(110,110)
  { x: MARGIN + THIRD, y: MARGIN + THIRD }, // 11: 内部点4 (110, 110)
];

// 可成方的正方形顶点 (用于成方判定)
// 共6个正方形可成方
export const SQUARES: Position[][] = [
  // 大正方形（4角）
  [0, 1, 2, 3],
  // 左上小正方形：左上角、上边点、内点3、左边点
  [0, 4, 10, 7],
  // 右上小正方形：上边点、右上角、右边点、内点1
  [4, 1, 5, 8],
  // 中心小正方形：内点4、内点1、内点2、内点3
  [11, 8, 9, 10],
  // 右下小正方形：内点4、右边点、右下角、下边点
  [11, 5, 2, 6],
  // 左下小正方形：左边点、内点2、下边点、左下角
  [7, 9, 6, 3],
];

// 相邻位置（用于移动判定）
// 线条连接规则：
// 1. 大正方形四边连接4角
// 2. 边点连接到相邻的角
// 3. 边点向内衍生连接到内部点
// 4. 内部点之间有连接（形成小正方形）
// 注意：所有移动都是一步一格，不能跳过中间的棋子
// 角点不能直接跳到另一个角点，必须经过中间的边点
export function getAdjacentPositions(pos: Position): Position[] {
  const adjacencyMap: Record<number, number[]> = {
    // 大正方形4角：只能移动到相邻的边点，不能直接跳到另一个角
    0: [4, 7],              // 左上角: 只连接上边点、左边点
    1: [4, 5],              // 右上角: 只连接上边点、右边点
    2: [5, 6],              // 右下角: 只连接右边点、下边点
    3: [6, 7],              // 左下角: 只连接下边点、左边点

    // 边点 (4-7)：连接相邻角点和直接向内的第一站
    4: [0, 1, 8],           // 上边点: 连接左上角、右上角、内点1
    5: [1, 2, 8],           // 右边点: 连接右上角、右下角、内点1
    6: [2, 3, 9],           // 下边点: 连接右下角、左下角、内点2
    7: [0, 3, 9],           // 左边点: 连接左上角、左下角、内点2

    // 内部点 (8-11)：连接边点和内部小正方形
    8: [4, 5, 10, 11],      // 内点1: 连接上边点、右边点、内点3、内点4
    9: [6, 7, 10, 11],      // 内点2: 连接下边点、左边点、内点3、内点4
    10: [8, 9],             // 内点3: 连接内点1、内点2
    11: [8, 9],             // 内点4: 连接内点1、内点2
  };
  return adjacencyMap[pos] || [];
}
