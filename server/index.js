const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('./db');
const auth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;
const COOKIE_NAME = 'zentra_session';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

function setSessionCookie(res, username) {
  const token = auth.createSessionToken(username);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    // secure:true нужно включить в проде за HTTPS
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  const username = auth.verifySessionToken(token);
  if (!username) return res.status(401).json({ error: 'Сессия недействительна, войдите снова' });
  const user = db.getUser(username);
  if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
  req.user = user;
  next();
}

function publicUser(user) {
  const { passwordSalt, passwordHash, ...rest } = user;
  return rest;
}

// ---------- API ----------

app.post('/api/auth/signup', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Логин должен быть не короче 3 символов' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });
    }
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Логин может содержать только латинские буквы, цифры и подчёркивание' });
    }
    if (db.getUser(cleanUsername)) {
      return res.status(409).json({ error: 'Такой логин уже занят' });
    }

    const { salt, hash } = auth.hashPassword(password);
    const user = {
      username: cleanUsername,
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
      addresses: auth.generateAddresses(),
      balances: { BTC: 0, ETH: 0, USDT: 0 },
    };
    db.createUser(user);
    setSessionCookie(res, cleanUsername);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    if (err.message === 'USER_EXISTS') {
      return res.status(409).json({ error: 'Такой логин уже занят' });
    }
    console.error('signup error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера при регистрации' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Укажите логин и пароль' });
    }
    const cleanUsername = username.trim().toLowerCase();
    const user = db.getUser(cleanUsername);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const ok = auth.verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
    setSessionCookie(res, cleanUsername);
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера при входе' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// health check — полезно для платформ деплоя (Render/Railway/etc.)
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`ZENTRA server running → http://localhost:${PORT}`);
});
