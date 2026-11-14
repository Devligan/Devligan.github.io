// ─────────────────────────────────────────────────────────────────────────────
//  SAVE FILE — the only hand-written part of the site.
//
//  Everything else (repos, languages, commits, the activity calendar, stats)
//  is pulled from GitHub by scripts/fetch-github.mjs and rebuilt every hour.
//
//  Ways to change what shows up without touching this file:
//    • Add the topic `portfolio` to a GitHub repo  → it becomes a Main Quest.
//    • Add the topic `portfolio-hide` to a repo     → it vanishes from the site.
//    • Give a repo a description / homepage URL     → it's used automatically.
// ─────────────────────────────────────────────────────────────────────────────

export default {
  github: 'Devligan',
  site: 'https://devligan.github.io',

  profile: {
    name: 'Sriharsha Challangi',
    handle: 'Devligan',
    // Shown big on the title screen. Recruiters read this first: keep it plain.
    role: 'Software Engineer',
    stack: ['TypeScript', 'Next.js', 'Python', 'PostgreSQL', 'Machine Learning'],
    tagline:
      'I build software that turns messy real-world data into tools people can use: a power-market trading desk, a live satellite tracker, a risk engine for 113 assets.',
    class: 'Full-Stack Engineer',
    subclass: 'Data & ML',
    // Typed out in the opening dialogue box. Keep it to 2–3 short lines.
    intro: [
      "Ah, a traveler. I'm Sriharsha.",
      'I like hard, real-world systems: electricity markets, orbital mechanics, financial risk. I build the software that makes them legible.',
      'Everything here syncs from my GitHub every hour, so it never goes stale. Have a look around.',
    ],
    // Optional. Leave '' to hide. These are public once deployed.
    email: '',
    linkedin: '',
    resume: '', // e.g. '/resume.pdf' (drop the file in /public)
    location: '',
  },

  // The gear screen. Grouped the way a JRPG groups equipment.
  equipment: {
    Weapons: ['TypeScript', 'Python', 'C#', 'SQL', 'JavaScript', 'R'],
    Armor: ['Next.js', 'React', 'ASP.NET Core', 'Streamlit', 'Gradio', 'Astro'],
    Relics: ['PostgreSQL', 'Supabase', 'PyTorch', 'scikit-learn', 'pandas', 'CesiumJS'],
    Mounts: ['Vercel', 'AWS EC2', 'GitHub Actions', 'Hugging Face Spaces'],
  },

  // Repo whose problem folders count as "monsters slain" (LeetCode practice).
  training: {
    repo: 'neetcode-submissions-rkmukv8m',
    label: 'on NeetCode',
  },

  // Hand-written case studies. Order here = order on the page.
  // `repo` must match the GitHub repo name. Anything left out falls back to
  // the repo's own description and README.
  quests: [
    {
      repo: 'powerflow',
      tier: 'main',
      title: 'PowerFlow',
      hook: 'Paper-trade the Texas power grid on real ERCOT prices.',
      flavor:
        'On Nov 11, 2026, the Panhandle cleared at $84/MWh day-ahead for 9 PM. When 9 PM came, it traded at $519.',
      problem:
        'ERCOT prices every hour of Texas electricity twice: a day-ahead auction and real-time delivery. The gap between them is a real trade, and there was no faithful way to practice it without risking real money.',
      approach:
        'A Next.js trading desk on Vercel with the whole engine written as Postgres functions in Supabase. pg_cron ingests ERCOT reports every 15 minutes. Bids close at the real 10:00 gate, fill at the clearing price, mark to real time, and settle on ERCOT’s calendar, holidays and 23/25-hour DST days included.',
      outcome:
        'Money is exact to a millionth of a dollar, and every account is reconciled against its fill history hourly on a public status page. CI applies every migration to a fresh database and tests the engine against live ERCOT data.',
      stack: ['Next.js', 'TypeScript', 'Supabase', 'PostgreSQL', 'pg_cron', 'Vercel'],
    },
    {
      repo: 'orbital-insight',
      tier: 'main',
      title: 'Orbital Insight',
      hook: 'What was that moving light? Every active satellite, live, in your browser.',
      flavor: 'About 16,000 objects propagated at once, client-side, accurate to about a kilometre.',
      problem:
        'You see a steady light glide across the night sky. What was it, and when will the next one pass somewhere you can actually see it?',
      approach:
        'SGP4 propagation of the full CelesTrak catalog runs entirely in the browser. Passes are kept only when the satellite is sunlit and your sky is dark, solved to the second, and drawn on a sky chart with cloud cover. The whole catalog renders on a CesiumJS globe.',
      outcome:
        'It identifies a sighting against every satellite in a second or two, screens close approaches days ahead, and needs no account and no server compute. A public methodology page lists every approximation it makes.',
      stack: ['TypeScript', 'Next.js', 'satellite.js / SGP4', 'CesiumJS', 'Open-Meteo'],
    },
    {
      repo: 'Financial-Market-Volatility-Correlation-Analysis',
      tier: 'main',
      title: 'FinRisk',
      hook: 'Cross-asset volatility, correlation and portfolio risk across 113 assets and 14 years.',
      flavor: 'Out of sample, equal weight edged max-Sharpe, 0.59 to 0.58. The dashboard says so.',
      problem:
        'Most portfolio dashboards show in-sample Sharpe ratios that look great and mean little. I wanted a risk system that reports what actually holds up on data it has never seen.',
      approach:
        'A Python analytics package over stocks, bonds, commodities and FX: VaR/CVaR, drawdown episodes, rolling correlations, Markowitz optimisation, a walk-forward backtest with transaction costs, Kupiec coverage tests and GARCH(1,1) forecasts. An eight-tab Streamlit dashboard serves it.',
      outcome:
        'It reports the unflattering findings too. Every 99% VaR test rejects, because real tails are fatter than history suggests. 35 of 113 assets are flagged as running hot, and there is an auto-generated executive summary.',
      stack: ['Python', 'pandas', 'NumPy', 'SciPy', 'arch (GARCH)', 'Plotly', 'Streamlit'],
    },
    {
      repo: 'Crypto-Server',
      tier: 'main',
      title: 'Crypto Terminal',
      hook: 'A self-hosted price archive that outgrows its API’s 90-day memory.',
      flavor: 'Every midnight UTC, the server wakes up and writes down what the market did.',
      problem:
        'CoinGecko’s free tier only returns 90 days of history per request, too short to study anything interesting.',
      approach:
        'An ASP.NET Core 8 REST API in C# on an AWS EC2 instance. It backfills missing data on startup, then snapshots daily close and volume into PostgreSQL through EF Core. A vanilla JS dashboard sits on top.',
      outcome:
        'A historical dataset that grows every day for seven assets, with endpoints for full history, the latest point and custom date ranges.',
      stack: ['C#', 'ASP.NET Core 8', 'PostgreSQL', 'EF Core', 'AWS EC2'],
      // The dashboard showed "CONNECTION FAILED" on 2026-11-14 (API server down?).
      // Delete this line once it's back up to restore the "Play live" button.
      live: '',
    },
    {
      repo: 'Casting-product-image-data-for-quality-inspection',
      tier: 'side',
      title: 'Casting Defect Detection',
      hook: 'Fine-tuned ResNet18 that flags defective metal castings, with SHAP overlays showing why.',
      stack: ['PyTorch', 'ResNet18', 'SHAP'],
    },
    {
      repo: 'Multilingual_AI_Translator',
      tier: 'side',
      title: 'Multilingual Translator',
      hook: 'Speak or type, hear it back in 50+ languages. NLLB-200 + gTTS behind a Gradio UI.',
      live: 'https://huggingface.co/spaces/Devligan/Multilingual_AI_Translator',
      liveNote: 'Hugging Face Space: may take ~30s to wake up.',
      stack: ['Transformers', 'NLLB-200', 'Gradio'],
    },
    {
      repo: 'Fake_News_Detector',
      tier: 'side',
      title: 'Fake News Detector',
      hook: 'TF-IDF + logistic regression at ~98.7% on the benchmark, with an honest note about why the real world is harder.',
      live: 'https://huggingface.co/spaces/Devligan/Fake_News_Detector',
      liveNote: 'Hugging Face Space: may take ~30s to wake up.',
      stack: ['scikit-learn', 'NLTK', 'Gradio'],
    },
  ],

  // Never shown, whatever GitHub says.
  hidden: ['TheOdinProject', 'Devligan.github.io'],
};
