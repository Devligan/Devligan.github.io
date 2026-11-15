// Turns the raw GitHub snapshot + the hand-written config into what the page shows.

import config from '../../portfolio.config.mjs';
import data from '../data/github.json';

const DAY = 86_400_000;

export const now = new Date(data.generatedAt);
export const profile = config.profile;

export function ago(iso) {
  const mins = Math.round((now - new Date(iso)) / 60_000);
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

export function shortDate(iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Date(iso).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}

const notebook = (name) => name === 'Jupyter Notebook';
export const langName = (l) => (l ? (notebook(l.name) ? 'Python' : l.name) : null);
export const langColor = (l) => (l ? (notebook(l.name) ? '#3572A5' : l.color ?? '#8a8f98') : '#8a8f98');

// ── Activity as a market series ──────────────────────────────────────────────

const weeks = data.calendar?.weeks ?? [];
// Running total by week: reads like an equity curve.
let running = 0;
export const weekly = weeks.map((w) => {
  const total = w.reduce((s, [, n]) => s + n, 0);
  running += total;
  return { start: w[0][0], total, cumulative: running };
});
// The last calendar week is usually partial, so compare the last 7 days instead.
const days = weeks.flat();
const sum = (arr) => arr.reduce((s, [, n]) => s + n, 0);
const last7 = sum(days.slice(-7));
const prev7 = sum(days.slice(-14, -7));

export const stats = {
  commits: data.stats.totalCommits,
  contributions: data.calendar?.total ?? null,
  repos: data.stats.repos,
  streak: data.calendar?.current ?? null,
  longest: data.calendar?.longest ?? null,
  last7,
  prev7,
  delta: last7 - prev7,
  practice: data.practice?.solved ?? null,
  practiceUrl: data.practice?.url,
  since: new Date(data.user.createdAt).getUTCFullYear(),
};

// ── Projects ─────────────────────────────────────────────────────────────────

const repoByName = new Map(data.repos.map((r) => [r.name, r]));

/** A repo's human name: its project title, "NeetCode" for the practice repo, else the repo name. */
export function displayName(repo) {
  if (repo === config.practice?.repo) return 'NeetCode';
  return config.projects.find((p) => p.repo === repo)?.title ?? repo;
}

function status(repo) {
  const idle = (now - new Date(repo.pushedAt)) / DAY;
  if (repo.archived) return { label: 'Archived', tone: 'muted' };
  if (idle < 14) return { label: 'Active', tone: 'up' };
  return { label: `Updated ${shortDate(repo.pushedAt, { month: 'short', year: 'numeric' })}`, tone: 'muted' };
}

function toProject(entry, repo) {
  return {
    ...entry,
    title: entry.title ?? repo.name.replace(/[-_]/g, ' '),
    summary: entry.summary ?? repo.description ?? repo.summary,
    live: entry.live ?? repo.homepage ?? '',
    source: repo.url,
    image: entry.image ?? repo.image ?? null,
    language: langName(repo.language),
    commits: repo.commits,
    createdAt: repo.createdAt,
    pushedAt: repo.pushedAt,
    status: status(repo),
    stack: entry.stack ?? repo.topics.filter((t) => !t.startsWith('portfolio')),
  };
}

const configured = config.projects
  .filter((p) => repoByName.has(p.repo))
  .map((p) => toProject(p, repoByName.get(p.repo)));
// Repos tagged `portfolio` on GitHub join the featured list automatically.
const tagged = data.repos
  .filter((r) => r.topics.includes('portfolio') && !config.projects.some((p) => p.repo === r.name))
  .map((r) => toProject({ repo: r.name, featured: true, category: 'Project', problem: r.summary }, r));

export const featured = [...configured.filter((p) => p.featured), ...tagged];
export const more = configured.filter((p) => !p.featured);

// ── Every repo ───────────────────────────────────────────────────────────────

const NEW_WINDOW = 45 * DAY;
export const repos = data.repos
  .map((r) => {
    const entry = config.projects.find((p) => p.repo === r.name);
    return {
      name: r.name,
      blurb: entry?.summary || r.description || r.summary,
      url: r.url,
      homepage: entry?.live ?? r.homepage,
      language: langName(r.language),
      color: langColor(r.language),
      commits: r.commits,
      pushedAt: r.pushedAt,
      isNew: now - new Date(r.createdAt) < NEW_WINDOW,
      featured: !!entry?.featured || r.topics.includes('portfolio'),
    };
  })
  .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));

export const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))];

// ── Recent commits (no single repo may take over) ────────────────────────────

export const recentCommits = (() => {
  const perRepo = new Map();
  return data.log.filter((e) => {
    const n = (perRepo.get(e.repo) ?? 0) + 1;
    perRepo.set(e.repo, n);
    return n <= 3;
  });
})()
  .slice(0, 8)
  .map((e) => ({ ...e, title: displayName(e.repo) }));

// ── Ticker tape ──────────────────────────────────────────────────────────────

// Only projects go on the tape, not coursework or practice repos.
const recentlyPushed = [...data.repos]
  .filter((r) => config.projects.some((p) => p.repo === r.name) || r.topics.includes('portfolio'))
  .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))
  .slice(0, 4);
export const ticker = [
  { sym: 'COMMITS', value: stats.commits.toLocaleString('en-US') },
  stats.contributions !== null && {
    sym: '7D',
    value: String(stats.last7),
    delta: stats.delta,
    title: 'Contributions in the last 7 days vs. the 7 before',
  },
  stats.contributions !== null && { sym: '12M', value: stats.contributions.toLocaleString('en-US'), title: 'Contributions, last 12 months' },
  { sym: 'REPOS', value: String(stats.repos) },
  stats.streak !== null && { sym: 'STREAK', value: `${stats.streak}D` },
  stats.practice !== null && { sym: 'NEETCODE', value: String(stats.practice) },
  ...recentlyPushed.map((r) => ({
    sym: displayName(r.name).toUpperCase(),
    value: ago(r.pushedAt),
    ago: r.pushedAt,
    title: `Last push to ${r.name}`,
  })),
].filter(Boolean);

export { config, data };
