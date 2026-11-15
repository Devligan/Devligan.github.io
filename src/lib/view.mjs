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
export const langColor = (l) => (l ? (notebook(l.name) ? '#3572A5' : l.color ?? '#8a8fb0') : '#8a8fb0');

// ── Experience ───────────────────────────────────────────────────────────────

const monthName = (ym) => shortDate(`${ym}-01`, { month: 'short', year: 'numeric' });
function span(start, end) {
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = (end ?? `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`).split('-').map(Number);
  const months = (ey - sy) * 12 + (em - sm) + 1; // LinkedIn counts both ends
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ');
}

export const experience = config.experience.map((e) => ({
  ...e,
  current: !e.end,
  dates: `${monthName(e.start)} – ${e.end ? monthName(e.end) : 'Present'}`,
  duration: span(e.start, e.end),
}));
export const education = config.education;

// ── Stats ────────────────────────────────────────────────────────────────────

const days = (data.calendar?.weeks ?? []).flat();
const sum = (arr) => arr.reduce((s, [, n]) => s + n, 0);

export const stats = {
  commits: data.stats.totalCommits,
  contributions: data.calendar?.total ?? null,
  repos: data.stats.repos,
  streak: data.calendar?.current ?? null,
  longest: data.calendar?.longest ?? null,
  last7: sum(days.slice(-7)),
  practice: data.practice?.solved ?? null,
  practiceUrl: data.practice?.url,
  since: new Date(data.user.createdAt).getUTCFullYear(),
};

// ── Projects ─────────────────────────────────────────────────────────────────

const repoByName = new Map(data.repos.map((r) => [r.name, r]));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** A repo's human name: its project title, "NeetCode" for the practice repo, else the repo name. */
export function displayName(repo) {
  if (repo === config.practice?.repo) return 'NeetCode';
  return config.projects.find((p) => p.repo === repo)?.title ?? repo;
}

function status(repo) {
  const idle = (now - new Date(repo.pushedAt)) / DAY;
  if (repo.archived) return { label: 'Archived', live: false };
  if (idle < 14) return { label: 'In active development', live: true };
  return { label: `Updated ${shortDate(repo.pushedAt, { month: 'short', year: 'numeric' })}`, live: false };
}

function toProject(entry, repo) {
  const title = entry.title ?? repo.name.replace(/[-_]/g, ' ');
  return {
    ...entry,
    id: slug(title),
    title,
    summary: entry.summary ?? repo.description ?? repo.summary,
    live: entry.live ?? repo.homepage ?? '',
    source: repo.url,
    gallery: repo.gallery ?? [],
    cover: repo.gallery?.[0] ?? null,
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
export const allProjects = [...featured, ...more];

// ── Every other repo ─────────────────────────────────────────────────────────

const shown = new Set(allProjects.map((p) => p.repo));
export const otherRepos = data.repos
  .filter((r) => !shown.has(r.name))
  .map((r) => ({
    name: r.name,
    blurb: r.description || r.summary,
    url: r.url,
    homepage: r.homepage,
    language: langName(r.language),
    color: langColor(r.language),
    pushedAt: r.pushedAt,
  }))
  .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));

// ── Recent commits (no single repo may take over) ────────────────────────────

export const recentCommits = (() => {
  const perRepo = new Map();
  return data.log.filter((e) => {
    const n = (perRepo.get(e.repo) ?? 0) + 1;
    perRepo.set(e.repo, n);
    return n <= 2;
  });
})()
  .slice(0, 6)
  .map((e) => ({ ...e, title: displayName(e.repo) }));

export { config, data };
