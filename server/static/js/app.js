let player = localStorage.getItem('playerName') || '';
let level = localStorage.getItem('botLevel') || 'easy';
let board = [];
let score = 0;

function startGame() {
    const playerName = document.getElementById("player-name").value;
    const playerSymbol = document.getElementById("player-symbol").value;
    const botLevel = document.getElementById("bot-level").value;

    if (!playerName || !playerSymbol || !botLevel) {
        alert("Please fill in all fields!");
        return;
    }

    // เก็บข้อมูลลง localStorage
    localStorage.setItem("playerName", playerName);
    localStorage.setItem("playerSymbol", playerSymbol);
    localStorage.setItem("botLevel", botLevel);

    // เปลี่ยนหน้าไปยังหน้ากระดานเกม
    window.location.href = "/game";
}


function updateBoard() {
    const boardDiv = document.getElementById('board');
    boardDiv.innerHTML = '';
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = board[r][c];
            cell.onclick = () => makeMove(r, c);
            boardDiv.appendChild(cell);
        }
    }
}

function makeMove(row, col) {
    if (board[row][col] !== ' ') {
        displayMessage('Invalid move! This cell is already taken.');
        return;
    }

    fetch('/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, board, move: [row, col], level })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error);
        } else {
            board = data.board;
            score = data.score;
            updateBoard();
            updateScore();
            if (data.winner) {
                const winnerMessage = data.winner === 'player' ? 'You win!' : (data.winner === 'bot' ? 'Bot wins!' : 'It\'s a draw!');
                displayMessage(winnerMessage);
            }
        }
    });
}

function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

function displayMessage(message) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
}

function restartGame() {
    board = [];
    score = 0;
    startGame();
}

// Start the game on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!player) {
        player = prompt('Enter your name:');
        localStorage.setItem('playerName', player);
    }
    if (!level) {
        level = prompt('Choose difficulty: easy or pro:');
        localStorage.setItem('botLevel', level);
    }
    startGame();
});
