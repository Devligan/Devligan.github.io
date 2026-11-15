// ─────────────────────────────────────────────────────────────────────────────
//  The only hand-written part of the site.
//
//  Everything else (repos, commits, the activity calendar, stats, project
//  screenshots) is pulled from GitHub by scripts/fetch-github.mjs every hour.
//
//  Ways to change what shows up without touching this file:
//    • Add the topic `portfolio` to a GitHub repo  → it's featured in Projects.
//    • Add the topic `portfolio-hide` to a repo     → it's hidden everywhere.
//    • Add screenshots to a featured repo's README  → they become its gallery.
// ─────────────────────────────────────────────────────────────────────────────

export default {
  github: 'Devligan',
  site: 'https://devligan.github.io',

  profile: {
    name: 'Sriharsha Challangi',
    handle: 'Devligan',
    role: 'Software Engineer',
    // One line under the name. Recruiters read this first.
    headline: 'CS + MIS + Math at the University of Houston. Previously a software engineering intern on the ETRM team at Mitsui & Co.',
    bio: [
      'I build software that has to be exactly right: settlement math, risk numbers, market data that arrives on time.',
      'In summer 2026 I interned on the ETRM team at Mitsui & Co. Energy Marketing and Services, where I mapped migration risk across 100+ C# customizations and built a pipeline for ERCOT market data. Most of my own projects live in the same world: power markets, portfolio risk and crypto prices.',
      'Outside of markets I build data-heavy tools, from a live satellite tracker to computer-vision models, and I tutor C++ and Python at UH.',
    ],
    email: 'sriharshachallangi@gmail.com',
    linkedin: 'https://www.linkedin.com/in/sriharsha-challangi/',
    resume: '', // e.g. '/resume.pdf' (drop the file in /public)
    location: 'Houston, TX',
  },

  // From LinkedIn. Newest first.
  experience: [
    {
      role: 'Software Engineering Intern, ETRM',
      company: 'Mitsui & Co. Energy Marketing and Services (USA)',
      type: 'Internship',
      start: '2026-05',
      end: '2026-08',
      location: 'Houston, TX · On-site',
      highlight: true,
      bullets: [
        'Evaluated migration risks and dependencies across 100+ C# customizations for an enterprise ETRM v16 → v25 upgrade, and identified refactoring opportunities across 30% of them.',
        'Engineered an automated pipeline that collects ERCOT energy-market data from 7+ sources, stores it in a SQL database and serves it through an API backend.',
        'Wrote a SQL query that aggregates 5+ tables into a consolidated dataset for business analysis.',
      ],
      tags: ['C#', 'SQL', 'ETRM', 'Trading systems', 'ERCOT'],
    },
    {
      role: 'Academic Support Assistant',
      company: 'University of Houston',
      type: 'Part-time',
      start: '2026-01',
      end: null,
      location: 'Houston, TX · On-site',
      bullets: [
        'Tutor C++ and Python across data structures, algorithms, debugging and software design.',
        'Diagnose algorithmic errors, inefficient implementations and bugs, then develop and compare improved solutions.',
        'Translate requirements into algorithms, data structures and working code, in person and online.',
      ],
      tags: ['C++', 'Python', 'Algorithms'],
    },
    {
      role: 'AI Trainer, Multimodal Data Annotation',
      company: 'Handshake AI Fellowship',
      type: 'Contract',
      start: '2025-11',
      end: '2026-04',
      location: 'Remote',
      bullets: [
        'Annotated and evaluated images, video and text to train and validate large language and vision-language models.',
        'Ran quality control and error analysis on model outputs to find failure modes and inconsistencies.',
      ],
      tags: ['Data annotation', 'Model evaluation'],
    },
  ],

  education: [
    {
      school: 'University of Houston',
      field: 'Computer Science · MIS · Mathematics',
      location: 'Houston, TX',
    },
  ],

  skills: {
    Languages: ['Python', 'TypeScript', 'C#', 'SQL', 'C++', 'JavaScript', 'R'],
    Frameworks: ['Next.js', 'React', 'ASP.NET Core', 'Streamlit'],
    'Data & ML': ['pandas', 'NumPy', 'SciPy', 'scikit-learn', 'PyTorch'],
    Infrastructure: ['PostgreSQL', 'Supabase', 'Vercel', 'AWS EC2', 'GitHub Actions'],
  },

  // Repo with one folder per solved problem (LeetCode-style practice).
  practice: {
    repo: 'neetcode-submissions-rkmukv8m',
    label: 'NeetCode problems',
  },

  // Order here = order on the page. `repo` must match the GitHub repo name.
  //   featured  → large card; others are smaller cards below.
  //   highlight → one number that sums the project up.
  //   media     → where the gallery comes from. By default, the README's images.
  //               { notebook: 'x.ipynb', pick: [0, 2] } takes chart outputs from a notebook;
  //               { files: [{ src: '/project-art/x.webp' }] } uses committed images.
  projects: [
    {
      repo: 'powerflow',
      featured: true,
      category: 'Fintech · Energy trading',
      title: 'PowerFlow',
      summary: 'Paper-trade the Texas power grid on real ERCOT prices.',
      highlight: { value: '$84 → $519', label: 'Day-ahead vs. real-time for one hour on Nov 11, 2026: the spread PowerFlow lets you trade.' },
      problem:
        'ERCOT prices each hour of Texas power twice, once in a day-ahead auction and again in real time. The gap between them is a real trade, and there was no realistic way to practise it.',
      approach:
        'A Next.js trading desk on Vercel with the engine written as Postgres functions in Supabase. pg_cron ingests ERCOT reports every 15 minutes; bids close at the real 10:00 gate, fill at the clearing price, mark to real time and settle on ERCOT’s own calendar, DST days included.',
      result:
        'Accounting exact to a millionth of a dollar, every account reconciled hourly on a public status page, and CI that tests the engine against live ERCOT data.',
      stack: ['Next.js', 'TypeScript', 'Supabase', 'PostgreSQL', 'pg_cron', 'Vercel'],
    },
    {
      repo: 'Financial-Market-Volatility-Correlation-Analysis',
      featured: true,
      category: 'Fintech · Quant risk',
      title: 'FinRisk',
      summary: 'Volatility, correlation and portfolio risk across 113 assets and 14 years.',
      highlight: { value: '0.59 vs 0.58', label: 'Out-of-sample Sharpe, equal weight vs. max-Sharpe. It reports what holds up, even when that’s unflattering.' },
      problem: 'Portfolio dashboards tend to show in-sample Sharpe ratios that look great and mean little.',
      approach:
        'A Python risk package over stocks, bonds, commodities and FX: VaR/CVaR, drawdowns, Markowitz optimisation, walk-forward backtests with costs, Kupiec tests and GARCH(1,1), served through an eight-tab Streamlit dashboard.',
      result:
        'Honest numbers. Equal weight edges max-Sharpe out of sample, and every 99% VaR test rejects because real tails are fatter than history suggests.',
      stack: ['Python', 'pandas', 'SciPy', 'arch', 'Plotly', 'Streamlit'],
      media: {
        readme: false,
        notebook: 'analysis_walkthrough.ipynb',
        pick: [0, 3, 2],
        alts: ['Daily return correlation matrix across 113 assets', 'Monte Carlo portfolios and the efficient frontier', 'Drawdowns of max-Sharpe vs. equal-weight vs. SPY'],
      },
    },
    {
      repo: 'Crypto-Server',
      featured: true,
      category: 'Fintech · Market data',
      title: 'Crypto Terminal',
      summary: 'A self-hosted crypto price archive that outgrows its API’s 90-day limit.',
      highlight: { value: '90 days → ∞', label: 'CoinGecko’s free tier forgets after 90 days. This server archives every day since launch.' },
      problem: 'CoinGecko’s free tier only returns 90 days of history, too short to analyse anything.',
      approach:
        'An ASP.NET Core 8 REST API in C# on AWS EC2 that backfills on startup and snapshots daily close and volume into PostgreSQL through EF Core every midnight UTC.',
      result: 'A dataset that grows every day for seven assets, with endpoints for full history, the latest price and date ranges.',
      stack: ['C#', 'ASP.NET Core 8', 'PostgreSQL', 'EF Core', 'AWS EC2'],
      media: { readme: false, files: [{ src: '/project-art/crypto-terminal-docs.webp', alt: 'Crypto Terminal REST API documentation page' }] },
      // The dashboard showed "CONNECTION FAILED" on 2026-11-14 (API server down?).
      // Delete this line once it's back up to restore the "Live demo" button.
      live: '',
    },
    {
      repo: 'orbital-insight',
      featured: true,
      category: 'Data visualisation',
      title: 'Orbital Insight',
      summary: 'Every active satellite, propagated live in your browser.',
      highlight: { value: '~16,000', label: 'Satellites propagated in real time, entirely client-side, accurate to about a kilometre.' },
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
      media: { readme: false, notebook: 'main.ipynb', pick: [3, 10], alts: ['SHAP explanations for defective and normal castings', 'SHAP summary of model behaviour'] },
    },
    {
      repo: 'Fake_News_Detector',
      category: 'Machine learning',
      title: 'Fake News Detector',
      summary: 'TF-IDF and logistic regression at ~98.7% on the benchmark, with a frank note on why the real world is harder.',
      live: 'https://huggingface.co/spaces/Devligan/Fake_News_Detector',
      liveNote: 'Hosted on Hugging Face; may take ~30s to wake.',
      stack: ['scikit-learn', 'NLTK', 'Gradio'],
      media: { readme: false, notebook: 'main.ipynb', pick: [1, 4], alts: ['News subjects by label', 'SHAP summary of the most influential words'] },
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
  ],

  // Never shown, whatever GitHub says.
  hidden: ['TheOdinProject', 'Devligan.github.io'],
};
