# devligan.github.io

My portfolio. It rebuilds itself from my GitHub every hour, so new repos, commits, stats and project screenshots show up without me touching it.

**Live:** https://devligan.github.io

![Portfolio title screen](public/og.png)

## How it stays current

```
GitHub API ──► scripts/fetch-github.mjs ──► src/data/github.json ──► astro build ──► GitHub Pages
                 (hourly, on push, or on demand via the Actions tab)
```

- **Projects**: each featured project's gallery comes from its README screenshots, or from chart outputs in its notebook. Images are resized to WebP and cached by git blob SHA, so they're only reprocessed when they change.
- **About**: commits, contributions, NeetCode count, the 12-month contribution calendar and recent commit messages.
- **Everything else on GitHub**: every other public repo, newest first.

If GitHub is unreachable, the last snapshot is kept and the site still builds.

## Editing it

Everything hand-written lives in [`portfolio.config.mjs`](portfolio.config.mjs): headline, bio, experience, education, skills and the project write-ups.

| Want to… | Do this |
| --- | --- |
| Feature a repo in Projects | Add the topic `portfolio` to the repo |
| Hide a repo | Add the topic `portfolio-hide` |
| Change a project's images | Add screenshots to its README, or set `media` in the config |
| Add a job | Add an entry to `experience` in the config |

## Running it

```bash
npm install
npm run sync    # pull fresh data (uses `gh auth token` or $GITHUB_TOKEN)
npm run dev     # http://localhost:4321
npm run build
```

Built with Astro and no client framework. One small script handles the starfield, project drawers, relative times and scroll effects. The page works without JavaScript (project cards link straight to GitHub) and respects `prefers-reduced-motion`.
