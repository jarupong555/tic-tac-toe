const playerName = localStorage.getItem("playerName") || "Player";
const playerSymbol = localStorage.getItem("playerSymbol") || "X";
const botLevel = localStorage.getItem("botLevel") || "easy";

document.getElementById("bot-level").textContent = botLevel;

const board = Array.from({ length: 3 }, () => Array(3).fill(""));
const botSymbol = playerSymbol === "X" ? "O" : "X";

let playerScore = 0;
let botScore = 0;
let draws = 0;
let streak = 0;
let totalScore = 0;
let gameEnded = false;
let isPlayerTurn = true;
let gameCount = 0;

// Initialize history
let history = JSON.parse(localStorage.getItem("gameHistory")) || [];

// Load sounds
const winSound = new Audio("/static/sounds/win.mp3");
const loseSound = new Audio("/static/sounds/lose.mp3");
const drawSound = new Audio("/static/sounds/draw.mp3");
const fireworksSound = new Audio("/static/sounds/fireworks.mp3");

// Play sound based on result
const playSound = (result) => {
    if (result === "player") {
        winSound.play();
    } else if (result === "bot") {
        loseSound.play();
    } else if (result === "draw") {
        drawSound.play();
    }
};

// ตรวจสอบปุ่มแว่นขยาย (ดู History) ให้ใช้งานได้ตลอดเวลา
const historyButton = document.querySelector("#history-icon");
if (historyButton) {
    historyButton.addEventListener("click", () => {
        closePopup();  // ปิด popup ถ้ามี
        showHistory();
    });
}

const renderBoard = () => {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";
    board.forEach((row, rIndex) => {
        row.forEach((cell, cIndex) => {
            const cellDiv = document.createElement("div");
            cellDiv.className = `cell ${cell.toLowerCase()}`;
            cellDiv.textContent = cell;
            cellDiv.onclick = () => makeMove(rIndex, cIndex);
            boardDiv.appendChild(cellDiv);
        });
    });
    updateScores();
};

const checkWinnerWithHighlight = (symbol) => {
    const winningCombination = [
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]],
    ];

    for (const combination of winningCombination) {
        const [a, b, c] = combination;
        if (
            board[a[0]][a[1]] === symbol &&
            board[b[0]][b[1]] === symbol &&
            board[c[0]][c[1]] === symbol
        ) {
            highlightWinner(combination);
            return true;
        }
    }
    return false;
};

const highlightWinner = (combination) => {
    combination.forEach(([row, col]) => {
        const cell = document.querySelectorAll(".cell")[row * 3 + col];
        cell.classList.add("winner");
    });
};

const isDraw = () => board.flat().every((cell) => cell !== "");

const displayMessage = (message, type = "info") => {
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = message;
    messageDiv.className = `alert alert-${type}`;
    messageDiv.classList.remove("d-none");
};

const updateScores = () => {
    document.getElementById("player-score").textContent = playerScore;
    document.getElementById("bot-score").textContent = botScore;
    document.getElementById("draws").textContent = draws;
    document.getElementById("streak").textContent = streak;

    if (streak === 3) {
        totalScore += 1;
        streak = 0;
        displayMessage("Bonus! You earned 1 extra point for a 3-game streak!", "success");
        showFireworks();
        fireworksSound.play();
    }

    document.getElementById("total-score").textContent = totalScore;
};

const showFireworks = () => {
    const fireworksContainer = document.createElement("div");
    fireworksContainer.id = "fireworks-container";
    fireworksContainer.style = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    fireworksContainer.innerHTML = `
        <div>
            <img src="/static/images/danger.gif" alt="Fireworks" style="max-width: 80%; max-height: 80%; animation: fadeIn 0.5s;">
        </div>
    `;
    document.body.appendChild(fireworksContainer);

    setTimeout(() => {
        fireworksContainer.remove();
    }, 3000);
};

const botMove = () => {
    if (gameEnded) return;

    let availableMoves = [];
    board.forEach((row, rIndex) => {
        row.forEach((cell, cIndex) => {
            if (!cell) availableMoves.push([rIndex, cIndex]);
        });
    });

    if (availableMoves.length === 0) {
        return;
    }

    if (botLevel === "easy") {
        const [row, col] = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        board[row][col] = botSymbol;
    } else if (botLevel === "medium") {
        // Medium level bot logic
        let move = null;
        // Try to win if possible
        for (let [row, col] of availableMoves) {
            board[row][col] = botSymbol;
            if (checkWinnerWithHighlight(botSymbol)) {
                move = [row, col];
            }
            board[row][col] = "";
            if (move) break;
        }
        // Block player's win
        if (!move) {
            for (let [row, col] of availableMoves) {
                board[row][col] = playerSymbol;
                if (checkWinnerWithHighlight(playerSymbol)) {
                    move = [row, col];
                }
                board[row][col] = "";
                if (move) break;
            }
        }
        // Random move if no immediate win or block
        if (!move) {
            move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
        board[move[0]][move[1]] = botSymbol;
    } else if (botLevel === "pro") {
        let bestScore = -Infinity;
        let move;
        for (let [row, col] of availableMoves) {
            board[row][col] = botSymbol;
            let score = minimax(board, 0, false);
            board[row][col] = "";
            if (score > bestScore) {
                bestScore = score;
                move = [row, col];
            }
        }
        if (move) {
            board[move[0]][move[1]] = botSymbol;
        }
    }
    renderBoard();

    if (checkWinnerWithHighlight(botSymbol)) {
        botScore++;
        streak = 0;
        totalScore -= 1;
        saveHistory("Bot Win");
        displayMessage("Bot wins!", "danger");
        gameEnded = true;
        playSound("bot");
        updateScores();
        showPopup("Bot wins! Do you want to play again?");
        return;
    }

    if (isDraw()) {
        draws++;
        streak = 0; // Reset streak on draw
        saveHistory("Draw");
        displayMessage("It's a draw!", "warning");
        gameEnded = true;
        playSound("draw");
        updateScores();
        showPopup("It's a draw! Do you want to play again?");
        return;
    }

    isPlayerTurn = true;
};

const minimax = (board, depth, isMaximizing) => {
    if (checkWinnerWithHighlight(botSymbol)) {
        return 10;
    } else if (checkWinnerWithHighlight(playerSymbol)) {
        return -10;
    } else if (isDraw()) {
        return 0;
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[r][c] === "") {
                    board[r][c] = botSymbol;
                    let score = minimax(board, depth + 1, false);
                    board[r][c] = "";
                    bestScore = Math.max(score, bestScore);
                }
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[r][c] === "") {
                    board[r][c] = playerSymbol;
                    let score = minimax(board, depth + 1, true);
                    board[r][c] = "";
                    bestScore = Math.min(score, bestScore);
                }
            }
        }
        return bestScore;
    }
};

const makeMove = (row, col) => {
    if (gameEnded) return;
    if (!isPlayerTurn) {
        displayMessage("It's not your turn!", "danger");
        return;
    }
    if (board[row][col]) {
        displayMessage("Invalid move! Cell is already occupied.", "danger");
        return;
    }

    board[row][col] = playerSymbol;
    renderBoard();

    if (checkWinnerWithHighlight(playerSymbol)) {
        playerScore++;
        streak++;
        totalScore += 1;
        saveHistory("Player Win");
        displayMessage(`${playerName} wins!`, "success");
        gameEnded = true;
        playSound("player");
        updateScores();
        showPopup(`${playerName} wins! Do you want to play again?`);
        return;
    }

    if (isDraw()) {
        draws++;
        streak = 0; // Reset streak on draw
        saveHistory("Draw");
        displayMessage("It's a draw!", "warning");
        gameEnded = true;
        playSound("draw");
        updateScores();
        showPopup("It's a draw! Do you want to play again?");
        return;
    }

    isPlayerTurn = false;
    setTimeout(botMove, 100); // ลดเวลาหน่วงให้เร็วขึ้นเป็น 100ms
};

const saveHistory = (result) => {
    history.push({
        playerScore,
        botScore,
        draws,
        totalScore,
        result,
    });
    localStorage.setItem("gameHistory", JSON.stringify(history));
};

const resetHistory = () => {
    history = [];
    localStorage.removeItem("gameHistory");
    showHistory();
};

const resetScores = () => {
    playerScore = 0;
    botScore = 0;
    draws = 0;
    streak = 0;
    totalScore = 0;
    gameEnded = false;
    gameCount = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            board[i][j] = "";
        }
    }
    isPlayerTurn = true;
    renderBoard();
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = "";
    messageDiv.className = "d-none";
    displayMessage("Scores have been reset!", "info");

    if (historyButton) {
        historyButton.addEventListener("click", showHistory);
    }
};

const restartGame = () => {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            board[i][j] = "";
        }
    }
    gameEnded = false;
    gameCount++;
    isPlayerTurn = gameCount % 2 !== 0;
    renderBoard();
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = "Game restarted!";
    messageDiv.className = "alert alert-success";

    setTimeout(() => {
        if (!isPlayerTurn) botMove();
    }, 100); // ลดเวลาหน่วงให้เร็วขึ้นเป็น 100ms
};

const showPopup = (message) => {
    const popup = document.createElement("div");
    popup.className = "popup-overlay";
    popup.innerHTML = `
        <div class="popup">
            <p>${message}</p>
            <button class="btn btn-primary" onclick="closePopup(); setTimeout(restartGame, 0)">Play Again</button>
            <button class="btn btn-danger" onclick="resetScores(); goToHome()">Back to Home</button>
        </div>
    `;
    document.body.appendChild(popup);
};

const closePopup = () => {
    const popup = document.querySelector(".popup-overlay");
    if (popup) {
        popup.remove();
    }
};

const goToHome = () => {
    window.location.href = "/";
};

const showHistory = () => {
    const historyPopup = document.getElementById("history-popup");
    historyPopup.classList.remove("d-none");

    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";

    if (history.length === 0) {
        historyList.innerHTML = "<li>No game history available.</li>";
    } else {
        history.forEach((entry, index) => {
            const li = document.createElement("li");
            li.textContent = `Game ${index + 1}: Player: ${entry.playerScore}, Bot: ${entry.botScore}, Draws: ${entry.draws}, Total Score: ${entry.totalScore}, Result: ${entry.result}`;
            historyList.appendChild(li);
        });
    }
};

const closeHistory = () => {
    const historyPopup = document.getElementById("history-popup");
    historyPopup.classList.add("d-none");
};

renderBoard();
