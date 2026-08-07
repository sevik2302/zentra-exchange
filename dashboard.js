const dashWrap = document.getElementById('dashWrap');
const toast = document.getElementById('toast');

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function fmtAddr(a) {
  return a.length > 20 ? a.slice(0, 10) + '…' + a.slice(-8) : a;
}

async function loadDashboard() {
  try {
    const res = await fetch('/api/me');
    if (res.status === 401) {
      location.href = '/auth.html';
      return;
    }
    if (!res.ok) {
      dashWrap.innerHTML = '<div class="center-msg">Не удалось загрузить данные аккаунта. Обновите страницу.</div>';
      return;
    }
    const { user } = await res.json();
    renderDashboard(user);
  } catch (err) {
    dashWrap.innerHTML = '<div class="center-msg">Сервер недоступен. Убедитесь, что он запущен (npm start), и обновите страницу.</div>';
  }
}

function renderDashboard(user) {
  const created = new Date(user.createdAt).toLocaleDateString('ru-RU');
  dashWrap.innerHTML = `
    <div class="banner">⚠ Демо-режим: адреса ниже сгенерированы случайно для демонстрации интерфейса и не подключены к реальному блокчейну. Не отправляйте на них реальные средства — они будут потеряны.</div>
    <div class="dash-hello">С возвращением, ${escapeHtml(user.username)}</div>
    <div class="dash-sub">Аккаунт создан ${created}</div>

    <div class="section-title">Балансы</div>
    <div class="bal-grid">
      <div class="bal-card"><div class="l">BTC</div><div class="v">${user.balances.BTC.toFixed(8)}</div></div>
      <div class="bal-card"><div class="l">ETH</div><div class="v">${user.balances.ETH.toFixed(6)}</div></div>
      <div class="bal-card"><div class="l">USDT</div><div class="v">${user.balances.USDT.toFixed(2)}</div></div>
      <div class="bal-card"><div class="l">Итого (USD)</div><div class="v">$0.00</div></div>
    </div>

    <div class="section-title">Адреса для депозита</div>
    <div class="addr-list" id="addrList"></div>
  `;

  const addrList = document.getElementById('addrList');
  Object.entries(user.addresses).forEach(([sym, addr]) => {
    const row = document.createElement('div');
    row.className = 'addr-row';
    row.innerHTML = `<div class="sym">${sym.replace('_', ' ')}</div><div class="addr" title="${addr}">${fmtAddr(addr)}</div><button class="copy-btn">Копировать</button>`;
    row.querySelector('.copy-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(addr);
        showToast('Адрес скопирован');
      } catch (e) {
        showToast('Не удалось скопировать');
      }
    });
    addrList.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) { /* ignore */ }
  location.href = '/';
});

loadDashboard();
