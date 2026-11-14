// Everything that moves. The page is complete without it; this only adds play.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private mode: fine */
    }
  },
};

// ── Sound: tiny square-wave blips, off until asked for ──────────────────────

let audio = null;
let soundOn = store.get('sound') === 'on';

function blip(freq = 880, dur = 0.05, type = 'square', vol = 0.04) {
  if (!soundOn) return;
  audio ??= new AudioContext();
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur);
}

const jingle = (notes, gap = 0.09) => notes.forEach((f, i) => setTimeout(() => blip(f, 0.12, 'square', 0.05), i * gap * 1000));

const soundBtn = $('[data-sound-toggle]');
function renderSound() {
  soundBtn?.setAttribute('aria-pressed', String(soundOn));
  const label = $('[data-sound-label]');
  if (label) label.textContent = soundOn ? 'on' : 'off';
}
soundBtn?.addEventListener('click', () => {
  soundOn = !soundOn;
  store.set('sound', soundOn ? 'on' : 'off');
  renderSound();
  if (soundOn) jingle([523, 659, 784]);
});
renderSound();

let lastHover = null;
document.addEventListener('pointerover', (e) => {
  const t = e.target.closest('.cursorable, .btn, .filter');
  if (t && t !== lastHover) blip(1320, 0.03);
  lastHover = t;
});
document.addEventListener('click', (e) => {
  if (e.target.closest('a, .filter')) blip(660, 0.06);
});

// ── Toast ───────────────────────────────────────────────────────────────────

const toastEl = $('[data-toast]');
let toastTimer;
function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('is-up');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-up'), 3200);
}

// ── Relative times stay true even if the page was built a while ago ─────────

function ago(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30.4);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ${months % 12 ? `${months % 12}mo ` : ''}ago`;
}
for (const el of $$('[data-ago]')) el.textContent = ago(el.dataset.ago);

// ── Dialogue box: typed out a line at a time ────────────────────────────────

// Each line keeps its full size while it types (the untyped rest is invisible),
// so nothing below the box jumps around.
const dialog = $('[data-dialog]');
if (dialog && !reduced) {
  const box = $('.lines', dialog);
  const lines = $$('[data-line]', dialog);
  const next = $('[data-dialog-next]', dialog);
  const full = lines.map((l) => l.textContent);

  const sr = document.createElement('p');
  sr.className = 'sr-only';
  sr.textContent = full.join(' ');
  box.before(sr);
  box.setAttribute('aria-hidden', 'true');

  const parts = lines.map((l) => {
    l.textContent = '';
    const typed = document.createElement('span');
    const rest = document.createElement('span');
    rest.className = 'rest';
    l.append(typed, rest);
    return { typed, rest };
  });
  const paint = (i, n) => {
    parts[i].typed.textContent = full[i].slice(0, n);
    parts[i].rest.textContent = full[i].slice(n);
  };
  lines.forEach((_, i) => paint(i, 0));

  let idx = -1;
  let typing = null;
  let wait = null;

  const finish = () => {
    clearInterval(typing);
    typing = null;
    paint(idx, full[idx].length);
    if (idx === lines.length - 1) next.hidden = true;
    else wait = setTimeout(advance, 1600);
  };

  const type = (i) => {
    let n = 0;
    lines[i - 1]?.classList.add('is-past');
    typing = setInterval(() => {
      n += 1;
      paint(i, n);
      if (n % 3 === 0 && full[i][n - 1] !== ' ') blip(1760, 0.015, 'square', 0.015);
      if (n >= full[i].length) finish();
    }, 22);
  };

  function advance() {
    clearTimeout(wait);
    if (typing) return finish();
    if (idx >= lines.length - 1) return;
    idx += 1;
    type(idx);
    if (idx > 0) blip(988, 0.05);
  }

  next.addEventListener('click', (e) => {
    e.stopPropagation();
    advance();
  });
  dialog.addEventListener('click', (e) => {
    if (!e.target.closest('a')) advance();
  });
  setTimeout(advance, 450);
}

// ── Menu: arrow keys move the cursor, number keys jump ──────────────────────

const menuItems = $$('[data-menu-item]');
menuItems.forEach((a, i) => {
  a.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = (i + (e.key === 'ArrowDown' ? 1 : -1) + menuItems.length) % menuItems.length;
      menuItems[n].focus();
      blip(1320, 0.03);
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea, [contenteditable]')) return;
  const n = Number(e.key);
  if (n >= 1 && n <= menuItems.length) {
    const target = $(menuItems[n - 1].getAttribute('href'));
    target?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    blip(660, 0.06);
  }
});

// Highlight the menu item for the chapter on screen.
const chapterObserver = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      menuItems.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
$$('main > section[id]').forEach((s) => chapterObserver.observe(s));

// ── Scroll reveal ───────────────────────────────────────────────────────────

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        revealObserver.unobserve(en.target);
      }
    }
  },
  { rootMargin: '0px 0px -8% 0px' },
);
$$('.reveal').forEach((el) => revealObserver.observe(el));

// ── Quest log filter ────────────────────────────────────────────────────────

// "All" starts folded to the ten most recent; a language filter shows every match.
const filters = $$('[data-filter]');
const rows = $$('[data-rows] > li');
const count = $('[data-log-count]');
const more = $('[data-log-more]');
const FOLD = 10;
let expanded = false;
let current = 'all';
function applyFilter(lang) {
  current = lang;
  const matches = rows.filter((r) => lang === 'all' || r.dataset.lang === lang);
  const limit = lang === 'all' && !expanded ? FOLD : Infinity;
  rows.forEach((r) => (r.hidden = true));
  matches.forEach((r, i) => (r.hidden = i >= limit));
  const shown = Math.min(matches.length, limit);
  filters.forEach((f) => f.setAttribute('aria-pressed', String(f.dataset.filter === lang)));
  if (count) count.textContent = `${shown} of ${matches.length} quest${matches.length === 1 ? '' : 's'}${lang === 'all' ? '' : ` · ${lang}`}`;
  if (more) more.hidden = shown >= matches.length;
}
filters.forEach((f) => f.addEventListener('click', () => applyFilter(f.dataset.filter)));
more?.addEventListener('click', () => {
  expanded = true;
  applyFilter(current);
  rows.find((r) => !r.hidden && rows.indexOf(r) === FOLD)?.querySelector('a')?.focus();
});
applyFilter('all');

// The calendar starts scrolled to today on narrow screens.
for (const el of $$('[data-scroll-end]')) el.scrollLeft = el.scrollWidth;

// ── Save crystal ────────────────────────────────────────────────────────────

const saveLines = [
  'Your progress has been saved.',
  'HP and MP fully restored. You feel ready to send an email.',
  'The crystal remembers you. (Unlike most recruiters’ inboxes.)',
  'Saved. Nothing was actually written anywhere, but it felt nice.',
];
let saveIdx = 0;
$('[data-save]')?.addEventListener('click', (e) => {
  const btn = e.currentTarget;
  const line = $('[data-save-line]');
  btn.classList.add('is-saving');
  setTimeout(() => btn.classList.remove('is-saving'), 600);
  if (line) line.textContent = saveLines[saveIdx++ % saveLines.length];
  jingle([784, 988, 1175, 1568], 0.08);
});

// ── Konami code → CRT mode ──────────────────────────────────────────────────

const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let pos = 0;
document.addEventListener('keydown', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  pos = key === code[pos] ? pos + 1 : key === code[0] ? 1 : 0;
  if (pos === code.length) {
    pos = 0;
    const on = document.documentElement.classList.toggle('crt');
    store.set('crt', on ? 'on' : 'off');
    toast(on ? '★ Secret unlocked: CRT mode' : 'CRT mode off. Back to the future.');
    jingle([523, 659, 784, 1047, 784, 1047], 0.07);
  }
});
if (store.get('crt') === 'on') document.documentElement.classList.add('crt');

// ── Night sky: stars, satellites, the odd meteor ────────────────────────────

const canvas = $('.sky');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let stars = [];
  let sats = [];
  let meteor = null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rand = (a, b) => a + Math.random() * (b - a);

  const newSat = () => {
    const fromLeft = Math.random() < 0.5;
    return {
      x: fromLeft ? -10 : w + 10,
      y: rand(h * 0.05, h * 0.55),
      vx: (fromLeft ? 1 : -1) * rand(0.12, 0.3),
      vy: rand(-0.05, 0.08),
      phase: rand(0, 6),
    };
  };

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((w * h) / 2600);
    stars = Array.from({ length: n }, () => ({
      x: Math.round(rand(0, w)),
      y: Math.round(rand(0, h * 0.85)),
      s: Math.random() < 0.08 ? 2 : 1,
      tw: rand(0.4, 2.2),
      ph: rand(0, 6.28),
      hue: Math.random() < 0.15 ? '255,220,160' : Math.random() < 0.2 ? '170,220,255' : '255,255,255',
    }));
    sats = [newSat(), newSat()].map((s) => ({ ...s, x: rand(0, w) }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const time = t / 1000;
    for (const s of stars) {
      const a = reduced ? 0.7 : 0.35 + 0.65 * Math.abs(Math.sin(time * s.tw + s.ph));
      ctx.fillStyle = `rgba(${s.hue},${a.toFixed(2)})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
      if (s.s === 2 && a > 0.85) {
        ctx.fillStyle = `rgba(${s.hue},0.25)`;
        ctx.fillRect(s.x - 2, s.y + 0.5, 6, 1);
        ctx.fillRect(s.x + 0.5, s.y - 2, 1, 6);
      }
    }
    if (reduced) return;

    // Satellites: steady dots gliding across, one with a strobe.
    sats = sats.map((s) => {
      s.x += s.vx;
      s.y += s.vy;
      const out = s.x < -20 || s.x > w + 20 || s.y < -20 || s.y > h;
      return out ? newSat() : s;
    });
    for (const s of sats) {
      const glint = Math.sin(time * 3 + s.phase) > 0.97 ? 1 : 0.75;
      ctx.fillStyle = `rgba(230,245,255,${glint})`;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
    }

    // A meteor every so often.
    if (!meteor && Math.random() < 0.0025) {
      meteor = { x: rand(w * 0.2, w), y: rand(0, h * 0.3), life: 0 };
    }
    if (meteor) {
      meteor.life += 1;
      const len = 60;
      const x = meteor.x - meteor.life * 7;
      const y = meteor.y + meteor.life * 3.5;
      const g = ctx.createLinearGradient(x, y, x + len, y - len / 2);
      g.addColorStop(0, 'rgba(255,240,200,0.9)');
      g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y - len / 2);
      ctx.stroke();
      if (meteor.life > 40) meteor = null;
    }
  }

  let running = true;
  const loop = (t) => {
    if (running) draw(t);
    if (!reduced) requestAnimationFrame(loop);
  };
  resize();
  requestAnimationFrame(loop);
  new ResizeObserver(() => {
    resize();
    if (reduced) draw(0);
  }).observe(canvas);
  // Don't burn battery drawing a sky nobody is looking at.
  new IntersectionObserver(([en]) => (running = en.isIntersecting)).observe(canvas);
}
