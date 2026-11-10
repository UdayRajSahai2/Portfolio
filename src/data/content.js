// ─────────────────────────────────────────────────────────────
// Every word, link and project on the site lives in this file.
// Rules (portfolio-spec.md CONTENT-01, CONTENT-02):
//   - never invent a fact, number, quote or title
//   - a list left empty does not render
//   - a project without a `url` shows as "Link coming soon"
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Uday Raj Sahai',
  firstName: 'Uday',
  role: 'Full stack developer',
  // the intro screen: a headline, one sentence and the door
  hello: {
    headline: 'Hi, I’m Uday.',
    sentence: 'I build for the web. Come in and see what else I’m into.',
    enter: 'Enter',
    loading: 'Setting up the room',
    ready: 'The door is open when you are',
    bubble: 'Hello!',
    sign: 'Uday’s room', // over the door
    mat: 'hello', // on the doormat
  },
  intro:
    'I’m a full stack developer. Away from code I lift weights, read, and watch a lot of films, TV series and anime. I’m part of a book club, and I keep coming back to philosophy, psychology and astronomy, because I want to understand people, the mind and the universe. I learn by experimenting, and I’m always after something new: a technology, an idea, or just a good story.',
  now: [
    'Junior Frontend Developer at CivicDataLab, working with Next.js and GraphQL',
    'Building Caissa, a free game reviewer for Chess.com players',
    'Learning three.js by building this room',
  ],
  experience: [
    { role: 'Junior Frontend Developer', org: 'CivicDataLab', when: 'Aug 2025 to now' },
    { role: 'Freelance Full Stack Developer', org: 'MERN blogging platform', when: 'Oct 2024 to Jul 2025' },
    { role: 'Software Engineer', org: 'Hubbell, Hyderabad', when: 'Sep 2023 to Sep 2024' },
    { role: 'PG Diploma, Advanced Computing', org: 'CDAC Chennai', when: 'Sep 2022 to Mar 2023' },
    { role: 'B.Tech, Computer Science', org: 'Greater Noida Institute of Technology', when: '2016 to 2020' },
  ],
};

// ── the character ────────────────────────────────────────────
export const avatar = {
  skin: '#C68B62',
  hair: '#1C1714',
  hairStyle: 'short', // 'short' | 'curly' | 'long' | 'bun' | 'buzz' | 'spiky'
  facialHair: 'none', // 'none' | 'stubble' | 'beard'
  glasses: false,
  shirt: '#3D6FD1',
  shirtPrint: 'U', // a letter on the chest; '' for none
  printColor: '#F4E7B0',
  pants: '#2B3040',
  shoes: '#F4F0E4',
  eyes: '#1A1A22',
  eyeShine: '#F7F4EA',
  mouth: '#5A2E2E',
  // after walking in
  welcome: 'Make yourself at home. Click anything.',
  // clicking the character: he says these in turn, then About opens
  introLines: [
    'Hi, I’m Uday Raj Sahai.',
    'I’m a full stack developer.',
    'Off the clock I lift, read, and binge films, series and anime.',
    'And I can talk philosophy, psychology or stars all night.',
  ],
  walkHint: 'Click the floor to walk, or click anything that catches your eye. Drag to look around.',
};

// ── the monitor in the room ──────────────────────────────────
// Language split of public GitHub code (bytes, all repos), github.com/UdayRajSahai2.
// C# and GraphQL come from work at Hubbell and CivicDataLab, which isn't public.
export const languages = [
  { name: 'JavaScript', pct: 39.5, color: '#F1E05A' },
  { name: 'TypeScript', pct: 34.3, color: '#3178C6' },
  { name: 'Python', pct: 19.6, color: '#3572A5' },
  { name: 'CSS', pct: 6.3, color: '#663399' },
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

// `short` is the dock label on small screens; `label` is the full name.
export const about = {
  label: 'About me',
  short: 'About',
};

export const contact = {
  label: 'Say hello',
  short: 'Contact',
  say: 'Drop me a line!',
  blurb: 'The envelope on the desk is for you. I’m open to full stack and frontend roles, freelance work, or a good conversation about any of the things in this room.',
  email: 'udayrajsahai@gmail.com',
  links: [
    { label: 'GitHub', url: 'https://github.com/UdayRajSahai2' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/udayrajsahai/' },
  ],
};

// Each interest maps to a zone in the room by `id` (see scene/room.js).
//   points:     short facts, shown as a list
//   favourites: TODO fill in your own titles; an empty list does not render
//   projects:   things you built
export const interests = [
  {
    id: 'code',
    label: 'Code',
    say: 'Here’s what I’m building.',
    blurb: 'Full stack across .NET and the MERN stack, now mostly Next.js and GraphQL at work.',
    tryIt: 'Click the screen to switch to the next file.',
    showLanguages: true,
    stack: ['React', 'Next.js', 'Node.js', 'Express', 'C#', '.NET Core', 'GraphQL', 'MongoDB', 'MySQL', 'SQL Server', 'Azure', 'AWS'],
    projects: [
      {
        name: 'Caissa',
        description: 'Free, open-source game review for Chess.com players: a blunder heatmap across your whole library, a weakness report, and puzzles built from your own mistakes.',
        url: 'https://github.com/UdayRajSahai2/Caissa',
        tags: ['Next.js 15', 'TypeScript', 'FastAPI', 'Python'],
      },
      {
        name: 'Blogging platform',
        description: 'A full blogging site with a rich editor, Google sign-in, nested comments, notifications and a dashboard for drafts and analytics. JWT auth, deployed on AWS.',
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
        description: 'Maps SKUs and tracks inventory, sales and returns straight from uploaded CSVs, with a dashboard and an assistant you can ask questions in plain English.',
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
        description: 'This portfolio, built with three.js and GSAP. Every object is drawn in code.',
        url: '',
        tags: ['three.js', 'WebGL'],
      },
    ],
  },
  {
    id: 'books',
    label: 'Books',
    say: 'This shelf is where I think.',
    blurb: 'I read to understand people, the mind and the universe. Philosophy and psychology fill most of this shelf.',
    tryIt: 'Watch me take a book to the chair. Click any other book to pull it out.',
    // what he is reading now: the open book in his hands shows the title and author
    reading: {
      title: 'Tuesdays with Morrie',
      by: 'Mitch Albom',
      note: 'I’m reading this right now and it is so heartwarming. Morrie is learning how to die well, and Mitch, his old student, is learning from him how to live. It is such a beautiful book.',
    },
    points: ['I’m part of a book club', 'Philosophy: how to think and how to live', 'Psychology: why people do what they do'],
    favourites: [], // TODO: add titles you love, e.g. { title: '', by: '' }
  },
  {
    id: 'screen',
    label: 'Films and anime',
    short: 'Films',
    say: 'Pick a channel.',
    blurb: 'I’m a movie buff. Films, TV series and anime, mostly for a good story told well.',
    tryIt: 'Click the TV and I’ll change the channel.',
    // the TV's channels: kind picks the picture (anime, series, film), label sits over the title
    channels: [
      { kind: 'anime', label: 'Anime', title: 'One Piece' },
      { kind: 'series', label: 'TV series', title: 'Breaking Bad' },
      { kind: 'film', label: 'Film', title: 'Interstellar' },
    ],
    points: ['Anime: One Piece', 'TV series: Breaking Bad', 'Film: Interstellar'],
    favourites: [], // TODO: add more favourites, e.g. { title: '', by: '' }
  },
  {
    id: 'gym',
    label: 'Gym',
    say: 'Spot me?',
    blurb: 'Lifting is the part of the day with no screen. It keeps the rest of the day honest.',
    tryIt: 'I’m mid-set. Click the barbell to hear it.',
    points: ['Weight training'],
  },
  {
    id: 'stars',
    label: 'Stars',
    say: 'Look up.',
    blurb: 'Astronomy is the biggest question I know: what is out there, and how did any of it begin.',
    tryIt: 'Click the telescope, or the button below, to look through it.',
    points: ['Astronomy'],
    sky: {
      open: 'Look through the telescope',
      title: 'Through the telescope',
      help: 'Drag to look around. Arrow keys work too.',
      start: 'Find Orion, then look for the others',
      close: 'Back to the room',
    },
  },
  {
    id: 'chess',
    label: 'Chess',
    say: 'Fancy a game?',
    blurb: 'A game I keep coming back to. I built a tool that shows me where my own games go wrong.',
    tryIt: 'You’re white. Click one of your pieces, then a marked square, and I’ll answer.',
    // what he says during a game
    game: {
      check: 'Check.',
      iWin: 'Checkmate. Good game!',
      youWin: 'You got me. Good game!',
      draw: 'Stalemate. A draw, then.',
    },
    projects: [
      {
        name: 'Caissa',
        description: 'Enter a Chess.com username and get a blunder heatmap across your whole library, a weakness report, move-by-move review and puzzles from your own mistakes.',
        url: 'https://github.com/UdayRajSahai2/Caissa',
        tags: ['Next.js 15', 'TypeScript', 'FastAPI', 'Python'],
      },
    ],
  },
];

// ── interface copy: panel headings and control labels ──────────
export const uiCopy = {
  built: 'Things I built',
  builtWith: 'Built with',
  openProject: 'Open on GitHub',
  soon: 'Link coming soon',
  languages: 'Languages on my GitHub',
  stack: 'What I work with',
  favourites: 'Favourites',
  reading: 'Reading now',
  by: 'by',
  now: 'Right now',
  been: 'Where I’ve been',
  walkTo: 'Walk me to',
  soundOn: 'Sound on',
  soundOff: 'Sound off',
  lamp: 'Desk lamp',
  me: 'That’s me',
};
