import { useState, useRef, useCallback, useEffect, createContext, useContext } from "react";

/* ============================================================================
   CONFIG — VPS BACKEND CONNECTION
   ----------------------------------------------------------------------------
   1. Set your backend URL in the env variable, or hardcode below.
   2. Flip USE_BACKEND = true once your VPS API is live.
   3. The api service object (below) is the single integration point.
   ============================================================================ */
const API_BASE = "/api";

// Set to true to use real backend; false uses local mock data + browser uploads
const USE_BACKEND = true;

/* ============================================================================
   API SERVICE — wire these endpoints on your VPS (Express/Fastify/Nest/etc.)
   Suggested stack: Node + Express + Postgres + JWT + multer (uploads)
   ============================================================================ */
const api = {
  async login(memberId, password) {
    if (!USE_BACKEND) {
      const m = MEMBERS.find(x => x.id === parseInt(memberId));
      if (!m || password !== m.pass) throw new Error("Invalid credentials");
      return { token: "mock-jwt-token", user: m };
    }
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, password }),
    });
    if (!r.ok) throw new Error("Invalid credentials");
    return r.json();
  },
  async getMembers() {
    if (!USE_BACKEND) return MEMBERS;
    return fetch(`${API_BASE}/members`).then(r => r.json());
  },
  async getPhotos(memberId) {
    if (!USE_BACKEND) return [];
    return fetch(`${API_BASE}/members/${memberId}/photos`).then(r => r.json());
  },
  async uploadPhotos(memberId, files, token) {
    if (!USE_BACKEND) {
      return files.map((f, i) => ({
        id: Date.now() + i,
        memberId,
        src: URL.createObjectURL(f),
        caption: f.name,
      }));
    }
    const fd = new FormData();
    files.forEach(f => fd.append("photos", f));
    const r = await fetch(`${API_BASE}/members/${memberId}/photos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    return r.json();
  },
  async getCollage() {
    if (!USE_BACKEND) return null;
    return fetch(`${API_BASE}/collage/germany-trip`).then(r => r.json());
  },
  async uploadCollagePhotos(files, token) {
    if (!USE_BACKEND) {
      return files.map((f, i) => ({
        id: Date.now() + i,
        src: URL.createObjectURL(f),
        caption: f.name,
      }));
    }
    const fd = new FormData();
    files.forEach(f => fd.append("photos", f));
    const r = await fetch(`${API_BASE}/collage/germany-trip`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    return r.json();
  },
  async deletePhoto(memberId, photoId, token) {
    if (!USE_BACKEND) return { ok: true };
    const r = await fetch(`${API_BASE}/members/${memberId}/photos/${photoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error("Delete failed");
    return r.json();
  },
  async getPosts() {
    if (!USE_BACKEND) return [];
    return fetch(`${API_BASE}/posts`).then(r => r.json());
  },
  async createPost(text, files, token) {
    if (!USE_BACKEND) {
      return { id: Date.now(), authorId: 1, text, images: [], likes: 0, likedBy: [], createdAt: new Date().toISOString() };
    }
    const fd = new FormData();
    fd.append("text", text);
    files.forEach(f => fd.append("images", f));
    const r = await fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!r.ok) throw new Error("Post creation failed");
    return r.json();
  },
  async deletePost(postId, token) {
    if (!USE_BACKEND) return { ok: true };
    const r = await fetch(`${API_BASE}/posts/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.json();
  },
  async likePost(postId, token) {
    if (!USE_BACKEND) return { liked: true, likes: 0 };
    const r = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.json();
  },
  async getComments(postId) {
    if (!USE_BACKEND) return [];
    return fetch(`${API_BASE}/posts/${postId}/comments`).then(r => r.json());
  },
  async addComment(postId, text, token) {
    if (!USE_BACKEND) {
      return { id: Date.now(), postId, authorId: 1, text, createdAt: new Date().toISOString() };
    }
    const r = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text }),
    });
    return r.json();
  },
};

/* ============================================================================
   DATA — replace with API calls once backend is live
   ============================================================================ */
const MEMBERS = [
  { id: 1,  name: "Alice Morgan",   initials: "AM", role: "CEO",            company: "NovaTech GmbH",       city: "Berlin",     color: "#E63946", pass: "alice2024",   bio: "Building the future of AI infrastructure. Passionate about sustainable tech and cross-border collaboration.", joined: "Jan 2023" },
  { id: 2,  name: "Bob Keller",     initials: "BK", role: "CTO",            company: "Keller Systems",      city: "Munich",     color: "#457B9D", pass: "bob2024",     bio: "Full-stack architect with 15 years in distributed systems. Open source contributor.", joined: "Feb 2023" },
  { id: 3,  name: "Carol Richter",  initials: "CR", role: "Head of Sales",  company: "RichterCo",           city: "Hamburg",    color: "#2D6A4F", pass: "carol2024",   bio: "Sales strategist helping European SMEs scale internationally. Former McKinsey.", joined: "Feb 2023" },
  { id: 4,  name: "David Schön",    initials: "DS", role: "CFO",            company: "Schön Capital",       city: "Frankfurt",  color: "#E9C46A", pass: "david2024",   bio: "Fintech investor and CFO with a passion for financial inclusion and ESG investing.", joined: "Mar 2023" },
  { id: 5,  name: "Eva Torres",     initials: "ET", role: "CMO",            company: "Torres Brand Lab",    city: "Barcelona",  color: "#F4A261", pass: "eva2024",     bio: "Award-winning brand strategist. Built marketing teams at 3 unicorns.", joined: "Mar 2023" },
  { id: 6,  name: "Felix Braun",    initials: "FB", role: "Engineer",       company: "Braun DevOps",        city: "Stuttgart",  color: "#6D4C41", pass: "felix2024",   bio: "DevOps & cloud engineer. Kubernetes certified. Coffee addict.", joined: "Apr 2023" },
  { id: 7,  name: "Greta Müller",   initials: "GM", role: "Product Lead",   company: "Müller Products",     city: "Cologne",    color: "#7B2D8B", pass: "greta2024",   bio: "Product leader turning complex problems into delightful user experiences.", joined: "Apr 2023" },
  { id: 8,  name: "Hans Weber",     initials: "HW", role: "Operations",     company: "Weber Logistics",     city: "Dresden",    color: "#1B7A34", pass: "hans2024",    bio: "Operations specialist with expertise in supply chain optimization and lean manufacturing.", joined: "May 2023" },
  { id: 9,  name: "Iris Hoffmann",  initials: "IH", role: "Legal",          company: "Hoffmann & Partners", city: "Düsseldorf", color: "#C0392B", pass: "iris2024",    bio: "IP & corporate lawyer. Advising startups and scale-ups across DACH region.", joined: "May 2023" },
  { id: 10, name: "Jan Fischer",    initials: "JF", role: "Designer",       company: "Fischer Design Co",   city: "Vienna",     color: "#2980B9", pass: "jan2024",     bio: "UI/UX designer obsessed with typography and motion. Behance Top 1%.", joined: "Jun 2023" },
  { id: 11, name: "Karin Bauer",    initials: "KB", role: "HR Director",    company: "Bauer Talent",        city: "Zurich",     color: "#8E44AD", pass: "karin2024",   bio: "Building diverse teams. People-first HR strategist.", joined: "Jun 2023" },
  { id: 12, name: "Lars Vogel",     initials: "LV", role: "Data Scientist", company: "Vogel Analytics",     city: "Leipzig",    color: "#16A085", pass: "lars2024",    bio: "ML engineer and data scientist. Kaggle Grandmaster.", joined: "Jul 2023" },
  { id: 13, name: "Maria Schulz",   initials: "MS", role: "Co-founder",     company: "Schulz Ventures",     city: "Nuremberg",  color: "#D35400", pass: "maria2024",   bio: "Serial entrepreneur with 3 exits. Mentor at TechStars and Y Combinator.", joined: "Jul 2023" },
  { id: 14, name: "Nico Hartmann",  initials: "NH", role: "COO",            company: "Hartmann Industries", city: "Hannover",   color: "#27AE60", pass: "nico2024",    bio: "Operations & scale-up expert. Helped 7 companies reach Series B.", joined: "Aug 2023" },
  { id: 15, name: "Olivia Koch",    initials: "OK", role: "Marketing",      company: "Koch Creative",       city: "Bremen",     color: "#E91E63", pass: "olivia2024",  bio: "Content & growth marketer. Built audiences from 0 to 1M+.", joined: "Aug 2023" },
  { id: 16, name: "Paul Wagner",    initials: "PW", role: "Investor",       company: "Wagner VC",           city: "Bonn",       color: "#795548", pass: "paul2024",    bio: "Early-stage investor focused on B2B SaaS. 40+ portfolio companies.", joined: "Sep 2023" },
  { id: 17, name: "Quinn Strauss",  initials: "QS", role: "Head of R&D",    company: "Strauss Labs",        city: "Mainz",      color: "#3F51B5", pass: "quinn2024",   bio: "Research director bridging academia and industry. 15 patents, PhD Physics.", joined: "Sep 2023" },
];

const NOTIFICATIONS = [
  { id: 1, text: "Alice uploaded 5 new photos", time: "2m ago",  memberId: 1 },
  { id: 2, text: "Bob updated his company profile", time: "15m ago", memberId: 2 },
  { id: 3, text: "Carol liked your post", time: "1h ago",  memberId: 3 },
  { id: 4, text: "David shared a document", time: "2h ago",  memberId: 4 },
  { id: 5, text: "Eva posted a new update", time: "3h ago",  memberId: 5 },
  { id: 6, text: "Felix joined the group chat", time: "5h ago",  memberId: 6 },
  { id: 7, text: "Greta commented on your photo", time: "6h ago",  memberId: 7 },
  { id: 8, text: "Hans replied to a thread", time: "1d ago",  memberId: 8 },
];

const FEED_POSTS = [
  { id: 1, memberId: 1, text: "Just closed our Series A! Incredibly grateful for our team and investors. The journey continues.", likes: 24, comments: 8, time: "1h ago" },
  { id: 2, memberId: 5, text: "Our new brand campaign went live today. Months of work distilled into 30 seconds. Check it out!", likes: 18, comments: 5, time: "3h ago" },
  { id: 3, memberId: 12, text: "Published a new paper on transformer optimization. Happy to share the preprint with anyone interested.", likes: 31, comments: 12, time: "5h ago" },
  { id: 4, memberId: 9, text: "Reminder: GDPR compliance deadlines are approaching. Reach out if your startup needs a legal review.", likes: 14, comments: 3, time: "8h ago" },
  { id: 5, memberId: 7, text: "Just shipped v2.0 of our product. 40% faster onboarding, new analytics dashboard, and dark mode finally!", likes: 27, comments: 9, time: "1d ago" },
];

// German trip collage seed (replaced when user uploads)
const GERMAN_TRIP_SEED = [
  { id: "g1", color: "linear-gradient(135deg,#1e3a8a,#3b82f6)", caption: "Brandenburg Gate, Berlin" },
  { id: "g2", color: "linear-gradient(135deg,#7c2d12,#ea580c)", caption: "Marienplatz, Munich" },
  { id: "g3", color: "linear-gradient(135deg,#064e3b,#10b981)", caption: "Black Forest" },
  { id: "g4", color: "linear-gradient(135deg,#581c87,#a855f7)", caption: "Neuschwanstein Castle" },
  { id: "g5", color: "linear-gradient(135deg,#9f1239,#f43f5e)", caption: "Cologne Cathedral" },
  { id: "g6", color: "linear-gradient(135deg,#1e293b,#475569)", caption: "Hamburg Harbour" },
  { id: "g7", color: "linear-gradient(135deg,#713f12,#eab308)", caption: "Heidelberg Old Town" },
  { id: "g8", color: "linear-gradient(135deg,#155e75,#06b6d4)", caption: "Rhine Valley" },
];

const genPhotos = (memberId, count = 48) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    memberId,
    src: null,
    color: `hsl(${(memberId * 47 + i * 23) % 360}, 55%, ${45 + (i % 5) * 5}%)`,
    caption: `Photo ${i + 1}`,
  }));

/* ============================================================================
   THEME CONTEXT
   ============================================================================ */
const ThemeContext = createContext({ theme: "dark", toggle: () => {} });
const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage?.getItem("connectnet-theme") || "dark";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage?.setItem("connectnet-theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);
  const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"));
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

/* ============================================================================
   STYLES — CSS variables driven theming + responsive
   ============================================================================ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root[data-theme="dark"] {
    --bg: #0b0b10;
    --bg2: #15151d;
    --bg3: #20202b;
    --bg4: #2a2a37;
    --border: rgba(255,255,255,0.08);
    --border2: rgba(255,255,255,0.16);
    --text: #ececf2;
    --text2: #8e8ea3;
    --accent: #7c6cff;
    --accent2: #ff6b9d;
    --accent3: #00d9b3;
    --success: #4caf50;
    --danger: #ff5c5c;
    --shadow: 0 10px 40px rgba(0,0,0,0.5);
    --shadow-sm: 0 2px 12px rgba(0,0,0,0.3);
  }
  :root[data-theme="light"] {
    --bg: #f6f7fb;
    --bg2: #ffffff;
    --bg3: #f1f2f7;
    --bg4: #e6e8ef;
    --border: rgba(0,0,0,0.07);
    --border2: rgba(0,0,0,0.14);
    --text: #1a1a25;
    --text2: #6a6a82;
    --accent: #6c5ce7;
    --accent2: #ec4899;
    --accent3: #00b894;
    --success: #2e7d32;
    --danger: #d32f2f;
    --shadow: 0 10px 40px rgba(20,20,40,0.10);
    --shadow-sm: 0 2px 8px rgba(20,20,40,0.06);
  }

  :root { --radius: 14px; --radius-sm: 10px; }

  html, body, #root { height: 100%; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
    transition: background 0.25s ease, color 0.25s ease;
  }

  /* TOPBAR */
  .topbar {
    height: 60px;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 14px;
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(12px);
  }
  .topbar-logo {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
    flex-shrink: 0;
    cursor: pointer;
  }
  .topbar-search {
    flex: 1;
    max-width: 320px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 8px 14px;
    color: var(--text);
    font-size: 13px;
    outline: none;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .topbar-search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,108,255,0.15); }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }

  .icon-btn {
    width: 36px; height: 36px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--text);
    font-size: 16px;
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
  }
  .icon-btn:hover { background: var(--bg4); border-color: var(--border2); }
  .icon-btn:active { transform: scale(0.95); }
  .icon-btn .badge-dot {
    position: absolute;
    width: 7px; height: 7px;
    background: var(--accent2); border-radius: 50%;
    top: 8px; right: 8px;
  }

  .user-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 5px 10px 5px 5px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.15s;
  }
  .user-badge:hover { background: var(--bg4); }

  .avatar-sm {
    width: 26px; height: 26px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: white;
    flex-shrink: 0;
  }
  .avatar-md {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: white;
    flex-shrink: 0;
  }

  /* LAYOUT */
  .layout {
    display: grid;
    grid-template-columns: 240px 1fr 260px;
    min-height: calc(100vh - 60px);
    max-width: 1280px;
    margin: 0 auto;
  }

  /* SIDEBARS */
  .sidebar-left, .sidebar-right {
    padding: 18px 14px;
    height: calc(100vh - 60px);
    overflow-y: auto;
    position: sticky;
    top: 60px;
    scrollbar-width: thin;
    scrollbar-color: var(--border2) transparent;
  }
  .sidebar-left { border-right: 1px solid var(--border); }
  .sidebar-right { border-left: 1px solid var(--border); }

  .sidebar-section { margin-bottom: 22px; }
  .sidebar-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--text2);
    margin-bottom: 10px;
    padding: 0 4px;
  }

  .member-row {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 8px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s;
    margin-bottom: 2px;
  }
  .member-row:hover { background: var(--bg3); }
  .member-row.active { background: linear-gradient(135deg, rgba(124,108,255,0.15), rgba(255,107,157,0.08)); }
  .member-info { flex: 1; min-width: 0; }
  .member-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .member-role { font-size: 11px; color: var(--text2); }
  .online-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); flex-shrink: 0; box-shadow: 0 0 0 2px var(--bg2); }

  .notif-item {
    padding: 9px 10px;
    border-radius: 10px;
    margin-bottom: 4px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    border-left: 2px solid transparent;
  }
  .notif-item:hover { background: var(--bg3); border-left-color: var(--accent); }
  .notif-text { font-size: 12px; color: var(--text); line-height: 1.4; }
  .notif-time { font-size: 10px; color: var(--text2); margin-top: 3px; }

  /* MAIN FEED */
  .main-feed { padding: 22px 24px 48px; min-width: 0; }
  .feed-header {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 4px;
    color: var(--text);
  }
  .feed-sub { font-size: 13px; color: var(--text2); margin-bottom: 22px; }

  /* GERMAN TRIP COLLAGE */
  .collage-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 22px;
    box-shadow: var(--shadow-sm);
  }
  .collage-head {
    padding: 16px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--border);
  }
  .collage-title {
    font-family: 'Syne', sans-serif;
    font-size: 17px;
    font-weight: 700;
    display: flex; align-items: center; gap: 8px;
  }
  .collage-flag {
    display: inline-flex;
    width: 22px; height: 14px;
    border-radius: 3px;
    background: linear-gradient(to bottom, #000 0 33%, #DD0000 33% 66%, #FFCE00 66% 100%);
  }
  .collage-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 110px;
    gap: 4px;
    padding: 4px;
  }
  .collage-tile {
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    transition: transform 0.2s, opacity 0.2s;
  }
  .collage-tile:hover { transform: scale(1.02); }
  .collage-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .collage-tile-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: rgba(255,255,255,0.85); text-align: center; padding: 8px;
    font-weight: 500;
  }
  .collage-tile.size-lg { grid-column: span 2; grid-row: span 2; }
  .collage-tile.size-tall { grid-row: span 2; }
  .collage-tile.size-wide { grid-column: span 2; }
  .collage-caption-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.65));
    color: #fff; font-size: 11px; padding: 14px 8px 6px;
    opacity: 0; transition: opacity 0.2s;
    font-weight: 500;
  }
  .collage-tile:hover .collage-caption-overlay { opacity: 1; }

  /* UPLOAD ZONE (collage + profile) */
  .upload-zone {
    border: 2px dashed var(--border2);
    border-radius: var(--radius);
    padding: 22px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    margin-bottom: 16px;
    background: var(--bg2);
  }
  .upload-zone:hover, .upload-zone.drag {
    border-color: var(--accent);
    background: linear-gradient(135deg, rgba(124,108,255,0.06), rgba(255,107,157,0.04));
  }
  .upload-icon { font-size: 30px; margin-bottom: 8px; }
  .upload-text { font-size: 13px; color: var(--text2); }
  .upload-text strong { color: var(--text); }

  .upload-inline {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }
  .upload-inline:hover { opacity: 0.9; }

  /* POSTS */
  .post-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 18px;
    margin-bottom: 14px;
    transition: border-color 0.2s, transform 0.1s;
  }
  .post-card:hover { border-color: var(--border2); }
  .post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .post-author { font-size: 14px; font-weight: 600; cursor: pointer; }
  .post-author:hover { color: var(--accent); }
  .post-meta { font-size: 12px; color: var(--text2); }
  .post-text { font-size: 14px; line-height: 1.6; color: var(--text); margin-bottom: 12px; }
  .post-actions { display: flex; gap: 18px; padding-top: 8px; border-top: 1px solid var(--border); }
  .post-action {
    font-size: 12px;
    color: var(--text2);
    cursor: pointer;
    display: flex; align-items: center; gap: 4px;
    transition: color 0.15s;
    user-select: none;
  }
  .post-action:hover { color: var(--accent); }
  .post-action.liked { color: var(--accent2); }

  /* RIGHT SIDEBAR */
  .featured-card {
    background: linear-gradient(135deg, rgba(124,108,255,0.18), rgba(255,107,157,0.10));
    border: 1px solid rgba(124,108,255,0.25);
    border-radius: var(--radius);
    padding: 14px;
    margin-bottom: 16px;
  }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
  .stat-item { text-align: center; padding: 9px 4px; background: var(--bg3); border-radius: 10px; }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 800; color: var(--accent); }
  .stat-label { font-size: 10px; color: var(--text2); margin-top: 2px; }

  /* PROFILE */
  .profile-page { padding: 0 0 48px; }
  .profile-banner {
    height: 180px;
    position: relative;
    overflow: hidden;
    border-radius: 0 0 var(--radius) var(--radius);
  }
  .profile-banner-bg { position: absolute; inset: 0; opacity: 0.85; }
  .profile-avatar-wrap {
    position: absolute;
    bottom: -40px; left: 24px;
    width: 88px; height: 88px;
    border-radius: 50%;
    border: 4px solid var(--bg);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 800; color: white;
    box-shadow: var(--shadow-sm);
  }
  .profile-body {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 18px;
    padding: 56px 22px 0;
  }
  .profile-name { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; margin-bottom: 2px; }
  .profile-role { font-size: 14px; color: var(--text2); margin-bottom: 4px; }
  .profile-company { font-size: 13px; font-weight: 600; color: var(--accent); margin-bottom: 10px; }
  .profile-bio { font-size: 13px; color: var(--text2); line-height: 1.65; margin-bottom: 14px; }
  .profile-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
  .badge {
    font-size: 10px; font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    background: rgba(124,108,255,0.14);
    color: var(--accent);
    border: 1px solid rgba(124,108,255,0.28);
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    max-height: calc(100vh - 220px);
    overflow-y: auto;
    padding-right: 2px;
  }
  .photo-thumb {
    aspect-ratio: 1;
    border-radius: 6px;
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.15s, opacity 0.15s;
    position: relative;
  }
  .photo-thumb:hover { transform: scale(1.05); opacity: 0.92; }
  .photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .photo-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 600;
  }
  .photo-delete-btn {
    position: absolute; top: 4px; right: 4px;
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(0,0,0,0.6); border: none;
    color: white; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.15s;
    font-size: 12px;
  }
  .photo-thumb:hover .photo-delete-btn { opacity: 1; }
  .photo-delete-btn:hover { background: var(--danger); }

  .section-title {
    font-size: 11px; font-weight: 700;
    letter-spacing: 1.2px; text-transform: uppercase;
    color: var(--text2);
    margin-bottom: 10px;
  }

  .company-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 14px;
  }
  .company-logo-box {
    width: 56px; height: 56px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: white;
    flex-shrink: 0;
  }
  .company-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 12px; }
  .company-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 3px; }
  .tag { display: inline-block; font-size: 10px; padding: 3px 8px; border-radius: 12px; font-weight: 600; }

  /* LIGHTBOX */
  .lightbox {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.92);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
    cursor: zoom-out;
    backdrop-filter: blur(8px);
  }
  .lightbox-img { max-width: 90vw; max-height: 90vh; border-radius: 10px; cursor: default; }
  .lightbox-close {
    position: absolute; top: 20px; right: 24px;
    width: 40px; height: 40px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 50%;
    color: white; cursor: pointer; font-size: 18px;
  }

  /* LOGIN */
  .login-page {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg);
    padding: 20px;
    position: relative;
    overflow: hidden;
  }
  .login-page::before {
    content: ""; position: absolute; inset: 0;
    background:
      radial-gradient(circle at 20% 30%, rgba(124,108,255,0.18), transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(255,107,157,0.14), transparent 40%);
    pointer-events: none;
  }
  .login-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 40px 36px;
    width: 100%;
    max-width: 400px;
    box-shadow: var(--shadow);
    position: relative;
    z-index: 1;
  }
  .login-logo {
    font-family: 'Syne', sans-serif;
    font-size: 30px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    margin-bottom: 6px;
  }
  .login-sub { font-size: 13px; color: var(--text2); text-align: center; margin-bottom: 28px; }
  .login-label { font-size: 12px; color: var(--text2); margin-bottom: 6px; display: block; font-weight: 500; }
  .login-input, .login-select {
    width: 100%;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 11px 14px;
    color: var(--text);
    font-size: 14px;
    outline: none;
    font-family: inherit;
    margin-bottom: 14px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .login-input:focus, .login-select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(124,108,255,0.15);
  }
  .password-wrap { position: relative; margin-bottom: 14px; }
  .password-wrap .login-input { margin-bottom: 0; padding-right: 44px; }
  .eye-btn {
    position: absolute;
    right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none;
    color: var(--text2);
    cursor: pointer; padding: 6px;
    font-size: 16px;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
  }
  .eye-btn:hover { color: var(--accent); background: var(--bg4); }

  .btn {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: transform 0.1s, box-shadow 0.15s, opacity 0.15s;
    box-shadow: 0 4px 14px rgba(124,108,255,0.3);
  }
  .btn:hover { box-shadow: 0 6px 20px rgba(124,108,255,0.45); }
  .btn:active { transform: scale(0.98); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-sm {
    padding: 7px 14px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-sm:hover { opacity: 0.9; }
  .btn-outline {
    padding: 7px 14px;
    background: transparent;
    color: var(--text2);
    border: 1px solid var(--border2);
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.15s, color 0.15s;
  }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent); }

  .error-msg { font-size: 12px; color: var(--danger); margin-top: -8px; margin-bottom: 10px; }
  .credentials-hint {
    background: var(--bg3);
    border-radius: 10px;
    padding: 11px 13px;
    margin-bottom: 18px;
    font-size: 11px;
    color: var(--text2);
    line-height: 1.65;
  }

  /* MOBILE MENU */
  .mobile-toggle { display: none; }
  .mobile-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 99;
  }

  /* SCROLLBARS */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text2); }

  /* RESPONSIVE */
  @media (max-width: 1100px) {
    .layout { grid-template-columns: 220px 1fr; }
    .sidebar-right { display: none; }
  }
  @media (max-width: 768px) {
    .layout { grid-template-columns: 1fr; }
    .sidebar-left {
      position: fixed;
      top: 60px; left: 0; bottom: 0;
      width: 280px;
      background: var(--bg2);
      z-index: 100;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
      border-right: 1px solid var(--border);
    }
    .sidebar-left.open { transform: translateX(0); box-shadow: var(--shadow); }
    .mobile-overlay.show { display: block; }
    .mobile-toggle { display: flex; }
    .topbar-search { display: none; }
    .main-feed { padding: 16px; }
    .profile-body { grid-template-columns: 1fr; padding: 56px 16px 0; }
    .collage-grid { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 90px; }
    .photo-grid { grid-template-columns: repeat(3, 1fr); }
    .feed-header { font-size: 22px; }
    .user-badge span { display: none; }
  }
  @media (max-width: 480px) {
    .topbar { padding: 0 12px; gap: 8px; }
    .topbar-logo { font-size: 18px; }
    .collage-grid { grid-template-columns: repeat(2, 1fr); }
    .login-card { padding: 28px 22px; }
    .post-actions { gap: 12px; }
  }
`;

/* ============================================================================
   ICONS — inline SVG (no external dependency)
   ============================================================================ */
const Icon = {
  Eye: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Sun: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  ),
  Moon: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Bell: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Menu: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Heart: ({ size = 14, filled }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Comment: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Share: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  Camera: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Plus: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  X: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

/* ============================================================================
   SHARED COMPONENTS
   ============================================================================ */
function Avatar({ member, size = "md", src }) {
  if (!member) return null;
  const cls = size === "sm" ? "avatar-sm" : "avatar-md";
  const sz = size === "sm" ? 26 : 36;
  const style = { background: member.color, width: sz, height: sz };
  if (src) return <div className={cls} style={style}><img src={src} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /></div>;
  return <div className={cls} style={style}>{member.initials}</div>;
}

/* ============================================================================
   LOGIN
   ============================================================================ */
function LoginPage({ onLogin }) {
  const [selectedId, setSelectedId] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme, toggle } = useTheme();

  const handleLogin = async () => {
    if (!selectedId) { setError("Please select a member."); return; }
    setLoading(true); setError("");
    try {
      const result = await api.login(selectedId, pass);
      onLogin(result.user, result.token);
    } catch (e) {
      setError(e.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button
        className="icon-btn"
        onClick={toggle}
        style={{ position: "absolute", top: 20, right: 20, zIndex: 2 }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
      </button>
      <div className="login-card">
        <div className="login-logo">ConnectNet</div>
        <div className="login-sub">Your private business network · 17 members</div>

        <div className="credentials-hint">
          <strong style={{ color: "var(--text)" }}>Demo credentials</strong><br />
          Pick any member. Password format: <code style={{ color: "var(--accent)" }}>firstname + 2024</code><br />
          e.g. Alice → <code style={{ color: "var(--accent)" }}>alice2024</code>
        </div>

        <label className="login-label">Select your profile</label>
        <select
          className="login-select"
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); setError(""); }}
        >
          <option value="">— Choose member —</option>
          {MEMBERS.map(m => (
            <option key={m.id} value={m.id}>{m.name} — {m.company}</option>
          ))}
        </select>

        <label className="login-label">Password</label>
        <div className="password-wrap">
          <input
            className="login-input"
            type={showPass ? "text" : "password"}
            placeholder="Enter your password"
            value={pass}
            onChange={e => { setPass(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowPass(s => !s)}
            aria-label={showPass ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPass ? <Icon.EyeOff /> : <Icon.Eye />}
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}
        <button className="btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   GERMAN TRIP COLLAGE
   ============================================================================ */
function GermanTripCollage({ photos, onUpload, isOwner = true }) {
  const fileRef = useRef();
  const [drag, setDrag] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const handleFiles = (files) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (imgs.length) onUpload(imgs);
  };

  // Layout pattern: first tile is large, rest follow varied sizes
  const sized = photos.map((p, i) => {
    let cls = "";
    if (i === 0) cls = "size-lg";
    else if (i === 3) cls = "size-tall";
    else if (i === 5) cls = "size-wide";
    return { ...p, cls };
  });

  return (
    <div className="collage-card">
      <div className="collage-head">
        <div className="collage-title">
          <span className="collage-flag" />
          Germany Trip · {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </div>
        {isOwner && (
          <button
            className="upload-inline"
            onClick={() => fileRef.current?.click()}
          >
            <Icon.Plus size={12} /> Add photos
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      <div
        className="collage-grid"
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        style={drag ? { background: "rgba(124,108,255,0.06)" } : undefined}
      >
        {sized.map(p => (
          <div
            key={p.id}
            className={`collage-tile ${p.cls}`}
            onClick={() => setLightbox(p)}
            style={p.src ? undefined : { background: p.color }}
          >
            {p.src
              ? <img src={p.src} alt={p.caption} />
              : <div className="collage-tile-placeholder">{p.caption}</div>
            }
            <div className="collage-caption-overlay">{p.caption}</div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}><Icon.X /></button>
          {lightbox.src
            ? <img className="lightbox-img" src={lightbox.src} alt={lightbox.caption} onClick={e => e.stopPropagation()} />
            : <div
                className="lightbox-img"
                onClick={e => e.stopPropagation()}
                style={{
                  width: "min(500px, 90vw)", height: "min(500px, 70vh)",
                  background: lightbox.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, color: "rgba(255,255,255,0.9)", borderRadius: 10, padding: 24, fontWeight: 600
                }}
              >
                {lightbox.caption}
              </div>
          }
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   PROFILE — photo sidebar
   ============================================================================ */
function PhotoSidebar({ photos, onPhotoClick, isOwner, onUpload, onDelete }) {
  const fileRef = useRef();
  const [drag, setDrag] = useState(false);

  return (
    <div>
      {isOwner && (
        <div
          className={`upload-zone${drag ? " drag" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => {
            e.preventDefault(); setDrag(false);
            const imgs = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
            if (imgs.length) onUpload(imgs);
          }}
        >
          <div className="upload-icon"><Icon.Camera size={28} /></div>
          <div className="upload-text"><strong>Upload photos</strong><br />drag & drop or click</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={e => onUpload(Array.from(e.target.files))}
          />
        </div>
      )}
      <div className="section-title">Photos ({photos.length})</div>
      <div className="photo-grid">
        {photos.map(photo => (
          <div key={photo.id} className="photo-thumb" onClick={() => onPhotoClick(photo)}>
            {photo.src
              ? <img src={photo.src} alt={photo.caption} />
              : <div className="photo-placeholder" style={{ background: photo.color }}>{photo.id}</div>
            }
            {isOwner && photo.src && (
              <button
                className="photo-delete-btn"
                onClick={e => { e.stopPropagation(); onDelete(photo.id); }}
                aria-label="Delete photo"
              >
                <Icon.X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ member, currentUser, allPhotos, onUpload, onDeletePhoto }) {
  const [lightbox, setLightbox] = useState(null);
  const isOwner = currentUser.id === member.id;
  const defaultPhotos = USE_BACKEND ? [] : genPhotos(member.id);
  const photos = allPhotos[member.id] || defaultPhotos;

  return (
    <div className="profile-page">
      <div className="profile-banner" style={{ background: `${member.color}33` }}>
        <div
          className="profile-banner-bg"
          style={{ background: `linear-gradient(135deg, ${member.color}, transparent 70%)` }}
        />
        <div className="profile-avatar-wrap" style={{ background: member.color }}>{member.initials}</div>
      </div>

      <div className="profile-body">
        <div>
          <PhotoSidebar
            photos={photos}
            onPhotoClick={setLightbox}
            isOwner={isOwner}
            onUpload={(files) => onUpload(member.id, files)}
            onDelete={(photoId) => onDeletePhoto(member.id, photoId)}
          />
        </div>

        <div>
          <div className="profile-name">{member.name}</div>
          <div className="profile-role">{member.role}</div>
          <div className="profile-company">{member.company}</div>
          <div className="profile-bio">{member.bio}</div>
          <div className="profile-badges">
            <span className="badge">{member.city}</span>
            <span className="badge">Member since {member.joined}</span>
            {isOwner && (
              <span className="badge" style={{ background: "rgba(255,107,157,0.15)", color: "var(--accent2)", borderColor: "rgba(255,107,157,0.3)" }}>You</span>
            )}
          </div>
          {!isOwner && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button className="btn-sm">+ Connect</button>
              <button className="btn-outline">Message</button>
            </div>
          )}

          <div className="company-card">
            <div className="company-header">
              <div className="company-logo-box" style={{ background: member.color }}>
                {member.company.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="company-name">{member.company}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>{member.city} · {member.role}</div>
                <span className="tag" style={{ background: `${member.color}22`, color: member.color }}>Active</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.65, marginBottom: 10 }}>
              {member.bio}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="tag" style={{ background: "rgba(124,108,255,0.12)", color: "var(--accent)", border: "1px solid rgba(124,108,255,0.2)" }}>{member.role}</span>
              <span className="tag" style={{ background: "rgba(0,217,179,0.12)", color: "var(--accent3)", border: "1px solid rgba(0,217,179,0.2)" }}>{member.city}</span>
            </div>
          </div>

          <div className="section-title">Recent Activity</div>
          {FEED_POSTS.filter(p => p.memberId === member.id).map(post => (
            <div key={post.id} className="post-card" style={{ marginBottom: 10 }}>
              <div className="post-text">{post.text}</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>♥ {post.likes} · {post.comments} comments · {post.time}</div>
            </div>
          ))}
          {FEED_POSTS.filter(p => p.memberId === member.id).length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text2)", padding: "12px 0" }}>No posts yet.</div>
          )}
        </div>
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}><Icon.X /></button>
          {lightbox.src
            ? <img className="lightbox-img" src={lightbox.src} alt={lightbox.caption} onClick={e => e.stopPropagation()} />
            : <div
                className="lightbox-img"
                onClick={e => e.stopPropagation()}
                style={{
                  width: 400, height: 400, background: lightbox.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 56, color: "rgba(255,255,255,0.7)", borderRadius: 10, fontWeight: 700
                }}
              >
                {lightbox.id}
              </div>
          }
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   POST COMPOSER — create a new post
   ============================================================================ */
function PostComposer({ currentUser, token, onPost }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleFiles = (newFiles) => {
    setFiles(prev => [...prev, ...Array.from(newFiles)]);
    Array.from(newFiles).forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews(prev => [...prev, e.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePost = async () => {
    if (!text.trim() && files.length === 0) return;
    setPosting(true);
    setError("");
    try {
      const post = await api.createPost(text, files, token);
      onPost(post);
      setText("");
      setFiles([]);
      setPreviews([]);
    } catch (e) { setError(e.message || "Post failed"); }
    finally { setPosting(false); }
  };

  return (
    <div className="post-card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <Avatar member={currentUser} size="md" />
        <textarea
          className="composer-textarea"
          placeholder="What's on your mind?"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          style={{
            flex: 1, background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "10px 14px", color: "var(--text)",
            fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit",
          }}
        />
      </div>
      {previews.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {previews.map((p, i) => (
            <div key={i} style={{ position: "relative", width: 64, height: 64 }}>
              <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
              <button
                onClick={() => removeFile(i)}
                style={{
                  position: "absolute", top: -4, right: -4, width: 18, height: 18,
                  borderRadius: "50%", background: "var(--danger)", border: "none",
                  color: "white", cursor: "pointer", fontSize: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              ><Icon.X size={10} /></button>
            </div>
          ))}
        </div>
      )}
      {error && <div className="error-msg" style={{ marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
        <button className="btn-outline" onClick={() => fileRef.current?.click()}>
          <Icon.Camera size={14} /> Photos
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={e => handleFiles(e.target.files)} />
        <button className="upload-inline" onClick={handlePost} disabled={posting || (!text.trim() && files.length === 0)}>
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   HOME FEED — with German trip collage at top
   ============================================================================ */
function HomeFeed({ collagePhotos, onCollageUpload, feedPosts, currentUser, token, onDeletePost, onLikePost, onAddComment, commentData, onLoadComments, onNewPost }) {
  const [expandedComments, setExpandedComments] = useState({});

  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments(s => ({ ...s, [postId]: !s[postId] }));
      return;
    }
    if (!commentData[postId]) await onLoadComments(postId);
    setExpandedComments(s => ({ ...s, [postId]: true }));
  };

  return (
    <div className="main-feed">
      <div className="feed-header">Home Feed</div>
      <div className="feed-sub">Welcome back · catch up with your network</div>

      <PostComposer currentUser={currentUser} token={token} onPost={onNewPost} />
      <GermanTripCollage photos={collagePhotos} onUpload={onCollageUpload} />

      {feedPosts.map(post => {
        const author = post.author;
        const isLiked = (post.likedBy || []).includes(currentUser.id);
        const isOwner = post.authorId === currentUser.id;
        return (
          <div key={post.id} className="post-card" style={{ position: "relative" }}>
            {isOwner && (
              <button
                onClick={() => onDeletePost(post.id)}
                style={{
                  position: "absolute", top: 12, right: 12,
                  background: "none", border: "none", color: "var(--text2)",
                  cursor: "pointer", padding: 4, borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0.5, transition: "opacity 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
                aria-label="Delete post"
              ><Icon.X size={16} /></button>
            )}
            <div className="post-header">
              <Avatar member={author} size="md" />
              <div>
                <div className="post-author">{author?.name}</div>
                <div className="post-meta">{author?.role} · {author?.company} · {new Date(post.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            {post.text && <div className="post-text">{post.text}</div>}
            {post.images && post.images.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                {post.images.map((img, i) => (
                  <img key={i} src={img} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 8 }} />
                ))}
              </div>
            )}
            <div className="post-actions">
              <span className={`post-action${isLiked ? " liked" : ""}`} onClick={() => onLikePost(post.id)}>
                <Icon.Heart filled={isLiked} /> {post.likes || 0}
              </span>
              <span className="post-action" onClick={() => toggleComments(post.id)}>
                <Icon.Comment /> {post.commentCount || 0}
              </span>
            </div>
            {expandedComments[post.id] && (
              <div style={{ paddingTop: 12, borderTop: "1px solid var(--border)", marginTop: 8 }}>
                {(commentData[post.id] || []).map(c => {
                  const ca = c.author;
                  return (
                    <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                      <Avatar member={ca} size="sm" />
                      <div style={{ flex: 1, background: "var(--bg3)", borderRadius: 8, padding: "6px 10px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{ca?.name}</div>
                        <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>{c.text}</div>
                      </div>
                    </div>
                  );
                })}
                <CommentInput postId={post.id} currentUser={currentUser} token={token} onAdd={onAddComment} />
              </div>
            )}
          </div>
        );
      })}
      {feedPosts.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text2)", fontSize: 14 }}>
          No posts yet. Be the first to post!
        </div>
      )}
    </div>
  );
}

function CommentInput({ postId, currentUser, token, onAdd }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onAdd(postId, text);
      setText("");
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
      <Avatar member={currentUser} size="sm" />
      <input
        className="composer-textarea"
        placeholder="Write a comment…"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSubmit())}
        style={{ flex: 1, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 20, padding: "8px 14px", color: "var(--text)", fontSize: 13, outline: "none", fontFamily: "inherit" }}
      />
      <button className="upload-inline" onClick={handleSubmit} disabled={sending || !text.trim()} style={{ padding: "6px 12px", fontSize: 12 }}>
        {sending ? "…" : "Send"}
      </button>
    </div>
  );
}

/* ============================================================================
   APP
   ============================================================================ */
function MainApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [activePage, setActivePage] = useState("feed");
  const [notifOpen, setNotifOpen] = useState(false);
  const [allPhotos, setAllPhotos] = useState({});
  const [collagePhotos, setCollagePhotos] = useState(GERMAN_TRIP_SEED);
  const [mobileNav, setMobileNav] = useState(false);
  const [members, setMembers] = useState(MEMBERS);
  const [feedPosts, setFeedPosts] = useState([]);
  const [commentData, setCommentData] = useState({});
  const { theme, toggle } = useTheme();

  // Restore session & initial load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage?.getItem("connectnet-session");
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored);
        setCurrentUser(user); setAuthToken(token);
      } catch (e) {}
    }
  }, []);

  // Load members, posts, collage from API after login
  useEffect(() => {
    if (!authToken) return;
    (async () => {
      try {
        const [memberData, postData, collageData] = await Promise.all([
          api.getMembers(),
          api.getPosts(),
          api.getCollage(),
        ]);
        if (memberData && memberData.length) setMembers(memberData);
        if (postData) setFeedPosts(postData);
        if (collageData && collageData.length) setCollagePhotos(collageData);
      } catch (e) { console.error("Failed to load data", e); }
    })();
  }, [authToken]);

  // Load member photos when viewing a profile
  useEffect(() => {
    if (!authToken || activePage === "feed") return;
    const memberId = parseInt(activePage);
    if (!memberId || allPhotos[memberId]) return;
    (async () => {
      try {
        const photos = await api.getPhotos(memberId);
        setAllPhotos(prev => ({ ...prev, [memberId]: photos }));
      } catch (e) { console.error("Failed to load photos", e); }
    })();
  }, [authToken, activePage]);

  const handleLogin = (user, token) => {
    setCurrentUser(user); setAuthToken(token);
    if (typeof window !== "undefined") {
      window.localStorage?.setItem("connectnet-session", JSON.stringify({ user, token }));
    }
  };
  const handleLogout = () => {
    setCurrentUser(null); setAuthToken(null);
    if (typeof window !== "undefined") {
      window.localStorage?.removeItem("connectnet-session");
    }
  };

  const handleProfileUpload = useCallback(async (memberId, files) => {
    const newPhotos = await api.uploadPhotos(memberId, files, authToken);
    setAllPhotos(prev => ({
      ...prev,
      [memberId]: [...(prev[memberId] || genPhotos(memberId)), ...newPhotos.map((p, i) => ({
        id: p.id || Date.now() + i,
        memberId,
        src: p.src || p.url,
        color: "#444",
        caption: p.caption || `Photo`,
      }))],
    }));
  }, [authToken]);

  const handleDeletePhoto = useCallback(async (memberId, photoId) => {
    await api.deletePhoto(memberId, photoId, authToken);
    setAllPhotos(prev => ({
      ...prev,
      [memberId]: (prev[memberId] || []).filter(p => p.id !== photoId),
    }));
  }, [authToken]);

  const handleCollageUpload = useCallback(async (files) => {
    const newPhotos = await api.uploadCollagePhotos(files, authToken);
    setCollagePhotos(prev => [
      ...newPhotos.map((p, i) => ({
        id: p.id || `up-${Date.now()}-${i}`,
        src: p.src || p.url,
        color: "#444",
        caption: p.caption || `Germany ${prev.length + i + 1}`,
      })),
      ...prev,
    ]);
  }, [authToken]);

  const handleCreatePost = useCallback((post) => {
    if (post && !post.error) setFeedPosts(prev => [post, ...prev]);
  }, []);

  const handleDeletePost = useCallback(async (postId) => {
    await api.deletePost(postId, authToken);
    setFeedPosts(prev => prev.filter(p => p.id !== postId));
  }, [authToken]);

  const handleLikePost = useCallback(async (postId) => {
    const result = await api.likePost(postId, authToken);
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: result.likes, likedBy: result.likedBy } : p));
  }, [authToken]);

  const handleLoadComments = useCallback(async (postId) => {
    const comments = await api.getComments(postId);
    setCommentData(prev => ({ ...prev, [postId]: comments }));
  }, []);

  const handleAddComment = useCallback(async (postId, text) => {
    const comment = await api.addComment(postId, text, authToken);
    setCommentData(prev => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }));
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
  }, [authToken]);

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  const activeMember = activePage !== "feed" ? members.find(m => m.id === parseInt(activePage)) : null;

  return (
    <>
      <div className="topbar">
        <button
          className="icon-btn mobile-toggle"
          onClick={() => setMobileNav(true)}
          aria-label="Menu"
        >
          <Icon.Menu />
        </button>
        <div className="topbar-logo" onClick={() => setActivePage("feed")}>ConnectNet</div>
        <input className="topbar-search" placeholder="Search members…" />
        <div className="topbar-right">
          <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
          </button>
          <button
            className="icon-btn"
            onClick={() => setNotifOpen(o => !o)}
            style={{ position: "relative" }}
            aria-label="Notifications"
          >
            <Icon.Bell />
            <span className="badge-dot" />
          </button>
          <div className="user-badge" onClick={() => setActivePage(String(currentUser.id))}>
            <Avatar member={currentUser} size="sm" />
            <span>{currentUser.name.split(" ")[0]}</span>
          </div>
          <button className="btn-outline" onClick={handleLogout}>Sign out</button>
        </div>
      </div>

      {notifOpen && (
        <div style={{
          position: "fixed", top: 68, right: 16, width: 300,
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: 12, zIndex: 200,
          boxShadow: "var(--shadow)"
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.2 }}>
            Notifications
          </div>
          {NOTIFICATIONS.map(n => {
            const m = members.find(x => x.id === n.memberId);
            return (
              <div key={n.id} className="notif-item" onClick={() => { setActivePage(String(n.memberId)); setNotifOpen(false); }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <Avatar member={m} size="sm" />
                  <div className="notif-text">{n.text}</div>
                </div>
                <div className="notif-time">{n.time}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile overlay */}
      <div className={`mobile-overlay${mobileNav ? " show" : ""}`} onClick={() => setMobileNav(false)} />

      <div className="layout">
        <div className={`sidebar-left${mobileNav ? " open" : ""}`}>
          <div className="sidebar-section">
            <div className="sidebar-label">Members ({members.length})</div>
            {members.map(m => (
              <div
                key={m.id}
                className={`member-row${activePage === String(m.id) ? " active" : ""}`}
                onClick={() => { setActivePage(String(m.id)); setMobileNav(false); }}
              >
                <Avatar member={m} size="md" />
                <div className="member-info">
                  <div className="member-name">{m.name}</div>
                  <div className="member-role">{m.role}</div>
                </div>
                <div className="online-dot" />
              </div>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Recent Notifications</div>
            {NOTIFICATIONS.filter(n => members.find(m => m.id === n.memberId)).slice(0, 5).map(n => (
              <div key={n.id} className="notif-item" onClick={() => { setActivePage(String(n.memberId)); setMobileNav(false); }}>
                <div className="notif-text">{n.text}</div>
                <div className="notif-time">{n.time}</div>
              </div>
            ))}
          </div>
        </div>

        {activePage === "feed"
          ? <HomeFeed
              collagePhotos={collagePhotos}
              onCollageUpload={handleCollageUpload}
              feedPosts={feedPosts}
              currentUser={currentUser}
              token={authToken}
              onDeletePost={handleDeletePost}
              onLikePost={handleLikePost}
              onAddComment={handleAddComment}
              commentData={commentData}
              onLoadComments={handleLoadComments}
              onNewPost={handleCreatePost}
            />
          : activeMember
            ? <ProfilePage
                member={activeMember}
                currentUser={currentUser}
                allPhotos={allPhotos}
                onUpload={handleProfileUpload}
                onDeletePhoto={handleDeletePhoto}
              />
            : <HomeFeed
                collagePhotos={collagePhotos}
                onCollageUpload={handleCollageUpload}
                feedPosts={feedPosts}
                currentUser={currentUser}
                token={authToken}
                onDeletePost={handleDeletePost}
                onLikePost={handleLikePost}
                onAddComment={handleAddComment}
                commentData={commentData}
                onLoadComments={handleLoadComments}
                onNewPost={handleCreatePost}
              />
        }

          <div className="sidebar-right">
            <div className="section-title" style={{ marginBottom: 10 }}>Network Stats</div>
            <div className="featured-card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, fontFamily: "Syne, sans-serif" }}>ConnectNet</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>Your private business network</div>
              <div className="stat-grid">
                <div className="stat-item"><div className="stat-num">{members.length}</div><div className="stat-label">Members</div></div>
                <div className="stat-item"><div className="stat-num">100%</div><div className="stat-label">Connected</div></div>
                <div className="stat-item"><div className="stat-num">{allPhotos[activeMember?.id]?.length || "0"}</div><div className="stat-label">Photos</div></div>
                <div className="stat-item"><div className="stat-num">{new Set(members.map(m => m.city)).size}</div><div className="stat-label">Cities</div></div>
              </div>
            </div>
            <div className="section-title" style={{ marginBottom: 10 }}>All Members</div>
            {members.map(m => (
              <div key={m.id} className="member-row" onClick={() => setActivePage(String(m.id))}>
                <Avatar member={m} size="sm" />
                <div className="member-info">
                  <div className="member-name">{m.name}</div>
                  <div className="member-role">{m.company}</div>
                </div>
              </div>
            ))}
          </div>
      </div>

      <style>{css}</style>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <style>{css}</style>
      <MainApp />
    </ThemeProvider>
  );
}
