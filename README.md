# devligan.github.io

My portfolio, built as a JRPG save file. It rebuilds itself from my GitHub every hour, so new repos, commits and stats show up without me touching it.

**Live:** https://devligan.github.io

![Title screen](public/og.png)

## How it stays current

```
GitHub API ──► scripts/fetch-github.mjs ──► src/data/github.json ──► astro build ──► GitHub Pages
                 (hourly, on push, or on demand via the Actions tab)
```

- **Quest Log**: every public, non-fork repo, newest first, with live links and commit counts.
- **Status**: level (√ lifetime commits), contributions, streaks, languages by usage, NeetCode problems solved.
- **Journey**: the 12-month contribution calendar plus real commit messages from the most active repos.
- **Main Quest art**: the first screenshot in each featured repo's README, downloaded at build time.

If GitHub is unreachable, the last snapshot is kept and the site still builds.

## Curating it from GitHub

| Want to… | Do this |
| --- | --- |
| Feature a repo as a Main Quest | Add the topic `portfolio` to the repo |
| Hide a repo | Add the topic `portfolio-hide` |
| Change a blurb | Edit the repo's description |
| Write a proper case study | Add an entry to `quests` in `portfolio.config.mjs` |

Everything hand-written (intro, equipment, case studies, contact links) lives in [`portfolio.config.mjs`](portfolio.config.mjs).

## Running it

```bash
npm install
npm run sync    # pull fresh data (uses `gh auth token` or $GITHUB_TOKEN)
npm run dev     # http://localhost:4321
npm run build
```

Built with Astro and no client framework: the only JavaScript is one small script for the dialogue box, menu keys, filters, sound and the night sky. It respects `prefers-reduced-motion` and works without JS.

Psst: ↑ ↑ ↓ ↓ ← → ← → B A
