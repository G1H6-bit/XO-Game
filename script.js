/* ============================================================
   XO Game — JavaScript
   Author  : Abdelrahman Ashraf
   Version : 2.0
   Sections:
     1. Constants & State
     2. Win Combinations
     3. DOM References
     4. Board Initialisation
     5. Cell Click Handler
     6. Keyboard Support (Accessibility Fix)
     7. Win / Draw Check
     8. Highlight Winning Cells
     9. Update Turn Indicator
    10. Score Board Update
    11. Show Result Overlay
    12. New Round (keep scores)
    13. Reset Scores
   ============================================================ */


/* ── 1. Constants & State ── */

/* Symbols used for each player */
const PLAYERS = { X: 'X', O: 'O' };

/* All 8 possible winning combinations (cell indices 0–8) */
const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],  // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8],  // columns
  [0, 4, 8], [2, 4, 6],             // diagonals
];

/* Mutable game state — reset each round */
let board       = Array(9).fill('');  // tracks each cell's value
let currentPlayer = PLAYERS.X;       // X always goes first
let gameActive  = true;               // false when won or drawn

/* Score persists across rounds until "Reset Scores" is clicked */
let scores = { X: 0, O: 0, draws: 0 };


/* ── 2. DOM References ── */
const boardEl       = document.getElementById('board');
const statusEl      = document.getElementById('status');
const turnDotEl     = document.getElementById('turnDot');
const turnLabelEl   = document.getElementById('turnLabel');
const scoreXEl      = document.getElementById('scoreX');
const scoreOEl      = document.getElementById('scoreO');
const scoreDrawEl   = document.getElementById('scoreDraw');
const scoreCardXEl  = document.getElementById('scoreCardX');
const scoreCardOEl  = document.getElementById('scoreCardO');
const resultOverlay = document.getElementById('resultOverlay');
const resultIconEl  = document.getElementById('resultIcon');
const resultTitleEl = document.getElementById('resultTitle');
const resultSubEl   = document.getElementById('resultSub');


/* ── 3. Board Initialisation ── */

/**
 * Builds (or rebuilds) the 9-cell grid.
 * Called once on page load and again after each round.
 */
function createBoard() {
  boardEl.innerHTML = '';

  board.forEach((value, index) => {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', `Cell ${index + 1}, empty`);
    cell.dataset.index = index;

    /* Restore cell content if called mid-game (not used now, but future-safe) */
    if (value) {
      cell.textContent = value;
      cell.classList.add(value.toLowerCase(), 'taken');
      cell.setAttribute('aria-label', `Cell ${index + 1}, ${value}`);
    }

    /* Mouse click */
    cell.addEventListener('click', handleCellClick);

    /* Keyboard — Enter or Space activates the cell (Accessibility Fix) */
    cell.addEventListener('keydown', handleCellKeydown);

    boardEl.appendChild(cell);
  });

  updateTurnIndicator();
  updateScoreBoard();
  statusEl.textContent = '';
}


/* ── 4. Cell Click Handler ── */

/**
 * Handles a player's move when a cell is clicked.
 * @param {MouseEvent} e
 */
function handleCellClick(e) {
  playCell(e.currentTarget);
}


/* ── 5. Keyboard Support (Accessibility Fix) ──
   Without this, keyboard users cannot play the game
   at all since the cells are <div> elements, not <button>s.
   Enter and Space are the standard keys for activating buttons.
   ───────────────────────────────────────────────────────────── */

/**
 * Handles keyboard events on a cell.
 * @param {KeyboardEvent} e
 */
function handleCellKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault(); /* prevent page scroll on Space */
    playCell(e.currentTarget);
  }
}


/* ── 6. Core Move Logic ── */

/**
 * Processes a move for the current player on the given cell.
 * @param {HTMLElement} cellEl - the cell DOM element
 */
function playCell(cellEl) {
  const index = parseInt(cellEl.dataset.index, 10);

  /* Ignore if cell is already taken or game is over */
  if (board[index] !== '' || !gameActive) {
    if (!gameActive) return;
    /* Shake to signal "already taken" */
    cellEl.style.animation = 'none';
    requestAnimationFrame(() => {
      cellEl.style.animation = 'shake 0.35s ease';
    });
    return;
  }

  /* Mark the board state */
  board[index] = currentPlayer;

  /* Update the cell visually */
  cellEl.textContent = currentPlayer;
  cellEl.classList.add(currentPlayer.toLowerCase(), 'taken');
  cellEl.setAttribute('aria-label', `Cell ${index + 1}, ${currentPlayer}`);

  /* Check for win */
  const winCombo = getWinCombo();
  if (winCombo) {
    highlightWinners(winCombo);
    scores[currentPlayer]++;
    updateScoreBoard();
    showResult('win', currentPlayer);
    gameActive = false;
    return;
  }

  /* Check for draw */
  if (!board.includes('')) {
    scores.draws++;
    updateScoreBoard();
    showResult('draw', null);
    gameActive = false;
    return;
  }

  /* Switch player */
  currentPlayer = currentPlayer === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
  updateTurnIndicator();
}


/* ── 7. Win / Draw Check ── */

/**
 * Checks whether the current board state has a winner.
 * @returns {number[]|null} the winning combo array, or null if no winner
 */
function getWinCombo() {
  return WIN_COMBOS.find(([a, b, c]) =>
    board[a] && board[a] === board[b] && board[a] === board[c]
  ) || null;
}


/* ── 8. Highlight Winning Cells ── */

/**
 * Adds the 'winner' class to the three winning cells
 * so they glow in their player colour.
 * @param {number[]} combo - array of 3 cell indices
 */
function highlightWinners(combo) {
  const cells = boardEl.querySelectorAll('.cell');
  combo.forEach((index) => {
    cells[index].classList.add('winner');
  });
}


/* ── 9. Update Turn Indicator ── */

/**
 * Updates the pulsing dot and label above the board
 * to show whose turn it is.
 */
function updateTurnIndicator() {
  if (!gameActive) return;
  const isX = currentPlayer === PLAYERS.X;
  turnDotEl.className  = 'turn-dot ' + (isX ? 'x' : 'o');
  turnLabelEl.textContent = `Player ${currentPlayer}'s turn`;
}


/* ── 10. Score Board Update ── */

/**
 * Refreshes the score display and highlights
 * the active player's score card.
 */
function updateScoreBoard() {
  scoreXEl.textContent    = scores.X;
  scoreOEl.textContent    = scores.O;
  scoreDrawEl.textContent = scores.draws;

  /* Highlight active player's card while game is running */
  scoreCardXEl.classList.toggle('active-x', gameActive && currentPlayer === PLAYERS.X);
  scoreCardOEl.classList.toggle('active-o', gameActive && currentPlayer === PLAYERS.O);
}


/* ── 11. Show Result Overlay ── */

/**
 * Fades in the win/draw result overlay.
 * @param {'win'|'draw'} type
 * @param {string|null}  player - 'X' or 'O', null for draw
 */
function showResult(type, player) {
  if (type === 'win') {
    resultIconEl.textContent  = player === 'X' ? '❌' : '⭕';
    resultTitleEl.textContent = `Player ${player} Wins!`;
    resultTitleEl.className   = 'result-title ' + player.toLowerCase();
    resultSubEl.textContent   = `Score: X ${scores.X} – O ${scores.O}`;
  } else {
    resultIconEl.textContent  = '🤝';
    resultTitleEl.textContent = "It's a Draw!";
    resultTitleEl.className   = 'result-title draw';
    resultSubEl.textContent   = `Draws: ${scores.draws}`;
  }

  /* Small delay so the player can see the last move before overlay appears */
  setTimeout(() => {
    resultOverlay.classList.add('show');
    /* Focus the "Play Again" button for keyboard users */
    document.getElementById('btnPlayAgain').focus();
  }, 500);
}


/* ── 12. New Round (keep scores) ── */

/**
 * Resets the board for a new round without clearing scores.
 * Called by the "Play Again" button in the overlay
 * and the "New Round" button below the board.
 */
function newRound() {
  board         = Array(9).fill('');
  currentPlayer = PLAYERS.X;
  gameActive    = true;

  resultOverlay.classList.remove('show');
  createBoard();
}


/* ── 13. Reset Scores ── */

/**
 * Resets all scores to zero and starts a fresh round.
 * Called by the "Reset Scores" button.
 */
function resetScores() {
  scores = { X: 0, O: 0, draws: 0 };
  newRound();
}


/* ── Page Load ── */
createBoard();
