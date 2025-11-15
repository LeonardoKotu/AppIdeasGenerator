import sqlite3

def init_db():
    
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    cursor.execute(

        '''
        create table if not exists Users(
            id integer primary key autoincrement,
            username varchar(50),
            password text
        )
        '''
    )

    conn.commit()
    conn.close()

# Добавлю тестовые данные(юзера)
def add_user(username, password):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    cursor.execute("SELECT username FROM Users WHERE username = ?", (username,))
    if cursor.fetchone():
        print("Пользователь уже существует")
        conn.close()
        return False
    
    cursor.execute("INSERT INTO Users (username, password) VALUES (?, ?)", (username, password))
    conn.commit()
    conn.close()
    return True
                       
# выборка юзера
def login_user(username):
    
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    '''
    Вытаскиваем пользователя из базы данных
    '''

    cursor.execute("select * from Users where username = ?", (username, ))
    user = cursor.fetchone()
    conn.close()

    if user:
        return user
    
    return None

