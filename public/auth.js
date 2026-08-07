const params = new URLSearchParams(location.search);
let mode = params.get('mode') === 'signup' ? 'signup' : 'login';

const authTitle = document.getElementById('authTitle');
const authSub = document.getElementById('authSub');
const authForm = document.getElementById('authForm');
const confirmField = document.getElementById('confirmField');
const submitBtn = document.getElementById('submitBtn');
const authSwitch = document.getElementById('authSwitch');
const switchLink = document.getElementById('switchLink');
const authError = document.getElementById('authError');

function renderMode() {
  if (mode === 'signup') {
    authTitle.textContent = 'Создать аккаунт';
    authSub.textContent = 'Займёт меньше минуты';
    confirmField.style.display = 'block';
    document.getElementById('confirm').required = true;
    submitBtn.textContent = 'Создать аккаунт';
    authSwitch.innerHTML = 'Уже есть аккаунт? <a href="#" id="switchLink">Войти</a>';
  } else {
    authTitle.textContent = 'Вход';
    authSub.textContent = 'Рады видеть вас снова';
    confirmField.style.display = 'none';
    document.getElementById('confirm').required = false;
    submitBtn.textContent = 'Войти';
    authSwitch.innerHTML = 'Нет аккаунта? <a href="#" id="switchLink">Создать</a>';
  }
  document.getElementById('switchLink').addEventListener('click', (e) => {
    e.preventDefault();
    mode = mode === 'signup' ? 'login' : 'signup';
    hideError();
    renderMode();
  });
}
renderMode();

function showError(msg) {
  authError.textContent = msg;
  authError.classList.add('show');
}
function hideError() {
  authError.classList.remove('show');
  authError.textContent = '';
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;

  if (mode === 'signup' && password !== confirm) {
    return showError('Пароли не совпадают');
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Подождите…';

  try {
    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      throw new Error('Сервер вернул некорректный ответ. Проверьте, что сервер запущен (npm start).');
    }

    if (!res.ok) {
      showError(data.error || `Ошибка запроса (${res.status})`);
      submitBtn.disabled = false;
      renderMode();
      return;
    }

    // успех — переходим в личный кабинет
    location.href = '/dashboard.html';
  } catch (err) {
    showError(err.message || 'Не удалось связаться с сервером. Проверьте, что сервер запущен (npm start).');
    submitBtn.disabled = false;
    renderMode();
  }
});
