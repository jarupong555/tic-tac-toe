from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from logic.board import create_board, check_winner, is_draw
from logic.ai import easy_bot_move, pro_bot_move
from logic.scores import players, win_streaks, update_score

app = Flask(__name__)
CORS(app)

# หน้าหลักสำหรับตั้งค่าเกม
@app.route('/')
def index():
    """หน้าแรก: เลือกชื่อ, X/O, และระดับบอท"""
    return render_template('index.html')

# หน้ากระดานเกม
@app.route('/game')
def game():
    """หน้ากระดานเกม"""
    return render_template('game.html')

# เริ่มเกมใหม่
@app.route('/start', methods=['POST'])
def start_game():
    """เริ่มเกมใหม่และสร้างกระดาน"""
    data = request.json
    player = data['player']
    level = data['level']
    
    # ตรวจสอบว่าผู้เล่นใหม่หรือไม่
    if player not in players:
        players[player] = 0
        win_streaks[player] = 0
    
    return jsonify({
        "board": create_board(),  # สร้างกระดานใหม่
        "level": level,
        "score": players[player]
    })

# การเล่นในแต่ละรอบ
@app.route('/play', methods=['POST'])
def play():
    """ดำเนินเกม: รับข้อมูลการเดินจากผู้เล่นและบอท"""
    data = request.json
    player = data['player']
    board = data['board']
    row, col = data['move']
    level = data['level']

    # ผู้เล่นเดิน
    if board[row][col] != " ":
        return jsonify({"error": "Invalid move"}), 400
    board[row][col] = "X"

    # ตรวจสอบผู้ชนะหลังจากผู้เล่นเดิน
    if check_winner(board) == "X":
        return jsonify(update_score(player, board, "player"))

    # ตรวจสอบเสมอ
    if is_draw(board):
        return jsonify({"board": board, "winner": "draw", "score": players[player]})

    # บอทเดิน
    bot_move = easy_bot_move(board) if level == "easy" else pro_bot_move(board)
    board[bot_move[0]][bot_move[1]] = "O"

    # ตรวจสอบผู้ชนะหลังจากบอทเดิน
    if check_winner(board) == "O":
        return jsonify(update_score(player, board, "bot"))

    # ตรวจสอบเสมออีกครั้ง
    if is_draw(board):
        return jsonify({"board": board, "winner": "draw", "score": players[player]})

    # ถ้ายังไม่มีผู้ชนะหรือเสมอ
    return jsonify({"board": board, "winner": None, "score": players[player]})

# ดึงคะแนนทั้งหมด
@app.route('/scores', methods=['GET'])
def get_scores():
    """แสดงคะแนนทั้งหมด"""
    return jsonify(players)

# จุดเริ่มต้นการทำงานของแอปพลิเคชัน
if __name__ == '__main__':
    app.run(debug=True)
