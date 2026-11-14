// Turns the raw GitHub snapshot + the save-file config into what the page shows.

import config from '../../portfolio.config.mjs';
import data from '../data/github.json';

const DAY = 86_400_000;

export const now = new Date(data.generatedAt);

export function ago(iso) {
  const ms = now - new Date(iso);
  const mins = Math.round(ms / 60_000);
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

export function shortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** "Day N" of the journey, counted from the day the GitHub account was made. */
export function journeyDay(iso) {
  return Math.floor((new Date(iso) - new Date(data.user.createdAt)) / DAY) + 1;
}

// Every language gets a JRPG element. The language name always comes first;
// the element is flavour.
const ELEMENTS = {
  TypeScript: 'Thunder',
  JavaScript: 'Spark',
  Python: 'Serpent',
  'C#': 'Steel',
  HTML: 'Earth',
  CSS: 'Wind',
  PLpgSQL: 'Stone',
  SQL: 'Stone',
  R: 'Rune',
  Go: 'Gale',
  Rust: 'Iron',
  Java: 'Ember',
  'C++': 'Forge',
  C: 'Forge',
  Shell: 'Shadow',
  Astro: 'Starlight',
  Quarto: 'Ink',
};
export const element = (lang) => ELEMENTS[lang] ?? 'Arcane';

// Levelling: LV is the square root of lifetime commits, so the next level
// is always (LV+1)² commits away.
const level = Math.max(1, Math.floor(Math.sqrt(data.stats.totalCommits)));
const accountDays = Math.floor((now - new Date(data.user.createdAt)) / DAY);

export const hero = {
  ...config.profile,
  level,
  exp: data.stats.totalCommits,
  nextLevelAt: (level + 1) ** 2,
  levelFloor: level ** 2,
  journeyYears: Math.floor(accountDays / 365),
  journeyMonths: Math.floor((accountDays % 365) / 30.4),
  accountDays,
};

const repoByName = new Map(data.repos.map((r) => [r.name, r]));

function questStatus(repo) {
  const idle = (now - new Date(repo.pushedAt)) / DAY;
  if (repo.archived) return { label: 'Sealed', tone: 'muted' };
  if (idle < 14) return { label: 'In progress', tone: 'live' };
  if (idle < 120) return { label: 'Recently cleared', tone: 'ok' };
  return { label: 'Cleared', tone: 'muted' };
}

/** A repo's languages as percentages, with slivers folded into "Other". */
function languageMix(repo) {
  const total = repo.languages.reduce((s, l) => s + l.size, 0) || 1;
  const mix = [];
  let other = 0;
  for (const l of repo.languages) {
    const pct = (l.size / total) * 100;
    if (pct >= 3) mix.push({ name: l.name, color: l.color ?? '#8b8fb0', pct });
    else other += pct;
  }
  if (other > 0.5) mix.push({ name: 'Other', color: '#5b5685', pct: other });
  return mix;
}

function toQuest(entry, repo) {
  return {
    ...entry,
    title: entry.title ?? repo.name.replace(/[-_]/g, ' '),
    hook: entry.hook ?? repo.description ?? repo.summary,
    live: entry.live ?? repo.homepage ?? '',
    source: repo.url,
    image: entry.image ?? repo.image ?? null,
    language: repo.language,
    languages: languageMix(repo),
    createdAt: repo.createdAt,
    commits: repo.commits,
    stars: repo.stars,
    pushedAt: repo.pushedAt,
    status: questStatus(repo),
    stack: entry.stack ?? repo.topics.filter((t) => !t.startsWith('portfolio')),
  };
}

// Hand-written quests first, then any repo tagged `portfolio` on GitHub.
const configured = config.quests
  .filter((q) => repoByName.has(q.repo))
  .map((q) => toQuest(q, repoByName.get(q.repo)));
const tagged = data.repos
  .filter((r) => r.topics.includes('portfolio') && !config.quests.some((q) => q.repo === r.name))
  .map((r) => toQuest({ repo: r.name, tier: 'main', problem: r.summary }, r));

export const mainQuests = [...configured.filter((q) => q.tier === 'main'), ...tagged];
export const sideQuests = configured.filter((q) => q.tier === 'side');

const NEW_WINDOW = 45 * DAY;
export const questLog = data.repos
  .map((r) => ({
    name: r.name,
    blurb: config.quests.find((q) => q.repo === r.name)?.hook || r.description || r.summary,
    url: r.url,
    homepage: config.quests.find((q) => q.repo === r.name)?.live ?? r.homepage,
    language: r.language?.name === 'Jupyter Notebook' ? 'Python' : r.language?.name ?? null,
    notebook: r.language?.name === 'Jupyter Notebook',
    color: r.language?.name === 'Jupyter Notebook' ? '#3572A5' : r.language?.color ?? '#8b8fb0',
    commits: r.commits,
    stars: r.stars,
    pushedAt: r.pushedAt,
    isNew: now - new Date(r.createdAt) < NEW_WINDOW,
    featured: config.quests.some((q) => q.repo === r.name) || r.topics.includes('portfolio'),
  }))
  .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));

export const elements = [...new Set(questLog.map((q) => q.language).filter(Boolean))];

// What I'm working on right now: the most recent commit and its repo.
const latest = data.log[0];
export const nowQuesting = latest
  ? {
      repo: latest.repo,
      title: config.quests.find((q) => q.repo === latest.repo)?.title ?? latest.repo,
      message: latest.message,
      date: latest.date,
      url: latest.url,
      repoUrl: repoByName.get(latest.repo)?.url ?? `https://github.com/${config.github}/${latest.repo}`,
    }
  : null;

// The adventure log, with no single repo allowed to take over the page.
export const adventureLog = (() => {
  const perRepo = new Map();
  return data.log.filter((e) => {
    const n = (perRepo.get(e.repo) ?? 0) + 1;
    perRepo.set(e.repo, n);
    return n <= 3;
  });
})().slice(0, 10);

export { config, data };
