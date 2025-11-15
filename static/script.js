document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы форм
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');

    // Плавное переключение на форму регистрации
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.style.opacity = '0';
        loginForm.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            registerForm.style.opacity = '0';
            registerForm.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                registerForm.style.opacity = '1';
                registerForm.style.transform = 'translateY(0)';
            }, 50);
        }, 400);
    });

    // Плавное переключение на форму входа
    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.style.opacity = '0';
        registerForm.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            loginForm.style.opacity = '0';
            loginForm.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                loginForm.style.opacity = '1';
                loginForm.style.transform = 'translateY(0)';
            }, 50);
        }, 400);
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
                // Успешный вход - анимация
                submitBtn.style.backgroundColor = '#27ae60';
                submitBtn.textContent = 'Успешно!';
                setTimeout(() => {
                    alert(result.message);
                    // Здесь можно сделать редирект
                    // window.location.href = '/dashboard';
                }, 500);
            } else {
                // Ошибка - анимация дрожания
                loginForm.classList.add('error');
                setTimeout(() => {
                    loginForm.classList.remove('error');
                }, 400);
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
                // Успешная регистрация - анимация
                submitBtn.style.backgroundColor = '#27ae60';
                submitBtn.textContent = 'Успешно!';
                setTimeout(() => {
                    alert(result.message);
                    // Автоматически переключаем на форму входа
                    registerForm.style.opacity = '0';
                    registerForm.style.transform = 'translateY(-20px)';
                    
                    setTimeout(() => {
                        registerForm.classList.add('hidden');
                        loginForm.classList.remove('hidden');
                        loginForm.style.opacity = '0';
                        loginForm.style.transform = 'translateY(20px)';
                        
                        setTimeout(() => {
                            loginForm.style.opacity = '1';
                            loginForm.style.transform = 'translateY(0)';
                            submitBtn.style.backgroundColor = '';
                        }, 50);
                    }, 400);
                }, 500);
            } else {
                // Ошибка - анимация дрожания
                registerForm.classList.add('error');
                setTimeout(() => {
                    registerForm.classList.remove('error');
                }, 400);
                alert(result.message);
            }
        })
        .catch(error => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            alert('Ошибка соединения');
        });
    });

    // Добавляем анимацию при загрузке страницы
    setTimeout(() => {
        document.querySelector('.container').style.opacity = '1';
    }, 100);
});