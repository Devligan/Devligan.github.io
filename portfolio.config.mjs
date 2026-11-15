// ─────────────────────────────────────────────────────────────────────────────
//  The only hand-written part of the site.
//
//  Everything else (repos, commits, the activity calendar, stats) is pulled
//  from GitHub by scripts/fetch-github.mjs and rebuilt every hour.
//
//  Ways to change what shows up without touching this file:
//    • Add the topic `portfolio` to a GitHub repo  → it's featured in Projects.
//    • Add the topic `portfolio-hide` to a repo     → it's hidden everywhere.
//    • Give a repo a description / homepage URL     → it's used automatically.
// ─────────────────────────────────────────────────────────────────────────────

export default {
  github: 'Devligan',
  site: 'https://devligan.github.io',

  profile: {
    name: 'Sriharsha Challangi',
    handle: 'Devligan',
    role: 'Software Engineer',
    // The first thing anyone reads. Keep it to one plain sentence.
    headline: 'Software engineer building fintech and data tools.',
    intro:
      'I build trading systems, market-data pipelines and risk analytics, mostly in TypeScript, Python and SQL.',
    stack: ['TypeScript', 'Python', 'SQL', 'Next.js', 'PostgreSQL'],
    bio: [
      'I’m drawn to fintech: markets, trading systems and the data pipelines underneath them. I like work that has to be exactly right, like settlement math, risk numbers and data that arrives on time.',
      'Outside finance I build data-heavy tools, from a live satellite tracker to small machine-learning models. This site pulls from my GitHub every hour, so what you see is what I’m working on now.',
    ],
    // Optional. Leave '' to hide. These are public once deployed.
    email: 'sriharshachallangi@gmail.com',
    linkedin: 'https://www.linkedin.com/in/sriharsha-challangi/',
    resume: '', // e.g. '/resume.pdf' (drop the file in /public)
    location: '',
  },

  skills: {
    Languages: ['TypeScript', 'Python', 'C#', 'SQL', 'JavaScript', 'R'],
    Frameworks: ['Next.js', 'React', 'ASP.NET Core', 'Streamlit', 'Astro'],
    'Data & ML': ['pandas', 'NumPy', 'SciPy', 'scikit-learn', 'PyTorch'],
    Infrastructure: ['PostgreSQL', 'Supabase', 'Vercel', 'AWS EC2', 'GitHub Actions'],
  },

  // Repo with one folder per solved problem (LeetCode-style practice).
  practice: {
    repo: 'neetcode-submissions-rkmukv8m',
    label: 'NeetCode problems',
  },

  // Hand-written case studies. Order here = order on the page.
  // `repo` must match the GitHub repo name. Anything left out falls back to
  // the repo's own description and README.
  //   featured: true  → full card in Projects; otherwise a small card under "More projects".
  //   highlight       → one number that sums the project up.
  projects: [
    {
      repo: 'powerflow',
      featured: true,
      category: 'Fintech',
      title: 'PowerFlow',
      summary: 'Paper-trade the Texas power grid on real ERCOT prices.',
      highlight: {
        value: '$84 → $519',
        label: 'Day-ahead vs. real-time price for one hour on Nov 11, 2026. PowerFlow lets you trade that spread.',
      },
      problem:
        'ERCOT prices each hour of Texas power twice, once in a day-ahead auction and again in real time. The gap is a real trade, and there was no realistic way to practise it.',
      approach:
        'Next.js on Vercel, with the trading engine written as Postgres functions in Supabase. ERCOT reports are ingested every 15 minutes. Bids close at the real 10:00 gate and settle on ERCOT’s own calendar.',
      result:
        'Accounting exact to a millionth of a dollar, hourly reconciliation on a public status page, and CI that tests the engine against live ERCOT data.',
      stack: ['Next.js', 'TypeScript', 'Supabase', 'PostgreSQL', 'Vercel'],
    },
    {
      repo: 'Financial-Market-Volatility-Correlation-Analysis',
      featured: true,
      category: 'Fintech',
      title: 'FinRisk',
      summary: 'Volatility, correlation and portfolio risk across 113 assets and 14 years.',
      highlight: {
        value: '0.59 vs 0.58',
        label: 'Out-of-sample Sharpe, equal weight vs. max-Sharpe. FinRisk reports what holds up, even when it’s unflattering.',
      },
      problem:
        'Portfolio dashboards tend to show in-sample Sharpe ratios that look great and mean little.',
      approach:
        'A Python risk package over stocks, bonds, commodities and FX: VaR/CVaR, drawdowns, Markowitz optimisation, walk-forward backtests with costs, and GARCH(1,1). An eight-tab Streamlit dashboard serves it.',
      result:
        'Honest numbers. Equal weight edges max-Sharpe out of sample, and every 99% VaR test rejects because real tails are fatter than history.',
      stack: ['Python', 'pandas', 'SciPy', 'arch', 'Streamlit'],
    },
    {
      repo: 'Crypto-Server',
      featured: true,
      category: 'Fintech',
      title: 'Crypto Terminal',
      summary: 'A self-hosted crypto price archive that outgrows its API’s 90-day limit.',
      highlight: {
        value: '7 assets',
        label: 'Daily close and volume archived every midnight UTC, building history the free API can’t give.',
      },
      problem: 'CoinGecko’s free tier only returns 90 days of history, too short to analyse anything.',
      approach:
        'An ASP.NET Core 8 API in C# on AWS EC2 that backfills on startup and snapshots daily prices into PostgreSQL through EF Core.',
      result: 'A dataset that grows every day, with REST endpoints for full history, the latest price and date ranges.',
      stack: ['C#', 'ASP.NET Core 8', 'PostgreSQL', 'EF Core', 'AWS EC2'],
      // The dashboard showed "CONNECTION FAILED" on 2026-11-14 (API server down?).
      // Delete this line once it's back up to restore the "Live demo" button.
      live: '',
    },
    {
      repo: 'orbital-insight',
      featured: true,
      category: 'Data visualisation',
      title: 'Orbital Insight',
      summary: 'Every active satellite, live in your browser.',
      highlight: {
        value: '~16,000',
        label: 'Satellites propagated in real time, entirely client-side.',
      },
      problem: 'You see a light glide across the night sky. What was it, and when is the next pass you can actually see?',
      approach:
        'SGP4 orbit propagation of the full CelesTrak catalog runs in the browser, keeping only passes where the satellite is sunlit and your sky is dark. CesiumJS draws the globe.',
      result: 'It identifies a sighting against the whole catalog in a second or two, with no account and no server compute.',
      stack: ['TypeScript', 'Next.js', 'satellite.js', 'CesiumJS'],
    },
    {
      repo: 'Casting-product-image-data-for-quality-inspection',
      category: 'Machine learning',
      title: 'Casting Defect Detection',
      summary: 'Fine-tuned ResNet18 that flags defective metal castings, with SHAP overlays showing why.',
      stack: ['PyTorch', 'ResNet18', 'SHAP'],
    },
    {
      repo: 'Multilingual_AI_Translator',
      category: 'Machine learning',
      title: 'Multilingual Translator',
      summary: 'Speak or type, hear it back in 50+ languages. NLLB-200 and gTTS behind a Gradio UI.',
      live: 'https://huggingface.co/spaces/Devligan/Multilingual_AI_Translator',
      liveNote: 'Hosted on Hugging Face; may take ~30s to wake.',
      stack: ['Transformers', 'NLLB-200', 'Gradio'],
    },
    {
      repo: 'Fake_News_Detector',
      category: 'Machine learning',
      title: 'Fake News Detector',
      summary: 'TF-IDF and logistic regression at ~98.7% on the benchmark, with a frank note on why the real world is harder.',
      live: 'https://huggingface.co/spaces/Devligan/Fake_News_Detector',
      liveNote: 'Hosted on Hugging Face; may take ~30s to wake.',
      stack: ['scikit-learn', 'NLTK', 'Gradio'],
    },
  ],

  // Never shown, whatever GitHub says.
  hidden: ['TheOdinProject', 'Devligan.github.io'],
};
