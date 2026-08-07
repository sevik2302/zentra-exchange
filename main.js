// ---------- nav scroll state ----------
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });
}

// ---------- reveal on scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((en, i) => {
    if (en.isIntersecting) {
      setTimeout(() => en.target.classList.add('in'), i * 50);
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// ---------- animated counters ----------
const cIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) {
      const el = en.target;
      const target = parseFloat(el.dataset.count);
      const suf = el.dataset.suffix || '';
      const isFloat = target % 1 !== 0;
      const start = performance.now();
      const dur = 1400;
      function step(t) {
        const p = Math.min((t - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        const v = target * e;
        el.textContent = (isFloat ? v.toFixed(2) : Math.round(v)) + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      cIO.unobserve(el);
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('[data-count]').forEach((el) => cIO.observe(el));

// ---------- demo market data ----------
const assets = [
  { name: 'Bitcoin', sym: 'BTC', price: 96412.50, chg: 4.82, vol: '$48.2B' },
  { name: 'Ethereum', sym: 'ETH', price: 3684.20, chg: 2.14, vol: '$21.7B' },
  { name: 'Solana', sym: 'SOL', price: 214.65, chg: -1.32, vol: '$6.4B' },
  { name: 'XRP', sym: 'XRP', price: 2.84, chg: 6.05, vol: '$4.1B' },
  { name: 'BNB', sym: 'BNB', price: 712.40, chg: 1.61, vol: '$2.8B' },
  { name: 'Toncoin', sym: 'TON', price: 8.92, chg: -0.87, vol: '$0.9B' },
];

const marqueeTrack = document.getElementById('marqueeTrack');
if (marqueeTrack) {
  let mq = '';
  for (let r = 0; r < 3; r++) {
    assets.forEach((a) => {
      const cls = a.chg >= 0 ? 'up' : 'down';
      const arr = a.chg >= 0 ? '▲' : '▼';
      mq += `<div class="mq-item"><b>${a.sym}</b> $${a.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span class="${cls}">${arr} ${Math.abs(a.chg)}%</span></div>`;
    });
  }
  marqueeTrack.innerHTML = mq;
}

const marketsBody = document.getElementById('marketsBody');
if (marketsBody) {
  assets.forEach((a) => {
    const cls = a.chg >= 0 ? 'up' : 'down';
    const arr = a.chg >= 0 ? '▲' : '▼';
    const color = a.chg >= 0 ? 'var(--green)' : 'var(--red)';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><div class="asset-cell"><div class="aicon">${a.sym[0]}</div><div><div style="font-weight:600;font-size:13.5px;">${a.name}</div><div class="mono" style="font-size:11px;color:var(--muted-2);">${a.sym}/USDT</div></div></div></td>
      <td class="mono" style="font-size:13.5px;">$${a.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td class="mono" style="font-size:13px;color:${color};">${arr} ${Math.abs(a.chg).toFixed(2)}%</td>
      <td class="mono" style="font-size:13px;color:var(--muted);">${a.vol}</td>
      <td><a class="trade-link" href="/auth.html?mode=signup">Торговать</a></td>`;
    marketsBody.appendChild(tr);
  });
}

// ---------- candlestick chart (visual only) ----------
function drawCandles() {
  const svg = document.getElementById('candleSvg');
  if (!svg) return;
  svg.innerHTML = '';
  const n = 36, w = 480, h = 160, cw = w / n;
  let price = 94000;
  const ns = 'http://www.w3.org/2000/svg';
  for (let i = 0; i < n; i++) {
    const open = price;
    const close = open + (Math.random() - 0.47) * 900;
    const high = Math.max(open, close) + Math.random() * 300;
    const low = Math.min(open, close) - Math.random() * 300;
    price = close;
    const min = 91000, max = 99000, range = max - min;
    const x = i * cw + cw * 0.2;
    const bw = cw * 0.6;
    const yO = h - ((open - min) / range) * h;
    const yC = h - ((close - min) / range) * h;
    const yH = h - ((high - min) / range) * h;
    const yL = h - ((low - min) / range) * h;
    const up = close >= open;
    const wick = document.createElementNS(ns, 'line');
    wick.setAttribute('x1', x + bw / 2); wick.setAttribute('x2', x + bw / 2);
    wick.setAttribute('y1', yH); wick.setAttribute('y2', yL);
    wick.setAttribute('stroke', up ? 'var(--green)' : 'var(--red)');
    wick.setAttribute('stroke-width', '1');
    svg.appendChild(wick);
    const body = document.createElementNS(ns, 'rect');
    body.setAttribute('x', x); body.setAttribute('width', bw);
    body.setAttribute('y', Math.min(yO, yC));
    body.setAttribute('height', Math.max(Math.abs(yO - yC), 1.5));
    body.setAttribute('class', up ? 'candle-up' : 'candle-down');
    body.setAttribute('rx', '1');
    svg.appendChild(body);
  }
}
drawCandles();

// ---------- order book (visual only) ----------
function buildBook(id, base, dir) {
  const el = document.getElementById(id);
  if (!el) return;
  let html = '';
  for (let i = 0; i < 5; i++) {
    const px = dir === 'ask' ? base + (i + 1) * 14.2 : base - (i + 1) * 14.2;
    const amt = (Math.random() * 1.4 + 0.05).toFixed(3);
    const w = 20 + Math.random() * 70;
    html += `<div class="ob-r ${dir}"><div class="bar" style="width:${w}%;"></div><span>${px.toFixed(1)}</span><span>${amt}</span></div>`;
  }
  el.innerHTML = html;
}
buildBook('obAsks', 96412.5, 'ask');
buildBook('obBids', 96412.5, 'bid');

// ---------- price ticking (visual only) ----------
const tmPrice = document.getElementById('tmPrice');
if (tmPrice) {
  setInterval(() => {
    let v = parseFloat(tmPrice.textContent.replace(/,/g, ''));
    v += (Math.random() - 0.5) * 80;
    tmPrice.textContent = v.toLocaleString('en-US', { minimumFractionDigits: 2 });
  }, 2000);
}
