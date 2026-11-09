// ─────────────────────────────────────────────────────────────
// Everything you'd want to edit lives in this file.
// Placeholder text is marked with TODO. Swap it for your own.
// A project without a `url` shows as "Link coming soon".
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Uday Raj Sahai',
  tagline: 'Full stack developer and chess player. I build for the web with React, Next.js, Node and .NET.',
  intro:
    'Full stack developer with 2+ years across .NET (C#, ASP.NET Core) and the MERN stack. I like building scalable web apps, clean REST and GraphQL APIs, and tools I actually want to use, like Caissa for my own chess games.',
  now: [
    'Junior Frontend Developer at CivicDataLab, working with Next.js and GraphQL',
    'Building Caissa, a free game reviewer for Chess.com players',
    'Learning three.js by making this room',
  ],
  experience: [
    { role: 'Junior Frontend Developer', org: 'CivicDataLab', when: 'Aug 2025 to now' },
    { role: 'Freelance Full Stack Developer', org: 'MERN blogging platform', when: 'Oct 2024 to Jul 2025' },
    { role: 'Software Engineer', org: 'Hubbell, Hyderabad', when: 'Sep 2023 to Sep 2024' },
    { role: 'PG Diploma, Advanced Computing', org: 'CDAC Chennai', when: 'Sep 2022 to Mar 2023' },
    { role: 'B.Tech, Computer Science', org: 'Greater Noida Institute of Technology', when: '2016 to 2020' },
  ],
};

// ── the monitor in the room ──────────────────────────────────
// Language split of public GitHub code (bytes, all repos), github.com/UdayRajSahai2.
// C# and GraphQL come from work at Hubbell and CivicDataLab, which isn't public.
export const languages = [
  { name: 'JavaScript', pct: 39.5, color: '#F1E05A' },
  { name: 'TypeScript', pct: 34.3, color: '#3178C6' },
  { name: 'Python', pct: 19.6, color: '#3572A5' },
  { name: 'CSS', pct: 6.3, color: '#8E6BD1' },
  { name: 'Other', pct: 0.3, color: '#8B8FA8' },
];

// Each file is typed out in turn on the monitor, one tab per language.
export const monitorFiles = [
  {
    name: 'heatmap.ts',
    lang: 'TypeScript',
    color: '#3178C6',
    code: [
      '// Caissa: every blunder in your library on one board',
      'export function blunderHeatmap(games: Game[]) {',
      '  const heat = new Map<Square, number>();',
      '  for (const move of games.flatMap((g) => g.moves)) {',
      "    if (move.label !== 'blunder') continue;",
      '    heat.set(move.to, (heat.get(move.to) ?? 0) + 1);',
      '  }',
      '  return heat;',
      '}',
    ],
  },
  {
    name: 'review.py',
    lang: 'Python',
    color: '#3572A5',
    code: [
      '# Caissa API: review one game with the engine',
      '@router.get("/games/{game_id}/review")',
      'async def review(game_id: str, depth: int = 18):',
      '    game = await load_game(game_id)',
      '    evals = [engine.analyse(p, depth) for p in game.positions]',
      '    return {',
      '        "accuracy": accuracy(evals),',
      '        "moments": key_moments(evals),',
      '    }',
    ],
  },
  {
    name: 'ReportExport.cs',
    lang: 'C#',
    color: '#178600',
    code: [
      '// Hubbell: Export to CSV across reports',
      'public async Task<FileResult> ExportCsv(int reportId)',
      '{',
      '    var report = await _reports.GetAsync(reportId);',
      '    var csv = new StringBuilder();',
      '    csv.AppendLine(string.Join(",", report.Headers));',
      '    foreach (var row in report.Rows)',
      '        csv.AppendLine(string.Join(",", row.Values));',
      '    return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv");',
      '}',
    ],
  },
  {
    name: 'blogs.js',
    lang: 'JavaScript',
    color: '#F1E05A',
    code: [
      '// Blogging platform: only signed-in writers can publish',
      'router.post("/create-blog", verifyJWT, async (req, res) => {',
      '  const { title, content, tags, draft } = req.body;',
      '  if (!title.length) {',
      '    return res.status(403).json({ error: "Add a title" });',
      '  }',
      '  const blog = await Blog.create({ title, content, tags, draft,',
      '    author: req.user });',
      '  res.status(200).json({ id: blog.blog_id });',
      '});',
    ],
  },
  {
    name: 'datasets.graphql',
    lang: 'GraphQL',
    color: '#E10098',
    code: [
      '# CivicDataLab: data for the Next.js frontend',
      'query Datasets($first: Int!, $sector: String) {',
      '  datasets(first: $first, sector: $sector) {',
      '    id',
      '    title',
      '    sectors { name }',
      '    updatedAt',
      '  }',
      '}',
    ],
  },
];

// ── the character that walks around the room ──────────────────
// TODO: set these so the character looks like you.
export const avatar = {
  skin: '#C68B62',
  hair: '#1C1714',
  hairStyle: 'short', // 'short' | 'curly' | 'long' | 'bun' | 'buzz' | 'spiky'
  facialHair: 'none', // 'none' | 'stubble' | 'beard'
  glasses: false,
  shirt: '#2F4858',
  shirtPrint: '♞', // a symbol printed on the chest
  printColor: '#E9C46A',
  pants: '#2E3350',
  shoes: '#F1EADC',
  greeting: "Hi, I'm Uday. Click anything and I'll walk you over.",
  // things the character says when you click on it
  pokes: ['Hey there!', 'Want a game of chess?', 'Try the record player.', 'Click the floor and I’ll walk there.'],
};

export const contact = {
  label: 'Contact',
  say: 'Drop me a line!',
  accent: '#C3A6FF',
  blurb: "The envelope on the desk is for you. I'm open to full stack and frontend roles, freelance work, or a game of chess.",
  email: 'udayrajsahai@gmail.com',
  links: [
    { label: 'GitHub', url: 'https://github.com/UdayRajSahai2' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/udayrajsahai/' },
  ],
};

export const about = {
  label: 'About',
  say: "That's me in a nutshell.",
  accent: '#FFB547',
};

// Each interest maps to an object in the room by `id`:
//   chess → chessboard, code → monitor, music → turntable, reading → bookshelf.
// You can add a new id here too. It shows up in the dock and opens a panel,
// even before it has its own object in src/scene/room.js.
export const interests = [
  {
    id: 'chess',
    label: 'Chess',
    say: 'Fancy a game?',
    accent: '#E9C46A',
    blurb: 'The game I keep coming back to. So I built a tool to show me where my own games go wrong.',
    tryIt: 'Click any piece to make it move.',
    projects: [
      {
        name: 'Caissa',
        description:
          'Free, open-source game review for Chess.com players. Enter a username and get a blunder heatmap across your whole library, a weakness report, full move-by-move review, and puzzles built from your own mistakes.',
        url: 'https://github.com/UdayRajSahai2/Caissa',
        tags: ['Next.js 15', 'TypeScript', 'FastAPI', 'Python'],
      },
    ],
  },
  {
    id: 'code',
    label: 'Code',
    say: "Here's what I'm building.",
    accent: '#7FD1B9',
    blurb: 'Full stack across .NET and the MERN stack, now mostly Next.js and GraphQL at work.',
    tryIt: 'Click the screen to switch to the next file.',
    showLanguages: true,
    stack: ['React', 'Next.js', 'Node.js', 'Express', 'C#', '.NET Core', 'GraphQL', 'MongoDB', 'MySQL', 'SQL Server', 'Azure', 'AWS'],
    projects: [
      {
        name: 'Blogging platform',
        description:
          'A full blogging site with a rich editor, Google sign-in, nested comments, notifications and a dashboard for drafts and analytics. JWT auth, deployed on AWS.',
        url: 'https://github.com/UdayRajSahai2/Blogging-Website',
        tags: ['MERN', 'JWT', 'Firebase', 'AWS'],
      },
      {
        name: 'HRMS Lite',
        description: 'A lightweight HR system for employee records and attendance tracking.',
        url: 'https://github.com/UdayRajSahai2/hrms-lite',
        tags: ['JavaScript', 'Python'],
      },
      {
        name: 'Warehouse MVP',
        description:
          'Maps SKUs, tracks inventory, sales and returns straight from uploaded CSVs, with a dashboard and an AI assistant you can ask questions in plain English.',
        url: 'https://github.com/UdayRajSahai2/WareHouse-MVP',
        tags: ['Python', 'Pandas', 'Streamlit'],
      },
      {
        name: 'Tourism Management System',
        description: 'Book travel itineraries and packages. Built on the MERN stack with JWT auth.',
        url: '',
        tags: ['React', 'Node.js', 'MongoDB'],
      },
      {
        name: 'This room',
        description: 'This 3D portfolio, built with three.js and GSAP. Every object is drawn in code.',
        url: '',
        tags: ['three.js', 'WebGL'],
      },
    ],
  },
  {
    id: 'music',
    label: 'Music',
    say: 'Let me put a record on.',
    accent: '#FF8FA3',
    blurb: 'Something is always playing while I work. Click the record to hear a loop.', // TODO
    tryIt: 'Click the record to start or stop it.',
    projects: [
      {
        name: 'Playlist',
        description: 'Placeholder for a playlist, a music app, or anything audio you have made.', // TODO
        url: '',
        tags: ['Audio'],
      },
    ],
  },
  {
    id: 'reading',
    label: 'Books',
    say: "Here's what I'm reading.",
    accent: '#9DB8FF',
    blurb: "The shelf of things I've read and want to read next.", // TODO
    tryIt: 'Click a book to pull it off the shelf.',
    projects: [
      {
        name: 'Reading list',
        description: 'Placeholder for a reading tracker, notes, or book reviews.', // TODO
        url: '',
        tags: ['Notes'],
      },
    ],
  },
];
