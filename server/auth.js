const crypto = require('crypto');

// В проде задайте SESSION_SECRET через переменные окружения / .env.
// Если не задан — используется значение по умолчанию (сессии переживут
// перезапуск сервера, но это НЕ безопасно для реального продакшена).
const SESSION_SECRET = process.env.SESSION_SECRET || 'zentra-dev-secret-change-me';

// ---------- пароли (Node.js crypto.scrypt, без внешних зависимостей) ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'));
}

// ---------- подписанные сессионные токены (без БД сессий) ----------
function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

function createSessionToken(username) {
  const payload = `${username}.${Date.now()}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

function verifySessionToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split('.');
    if (parts.length !== 3) return null;
    const [username, ts, sig] = parts;
    const payload = `${username}.${ts}`;
    const expected = sign(payload);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    // сессия действительна 30 дней
    if (Date.now() - Number(ts) > 30 * 24 * 60 * 60 * 1000) return null;
    return username;
  } catch (e) {
    return null;
  }
}

// ---------- демо-адреса для депозита ----------
// ВАЖНО: это случайно сгенерированные строки в формате крипто-адресов,
// НЕ подключённые к реальному блокчейну. Они нужны только для витрины
// интерфейса. Реальный приём депозитов требует кастодиального провайдера
// (Fireblocks/BitGo/Copper и т.п.), лицензии и security-аудита.
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function randomFrom(alphabet, len) {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function generateAddresses() {
  return {
    BTC: 'bc1q' + randomFrom(B58.toLowerCase(), 38),
    ETH: '0x' + randomFrom('0123456789abcdef', 40),
    USDT_TRC20: 'T' + randomFrom(B58, 33),
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  generateAddresses,
};
