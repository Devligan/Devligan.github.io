// Small enhancements only. The page is complete without this script.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

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
for (const el of $$('[data-ago-short]')) if (el.dataset.agoShort) el.textContent = ago(el.dataset.agoShort);

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

// ── Nav: highlight the section on screen ────────────────────────────────────

const navLinks = $$('[data-nav]');
const spy = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
$$('main > section[id]').forEach((s) => spy.observe(s));

// ── Repositories: filter by language, fold "All" to the latest ten ──────────

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
  if (count) count.textContent = `Showing ${shown} of ${matches.length}${lang === 'all' ? '' : ` · ${lang}`}`;
  if (more) more.hidden = shown >= matches.length;
}
filters.forEach((f) => f.addEventListener('click', () => applyFilter(f.dataset.filter)));
more?.addEventListener('click', () => {
  expanded = true;
  applyFilter(current);
  rows[FOLD]?.querySelector('a')?.focus();
});
if (rows.length) applyFilter('all');

// The contribution calendar starts scrolled to today on narrow screens.
for (const el of $$('[data-scroll-end]')) el.scrollLeft = el.scrollWidth;
