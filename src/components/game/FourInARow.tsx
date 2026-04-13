import { useState, useCallback, useEffect } from 'react';
import {
  ROWS, COLS,
  createBoard, makeMove, checkWinner, getWinningCells, getAiMove,
  type Board, type Player,
} from './gameLogic';

type GameState = 'playing' | 'won' | 'lost' | 'draw';
type Difficulty = 'easy' | 'medium' | 'hard';

const difficultyDepth: Record<Difficulty, number> = {
  easy: 2,
  medium: 3,
  hard: 5,
};

export default function FourInARow() {
  const [board, setBoard] = useState<Board>(createBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [winCells, setWinCells] = useState<[number, number][] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [aiThinking, setAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);

  const humanPlayer: Player = 1;
  const aiPlayer: Player = -1;

  const reset = useCallback(() => {
    setBoard(createBoard());
    setCurrentPlayer(1);
    setGameState('playing');
    setWinCells(null);
    setAiThinking(false);
    setLastMove(null);
    setMoveCount(0);
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState !== 'playing' || currentPlayer !== humanPlayer || aiThinking) return;
    if (board[row][col] !== 0) return;

    const action = row * COLS + col;
    const newBoard = makeMove(board, action, humanPlayer);
    setBoard(newBoard);
    setLastMove(action);
    setMoveCount(m => m + 1);

    const winner = checkWinner(newBoard);
    if (winner !== 0) {
      if (winner === humanPlayer) setGameState('won');
      else if (winner === 0.0001) setGameState('draw');
      setWinCells(getWinningCells(newBoard));
      return;
    }

    setCurrentPlayer(aiPlayer);
    setAiThinking(true);
  }, [board, currentPlayer, gameState, aiThinking, humanPlayer, aiPlayer]);

  // AI turn
  useEffect(() => {
    if (currentPlayer !== aiPlayer || gameState !== 'playing' || !aiThinking) return;

    const timer = setTimeout(() => {
      const move = getAiMove(board, aiPlayer, difficultyDepth[difficulty]);
      if (move === -1) return;

      const newBoard = makeMove(board, move, aiPlayer);
      setBoard(newBoard);
      setLastMove(move);
      setMoveCount(m => m + 1);
      setAiThinking(false);

      const winner = checkWinner(newBoard);
      if (winner !== 0) {
        if (winner === aiPlayer) setGameState('lost');
        else if (winner === 0.0001) setGameState('draw');
        setWinCells(getWinningCells(newBoard));
        return;
      }

      setCurrentPlayer(humanPlayer);
    }, 400 + Math.random() * 300);

    return () => clearTimeout(timer);
  }, [currentPlayer, aiPlayer, humanPlayer, gameState, aiThinking, board, difficulty]);

  const isWinCell = (r: number, c: number) =>
    winCells?.some(([wr, wc]) => wr === r && wc === c) ?? false;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Game header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Four-in-a-Row</h2>
          <p className="text-sm text-gray-500">
            4 x 9 board &middot; Place anywhere &middot; From{' '}
            <a href="https://openreview.net/forum?id=ZAbYb4jDJt" target="_blank" rel="noopener" className="text-sky-400 hover:text-sky-300">
              Lin et al., NeurIPS 2024
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => { setDifficulty(d); reset(); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                difficulty === d
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${currentPlayer === humanPlayer ? 'bg-sky-400' : 'bg-orange-400'}`} />
          <span className="text-sm text-gray-400">
            {gameState === 'playing'
              ? aiThinking
                ? 'AI is thinking...'
                : 'Your turn — click an empty cell'
              : gameState === 'won'
              ? 'You won!'
              : gameState === 'lost'
              ? 'AI wins. Try again?'
              : 'Draw!'}
          </span>
        </div>
        <span className="text-xs text-gray-600 font-mono">move {moveCount}</span>
      </div>

      {/* Board */}
      <div
        className="relative rounded-2xl p-3 sm:p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => {
              const cell = board[r][c];
              const action = r * COLS + c;
              const isLast = lastMove === action;
              const isWin = isWinCell(r, c);
              const isEmpty = cell === 0;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!isEmpty || gameState !== 'playing' || aiThinking}
                  className={`
                    aspect-square rounded-lg sm:rounded-xl relative
                    transition-all duration-200
                    ${isEmpty && gameState === 'playing' && !aiThinking
                      ? 'hover:bg-white/10 cursor-pointer hover:scale-105'
                      : ''}
                    ${isWin ? 'scale-110 z-10' : ''}
                  `}
                  style={{
                    background: cell === 0
                      ? 'rgba(255,255,255,0.03)'
                      : cell === 1
                      ? isWin ? '#38bdf8' : 'rgba(56, 189, 248, 0.7)'
                      : isWin ? '#fb923c' : 'rgba(251, 146, 60, 0.7)',
                    border: `1px solid ${
                      isWin ? (cell === 1 ? '#38bdf8' : '#fb923c')
                      : isLast ? 'rgba(255,255,255,0.25)'
                      : 'rgba(255,255,255,0.04)'
                    }`,
                    boxShadow: isWin
                      ? `0 0 20px ${cell === 1 ? 'rgba(56,189,248,0.4)' : 'rgba(251,146,60,0.4)'}`
                      : isLast
                      ? '0 0 10px rgba(255,255,255,0.1)'
                      : 'none',
                  }}
                >
                  {cell !== 0 && (
                    <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                      {cell === 1 ? 'X' : 'O'}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* AI thinking overlay */}
        {aiThinking && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-orange-400"
                  style={{
                    animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Game over actions */}
      {gameState !== 'playing' && (
        <div className="mt-6 text-center">
          <button
            onClick={reset}
            className="px-6 py-2 rounded-xl text-sm font-medium text-white bg-sky-500/20 border border-sky-500/30 hover:bg-sky-500/30 transition-all"
          >
            Play again
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-sky-400/70" />
          <span>You (X)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-400/70" />
          <span>AI (O)</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
