"""
Махди, твоя задача создать эндпоинт /register которая позволяет создавать пользователя.
Всё на основе Flask.
"""

from flask import Flask, render_template, request, jsonify
from db.database import init_db, add_user, login_user


# сразу все инициализируем
init_db()

# создаём объект
app = Flask(__name__, template_folder='web/')


# Эндпоинт: главная страница входа
@app.route("/")
def home_page():
    return render_template("login.html")

# Страница Ошибки
@app.route("/404ERR")
def error_page():
    return render_template("/error_page.html")

# Энпоинт: регистрация пользователя
@app.route("/login", methods=['POST'])
def login_reg():
    data = request.json
    
    username = data.get("username")
#    password = data.get("password")

    # Используй функцию для проверки логина, а не регистрации
    user = login_user(username)  # ← вот эту функцию нужно создать

    if user:
        return jsonify({"success": True, "message": "Вход выполнен успешно!"})    
    else:
        return jsonify({"success": False, "message": "Неверный логин или пароль!"})

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        confirm_password = data.get('confirmPassword')
        
        # Проверка обязательных полей
        if not all([username, password, confirm_password]):
            return jsonify({'success': False, 'message': 'Все поля обязательны для заполнения'})
        
        if password != confirm_password:
            return jsonify({'success': False, 'message': 'Пароли не совпадают'})
        
        if add_user(username, password):
            return jsonify({'success': True, 'message': 'Регистрация успешна!'})
        else:
            return jsonify({'success': False, 'message': 'Пользователь с таким email или логином уже существует'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Ошибка сервера: {str(e)}'})

if __name__ == '__main__':
    app.run(debug=True)