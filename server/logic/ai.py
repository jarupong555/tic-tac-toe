import random

from .board import check_winner


def easy_bot_move(board):
    empty_cells = [(r, c) for r in range(3) for c in range(3) if board[r][c] == " "]
    return random.choice(empty_cells)


def pro_bot_move(board):
    # Check if the bot can win in the next move
    for r in range(3):
        for c in range(3):
            if board[r][c] == " ":
                board[r][c] = "O"
                if check_winner(board) == "O":
                    board[r][c] = " "
                    return (r, c)
                board[r][c] = " "

    # If the bot cannot win, use the easy bot's strategy
    return easy_bot_move(board)
