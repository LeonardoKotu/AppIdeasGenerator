document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы форм
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');

    // Переключение на форму регистрации
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    // Переключение на форму входа
    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Вход
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        // Анимация загрузки
        const submitBtn = this.querySelector('button');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Вход...';
        submitBtn.disabled = true;
        
        fetch('/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            // Возвращаем кнопку в исходное состояние
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            if (result.success) {
                // Переходим на главную страницу
                if (result.redirect) {
                    window.location.href = result.redirect;
                } else {
                    window.location.href = '/main';
                }
            } else {
                alert(result.message);
            }
        })
        .catch(error => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            alert('Ошибка соединения');
        });
    });

    // Регистрация
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            username: formData.get('username'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        // Анимация загрузки
        const submitBtn = this.querySelector('button');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Регистрация...';
        submitBtn.disabled = true;
        
        fetch('/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            // Возвращаем кнопку в исходное состояние
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            if (result.success) {
                // Переходим на главную страницу
                if (result.redirect) {
                    window.location.href = result.redirect;
                } else {
                    window.location.href = '/main';
                }
            } else {
                alert(result.message);
            }
        })
        .catch(error => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            alert('Ошибка соединения');
        });
    });
});