// Pulls everything the site shows from GitHub and writes src/data/github.json.
//
// Runs before every build (hourly in CI). Only public data is ever requested,
// so a local run with your personal token can't leak private repos.
// If GitHub is unreachable the previous snapshot is kept and the build goes on.

import { execSync } from 'node:child_process';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
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
          # Git paths are case-sensitive, so try the usual spellings.
          readme: object(expression: "HEAD:README.md") { ... on Blob { text } }
          readmeLower: object(expression: "HEAD:readme.md") { ... on Blob { text } }
          readmeTitle: object(expression: "HEAD:Readme.md") { ... on Blob { text } }
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
  return clip(first, 280);
}

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

/** Markdown inline → plain text, minus leading emoji/checkmarks. */
function plain(s) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^[\p{Extended_Pictographic}✅✔️‍\s]+/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split a README into { heading, lines } sections, skipping code blocks. */
function readmeSections(md) {
  const out = [];
  let cur = { heading: '', lines: [] };
  let inCode = false;
  for (const line of md.replace(/\r/g, '').split('\n')) {
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const h = line.match(/^#{1,4}\s+(.*)/);
    if (h) {
      out.push(cur);
      cur = { heading: plain(h[1]), lines: [] };
    } else cur.lines.push(line);
  }
  out.push(cur);
  return out;
}

function bulletsOf(lines) {
  const items = [];
  for (const line of lines) {
    const m = line.match(/^\s{0,3}[-*+]\s+(.*)/);
    if (m) items.push(m[1]);
    else if (items.length && /^\s{2,}\S/.test(line)) items[items.length - 1] += ` ${line.trim()}`;
  }
  return items.map(plain).filter((t) => t.length > 12 && !/\b(npm|pip) install\b/i.test(t));
}

const SKIP = /install|usage|setup|getting started|running|run it|quick ?start|credit|licen|limitation|todo|contribut|how to use|dataset|data source|author/i;

/**
 * What a tagged project does and how it's built, in the README's own words.
 * Used for repos featured with the `portfolio` topic that have no hand-written entry.
 */
function readmeDetails(md) {
  if (!md) return { features: [], built: '' };
  const secs = readmeSections(md);
  const featureSec =
    secs.find((s) => /feature|what (it|the project|you can) do|highlight|capabilit|overview/i.test(s.heading) && bulletsOf(s.lines).length >= 2) ??
    secs.find((s) => !SKIP.test(s.heading) && bulletsOf(s.lines).length >= 2);
  const features = featureSec ? bulletsOf(featureSec.lines).slice(0, 5).map((t) => clip(t, 220)) : [];

  const builtSec = secs.find((s) => /how it works|architecture|how it fits|tech|stack|built with|implementation|model/i.test(s.heading));
  const para = builtSec?.lines
    .join('\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p.length > 40 && !/^[|>*+-]/.test(p));
  return { features, built: para ? clip(plain(para.replace(/\n/g, ' ')), 420) : '' };
}

/** Every real screenshot in a README (no badges), in order, with its alt text. */
function readmeImages(md) {
  if (!md) return [];
  const found = [
    ...[...md.matchAll(/!\[([^\]]*)\]\(([^)\s]+)/g)].map((m) => ({ src: m[2], alt: m[1], at: m.index })),
    ...[...md.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/g)].map((m) => ({
      src: m[1],
      alt: m[0].match(/alt=["']([^"']*)["']/)?.[1] ?? '',
      at: m.index,
    })),
  ].sort((a, b) => a.at - b.at);
  const seen = new Set();
  return found.filter(
    (i) => /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(i.src) && !/shields\.io|badge/i.test(i.src) && !seen.has(i.src) && seen.add(i.src),
  );
}

// Images are resized to WebP and cached by their git blob SHA, so the hourly
// build only re-processes an image when it actually changes.

const raw = (repo, branch, p) => `https://raw.githubusercontent.com/${LOGIN}/${repo}/${branch}/${p.replace(/^\.?\//, '')}`;

async function saveWebp(buffer, name) {
  await mkdir(ART_DIR, { recursive: true });
  const info = await sharp(buffer).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(ART_DIR, `${name}.webp`));
  return { src: `/project-art/${name}.webp`, w: info.width, h: info.height };
}

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': headers['User-Agent'] } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function buildGallery(repo, media, readme, prevGallery) {
  const cached = new Map((prevGallery ?? []).map((g) => [g.key, g]));
  const reuse = (key) => {
    const g = cached.get(key);
    return g && existsSync(path.join(ROOT, 'public', g.src)) ? g : null;
  };
  const tree = await rest(`/repos/${LOGIN}/${repo.name}/git/trees/${repo.branch}?recursive=1`);
  const shaOf = new Map(tree.tree.map((t) => [t.path, t.sha]));
  const gallery = [];

  for (const file of media.files ?? []) {
    const p = path.join(ROOT, 'public', file.src);
    if (!existsSync(p)) continue;
    const meta = await sharp(p).metadata();
    gallery.push({ key: file.src, src: file.src, alt: file.alt ?? '', w: meta.width, h: meta.height });
  }

  if (media.notebook) {
    const sha = shaOf.get(media.notebook);
    const picks = media.pick ?? [0, 1, 2];
    const keys = picks.map((i) => `${media.notebook}@${sha}#${i}`);
    if (keys.every((k) => reuse(k))) {
      gallery.push(...keys.map(reuse));
    } else {
      const nb = JSON.parse((await fetchBuffer(raw(repo.name, repo.branch, media.notebook))).toString('utf8'));
      const pngs = nb.cells.flatMap((c) => (c.outputs ?? []).map((o) => o.data?.['image/png']).filter(Boolean));
      for (const [n, i] of picks.entries()) {
        if (!pngs[i]) continue;
        const b64 = Array.isArray(pngs[i]) ? pngs[i].join('') : pngs[i];
        const saved = await saveWebp(Buffer.from(b64, 'base64'), `${repo.name}-nb${i}`);
        gallery.push({ key: keys[n], alt: media.alts?.[n] ?? '', ...saved });
      }
    }
  }

  if (media.readme !== false) {
    for (const [i, img] of readmeImages(readme).slice(0, 6).entries()) {
      const url = /^https?:\/\//.test(img.src) ? img.src : raw(repo.name, repo.branch, img.src);
      const key = /^https?:\/\//.test(img.src) ? url : `${img.src}@${shaOf.get(img.src.replace(/^\.?\//, ''))}`;
      const hit = reuse(key);
      if (hit) {
        gallery.push({ ...hit, alt: img.alt });
        continue;
      }
      const saved = await saveWebp(await fetchBuffer(url), `${repo.name}-${i}`);
      gallery.push({ key, alt: img.alt, ...saved });
    }
  }
  return gallery;
}

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
      const readme = (r.readme ?? r.readmeTitle ?? r.readmeLower)?.text ?? '';
      return {
        name: r.name,
        description: r.description ?? '',
        summary: readmeSummary(readme),
        ...readmeDetails(readme),
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
        readme,
      };
    })
    .filter((r) => !hidden.has(r.name.toLowerCase()) && !r.topics.includes('portfolio-hide'));

  // Galleries for projects, saved locally so the site never hotlinks.
  const mediaFor = new Map([
    ...repos.filter((r) => r.topics.includes('portfolio')).map((r) => [r.name, {}]),
    ...config.projects.map((p) => [p.repo, p.media ?? {}]),
  ]);
  for (const r of repos) {
    if (!mediaFor.has(r.name)) continue;
    const prevGallery = prev.repos?.find((p) => p.name === r.name)?.gallery;
    try {
      r.gallery = await buildGallery(r, mediaFor.get(r.name), r.readme, prevGallery);
    } catch (e) {
      console.warn(`  gallery for ${r.name} skipped, keeping last snapshot: ${e.message}`);
      r.gallery = prevGallery ?? [];
    }
  }
  for (const r of repos) delete r.readme;

  // Drop images nothing references any more.
  const used = new Set(repos.flatMap((r) => (r.gallery ?? []).map((g) => path.basename(g.src))));
  if (existsSync(ART_DIR)) {
    for (const f of await readdir(ART_DIR)) if (!used.has(f)) await unlink(path.join(ART_DIR, f));
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

  // Recent commit messages from the most recently active projects (not coursework).
  const recent = repos
    .filter((r) => mediaFor.has(r.name))
    .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))
    .slice(0, 6);
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
