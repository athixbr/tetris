import React, { useEffect, useState } from 'react';
import './GameBoard.css';
import { randomTetromino } from '../utils/tetrominoes';
import { useInterval } from '../hooks/useInterval';

const ROWS = 20;
const COLS = 10;

const createEmptyBoard = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const GameBoard = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [piece, setPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(randomTetromino());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);

  const rotateMatrix = matrix => {
    const size = matrix.length;
    return Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => matrix[size - 1 - x][y])
    );
  };

  const checkCollision = (shape, pos, boardToCheck) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newY = y + pos.y;
          const newX = x + pos.x;
          if (
            newY >= ROWS ||
            newX < 0 ||
            newX >= COLS ||
            (newY >= 0 && boardToCheck[newY][newX] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotatePiece = () => {
    const rotatedShape = rotateMatrix(piece.shape);
    if (!checkCollision(rotatedShape, piece.pos, board)) {
      setPiece(prev => ({ ...prev, shape: rotatedShape }));
    }
  };

  const movePiece = (dx, dy) => {
    const newPos = { x: piece.pos.x + dx, y: piece.pos.y + dy };
    if (!checkCollision(piece.shape, newPos, board)) {
      setPiece(prev => ({ ...prev, pos: newPos }));
    }
  };

  const mergePieceToBoard = (shape, pos, currentBoard) => {
    const newBoard = currentBoard.map(row => [...row]);
    shape.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val) {
          const boardY = y + pos.y;
          const boardX = x + pos.x;
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            newBoard[boardY][boardX] = 1;
          }
        }
      });
    });
    return newBoard;
  };

  const clearFullLines = board => {
    const newBoard = board.filter(row => row.some(cell => cell === 0));
    const clearedLines = ROWS - newBoard.length;

    if (clearedLines > 0) {
      const emptyRows = Array.from({ length: clearedLines }, () =>
        Array(COLS).fill(0)
      );
      const totalScore = [0, 100, 300, 500, 800][clearedLines] || clearedLines * 200;
      setScore(prev => prev + totalScore);
      return [...emptyRows, ...newBoard];
    }

    return board;
  };

  const getBoardWithPiece = () => {
    const tempBoard = board.map(row => [...row]);
    if (!piece) return tempBoard;

    piece.shape.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val) {
          const boardY = y + piece.pos.y;
          const boardX = x + piece.pos.x;
          if (
            boardY >= 0 &&
            boardY < ROWS &&
            boardX >= 0 &&
            boardX < COLS
          ) {
            tempBoard[boardY][boardX] = 1;
          }
        }
      });
    });

    return tempBoard;
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setPiece(null);
    setNextPiece(randomTetromino());
    setScore(0);
    setGameOver(false);
    setShowStartModal(false);
  };

  useEffect(() => {
    if (!piece && !gameOver) {
      setPiece({
        shape: nextPiece.shape,
        pos: { x: 3, y: 0 },
      });
      setNextPiece(randomTetromino());
    }
  }, [piece, nextPiece, gameOver]);

  useEffect(() => {
    const handleKeyDown = e => {
      if (gameOver || showStartModal) return;
      if (e.key === 'ArrowLeft') movePiece(-1, 0);
      if (e.key === 'ArrowRight') movePiece(1, 0);
      if (e.key === 'ArrowDown') movePiece(0, 1);
      if (e.key === 'ArrowUp') rotatePiece();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [piece, board, gameOver, showStartModal]);

  useInterval(() => {
    if (gameOver || showStartModal || !piece) return;

    const newPos = { x: piece.pos.x, y: piece.pos.y + 1 };

    if (!checkCollision(piece.shape, newPos, board)) {
      setPiece(prev => ({ ...prev, pos: newPos }));
    } else {
      const merged = mergePieceToBoard(piece.shape, piece.pos, board);
      const cleaned = clearFullLines(merged);
      setBoard(cleaned);

      const newPiece = {
        shape: nextPiece.shape,
        pos: { x: 3, y: 0 },
      };
      setNextPiece(randomTetromino());

      if (checkCollision(newPiece.shape, newPiece.pos, cleaned)) {
        setGameOver(true);
      } else {
        setPiece(newPiece);
      }
    }
  }, 500);

  const currentBoard = getBoardWithPiece();

  return (
    <div style={{ textAlign: 'center' }}>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
        <div>
          <div className="score-panel">Score: {score}</div>
          <div className="next-piece">
            {nextPiece.shape.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={`cell small ${cell ? 'active' : ''}`}
                />
              ))
            )}
          </div>
        </div>

        <div className="game-board">
          {currentBoard.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`cell ${cell ? 'active' : ''}`}
              />
            ))
          )}
        </div>
      </div>

      {(showStartModal || gameOver) && (
        <div className="modal">
          <div className="modal-content">
            <h2>{gameOver ? 'Game Over 😵' : 'Pronto pra jogar?'}</h2>
            {gameOver && <p>Seu score: {score}</p>}
            <button onClick={resetGame}>{gameOver ? 'Restart' : 'Start Game'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
