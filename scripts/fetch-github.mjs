// Pulls everything the site shows from GitHub and writes src/data/github.json.
//
// Runs before every build (hourly in CI). Only public data is ever requested,
// so a local run with your personal token can't leak private repos.
// If GitHub is unreachable the previous snapshot is kept and the build goes on.

import { execSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import config from '../portfolio.config.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src/data/github.json');
const ART_DIR = path.join(ROOT, 'public/project-art');
const LOGIN = config.github;

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

const TOKEN = token();
const headers = {
  'User-Agent': `${LOGIN}-portfolio`,
  Accept: 'application/vnd.github+json',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function rest(url) {
  const res = await fetch(`https://api.github.com${url}`, { headers });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function graphql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) {
    throw new Error(`GraphQL: ${res.status} ${JSON.stringify(body.errors ?? body.message)}`);
  }
  return body.data;
}

const REPO_QUERY = /* GraphQL */ `
  query ($login: String!, $userId: ID!) {
    user(login: $login) {
      name
      login
      avatarUrl
      bio
      createdAt
      followers { totalCount }
      repositories(
        first: 100
        privacy: PUBLIC
        ownerAffiliations: OWNER
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        nodes {
          name
          description
          url
          homepageUrl
          stargazerCount
          forkCount
          isFork
          isArchived
          isEmpty
          createdAt
          pushedAt
          primaryLanguage { name color }
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
          repositoryTopics(first: 20) { nodes { topic { name } } }
          defaultBranchRef {
            name
            target { ... on Commit { history(author: { id: $userId }) { totalCount } } }
          }
          readme: object(expression: "HEAD:README.md") { ... on Blob { text } }
        }
      }
    }
  }
`;

const CALENDAR_QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }
`;

// ── README helpers ───────────────────────────────────────────────────────────

function readmeSummary(md) {
  if (!md) return '';
  const text = md
    .replace(/\r/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/g, '');
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, ' ').replace(/\\(\s|$)/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(
      (p) =>
        p.length > 50 &&
        !/^[#|>*-]/.test(p) &&
        !/^[-=*_]{3,}$/.test(p) &&
        // Setup instructions make terrible blurbs.
        !/\b(npm|pip) install\b|run "|https?:\/\//i.test(p),
    );
  const first = (paras[0] ?? '').replace(/\*\*|__|`/g, '');
  return first.length > 280 ? first.slice(0, 277).replace(/\s+\S*$/, '') + '…' : first;
}

function readmeImage(md, repo, branch) {
  if (!md) return null;
  const candidates = [
    ...[...md.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((m) => m[1]),
    ...[...md.matchAll(/<img[^>]+src=["']([^"']+)["']/g)].map((m) => m[1]),
  ];
  const src = candidates.find(
    (u) => /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(u) && !/shields\.io|badge/i.test(u),
  );
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return src;
  return `https://raw.githubusercontent.com/${LOGIN}/${repo}/${branch}/${src.replace(/^\.?\//, '')}`;
}

async function downloadArt(repo, url) {
  const ext = (url.match(/\.(png|jpe?g|gif|webp)/i)?.[1] ?? 'png').toLowerCase();
  const file = `${repo}.${ext}`;
  const res = await fetch(url, { headers: { 'User-Agent': headers['User-Agent'] } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  await mkdir(ART_DIR, { recursive: true });
  await writeFile(path.join(ART_DIR, file), Buffer.from(await res.arrayBuffer()));
  return `/project-art/${file}`;
}

// ── Derived numbers ──────────────────────────────────────────────────────────

function streaks(days) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // Current streak: today may not have a commit yet, so allow it to be empty.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) current++;
    else if (i === days.length - 1) continue;
    else break;
  }
  return { current, longest };
}

function languageTotals(repos) {
  // Notebooks are inflated by cell outputs, so a language's weight is its share
  // of each repo, not raw bytes. Recent repos count a bit more.
  const now = Date.now();
  const totals = new Map();
  for (const r of repos) {
    const sum = r.languages.reduce((s, l) => s + l.size, 0);
    if (!sum) continue;
    const ageYears = (now - new Date(r.pushedAt).getTime()) / 3.15e10;
    const recency = 1 / (1 + ageYears * 0.5);
    for (const l of r.languages) {
      const name = l.name === 'Jupyter Notebook' ? 'Python' : l.name;
      const color = name === 'Python' ? '#3572A5' : l.color;
      const t = totals.get(name) ?? { name, color, score: 0, repos: new Set() };
      t.score += (l.size / sum) * recency;
      if (l.size / sum > 0.05) t.repos.add(r.name);
      totals.set(name, t);
    }
  }
  const list = [...totals.values()]
    .map((t) => ({ name: t.name, color: t.color, score: t.score, repos: t.repos.size }))
    .filter((t) => t.repos > 0)
    .sort((a, b) => b.score - a.score);
  const max = list[0]?.score ?? 1;
  return list.map((t) => ({ ...t, pct: Math.round((t.score / max) * 100) }));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const hidden = new Set(config.hidden.map((h) => h.toLowerCase()));
  // Optional sections fall back to the last good snapshot rather than vanishing.
  const prev = existsSync(OUT) ? JSON.parse(await readFile(OUT, 'utf8')) : {};

  const { node_id: userId } = await rest(`/users/${LOGIN}`);
  const { user } = await graphql(REPO_QUERY, { login: LOGIN, userId });

  const repos = user.repositories.nodes
    .filter((r) => !r.isFork && !r.isEmpty)
    .map((r) => {
      const topics = r.repositoryTopics.nodes.map((n) => n.topic.name);
      return {
        name: r.name,
        description: r.description ?? '',
        summary: readmeSummary(r.readme?.text),
        url: r.url,
        homepage: r.homepageUrl || '',
        stars: r.stargazerCount,
        forks: r.forkCount,
        archived: r.isArchived,
        createdAt: r.createdAt,
        pushedAt: r.pushedAt,
        language: r.primaryLanguage,
        languages: r.languages.edges.map((e) => ({ name: e.node.name, color: e.node.color, size: e.size })),
        topics,
        commits: r.defaultBranchRef?.target?.history?.totalCount ?? 0,
        branch: r.defaultBranchRef?.name ?? 'main',
        imageUrl: readmeImage(r.readme?.text, r.name, r.defaultBranchRef?.name ?? 'main'),
      };
    })
    .filter((r) => !hidden.has(r.name.toLowerCase()) && !r.topics.includes('portfolio-hide'));

  // Card art for projects: the first real screenshot in each README, saved locally
  // so the site never hotlinks.
  const projectRepos = new Set([
    ...config.projects.map((p) => p.repo),
    ...repos.filter((r) => r.topics.includes('portfolio')).map((r) => r.name),
  ]);
  for (const r of repos) {
    if (!projectRepos.has(r.name) || !r.imageUrl) continue;
    try {
      r.image = await downloadArt(r.name, r.imageUrl);
    } catch (e) {
      console.warn(`  art for ${r.name} skipped: ${e.message}`);
      r.image = prev.repos?.find((p) => p.name === r.name)?.image;
    }
  }

  // Calendar. Can fail with some token types, so it's optional.
  let calendar = null;
  try {
    const { user: u } = await graphql(CALENDAR_QUERY, { login: LOGIN });
    const c = u.contributionsCollection.contributionCalendar;
    const days = c.weeks.flatMap((w) => w.contributionDays);
    calendar = {
      total: c.totalContributions,
      weeks: c.weeks.map((w) => w.contributionDays.map((d) => [d.date, d.contributionCount])),
      ...streaks(days),
    };
  } catch (e) {
    console.warn(`  calendar skipped, keeping last snapshot: ${e.message}`);
    calendar = prev.calendar ?? null;
  }

  // Adventure log: real commit messages from the most recently active repos.
  const recent = [...repos].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt)).slice(0, 6);
  const log = [];
  for (const r of recent) {
    try {
      const commits = await rest(`/repos/${LOGIN}/${r.name}/commits?per_page=10&author=${LOGIN}`);
      for (const c of commits) {
        const message = c.commit.message.split('\n')[0].trim();
        if (/^merge (pull request|branch)/i.test(message)) continue;
        log.push({ repo: r.name, message, date: c.commit.author.date, url: c.html_url });
      }
    } catch (e) {
      console.warn(`  commits for ${r.name} skipped: ${e.message}`);
    }
  }
  log.sort((a, b) => b.date.localeCompare(a.date));

  // Practice repo: one folder per solved problem.
  let practice = null;
  if (config.practice?.repo) {
    try {
      const tree = await rest(`/repos/${LOGIN}/${config.practice.repo}/git/trees/HEAD?recursive=1`);
      const problems = new Set(
        tree.tree
          .filter((t) => t.type === 'blob' && t.path.split('/').length >= 2)
          .map((t) => t.path.split('/').slice(0, -1).join('/')),
      );
      practice = { solved: problems.size, url: `https://github.com/${LOGIN}/${config.practice.repo}` };
    } catch (e) {
      console.warn(`  practice skipped, keeping last snapshot: ${e.message}`);
      practice = prev.practice ?? prev.training ?? null;
    }
  }

  const totalCommits = repos.reduce((s, r) => s + r.commits, 0);
  const data = {
    generatedAt: new Date().toISOString(),
    user: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      followers: user.followers.totalCount,
    },
    stats: {
      repos: repos.length,
      totalCommits,
      stars: repos.reduce((s, r) => s + r.stars, 0),
      lastPush: repos[0]?.pushedAt ?? null,
    },
    languages: languageTotals(repos),
    repos,
    log: log.slice(0, 40),
    calendar,
    practice,
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(data, null, 2) + '\n');
  console.log(
    `✓ synced ${repos.length} repos, ${totalCommits} commits, ${log.length} log entries` +
      (calendar ? `, ${calendar.total} contributions` : ''),
  );
}

main().catch(async (e) => {
  console.error(`✗ GitHub sync failed: ${e.message}`);
  if (existsSync(OUT)) {
    const prev = JSON.parse(await readFile(OUT, 'utf8'));
    console.error(`  keeping the snapshot from ${prev.generatedAt}`);
    process.exit(0);
  }
  process.exit(1);
});
