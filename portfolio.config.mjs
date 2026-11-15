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

  // Everything here is taken from each repo's own README (or, for the ML
  // projects, the notebook's printed results). Don't add claims that aren't there.
  //
  // `repo` must match the GitHub repo name. Projects are ordered by their latest
  // push, newest first, within each group.
  //   featured → large card; others are smaller cards under "Machine learning".
  //   summary  → one line on the card.
  //   facts    → real numbers shown in the project panel.
  //   does     → what it does, as bullets.
  //   built    → how it's built.
  //   media    → where the gallery comes from. By default, the README's images.
  //              { notebook: 'x.ipynb', pick: [0, 2] } takes chart outputs from a notebook;
  //              { files: [{ src: '/project-art/x.webp' }] } uses committed images.
  projects: [
    {
      repo: 'powerflow',
      featured: true,
      category: 'Fintech · Energy trading',
      title: 'PowerFlow',
      summary: 'Paper-trade the Texas power grid on real ERCOT prices.',
      facts: [
        { value: '$100,000', label: 'virtual cash to trade with' },
        { value: '15 min', label: 'between pulls of ERCOT’s market reports' },
        { value: '2 days', label: 'to settlement, on ERCOT’s business-day calendar' },
      ],
      does: [
        'Bid on tomorrow’s hours in ERCOT’s day-ahead market before the real 10:00 Central gate. Bids fill at the clearing price ERCOT publishes that afternoon.',
        'Positions are marked to the real-time price hour by hour, then settle when ERCOT calls prices final two business days later, with holidays and 23/25-hour daylight-saving days handled.',
        'A positions view lays out net MWh by delivery hour; analytics show return, win rate, best and worst trade and drawdown from settled fills.',
        'The prices are real, from ERCOT’s public market reports. Only the money is simulated.',
      ],
      built:
        'A Next.js app on Vercel with the trading engine written as Postgres functions in Supabase. pg_cron pulls ERCOT’s reports every 15 minutes and settles whatever has become final. Money is exact to a millionth of a dollar, every account is checked against its fill history each hour on a public status page, and CI applies every migration to a fresh database and runs the engine tests against live ERCOT data.',
      stack: ['Next.js', 'TypeScript', 'Supabase', 'PostgreSQL', 'pg_cron', 'Vercel'],
    },
    {
      repo: 'Financial-Market-Volatility-Correlation-Analysis',
      featured: true,
      category: 'Fintech · Quant risk',
      title: 'Financial Market Volatility & Correlation Analysis',
      summary: 'A quantitative risk system for 113 assets across stocks, ETFs, bonds, commodities and currencies, with an interactive dashboard.',
      facts: [
        { value: '113', label: 'assets across five asset classes' },
        { value: '3,613', label: 'trading days, May 2012 to Oct 2026' },
        { value: '63', label: 'offline pytest tests on synthetic data' },
      ],
      does: [
        'Computes risk and return metrics for every asset: CAGR, volatility, Sharpe and Sortino ratios, max drawdown, historical VaR/CVaR, beta and Jensen’s alpha against a benchmark.',
        'Maps cross-asset correlations, with rolling correlation and volatility for any pair of assets.',
        'Optimises long-only portfolios (max-Sharpe, minimum-variance, efficient frontier) and validates them out of sample with a monthly walk-forward backtest that charges transaction costs.',
        'Stress-tests every asset and portfolio against crisis windows such as the COVID crash, the 2022 rate shock and 2023 banking stress, and forecasts volatility with GARCH(1,1).',
        'Writes plain-English executive summaries, CSV/XLSX exports and a standalone HTML report.',
      ],
      built:
        'A Python analytics package with thin entry points on top: a command-line pipeline, an eight-tab Streamlit dashboard and a pre-executed notebook walkthrough. Prices come live from Yahoo Finance, with a committed snapshot so everything also runs offline.',
      stack: ['Python', 'pandas', 'NumPy', 'SciPy', 'arch', 'Plotly', 'Streamlit', 'yfinance'],
      media: {
        readme: false,
        notebook: 'analysis_walkthrough.ipynb',
        pick: [0, 3, 2],
        alts: ['Daily return correlation matrix across 113 assets', 'Monte Carlo portfolios and the efficient frontier', 'Drawdowns of the max-Sharpe and equal-weight portfolios vs. SPY'],
      },
    },
    {
      repo: 'Crypto-Server',
      featured: true,
      category: 'Fintech · Market data',
      title: 'Crypto Terminal',
      summary: 'A full-stack crypto price archive that works around CoinGecko’s 90-day free-tier history limit.',
      facts: [
        { value: '7', label: 'assets tracked: BTC, ETH, SOL, XRP, DOGE, ADA, USDC' },
        { value: 'Daily', label: 'close and volume stored at midnight UTC' },
        { value: '90 days', label: 'of history per request on the free API, which this works around' },
      ],
      does: [
        'Backfills any missing price data for every tracked asset when the server starts.',
        'Every day at midnight UTC, fetches each coin’s closing price and trading volume and stores it, so the dataset keeps growing.',
        'Serves a REST API with endpoints for full history, the latest data point and custom date ranges.',
        'A dashboard charts the stored history from that API.',
      ],
      built:
        'Built from scratch: an ASP.NET Core 8 REST API in C#, PostgreSQL through Entity Framework Core, hosted on an AWS EC2 t3.micro running Ubuntu 24.04, with a vanilla HTML, CSS and JavaScript frontend.',
      stack: ['C#', 'ASP.NET Core 8', 'PostgreSQL', 'EF Core', 'AWS EC2', 'JavaScript'],
      media: { readme: false, files: [{ src: '/project-art/crypto-terminal-docs.webp', alt: 'Crypto Terminal REST API documentation page' }] },
      // The dashboard showed "CONNECTION FAILED" on 2026-11-14 (API server down?).
      // Delete this line once it's back up to restore the "Live demo" button.
      live: '',
    },
    {
      repo: 'orbital-insight',
      featured: true,
      category: 'Web app · Space',
      title: 'Orbital Insight',
      summary: 'Which satellites cross your sky tonight, what that moving light was, and every active satellite on a live globe.',
      facts: [
        { value: '~16,000', label: 'objects propagated live in the browser' },
        { value: '~1 km', label: 'position accuracy from public orbital data' },
        { value: '1–2 s', label: 'to check a sighting against the whole catalog' },
      ],
      does: [
        'Shows tonight’s visible passes for any town: only ones where the satellite is sunlit against a dark sky, with a sky chart, compass direction, cloud forecast and a calendar reminder.',
        'Identifies a sighting: say when and which way you were looking, and the whole catalog is checked against your sky.',
        'Puts every active satellite on a live globe. Follow the ISS, scrub time forward, click any dot.',
        'Charts every satellite by orbit height and tilt, and screens any satellite for close approaches over the next few days.',
      ],
      built:
        'Public element sets from CelesTrak are fed into SGP4, the standard orbit model, via satellite.js, all in the browser with no account needed. CesiumJS draws the globe and Open-Meteo provides town search and cloud forecasts. A methodology page lists every approximation.',
      stack: ['TypeScript', 'Next.js', 'satellite.js', 'CesiumJS', 'Open-Meteo'],
    },
    {
      repo: 'Casting-product-image-data-for-quality-inspection',
      category: 'Machine learning',
      title: 'Casting Defect Detection',
      summary: 'A CNN that classifies photos of metal castings as defective or normal, to automate visual quality inspection.',
      facts: [
        { value: '99.86%', label: 'test accuracy' },
        { value: '1.00', label: 'test ROC AUC' },
      ],
      does: [
        'Preprocesses Kaggle’s real-life industrial casting images with augmentation.',
        'Fine-tunes a pretrained ResNet18 with transfer learning.',
        'Evaluates with accuracy, precision, recall, ROC AUC and a confusion matrix.',
        'Explains predictions with SHAP overlays that show which parts of each image drove the call.',
      ],
      stack: ['PyTorch', 'torchvision', 'ResNet18', 'SHAP'],
      media: { readme: false, notebook: 'main.ipynb', pick: [3, 10], alts: ['SHAP explanations for defective and normal castings', 'SHAP summary of model behaviour'] },
    },
    {
      repo: 'Fake_News_Detector',
      category: 'Machine learning',
      title: 'Fake News Detector',
      summary: 'Classifies a news article as fake or real from its text or URL, using TF-IDF features and logistic regression.',
      facts: [
        { value: '~98.7%', label: 'accuracy on the benchmark test set' },
        { value: '5,000', label: 'TF-IDF features' },
      ],
      does: [
        'Accepts raw article text or a URL.',
        'Cleans and lemmatises the text with NLTK, then predicts FAKE or REAL with a confidence score.',
        'The README is upfront that real-world performance is weaker: it lacks source context and is sensitive to new topics and adversarial phrasing.',
      ],
      stack: ['scikit-learn', 'NLTK', 'Gradio'],
      live: 'https://huggingface.co/spaces/Devligan/Fake_News_Detector',
      liveNote: 'Hosted on Hugging Face; may take ~30s to wake.',
      media: { readme: false, notebook: 'main.ipynb', pick: [1, 4], alts: ['News subjects by label', 'SHAP summary of the most influential words'] },
    },
    {
      repo: 'Multilingual_AI_Translator',
      category: 'Machine learning',
      title: 'Multilingual Translator',
      summary: 'Translate typed or spoken text into another language and hear it read aloud.',
      facts: [
        { value: '50+', label: 'languages' },
        { value: '600M', label: 'parameter NLLB-200 translation model (distilled)' },
      ],
      does: [
        'Translates typed text and plays the result as audio.',
        'Takes voice input, transcribes it, translates it and reads it back.',
        'Detects the source language automatically.',
      ],
      built: 'Meta’s NLLB-200 (distilled 600M) through Hugging Face Transformers for translation, gTTS for speech, SpeechRecognition and LangDetect for input, all behind a Gradio app.',
      stack: ['Transformers', 'NLLB-200', 'gTTS', 'Gradio'],
      live: 'https://huggingface.co/spaces/Devligan/Multilingual_AI_Translator',
      liveNote: 'Hosted on Hugging Face; may take ~30s to wake.',
    },
  ],

  // Never shown, whatever GitHub says.
  hidden: ['TheOdinProject', 'Devligan.github.io', 'neetcode-submissions-rkmukv8m'],
};
