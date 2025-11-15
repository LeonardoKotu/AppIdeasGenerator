    document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const showLoginFromText = document.getElementById('showLoginFromText');

        // Показать форму регистрации
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });

        // Показать форму входа (из ссылки "Войти")
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });

        // Показать форму входа (из ссылки "Уже есть аккаунт?")
        showLoginFromText.addEventListener('click', function(e) {
            e.preventDefault();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });

        // Обработка отправки формы входа
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Вход выполнен!');
        });

        // Обработка отправки формы регистрации
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Регистрация завершена!');
        });
    });