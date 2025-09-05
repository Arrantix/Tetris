const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const nextPieceCanvas = document.getElementById('next-piece');
const nextPieceContext = nextPieceCanvas.getContext('2d');

context.scale(20, 20);
nextPieceContext.scale(16, 16);

const arena = createMatrix(10, 20);
const player = {
  pos: {x: 0, y: 0},
  matrix: null,
  nextMatrix: null,
  score: 0,
  lines: 0,
  level: 0,
};


const colors = [
  null,
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF',
];

const pieces = 'ILJOTSZ';

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  if (type === 'I') {
    return [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ];
  } else if (type === 'L') {
    return [
      [0, 2, 0],
      [0, 2, 0],
      [0, 2, 2],
    ];
  } else if (type === 'J') {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [3, 3, 0],
    ];
  } else if (type === 'O') {
    return [
      [4, 4],
      [4, 4],
    ];
  } else if (type === 'T') {
    return [
      [0, 5, 0],
      [5, 5, 5],
      [0, 0, 0],
    ];
  } else if (type === 'S') {
    return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0],
    ];
  } else if (type === 'Z') {
    return [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ];
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, {x: 0, y: 0}, context, true); // draw borders for arena
  drawMatrix(player.matrix, player.pos, context, true); // draw player piece
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [
        matrix[x][y],
        matrix[y][x],
      ] = [
        matrix[y][x],
        matrix[x][y],
      ];
    }
  }

  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    updateScore();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(offset) {
  player.pos.x += offset;
  if (collide(arena, player)) {
    player.pos.x -= offset;
  }
}

function playerReset() {
  const pieces = 'ILJOTSZ';
  if (player.nextMatrix === null) {
    player.nextMatrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  }
  player.matrix = player.nextMatrix;
  player.nextMatrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.level = 0;
    updateScore();
  }
  drawNextPiece();
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0) {
        const newY = y + o.y;
        const newX = x + o.x;
        if (newY < 0 || newY >= arena.length || newX < 0 || newX >= arena[0].length || arena[newY][newX] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }

    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;

    player.score += rowCount * 10;
    player.lines++;
    player.level = Math.floor(player.lines / 10);
    rowCount *= 2;
  }
}

function updateScore() {
  scoreElement.innerText = player.score;
  linesElement.innerText = player.lines;
  levelElement.innerText = player.level;
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  const currentDropInterval = Math.max(50, 1000 - player.level * 50);
  if (dropCounter > currentDropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}

let musicStarted = false;
document.addEventListener('keydown', event => {
  if (!musicStarted) {
    tetrisMusic.play().catch(() => {});
    musicStarted = true;
  }
  if (event.keyCode === 37) {
    playerMove(-1);
  } else if (event.keyCode === 39) {
    playerMove(1);
  } else if (event.keyCode === 40) {
    playerDrop();
  } else if (event.keyCode === 38) {
    playerRotate(-1);
  } else if (event.keyCode === 32) {
    while (!collide(arena, player)) {
      player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
});

playerReset();
updateScore();
update();



// Add toggle music button event listener
const toggleMusicButton = document.getElementById('toggle-music');
const tetrisMusic = document.getElementById('tetris-music');

tetrisMusic.volume = 0.02;
tetrisMusic.play().catch(() => {}); // try to play on load, ignore if blocked
document.addEventListener('click', () => {
  tetrisMusic.play().catch(() => {});
}, { once: true }); // play on first click
toggleMusicButton.addEventListener('click', () => {
  if (tetrisMusic.paused) {
    tetrisMusic.play().catch(() => {});
  }
  if (tetrisMusic.muted) {
    tetrisMusic.muted = false;
    toggleMusicButton.textContent = 'Mute Music';
  } else {
    tetrisMusic.muted = true;
    toggleMusicButton.textContent = 'Unmute Music';
  }
});
function drawNextPiece() {
  nextPieceContext.fillStyle = '#000';
  nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
  // Calculate offset to perfectly center the piece in the 4x4 preview canvas with visual tweak
  const matrix = player.nextMatrix;
  const width = matrix[0].length;
  const height = matrix.length;
  const offsetX = (4 - width) / 2 + 0.15; // small visual nudge
  const offsetY = (4 - height) / 2 + 0.15; // small visual nudge
  drawMatrix(matrix, {x: offsetX, y: offsetY}, nextPieceContext);
}

function drawMatrix(matrix, offset, ctx = context, drawBorders = false) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        if (drawBorders) {
          ctx.strokeStyle = '#000'; // black border for separation
          ctx.lineWidth = 0.05;
          ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
        }
      }
    });
  });
}

// ===== ADVANCED TETRIS AI =====

// Advanced AI weights for perfect play - optimized for Tetris (4-line clears)
const AI_WEIGHTS = {
  aggregateHeight: -0.510066,
  completeLines: -2.0,  // Strongly penalize line clearing to encourage Tetris buildup
  holes: -50.0,  // Strongly penalize holes to prevent creating gaps
  bumpiness: -0.184483,
  maxHeight: -2.25,  // Increased penalty to discourage building too high
  wellDepth: -0.0288407,
  rowTransitions: -0.128854,
  columnTransitions: -0.123644,
  overhangPenalty: -0.0366875,
  holeDepthPenalty: -0.0234375,
  surfaceRoughness: -0.015625,
  tetrisReady: 4.5,  // Increased slightly to maintain Tetris priority
  tspinPotential: 0.3
};

function cloneMatrix(matrix) {
  return matrix.map(row => row.slice());
}

function getAggregateHeight(board) {
  let total = 0;
  for (let x = 0; x < board[0].length; x++) {
    total += getColumnHeight(board, x);
  }
  return total;
}

function getColumnHeight(board, x) {
  for (let y = 0; y < board.length; y++) {
    if (board[y][x] !== 0) {
      return board.length - y;
    }
  }
  return 0;
}

function getCompleteLines(board) {
  let completeLines = 0;
  for (let y = 0; y < board.length; y++) {
    if (board[y].every(cell => cell !== 0)) {
      completeLines++;
    }
  }
  return completeLines;
}

function getHoles(board) {
  let holes = 0;
  for (let x = 0; x < board[0].length; x++) {
    let blockFound = false;
    for (let y = 0; y < board.length; y++) {
      if (board[y][x] !== 0) {
        blockFound = true;
      } else if (blockFound && board[y][x] === 0) {
        holes++;
      }
    }
  }
  return holes;
}

function getBumpiness(board) {
  let bumpiness = 0;
  for (let x = 0; x < board[0].length - 1; x++) {
    bumpiness += Math.abs(getColumnHeight(board, x) - getColumnHeight(board, x + 1));
  }
  return bumpiness;
}

function getMaxHeight(board) {
  let maxHeight = 0;
  for (let x = 0; x < board[0].length; x++) {
    maxHeight = Math.max(maxHeight, getColumnHeight(board, x));
  }
  return maxHeight;
}

function getWellDepth(board) {
  let wellDepth = 0;
  for (let x = 0; x < board[0].length; x++) {
    let leftHeight = x > 0 ? getColumnHeight(board, x - 1) : board.length;
    let rightHeight = x < board[0].length - 1 ? getColumnHeight(board, x + 1) : board.length;
    let currentHeight = getColumnHeight(board, x);
    let well = Math.min(leftHeight, rightHeight) - currentHeight;
    if (well > 0) {
      wellDepth += well * (well + 1) / 2;
    }
  }
  return wellDepth;
}

function getRowTransitions(board) {
  let transitions = 0;
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length - 1; x++) {
      if (board[y][x] !== board[y][x + 1]) {
        transitions++;
      }
    }
    if (board[y][0] === 0) transitions++;
    if (board[y][board[0].length - 1] === 0) transitions++;
  }
  return transitions;
}

function getColumnTransitions(board) {
  let transitions = 0;
  for (let x = 0; x < board[0].length; x++) {
    for (let y = 0; y < board.length - 1; y++) {
      if (board[y][x] !== board[y + 1][x]) {
        transitions++;
      }
    }
    if (board[board.length - 1][x] === 0) transitions++;
  }
  return transitions;
}

function getOverhangPenalty(board) {
  let penalty = 0;
  for (let x = 0; x < board[0].length; x++) {
    let columnHeight = getColumnHeight(board, x);
    for (let y = board.length - columnHeight; y < board.length; y++) {
      if (board[y][x] === 0) {
        for (let yy = y - 1; yy >= board.length - columnHeight; yy--) {
          if (board[yy][x] !== 0) {
            penalty += (y - (board.length - columnHeight)) + 1;
            break;
          }
        }
      }
    }
  }
  return penalty;
}

function getHoleDepthPenalty(board) {
  let penalty = 0;
  for (let x = 0; x < board[0].length; x++) {
    let columnHeight = getColumnHeight(board, x);
    let holeDepth = 0;
    for (let y = board.length - 1; y >= board.length - columnHeight; y--) {
      if (board[y][x] === 0) {
        holeDepth++;
      } else {
        penalty += holeDepth * holeDepth;
        holeDepth = 0;
      }
    }
  }
  return penalty;
}

function getSurfaceRoughness(board) {
  let roughness = 0;
  for (let x = 0; x < board[0].length - 1; x++) {
    let h1 = getColumnHeight(board, x);
    let h2 = getColumnHeight(board, x + 1);
    roughness += Math.abs(h1 - h2);
  }
  return roughness;
}

function getTetrisReady(board) {
  let tetrisReady = 0;
  for (let y = 0; y < board.length; y++) {
    let filledCount = 0;
    for (let x = 0; x < board[0].length; x++) {
      if (board[y][x] !== 0) filledCount++;
    }
    if (filledCount === board[0].length - 1) tetrisReady += 1;
  }
  return tetrisReady;
}

function getTspinPotential(board) {
  let tspinPotential = 0;
  for (let y = 0; y < board.length - 1; y++) {
    for (let x = 1; x < board[0].length - 1; x++) {
      if (board[y][x] === 0 && board[y][x-1] !== 0 && board[y][x+1] !== 0 && board[y+1][x] !== 0) {
        tspinPotential += 1;
      }
    }
  }
  return tspinPotential;
}

function evaluateBoard(board) {
  const aggregateHeight = getAggregateHeight(board);
  const completeLines = getCompleteLines(board);
  const holes = getHoles(board);
  const bumpiness = getBumpiness(board);
  const maxHeight = getMaxHeight(board);
  const wellDepth = getWellDepth(board);
  const rowTransitions = getRowTransitions(board);
  const columnTransitions = getColumnTransitions(board);
  const overhangPenalty = getOverhangPenalty(board);
  const holeDepthPenalty = getHoleDepthPenalty(board);
  const surfaceRoughness = getSurfaceRoughness(board);
  const tetrisReady = getTetrisReady(board);
  const tspinPotential = getTspinPotential(board);

  return AI_WEIGHTS.aggregateHeight * aggregateHeight +
         AI_WEIGHTS.completeLines * completeLines +
         AI_WEIGHTS.holes * holes +
         AI_WEIGHTS.bumpiness * bumpiness +
         AI_WEIGHTS.maxHeight * maxHeight +
         AI_WEIGHTS.wellDepth * wellDepth +
         AI_WEIGHTS.rowTransitions * rowTransitions +
         AI_WEIGHTS.columnTransitions * columnTransitions +
         AI_WEIGHTS.overhangPenalty * overhangPenalty +
         AI_WEIGHTS.holeDepthPenalty * holeDepthPenalty +
         AI_WEIGHTS.surfaceRoughness * surfaceRoughness +
         AI_WEIGHTS.tetrisReady * tetrisReady +
         AI_WEIGHTS.tspinPotential * tspinPotential;
}

function rotateMatrix(matrix) {
  const N = matrix.length;
  const result = [];
  for (let i = 0; i < N; i++) {
    result.push(new Array(N).fill(0));
  }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      result[x][N - 1 - y] = matrix[y][x];
    }
  }
  return result;
}

function placePiece(arena, piece, pos) {
  const newArena = cloneMatrix(arena);
  piece.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const newY = y + pos.y;
        const newX = x + pos.x;
        if (newY >= 0 && newY < newArena.length && newX >= 0 && newX < newArena[0].length) {
          newArena[newY][newX] = value;
        }
      }
    });
  });
  return newArena;
}

function clearLines(board) {
  let newBoard = board.filter(row => !row.every(cell => cell !== 0));
  let linesCleared = board.length - newBoard.length;
  while (newBoard.length < board.length) {
    newBoard.unshift(new Array(board[0].length).fill(0));
  }
  return {newBoard, linesCleared};
}

function dropPosition(arena, piece, x) {
  let y = 0;
  while (!collide(arena, {matrix: piece, pos: {x: x, y: y}})) {
    y++;
  }
  return y - 1;
}

function getPossibleMoves(board, piece) {
  let moves = [];
  let rotations = [piece];
  for (let i = 1; i < 4; i++) {
    rotations.push(rotateMatrix(rotations[i - 1]));
  }
  for (let r = 0; r < rotations.length; r++) {
    let matrix = rotations[r];
    let width = matrix[0].length;
    for (let x = -width + 1; x < board[0].length; x++) {
      let y = dropPosition(board, matrix, x);
      if (y < 0) continue;
      if (collide(board, {matrix: matrix, pos: {x: x, y: y}})) continue;
      moves.push({rotation: r, x: x, y: y, piece: matrix});
    }
  }
  return moves;
}

function findBestMove(board, currentPiece, nextPiece) {
  let bestMove = null;
  let bestScore = -Infinity;

  const moves = getPossibleMoves(board, currentPiece);

  for (let move of moves) {
    const newBoard = placePiece(board, move.piece, {x: move.x, y: move.y});
    const {newBoard: clearedBoard, linesCleared} = clearLines(newBoard);

    // Check if board has holes or is getting too high - allow non-Tetris clears in these cases
    const maxHeight = getMaxHeight(board);
    const holesCount = getHoles(board);
    const allowNonTetris = maxHeight >= 15 || holesCount > 0; // Allow 1-3 line clears when board gets too high or has holes

    // Only allow Tetris (4-line) clears or no clears at all, unless board is too high or has holes
    if (linesCleared > 0 && linesCleared !== 4 && !allowNonTetris) {
      continue;
    }

    let score = evaluateBoard(clearedBoard); // Let weighted evaluation handle line clearing

    // If holes are present, prioritize moves that clear lines to remove holes
    const remainingHoles = getHoles(clearedBoard);
    if (remainingHoles > 0 && linesCleared === 0) {
      // Penalize moves that do not clear lines when holes exist
      score -= 1000;
    }

    // Consider next piece for better decisions
    if (nextPiece) {
      const nextMoves = getPossibleMoves(clearedBoard, nextPiece);
      let bestNextScore = -Infinity;
      for (let nextMove of nextMoves) {
        const nextNewBoard = placePiece(clearedBoard, nextMove.piece, {x: nextMove.x, y: nextMove.y});
        const {newBoard: nextClearedBoard, linesCleared: nextLinesCleared} = clearLines(nextNewBoard);
        const nextScore = evaluateBoard(nextClearedBoard); // Let weighted evaluation handle next piece line clearing
        bestNextScore = Math.max(bestNextScore, nextScore);
      }
      score += bestNextScore * 0.1; // Weight next piece consideration
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// AI control variables
let aiEnabled = false;
let aiMove = null;

// Add AI toggle event listener
const toggleAIButton = document.getElementById('toggle-ai');
toggleAIButton.addEventListener('click', () => {
  aiEnabled = !aiEnabled;
  toggleAIButton.textContent = aiEnabled ? 'Disable AI' : 'Enable AI';
  if (aiEnabled) {
    toggleAIButton.style.backgroundColor = '#4CAF50';
  } else {
    toggleAIButton.style.backgroundColor = 'gray';
  }
});

function applyAIMove() {
  if (!aiMove) {
    aiMove = findBestMove(arena, player.matrix, player.nextMatrix);
    if (!aiMove) return;
  }
  // Rotate step-by-step using playerRotate to handle collisions and offsets
  for (let i = 0; i < aiMove.rotation; i++) {
    playerRotate(1);
  }
  // Move horizontally stepwise towards target x using playerMove to respect collisions
  while (player.pos.x < aiMove.x) {
    playerMove(1);
  }
  while (player.pos.x > aiMove.x) {
    playerMove(-1);
  }
  // Drop piece
  playerDrop();
  aiMove = null;
}

const originalUpdate = update;
update = function(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  const currentDropInterval = Math.max(50, 1000 - player.level * 50);
  if (dropCounter > (aiEnabled ? 50 : currentDropInterval)) { // faster drop for AI
    if (aiEnabled) {
      applyAIMove();
    } else {
      playerDrop();
    }
  }

  draw();
  requestAnimationFrame(update);
};


