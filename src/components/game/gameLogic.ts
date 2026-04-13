// Four-in-a-Row game logic
// Ported from deep_rl/classes/beck/beck_game.py
// Board: 4 rows x 9 columns, free placement (click any empty cell), k=4 to win

export const ROWS = 4;
export const COLS = 9;
export const K = 4; // pieces in a row to win

export type Player = 1 | -1;
export type Cell = 0 | 1 | -1;
export type Board = Cell[][];

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export function getValidMoves(board: Board): number[] {
  const moves: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === 0) moves.push(r * COLS + c);
    }
  }
  return moves;
}

export function makeMove(board: Board, action: number, player: Player): Board {
  const newBoard = board.map(row => [...row]);
  const r = Math.floor(action / COLS);
  const c = action % COLS;
  newBoard[r][c] = player;
  return newBoard;
}

// Check for k-in-a-row in all 4 directions
// Returns: 1 if player 1 wins, -1 if player -1 wins, 0.0001 if draw, 0 if ongoing
export function checkWinner(board: Board): number {
  const directions = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal
    [1, -1], // anti-diagonal
  ];

  for (const player of [1, -1] as Player[]) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] !== player) continue;
        for (const [dr, dc] of directions) {
          let count = 1;
          for (let step = 1; step < K; step++) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
            if (board[nr][nc] !== player) break;
            count++;
          }
          if (count >= K) return player;
        }
      }
    }
  }

  // Check for draw
  const hasEmpty = board.some(row => row.some(cell => cell === 0));
  if (!hasEmpty) return 0.0001;

  return 0;
}

// Get the winning cells for highlighting
export function getWinningCells(board: Board): [number, number][] | null {
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1],
  ];

  for (const player of [1, -1] as Player[]) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] !== player) continue;
        for (const [dr, dc] of directions) {
          const cells: [number, number][] = [[r, c]];
          for (let step = 1; step < K; step++) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
            if (board[nr][nc] !== player) break;
            cells.push([nr, nc]);
          }
          if (cells.length >= K) return cells;
        }
      }
    }
  }
  return null;
}

// Heuristic evaluation for minimax
function evaluate(board: Board): number {
  const winner = checkWinner(board);
  if (winner === 1) return 10000;
  if (winner === -1) return -10000;

  let score = 0;
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of directions) {
        let p1 = 0, p2 = 0, empty = 0;
        for (let step = 0; step < K; step++) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          if (board[nr][nc] === 1) p1++;
          else if (board[nr][nc] === -1) p2++;
          else empty++;
        }
        if (p1 + empty >= K && p2 === 0) score += p1 * p1;
        if (p2 + empty >= K && p1 === 0) score -= p2 * p2;
      }
    }
  }

  // Center preference
  const centerCol = Math.floor(COLS / 2);
  for (let r = 0; r < ROWS; r++) {
    if (board[r][centerCol] === 1) score += 3;
    if (board[r][centerCol] === -1) score -= 3;
  }

  return score;
}

// Minimax with alpha-beta pruning
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  const winner = checkWinner(board);
  if (winner !== 0 || depth === 0) {
    if (winner === 1) return 10000 + depth;
    if (winner === -1) return -10000 - depth;
    if (winner === 0.0001) return 0;
    return evaluate(board);
  }

  const moves = getValidMoves(board);

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move, 1);
      const eval_ = minimax(newBoard, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move, -1);
      const eval_ = minimax(newBoard, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// AI move selection
export function getAiMove(board: Board, player: Player, depth: number = 4): number {
  const moves = getValidMoves(board);
  if (moves.length === 0) return -1;

  let bestMove = moves[0];
  let bestScore = player === 1 ? -Infinity : Infinity;

  for (const move of moves) {
    const newBoard = makeMove(board, move, player);
    const score = minimax(newBoard, depth - 1, -Infinity, Infinity, player !== 1);

    if (player === 1 && score > bestScore) {
      bestScore = score;
      bestMove = move;
    } else if (player === -1 && score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
