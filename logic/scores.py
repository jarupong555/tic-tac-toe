players = {}
win_streaks = {}


def update_score(player, board, winner):
    if winner == "player":
        players[player] += 1
        win_streaks[player] += 1
        if win_streaks[player] == 3:
            players[player] += 1
            win_streaks[player] = 0
        return {"board": board, "winner": "player", "score": players[player]}
    elif winner == "bot":
        players[player] -= 1
        win_streaks[player] = 0
        return {"board": board, "winner": "bot", "score": players[player]}
