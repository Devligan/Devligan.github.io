// Enhancements only. The page is complete without this script.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

// The contribution calendar starts scrolled to today on narrow screens.
for (const el of $$('[data-scroll-end]')) el.scrollLeft = el.scrollWidth;

// ── Scroll reveal ───────────────────────────────────────────────────────────

const reveal = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add('is-in');
      reveal.unobserve(en.target);
    }
  },
  { rootMargin: '0px 0px -8% 0px' },
);
$$('.reveal').forEach((el) => reveal.observe(el));

// ── Nav: hidden on the title screen, then tracks the section on screen ──────

const navBar = $('[data-nav-bar]');
const hero = $('#top');
if (navBar && hero) {
  new IntersectionObserver(([en]) => navBar.classList.toggle('is-shown', !en.isIntersecting), {
    rootMargin: '-80px 0px 0px 0px',
  }).observe(hero);
}
const navLinks = $$('[data-nav]');
const spy = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
$$('main > section[id]').forEach((s) => spy.observe(s));

// ── Project drawers ─────────────────────────────────────────────────────────

const drawers = new Map($$('[data-drawer]').map((d) => [d.dataset.drawer, d]));
let openId = null;

function openDrawer(id, { push = true } = {}) {
  const d = drawers.get(id);
  if (!d) return;
  if (openId && openId !== id) drawers.get(openId)?.close();
  if (!d.open) d.showModal();
  d.querySelector('.drawer-panel').scrollTop = 0;
  openId = id;
  document.body.classList.add('has-dialog');
  if (push) history.pushState({ project: id }, '', `#project/${id}`);
}

function closeDrawer() {
  if (!openId) return;
  const d = drawers.get(openId);
  openId = null;
  if (d?.open) d.close();
}

for (const d of drawers.values()) {
  d.addEventListener('close', () => {
    document.body.classList.remove('has-dialog');
    if (location.hash.startsWith('#project/') && !openId) history.pushState(null, '', '#projects');
    if (openId === d.dataset.drawer) {
      openId = null;
      history.pushState(null, '', '#projects');
    }
  });
  // Click on the dimmed backdrop (the dialog itself, outside the panel) closes it.
  d.addEventListener('click', (e) => {
    if (e.target === d) closeDrawer();
  });
  $$('[data-close]', d).forEach((b) => b.addEventListener('click', closeDrawer));

  // Gallery: thumbnails swap the main image.
  const main = $('[data-g-main]', d);
  $$('[data-g-src]', d).forEach((btn) =>
    btn.addEventListener('click', () => {
      main.src = btn.dataset.gSrc;
      main.alt = btn.dataset.gAlt;
      $$('[data-g-src]', d).forEach((b) => b.classList.toggle('is-on', b === btn));
    }),
  );
}

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-open]');
  if (!trigger || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  openDrawer(trigger.dataset.open);
});

function fromHash() {
  const m = location.hash.match(/^#project\/(.+)$/);
  if (m && drawers.has(m[1])) openDrawer(m[1], { push: false });
  else if (openId) closeDrawer();
}
window.addEventListener('popstate', fromHash);
fromHash();

// ── Starfield ───────────────────────────────────────────────────────────────

const canvas = $('canvas.stars');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let stars = [];
  let meteor = null;
  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((w * h) / 3800);
    stars = Array.from({ length: n }, () => {
      const depth = Math.random();
      return {
        x: rand(0, w),
        y: rand(0, h),
        r: 0.3 + depth * 1.2,
        depth,
        tw: rand(0.5, 2),
        ph: rand(0, 6.28),
        hue: Math.random() < 0.18 ? '255,226,160' : Math.random() < 0.25 ? '170,215,255' : '255,255,255',
      };
    });
  }

  let scrollY = window.scrollY;
  window.addEventListener('scroll', () => (scrollY = window.scrollY), { passive: true });

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const time = t / 1000;
    for (const s of stars) {
      // Gentle parallax: nearer stars drift more as you scroll.
      const y = (((s.y - scrollY * s.depth * 0.15) % h) + h) % h;
      const a = reduced ? 0.6 : 0.25 + 0.75 * Math.abs(Math.sin(time * s.tw + s.ph));
      ctx.beginPath();
      ctx.fillStyle = `rgba(${s.hue},${(a * (0.4 + s.depth * 0.6)).toFixed(3)})`;
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.2 && a > 0.9) {
        ctx.fillStyle = `rgba(${s.hue},0.12)`;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (reduced) return;

    if (!meteor && Math.random() < 0.002) meteor = { x: rand(w * 0.3, w * 1.1), y: rand(-20, h * 0.4), life: 0 };
    if (meteor) {
      meteor.life += 1;
      const x = meteor.x - meteor.life * 9;
      const y = meteor.y + meteor.life * 4;
      const g = ctx.createLinearGradient(x, y, x + 120, y - 54);
      g.addColorStop(0, 'rgba(255,240,205,0.9)');
      g.addColorStop(1, 'rgba(255,240,205,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 120, y - 54);
      ctx.stroke();
      if (meteor.life > 50) meteor = null;
    }
  }

  resize();
  window.addEventListener('resize', () => {
    resize();
    if (reduced) draw(0);
  });
  if (reduced) draw(0);
  else {
    const loop = (t) => {
      if (!document.hidden) draw(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
