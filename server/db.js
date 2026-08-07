// Простая файловая база данных (JSON на диске).
// Для реального продакшена замените на PostgreSQL/MySQL/SQLite —
// здесь важна прозрачность и ноль внешних зависимостей "из коробки".

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    // файл повреждён — не затираем его молча, поднимаем ошибку
    throw new Error('db.json повреждён или содержит некорректный JSON: ' + e.message);
  }
}

function writeDb(data) {
  ensureDb();
  // атомарная запись: сначала во временный файл, потом переименование
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, DB_FILE);
}

function getUser(username) {
  const db = readDb();
  return db.users[username.toLowerCase()] || null;
}

function createUser(user) {
  const db = readDb();
  const key = user.username.toLowerCase();
  if (db.users[key]) {
    throw new Error('USER_EXISTS');
  }
  db.users[key] = user;
  writeDb(db);
  return user;
}

function updateUser(username, patch) {
  const db = readDb();
  const key = username.toLowerCase();
  if (!db.users[key]) throw new Error('USER_NOT_FOUND');
  db.users[key] = { ...db.users[key], ...patch };
  writeDb(db);
  return db.users[key];
}

module.exports = { getUser, createUser, updateUser, readDb, writeDb };
