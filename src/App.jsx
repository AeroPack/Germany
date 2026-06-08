import { useState, useRef, useCallback, useEffect, createContext, useContext } from "react";

const API_BASE =
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) ||
  "https://your-vps-domain.com/api";

const USE_BACKEND = false;

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
        tags: [],
        uploadedAt: new Date().toISOString(),
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
  async deletePhoto(memberId, photoId, token) {
    if (!USE_BACKEND) return { success: true };
    const r = await fetch(`${API_BASE}/members/${memberId}/photos/${photoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.json();
  },
  async uploadAvatar(memberId, file, token) {
    if (!USE_BACKEND) {
      return { src: URL.createObjectURL(file) };
    }
    const fd = new FormData();
    fd.append("avatar", file);
    const r = await fetch(`${API_BASE}/members/${memberId}/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    return r.json();
  },
  async deleteAvatar(memberId, token) {
    if (!USE_BACKEND) return { success: true };
    const r = await fetch(`${API_BASE}/members/${memberId}/avatar`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
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
        tags: [],
        uploadedAt: new Date().toISOString(),
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
};

const MEMBERS = [
  { id: 1, group: "Cologne", name: "Kalyan Bobade", username: "kalyanb_cologne", initials: "KB", role: "Founder & Managing Director", company: "Ascent Castings Technologies", company_description: "Precision casting and manufacturing company specializing in advanced casting technologies.", city: "Pune, Maharashtra, India", color: "#E63946", pass: "KalB@Cast#91", image: "assets/images/kalyan_bobade.png", joined: "May 2025" },
  { id: 2, group: "Cologne", name: "Nilesh Jaiswal", username: "nileshj_cologne", initials: "NJ", role: "Managing Director", company: "Amar Chand Steel Private Limited (A.C. Steel)", company_description: "Metal processing, manufacturing and trading firm operating in heavy engineering and steel sectors.", city: "Kolkata, West Bengal, India", color: "#457B9D", pass: "NilJ@Steel#77", image: "assets/images/nilesh_jaiswal.png", joined: "May 2025" },
  { id: 3, group: "Cologne", name: "Santosh Naidu", username: "santoshn_cologne", initials: "SN", role: "3rd Generation Entrepreneur / New Product Development", company: "BJ Perfect Works", company_description: "Manufacturer of precision machined components serving diverse industrial sectors.", city: "Pune, Maharashtra, India", color: "#2D6A4F", pass: "SanN@BJPw#63", image: "assets/images/santosh_naidu.png", joined: "May 2025" },
  { id: 4, group: "Cologne", name: "Sachin Rathore", username: "sachinr_cologne", initials: "SR", role: "General Manager", company: "RR Global (RR Kabel Limited)", company_description: "Leading conglomerate in electrical products, cables and wires serving global markets.", city: "Mumbai, Maharashtra, India", color: "#E9C46A", pass: "SacR@RRGl#85", image: "assets/images/sachin_rathore.png", joined: "May 2025" },
  { id: 5, group: "Berlin", name: "Nikhil Dayakar", username: "nikhild_berlin", initials: "ND", role: "Managing Partner", company: "Accurate Bearing Components (ABC)", company_description: "Auto components manufacturer specializing in precision bearing components for automotive applications.", city: "Bangalore, Karnataka, India", color: "#F4A261", pass: "NikD@ABCo#42", image: "assets/images/nikhil_dayakar.png", joined: "May 2025" },
  { id: 6, group: "Berlin", name: "Nalin Bhatara", username: "nalinb_berlin", initials: "NB", role: "Chief Executive Officer", company: "Aero Pack Technologies Pvt. Ltd.", company_description: "Provider of defence solutions, retail automation and IT solutions for specialized industries.", city: "New Delhi, Delhi, India", color: "#6D4C41", pass: "NalB@AerP#56", image: "assets/images/nalin_bhatara.png", joined: "May 2025" },
  { id: 7, group: "Berlin", name: "Dhananjayan Subramanian", username: "dhananjs_berlin", initials: "DS", role: "Director", company: "Embien Technologies India Private Limited", company_description: "Electronics design and engineering services company serving clients across Chennai, Bangalore and Madurai.", city: "Chennai / Bangalore / Madurai, India", color: "#7B2D8B", pass: "DhaS@Embn#38", image: "assets/images/dhananjayan_subramanian.png", joined: "May 2025" },
  { id: 8, group: "Berlin", name: "Utkarsh Zope", username: "utkarshz_berlin", initials: "UZ", role: "Head of Business Development", company: "Kuro Systems", company_description: "Industry 4.0 and IIoT solutions provider enabling industrial automation for modern manufacturing.", city: "India", color: "#1B7A34", pass: "UtkZ@Kuro#74", image: "assets/images/utkarsh_zope.png", joined: "May 2025" },
  { id: 9, group: "Berlin", name: "Mayank Bhatewara", username: "mayankb_berlin", initials: "MB", role: "Director", company: "Technix ACS Private Limited", company_description: "Engineering services and process automation company based in Mumbai.", city: "Mumbai, Maharashtra, India", color: "#C0392B", pass: "MayB@Tcnx#29", image: "assets/images/mayank_bhatewara.png", joined: "May 2025" },
  { id: 10, group: "Munich", name: "Sunil Naik", username: "suniln_munich", initials: "SN", role: "Co-Founder and CEO", company: "Dhruv Compusoft Consultancy Pvt. Ltd.", company_description: "Global provider of Manufacturing Execution Systems, factory automation and IIoT solutions with presence across USA, Singapore, Malaysia, Latvia and Netherlands.", city: "Mumbai, India", color: "#2980B9", pass: "SunN@Dhrv#67", image: "assets/images/sunil_naik.png", joined: "May 2025" },
  { id: 11, group: "Munich", name: "Sandeep Mathur", username: "sandeepm_munich", initials: "SM", role: "Territory Head – Germany", company: "Pratham Software Pvt. Ltd. (PSI)", company_description: "Software product engineering company offering AI-enabled SaaS development, legacy modernization, cloud and DevOps services.", city: "Jaipur, India", color: "#8E44AD", pass: "SanM@Prth#53", image: "assets/images/sandeep_mathur.png", joined: "May 2025" },
  { id: 12, group: "Munich", name: "Yashwanthan Manivannan", username: "yashwanthanm_munich", initials: "YM", role: "Founder & CEO", company: "Watts and Joules India Pvt. Ltd.", company_description: "Energy management and renewable solutions company specializing in smart grid, IoT integration and PV & BESS manufacturing.", city: "India", color: "#16A085", pass: "YasM@WtJl#88", image: "assets/images/yashwanthan_manivannan.png", joined: "May 2025" },
  { id: 13, group: "Munich", name: "Mahesh Tudavekar", username: "mahesht_munich", initials: "MT", role: "Director – Technology & Systems", company: "Shuddha Space Private Limited", company_description: "Agri-tech company enabling traceable sourcing and sustainable farming across 18 Indian states, connecting 1000+ FPOs and 250,000+ farmers.", city: "India (Pan-India, 18 states)", color: "#D35400", pass: "MahT@Shdh#46", image: "assets/images/mahesh_tudavekar.png", joined: "May 2025" },
  { id: 14, group: "Hamburg", name: "Rajesh Kumar", username: "rajeshk_hamburg", initials: "RK", role: "Representative", company: "Kanha Engineering Pvt Ltd.", company_description: "Engineering company seeking partnerships with German industrial firms across manufacturing and engineering sectors.", city: "India", color: "#27AE60", pass: "RajK@Knh#31", image: "assets/images/rajesh_kumar.png", joined: "May 2025" },
  { id: 15, group: "Hamburg", name: "Prateek R. Agarwal", username: "prateeka_hamburg", initials: "PA", role: "CEO & Founder", company: "Kavach Infra Projects Pvt. Ltd.", company_description: "Pre-engineered building manufacturer and structural steel EPC contractor specializing in defence infrastructure and turnkey construction.", city: "Kolkata, India", color: "#E91E63", pass: "PraA@Kvch#72", image: "assets/images/prateek_agarwal.png", joined: "May 2025" },
  { id: 16, group: "Hamburg", name: "Sanjna Chilakapati", username: "sanjnac_hamburg", initials: "SC", role: "Transformation Officer", company: "Innomet Advanced Materials Ltd.", company_description: "Advanced materials company manufacturing metal powders and tungsten heavy alloy components for aerospace, defence and automotive sectors.", city: "Hyderabad, Telangana, India", color: "#795548", pass: "SanC@Inmt#19", image: "assets/images/sanjna_chilakapati.png", joined: "May 2025" },
  { id: 17, group: "Hamburg", name: "Dr. Rajkumar Yadav", username: "rajkumary_hamburg", initials: "RY", role: "Head – Research & Quality", company: "Pluss Advanced Technologies Ltd.", company_description: "Specialty materials company developing phase change materials for thermal management and specialty polymers for industrial and packaging applications.", city: "Gurugram, Haryana, India", color: "#3F51B5", pass: "RajY@Plss#60", image: "assets/images/dr_rajkumar_yadav.png", joined: "May 2025" },
];

const CREDENTIALS_SHEET = MEMBERS.map(m => ({
  id: m.id, name: m.name, username: m.username, password: m.pass, group: m.group,
}));

/* ---- helpers ---- */
function formatUploadTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatOnlineStatus(lastSeenIso) {
  if (!lastSeenIso) return { label: "Offline", online: false };
  const diffMs = new Date() - new Date(lastSeenIso);
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 3) return { label: "Online", online: true };
  if (diffMin < 60) return { label: `${diffMin}m ago`, online: false };
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return { label: `${diffHr}h ago`, online: false };
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return { label: "Yesterday", online: false };
  return { label: new Date(lastSeenIso).toLocaleDateString(undefined, { month: "short", day: "numeric" }), online: false };
}

/* Read an image File as a (downscaled) data URL so it survives reloads via localStorage. */
function readImageAsDataURL(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result); // fall back to raw data URL
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const type = file.type === "image/png" ? "image/png" : "image/jpeg";
          resolve(canvas.toDataURL(type, quality));
        } catch (e) {
          resolve(reader.result);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================================================
   THEME CONTEXT
   ============================================================================ */
const ThemeContext = createContext({ theme: "dark", toggle: () => {} });
const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage?.getItem("letsconnect-theme") || "dark";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage?.setItem("letsconnect-theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);
  const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"));
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

/* ============================================================================
   STYLES
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

  /* Universal inputs fix for mobile scaling */
  input, textarea, select { max-width: 100%; }

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
    overflow: hidden;
  }
  .avatar-md {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: white;
    flex-shrink: 0;
    overflow: hidden;
  }
  .avatar-lg {
    width: 88px; height: 88px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 800; color: white;
    flex-shrink: 0;
    overflow: hidden;
    position: relative;
  }
  .avatar-lg img, .avatar-md img, .avatar-sm img {
    width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
  }
  .avatar-lg .avatar-overlay {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: 50%;
    cursor: pointer;
    gap: 6px;
    flex-direction: column;
  }
  .avatar-lg:hover .avatar-overlay { opacity: 1; }
  .avatar-overlay-btn {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 6px;
    color: white;
    font-size: 10px;
    padding: 3px 7px;
    cursor: pointer;
    font-family: inherit;
    font-weight: 600;
    transition: background 0.15s;
  }
  .avatar-overlay-btn:hover { background: rgba(255,255,255,0.28); }
  .avatar-overlay-btn.danger { border-color: rgba(255,92,92,0.5); color: #ff8888; }

  .layout {
    display: grid;
    grid-template-columns: 240px 1fr 260px;
    min-height: calc(100vh - 60px);
    max-width: 1280px;
    margin: 0 auto;
  }

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

  .group-tag {
    display: inline-block;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 8px;
    background: rgba(124,108,255,0.14);
    color: var(--accent);
    border: 1px solid rgba(124,108,255,0.25);
    margin-left: 4px;
    letter-spacing: 0.5px;
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
  .member-role { font-size: 11px; color: var(--text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .member-status { font-size: 10px; color: var(--text2); margin-top: 1px; display: flex; align-items: center; gap: 4px; }
  .online-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); flex-shrink: 0; box-shadow: 0 0 0 2px var(--bg2); }
  .offline-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text2); flex-shrink: 0; box-shadow: 0 0 0 2px var(--bg2); }

  .main-feed { padding: 22px 24px 48px; min-width: 0; }
  .feed-header {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 4px;
    color: var(--text);
  }
  .feed-sub { font-size: 13px; color: var(--text2); margin-bottom: 22px; }

  /* Post composer */
  .post-composer {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 18px;
    margin-bottom: 22px;
  }
  .post-composer textarea {
    width: 100%;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 11px 14px;
    color: var(--text);
    font-size: 14px;
    font-family: inherit;
    resize: none;
    outline: none;
    min-height: 80px;
    transition: border-color 0.15s;
    margin-bottom: 10px;
  }
  .post-composer textarea:focus { border-color: var(--accent); }
  .post-composer-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }

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
  .collage-empty {
    padding: 40px 20px;
    text-align: center;
    color: var(--text2);
    font-size: 13px;
  }
  .collage-empty-icon { font-size: 36px; margin-bottom: 10px; }
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
  .collage-tile.size-lg { grid-column: span 2; grid-row: span 2; }
  .collage-tile.size-tall { grid-row: span 2; }
  .collage-tile.size-wide { grid-column: span 2; }
  .collage-caption-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.72));
    color: #fff; font-size: 11px; padding: 22px 8px 6px;
    opacity: 0; transition: opacity 0.2s;
    font-weight: 500;
  }
  .collage-tile:hover .collage-caption-overlay { opacity: 1; }
  .collage-tile-meta { font-size: 10px; color: rgba(255,255,255,0.75); margin-top: 2px; }
  .collage-delete-btn {
    position: absolute; top: 5px; right: 5px;
    width: 22px; height: 22px;
    background: rgba(255,0,0,0.75);
    border: none; border-radius: 50%;
    color: white; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 10;
  }
  .collage-tile:hover .collage-delete-btn { opacity: 1; }

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
  .post-text { font-size: 14px; line-height: 1.6; color: var(--text); margin-bottom: 10px; }
  .post-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
  .post-tag {
    font-size: 11px; font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
    background: rgba(124,108,255,0.12);
    color: var(--accent);
    border: 1px solid rgba(124,108,255,0.22);
  }
  .post-actions { display: flex; gap: 18px; padding-top: 8px; border-top: 1px solid var(--border); align-items: center; }
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
  .post-delete-btn {
    margin-left: auto;
    font-size: 11px;
    color: var(--danger);
    cursor: pointer;
    opacity: 0.6;
    background: none;
    border: none;
    font-family: inherit;
    transition: opacity 0.15s;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .post-delete-btn:hover { opacity: 1; background: rgba(255,92,92,0.1); }

  /* Composer image preview */
  .composer-image-preview {
    position: relative;
    margin-bottom: 10px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border);
    max-width: 100%;
  }
  .composer-image-preview img { display: block; width: 100%; max-height: 320px; object-fit: cover; }
  .composer-image-remove {
    position: absolute; top: 8px; right: 8px;
    width: 26px; height: 26px;
    background: rgba(0,0,0,0.6); color: #fff;
    border: none; border-radius: 50%;
    cursor: pointer; font-size: 12px;
    display: flex; align-items: center; justify-content: center;
  }
  .composer-image-remove:hover { background: rgba(0,0,0,0.8); }

  /* Post image in feed */
  .post-image-wrap {
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
    cursor: pointer;
    border: 1px solid var(--border);
  }
  .post-image {
    display: block;
    width: 100%;
    max-height: 480px;
    object-fit: cover;
    transition: transform 0.2s;
  }
  .post-image-wrap:hover .post-image { transform: scale(1.01); }

  /* Removable tag on own posts */
  .post-tag-remove {
    background: none; border: none; cursor: pointer;
    color: var(--accent); font-size: 11px; line-height: 1;
    margin-left: 4px; padding: 0; opacity: 0.7;
  }
  .post-tag-remove:hover { opacity: 1; }

  /* Comments */
  .comment-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .comment-row { display: flex; align-items: flex-start; gap: 8px; }
  .comment-bubble {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 8px 12px;
    flex: 1;
    min-width: 0;
  }
  .comment-author { font-size: 12px; font-weight: 600; color: var(--text); }
  .comment-text { font-size: 13px; color: var(--text); line-height: 1.5; word-break: break-word; }
  .comment-time { font-size: 10px; color: var(--text2); margin-top: 2px; }
  .comment-delete-btn {
    background: none; border: none; cursor: pointer;
    color: var(--danger); font-size: 12px;
    opacity: 0.5; padding: 4px; flex-shrink: 0;
    transition: opacity 0.15s;
  }
  .comment-delete-btn:hover { opacity: 1; }
  .comment-input-row { display: flex; align-items: center; gap: 8px; }
  .comment-input {
    flex: 1;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 8px 14px;
    color: var(--text);
    font-size: 13px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
  }
  .comment-input:focus { border-color: var(--accent); }
  .comment-input-row .btn-sm {
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; padding: 0; border-radius: 50%;
  }
  .comment-input-row .btn-sm:disabled { opacity: 0.4; cursor: default; }

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
    overflow: hidden;
    cursor: pointer;
  }
  .profile-body {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 18px;
    padding: 56px 22px 0;
  }
  .profile-name { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; margin-bottom: 2px; }
  .profile-username { font-size: 13px; color: var(--text2); margin-bottom: 4px; font-family: monospace; }
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

  /* Photo grid */
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
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
    background: var(--bg3);
  }
  .photo-thumb:hover { transform: scale(1.05); opacity: 0.92; }
  .photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .photo-delete-btn {
    position: absolute; top: 4px; right: 4px;
    width: 20px; height: 20px;
    background: rgba(255,0,0,0.8);
    border: none; border-radius: 50%;
    color: white; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 5;
  }
  .photo-thumb:hover .photo-delete-btn { opacity: 1; }
  .photo-time-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.68));
    padding: 14px 5px 4px;
    font-size: 9px;
    color: rgba(255,255,255,0.85);
    opacity: 0;
    transition: opacity 0.15s;
    font-weight: 500;
  }
  .photo-thumb:hover .photo-time-overlay { opacity: 1; }
  .photo-tags-strip {
    display: flex; flex-wrap: wrap; gap: 3px;
    margin-top: 2px;
  }
  .photo-tag-mini {
    font-size: 9px; font-weight: 600;
    padding: 1px 5px;
    border-radius: 8px;
    background: rgba(124,108,255,0.22);
    color: var(--accent);
  }
  .photo-edit-btn {
    position: absolute; top: 4px; left: 4px;
    width: 20px; height: 20px;
    background: rgba(124,108,255,0.85);
    border: none; border-radius: 50%;
    color: white; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 5;
  }
  .photo-thumb:hover .photo-edit-btn { opacity: 1; }

  /* Tag editor modal */
  .tag-editor-modal {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(6px);
    padding: 20px;
  }
  .tag-editor-box {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px;
    width: 100%;
    max-width: 380px;
    box-shadow: var(--shadow);
  }
  .tag-editor-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 12px; }
  .tag-input-row { display: flex; gap: 8px; margin-bottom: 12px; }
  .tag-input {
    flex: 1;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;
    color: var(--text);
    font-size: 13px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
  }
  .tag-input:focus { border-color: var(--accent); }
  .current-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; min-height: 28px; }
  .current-tag {
    display: flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 600;
    padding: 3px 8px 3px 10px;
    border-radius: 12px;
    background: rgba(124,108,255,0.15);
    color: var(--accent);
    border: 1px solid rgba(124,108,255,0.28);
  }
  .tag-remove-btn {
    background: none; border: none; cursor: pointer;
    color: var(--accent); font-size: 12px; padding: 0; line-height: 1;
    opacity: 0.7;
    transition: opacity 0.15s;
  }
  .tag-remove-btn:hover { opacity: 1; }

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

  .lightbox {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.92);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
    cursor: zoom-out;
    backdrop-filter: blur(8px);
  }
  .lightbox-content {
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    max-width: 90vw;
  }
  .lightbox-img { max-width: 90vw; max-height: 80vh; border-radius: 10px; cursor: default; }
  .lightbox-close {
    position: absolute; top: 20px; right: 24px;
    width: 40px; height: 40px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 50%;
    color: white; cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
  }
  .lightbox-meta {
    color: rgba(255,255,255,0.75);
    font-size: 12px;
    text-align: center;
    line-height: 1.6;
    cursor: default;
  }
  .lightbox-tags { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; margin-top: 4px; }
  .lightbox-tag {
    font-size: 11px; font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(124,108,255,0.25);
    color: #c4b8ff;
    border: 1px solid rgba(124,108,255,0.35);
  }

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
    max-width: 420px;
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
  .btn-danger {
    padding: 7px 14px;
    background: transparent;
    color: var(--danger);
    border: 1px solid rgba(255,92,92,0.35);
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }
  .btn-danger:hover { background: rgba(255,92,92,0.1); }

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

  /* Responsive Table Wrapper */
  .creds-table-wrapper { width: 100%; overflow-x: auto; }
  .creds-table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 600px; }
  .creds-table th {
    text-align: left; padding: 8px 10px;
    background: var(--bg3); color: var(--text2);
    font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid var(--border);
  }
  .creds-table td {
    padding: 8px 10px; border-bottom: 1px solid var(--border);
    color: var(--text); font-family: monospace; font-size: 11px;
  }
  .creds-table tr:hover td { background: var(--bg3); }

  .empty-feed {
    text-align: center;
    padding: 48px 20px;
    color: var(--text2);
  }
  .empty-feed-icon { font-size: 44px; margin-bottom: 12px; }
  .empty-feed-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .empty-feed-sub { font-size: 13px; line-height: 1.6; }

  .mobile-toggle { display: none; }
  .mobile-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 99;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text2); }

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
    
    /* Swap Photo Grid and Information on Mobile Profile Page */
    .profile-body { display: flex; flex-direction: column-reverse; padding: 56px 16px 0; gap: 24px; }
    .profile-info-section { margin-bottom: 12px; }
    
    .collage-grid { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 90px; }
    .photo-grid { grid-template-columns: repeat(3, 1fr); }
    .feed-header { font-size: 22px; }
    .user-badge span { display: none; }
  }
  @media (max-width: 480px) {
    .topbar { padding: 0 12px; gap: 8px; }
    .topbar-logo { font-size: 18px; }
    .collage-grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 110px;}
    .login-card { padding: 28px 22px; }
    .post-actions { gap: 12px; flex-wrap: wrap; }
    
    /* Make composer buttons full width cleanly on tiny screens */
    .post-composer-actions { flex-direction: column; align-items: stretch; }
    .post-composer-actions > div { justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 8px; }
    .post-composer-actions button.btn-sm { margin-top: 10px; width: 100%; justify-content: center; }
  }
    /* --- Custom Dropdown Styles --- */
  .custom-select-wrapper { 
    position: relative; 
    width: 100%; 
    margin-bottom: 14px; 
    user-select: none; 
  }
  .custom-select-trigger {
    width: 100%; 
    background: var(--bg3); 
    border: 1px solid var(--border); 
    border-radius: 10px;
    padding: 11px 14px; 
    color: var(--text); 
    font-size: 14px; 
    font-family: inherit;
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .custom-select-trigger:focus, 
  .custom-select-wrapper.open .custom-select-trigger {
    border-color: var(--accent); 
    box-shadow: 0 0 0 3px rgba(124,108,255,0.15); 
    outline: none;
  }
  .custom-select-menu {
    position: absolute; 
    top: calc(100% + 6px); 
    left: 0; 
    width: 100%;
    background: var(--bg3); 
    border: 1px solid var(--border); 
    border-radius: 10px;
    box-shadow: var(--shadow); 
    z-index: 50; 
    max-height: 240px; 
    overflow-y: auto;
    padding: 8px 0; 
    display: none;
  }
  .custom-select-wrapper.open .custom-select-menu { 
    display: block; 
    animation: fadeIn 0.15s ease;
  }
  .custom-select-group { 
    padding: 8px 14px 4px; 
    font-size: 10px; 
    font-weight: 700; 
    color: var(--text2); 
    text-transform: uppercase; 
    letter-spacing: 1px; 
  }
  .custom-select-option { 
    padding: 8px 14px; 
    font-size: 13px; 
    color: var(--text); 
    cursor: pointer; 
    transition: background 0.15s; 
  }
  .custom-select-option:hover { 
    background: var(--bg4); 
  }
  .custom-select-option.selected { 
    background: linear-gradient(135deg, rgba(124,108,255,0.15), rgba(255,107,157,0.08)); 
    color: var(--accent); 
    font-weight: 600; 
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
`;

/* ============================================================================
   ICONS
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
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
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
  Trash: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  Key: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/>
    </svg>
  ),
  Tag: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Send: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
};

/* ============================================================================
   SHARED COMPONENTS
   ============================================================================ */
function Avatar({ member, size = "md", avatarSrc }) {
  const cls = size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : "avatar-md";
  const sz = size === "sm" ? 26 : size === "lg" ? 88 : 36;
  const style = { background: member.color, width: sz, height: sz };
  const src = avatarSrc || null;
  if (src) {
    return (
      <div className={cls} style={style}>
        <img src={src} alt={member.name} />
      </div>
    );
  }
  return <div className={cls} style={style}>{member.initials}</div>;
}

/* ============================================================================
   TAG EDITOR MODAL
   ============================================================================ */
function TagEditorModal({ photo, onSave, onClose }) {
  const [tags, setTags] = useState(photo.tags || []);
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setInput("");
  };

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
  };

  return (
    <div className="tag-editor-modal" onClick={onClose}>
      <div className="tag-editor-box" onClick={e => e.stopPropagation()}>
        <div className="tag-editor-title">🏷️ Edit Tags</div>
        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
          Tags are optional. Add keywords to describe this photo.
        </div>
        <div className="tag-input-row">
          <input
            className="tag-input"
            placeholder="Add a tag and press Enter…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button className="btn-sm" onClick={addTag} style={{ flexShrink: 0 }}>Add</button>
        </div>
        <div className="current-tags">
          {tags.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic" }}>No tags yet</span>
          )}
          {tags.map(t => (
            <span key={t} className="current-tag">
              #{t}
              <button className="tag-remove-btn" onClick={() => removeTag(t)}>✕</button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-sm" onClick={() => onSave(tags)}>Save Tags</button>
        </div>
      </div>
    </div>
  );
}


function CustomSelect({ value, onChange, groups, members }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close the dropdown if the user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedMember = members.find(m => m.id === parseInt(value));

  return (
    <div className={`custom-select-wrapper ${isOpen ? "open" : ""}`} ref={wrapperRef}>
      <div
        className="custom-select-trigger"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span style={{ opacity: selectedMember ? 1 : 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 10 }}>
          {selectedMember ? `${selectedMember.name} · ${selectedMember.role}` : "— Choose your name —"}
        </span>
        <span style={{ fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </div>
      
      <div className="custom-select-menu">
        {groups.map(g => (
          <div key={g}>
            <div className="custom-select-group">{g} Group</div>
            {members.filter(m => m.group === g).map(m => (
              <div
                key={m.id}
                className={`custom-select-option ${value === String(m.id) ? "selected" : ""}`}
                onClick={() => { 
                  onChange(String(m.id)); 
                  setIsOpen(false); 
                }}
              >
                {m.name} <span style={{ color: "var(--text2)", fontSize: 11, marginLeft: 6 }}>· {m.role}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
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

  const groups = [...new Set(MEMBERS.map(m => m.group))];

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
        <div className="login-logo">Lets Connect</div>
        <div className="login-sub">Germany Business Trip · 17 Members</div>

        <div className="credentials-hint">
          <strong style={{ color: "var(--text)" }}>Your credentials were shared privately.</strong><br />
          Select your name below and enter your password.<br />
          <span style={{ color: "var(--accent)" }}>Username shown after login.</span>
        </div>

<label className="login-label">Select your profile</label>
        <CustomSelect 
          value={selectedId} 
          onChange={(val) => { setSelectedId(val); setError(""); }} 
          groups={groups} 
          members={MEMBERS} 
        />

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
   CREDENTIALS TABLE
   ============================================================================ */
function CredentialsTable({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, backdropFilter: "blur(8px)", padding: 20,
    }}>
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: 24, maxWidth: 700, width: "100%",
        maxHeight: "85vh", overflow: "auto", boxShadow: "var(--shadow)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 700 }}>
            <Icon.Key size={16} /> All Credentials
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.X /></button>
        </div>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>
          ⚠️ Admin view only — distribute passwords privately to each member.
        </div>
        
        {/* Table responsive wrapper added here */}
        <div className="creds-table-wrapper">
          <table className="creds-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Username (Login ID)</th><th>Password</th><th>Group</th>
              </tr>
            </thead>
            <tbody>
              {CREDENTIALS_SHEET.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td style={{ fontFamily: "inherit", fontWeight: 600 }}>{c.name}</td>
                  <td>{c.username}</td>
                  <td style={{ color: "var(--accent2)" }}>{c.password}</td>
                  <td>{c.group}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <button className="btn-sm" onClick={() => {
            const rows = CREDENTIALS_SHEET.map(c =>
              `${c.name}\tUsername: ${c.username}\tPassword: ${c.password}\tGroup: ${c.group}`
            ).join("\n");
            navigator.clipboard?.writeText(rows);
          }}>Copy all to clipboard</button>
          <button className="btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   GERMAN TRIP COLLAGE
   ============================================================================ */
function GermanTripCollage({ photos, onUpload, onDelete, isOwner = true }) {
  const fileRef = useRef();
  const [drag, setDrag] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const handleFiles = (files) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (imgs.length) onUpload(imgs);
  };

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
          <button className="upload-inline" onClick={() => fileRef.current?.click()}>
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

      {photos.length === 0 ? (
        <div className="collage-empty">
          <div className="collage-empty-icon">🇩🇪</div>
          <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>No group photos yet</div>
          <div>Be the first to add photos from the Germany trip!</div>
          {isOwner && (
            <button className="upload-inline" style={{ marginTop: 14 }} onClick={() => fileRef.current?.click()}>
              <Icon.Camera size={12} /> Upload photos
            </button>
          )}
        </div>
      ) : (
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
              style={p.src ? undefined : { background: "#333" }}
            >
              <div onClick={() => setLightbox(p)} style={{ width: "100%", height: "100%" }}>
                {p.src
                  ? <img src={p.src} alt={p.caption} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Photo</div>
                }
              </div>
              <div className="collage-caption-overlay">
                {p.caption}
                {p.uploadedAt && <div className="collage-tile-meta">{formatUploadTime(p.uploadedAt)}</div>}
              </div>
              {isOwner && (
                <button
                  className="collage-delete-btn"
                  onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                  title="Delete photo"
                >✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}><Icon.X /></button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            {lightbox.src
              ? <img className="lightbox-img" src={lightbox.src} alt={lightbox.caption} />
              : null
            }
            <div className="lightbox-meta">
              {lightbox.caption}
              {lightbox.uploadedAt && <div style={{ marginTop: 2, fontSize: 11 }}>Uploaded {formatUploadTime(lightbox.uploadedAt)}</div>}
            </div>
            {lightbox.tags && lightbox.tags.length > 0 && (
              <div className="lightbox-tags">
                {lightbox.tags.map(t => <span key={t} className="lightbox-tag">#{t}</span>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   PHOTO SIDEBAR — with delete, tags, upload time
   ============================================================================ */
function PhotoSidebar({ photos, onPhotoClick, isOwner, onUpload, onDeletePhoto, onUpdateTags }) {
  const fileRef = useRef();
  const [drag, setDrag] = useState(false);
  const [editTagPhoto, setEditTagPhoto] = useState(null);

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
      {photos.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", padding: "20px 0", fontStyle: "italic" }}>
          No photos yet
        </div>
      )}
      <div className="photo-grid">
        {photos.map(photo => (
          <div key={photo.id} className="photo-thumb">
            <div onClick={() => onPhotoClick(photo)} style={{ width: "100%", height: "100%" }}>
              {photo.src
                ? <img src={photo.src} alt={photo.caption} />
                : <div className="photo-placeholder" style={{ background: "#333", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Photo</div>
              }
            </div>
            <div className="photo-time-overlay">
              {photo.uploadedAt ? formatUploadTime(photo.uploadedAt) : ""}
              {photo.tags && photo.tags.length > 0 && (
                <div className="photo-tags-strip">
                  {photo.tags.slice(0, 2).map(t => <span key={t} className="photo-tag-mini">#{t}</span>)}
                </div>
              )}
            </div>
            {isOwner && (
              <>
                <button
                  className="photo-edit-btn"
                  onClick={e => { e.stopPropagation(); setEditTagPhoto(photo); }}
                  title="Edit tags"
                >🏷</button>
                <button
                  className="photo-delete-btn"
                  onClick={e => { e.stopPropagation(); onDeletePhoto(photo.id); }}
                  title="Delete photo"
                >✕</button>
              </>
            )}
          </div>
        ))}
      </div>

      {editTagPhoto && (
        <TagEditorModal
          photo={editTagPhoto}
          onSave={(newTags) => {
            onUpdateTags(editTagPhoto.id, newTags);
            setEditTagPhoto(null);
          }}
          onClose={() => setEditTagPhoto(null)}
        />
      )}
    </div>
  );
}

/* ============================================================================
   PROFILE AVATAR UPLOAD/DELETE
   ============================================================================ */
function ProfileAvatar({ member, isOwner, avatarSrc, onUploadAvatar, onDeleteAvatar }) {
  const fileRef = useRef();

  return (
    <div className="profile-avatar-wrap" style={{ background: member.color }}>
      {avatarSrc
        ? <img src={avatarSrc} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
        : <span>{member.initials}</span>
      }
      {isOwner && (
        <div className="avatar-overlay">
          <button
            className="avatar-overlay-btn"
            onClick={() => fileRef.current?.click()}
            title="Upload profile photo"
          >📷 Upload</button>
          {avatarSrc && (
            <button
              className="avatar-overlay-btn danger"
              onClick={onDeleteAvatar}
              title="Remove profile photo"
            >🗑 Remove</button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) onUploadAvatar(f);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   PROFILE PAGE
   ============================================================================ */
function ProfilePage({ member, currentUser, allPhotos, onUpload, onDeletePhoto, onUpdateTags, avatars, onUploadAvatar, onDeleteAvatar }) {
  const [lightbox, setLightbox] = useState(null);
  const isOwner = currentUser.id === member.id;
  const photos = allPhotos[member.id] || [];

  const handlePhotoClick = (photo) => setLightbox(photo);

  return (
    <div className="profile-page">
      <div className="profile-banner" style={{ background: `${member.color}33` }}>
        <div
          className="profile-banner-bg"
          style={{ background: `linear-gradient(135deg, ${member.color}, transparent 70%)` }}
        />
        <ProfileAvatar
          member={member}
          isOwner={isOwner}
          avatarSrc={avatars[member.id] || null}
          onUploadAvatar={(file) => onUploadAvatar(member.id, file)}
          onDeleteAvatar={() => onDeleteAvatar(member.id)}
        />
      </div>

      <div className="profile-body">
        {/* Swapped visual flex order with dedicated classes for mobile layouts */}
        <div className="profile-photos-section">
          <PhotoSidebar
            photos={photos}
            onPhotoClick={handlePhotoClick}
            isOwner={isOwner}
            onUpload={(files) => onUpload(member.id, files)}
            onDeletePhoto={(photoId) => onDeletePhoto(member.id, photoId)}
            onUpdateTags={(photoId, tags) => onUpdateTags(member.id, photoId, tags)}
          />
        </div>

        <div className="profile-info-section">
          <div className="profile-name">{member.name}</div>
          <div className="profile-username">@{member.username}</div>
          <div className="profile-role">{member.role}</div>
          <div className="profile-company">{member.company}</div>
          <div className="profile-bio">{member.company_description}</div>
          <div className="profile-badges">
            <span className="badge">{member.city}</span>
            <span className="badge">{member.group} Group</span>
            <span className="badge">Germany Trip 2025</span>
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
              {member.company_description}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="tag" style={{ background: "rgba(124,108,255,0.12)", color: "var(--accent)", border: "1px solid rgba(124,108,255,0.2)" }}>{member.role}</span>
              <span className="tag" style={{ background: "rgba(0,217,179,0.12)", color: "var(--accent3)", border: "1px solid rgba(0,217,179,0.2)" }}>{member.group} Group</span>
            </div>
          </div>
        </div>
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}><Icon.X /></button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            {lightbox.src && <img className="lightbox-img" src={lightbox.src} alt={lightbox.caption} />}
            <div className="lightbox-meta">
              {lightbox.caption}
              {lightbox.uploadedAt && <div style={{ marginTop: 2, fontSize: 11 }}>Uploaded {formatUploadTime(lightbox.uploadedAt)}</div>}
            </div>
            {lightbox.tags && lightbox.tags.length > 0 && (
              <div className="lightbox-tags">
                {lightbox.tags.map(t => <span key={t} className="lightbox-tag">#{t}</span>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   POST COMPOSER
   ============================================================================ */
function PostComposer({ currentUser, avatars, onPost }) {
  const [text, setText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef();

  const addTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) setTags(prev => [...prev, trimmed]);
    setTagInput("");
  };

  const handlePickImage = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const dataUrl = await readImageAsDataURL(file);
      setImage(dataUrl);
    } catch (e) {
      /* ignore */
    }
    setBusy(false);
  };

  const handlePost = () => {
    if (!text.trim() && !image) return;
    onPost({ text: text.trim(), tags, image });
    setText("");
    setTags([]);
    setTagInput("");
    setShowTagInput(false);
    setImage(null);
  };

  return (
    <div className="post-composer">
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
        <Avatar member={currentUser} size="md" avatarSrc={avatars[currentUser.id]} />
        <textarea
          placeholder={`What's on your mind, ${currentUser.name.split(" ")[0]}?`}
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </div>

      {image && (
        <div className="composer-image-preview">
          <img src={image} alt="upload preview" />
          <button className="composer-image-remove" onClick={() => setImage(null)} title="Remove image">✕</button>
        </div>
      )}

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {tags.map(t => (
            <span key={t} className="current-tag">
              #{t}
              <button className="tag-remove-btn" onClick={() => setTags(prev => prev.filter(x => x !== t))}>✕</button>
            </span>
          ))}
        </div>
      )}

      {showTagInput && (
        <div className="tag-input-row" style={{ marginBottom: 10 }}>
          <input
            className="tag-input"
            placeholder="Add a tag and press Enter…"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
            autoFocus
          />
          <button className="btn-sm" onClick={addTag}>Add</button>
        </div>
      )}

      <div className="post-composer-actions">
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-outline"
            style={{ display: "flex", alignItems: "center", gap: 5 }}
            onClick={() => imgRef.current?.click()}
          >
            <Icon.Camera size={13} /> {busy ? "Loading…" : (image ? "Change photo" : "Photo")}
          </button>
          <button
            className="btn-outline"
            style={{ display: "flex", alignItems: "center", gap: 5 }}
            onClick={() => setShowTagInput(s => !s)}
          >
            <Icon.Tag size={12} /> {showTagInput ? "Hide tags" : "Add tags"}
          </button>
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => { handlePickImage(e.target.files?.[0]); e.target.value = ""; }}
          />
        </div>
        <button
          className="btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 5 }}
          onClick={handlePost}
          disabled={busy || (!text.trim() && !image)}
        >
          <Icon.Send size={12} /> Post
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   HOME FEED
   ============================================================================ */
function HomeFeed({ collagePhotos, onCollageUpload, onCollageDelete, avatars, currentUser, feedPosts, onPost, onDeletePost, onAddComment, onDeleteComment, onRemoveTag }) {
  const [liked, setLiked] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [drafts, setDrafts] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const toggleLike = (id) => setLiked(s => ({ ...s, [id]: !s[id] }));
  const toggleComments = (id) => setOpenComments(s => ({ ...s, [id]: !s[id] }));

  const submitComment = (postId) => {
    const text = (drafts[postId] || "").trim();
    if (!text) return;
    onAddComment(postId, text);
    setDrafts(d => ({ ...d, [postId]: "" }));
    setOpenComments(s => ({ ...s, [postId]: true }));
  };

  return (
    <div className="main-feed">
      <div className="feed-header">Home Feed</div>
      <div className="feed-sub">Lets Connect · Germany Business Trip 2025</div>

      <PostComposer currentUser={currentUser} avatars={avatars} onPost={onPost} />

      <GermanTripCollage photos={collagePhotos} onUpload={onCollageUpload} onDelete={onCollageDelete} />

      {feedPosts.length === 0 ? (
        <div className="empty-feed">
          <div className="empty-feed-icon">💬</div>
          <div className="empty-feed-title">No posts yet</div>
          <div className="empty-feed-sub">Be the first to share something with the group!</div>
        </div>
      ) : (
        feedPosts.map(post => {
          const author = MEMBERS.find(m => m.id === post.memberId);
          if (!author) return null;
          const isLiked = liked[post.id];
          const isOwn = currentUser.id === post.memberId;
          const comments = Array.isArray(post.comments) ? post.comments : [];
          const commentsOpen = openComments[post.id];
          return (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <Avatar member={author} size="md" avatarSrc={avatars[author.id]} />
                <div>
                  <div className="post-author">{author.name}</div>
                  <div className="post-meta">{author.role} · {author.company} · {formatUploadTime(post.createdAt)}</div>
                </div>
              </div>
              {post.text && <div className="post-text">{post.text}</div>}
              {post.image && (
                <div className="post-image-wrap" onClick={() => setLightbox(post)}>
                  <img src={post.image} alt="post" className="post-image" />
                </div>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map(t => (
                    <span key={t} className="post-tag">
                      #{t}
                      {isOwn && (
                        <button
                          className="post-tag-remove"
                          title="Remove tag"
                          onClick={() => onRemoveTag(post.id, t)}
                        >✕</button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              <div className="post-actions">
                <span className={`post-action${isLiked ? " liked" : ""}`} onClick={() => toggleLike(post.id)}>
                  <Icon.Heart filled={isLiked} /> {post.likes + (isLiked ? 1 : 0)}
                </span>
                <span className="post-action" onClick={() => toggleComments(post.id)}>
                  <Icon.Comment /> {comments.length}
                </span>
                <span className="post-action"><Icon.Share /> Share</span>
                {isOwn && (
                  <button className="post-delete-btn" onClick={() => onDeletePost(post.id)}>
                    <Icon.Trash size={11} /> Delete
                  </button>
                )}
              </div>

              {commentsOpen && (
                <div className="comment-section">
                  {comments.map(c => {
                    const cAuthor = MEMBERS.find(m => m.id === c.memberId);
                    const canDelete = currentUser.id === c.memberId || isOwn;
                    return (
                      <div key={c.id} className="comment-row">
                        <Avatar member={cAuthor || author} size="sm" avatarSrc={avatars[c.memberId]} />
                        <div className="comment-bubble">
                          <div className="comment-author">{cAuthor ? cAuthor.name : "Member"}</div>
                          <div className="comment-text">{c.text}</div>
                          <div className="comment-time">{formatUploadTime(c.createdAt)}</div>
                        </div>
                        {canDelete && (
                          <button
                            className="comment-delete-btn"
                            title="Delete comment"
                            onClick={() => onDeleteComment(post.id, c.id)}
                          >✕</button>
                        )}
                      </div>
                    );
                  })}
                  <div className="comment-input-row">
                    <Avatar member={currentUser} size="sm" avatarSrc={avatars[currentUser.id]} />
                    <input
                      className="comment-input"
                      placeholder="Write a comment…"
                      value={drafts[post.id] || ""}
                      onChange={e => setDrafts(d => ({ ...d, [post.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submitComment(post.id); } }}
                    />
                    <button
                      className="btn-sm"
                      onClick={() => submitComment(post.id)}
                      disabled={!(drafts[post.id] || "").trim()}
                    >
                      <Icon.Send size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {lightbox && lightbox.image && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}><Icon.X /></button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img className="lightbox-img" src={lightbox.image} alt="post" />
            {lightbox.text && <div className="lightbox-meta">{lightbox.text}</div>}
            {lightbox.tags && lightbox.tags.length > 0 && (
              <div className="lightbox-tags">
                {lightbox.tags.map(t => <span key={t} className="lightbox-tag">#{t}</span>)}
              </div>
            )}
          </div>
        </div>
      )}
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
  const [showCreds, setShowCreds] = useState(false);
  const [allPhotos, setAllPhotos] = useState({});
  const [avatars, setAvatars] = useState({});
  const [collagePhotos, setCollagePhotos] = useState([]);
  const [mobileNav, setMobileNav] = useState(false);
  const [feedPosts, setFeedPosts] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState({}); // { memberId: isoString }
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage?.getItem("letsconnect-session");
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored);
        setCurrentUser(user); setAuthToken(token);
      } catch (e) {}
    }
    // load persisted data
    try {
      const savedPhotos = window.localStorage?.getItem("letsconnect-photos");
      if (savedPhotos) setAllPhotos(JSON.parse(savedPhotos));
    } catch (e) {}
    try {
      const savedPosts = window.localStorage?.getItem("letsconnect-posts");
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        const normalized = Array.isArray(parsed) ? parsed.map(p => ({
          ...p,
          tags: Array.isArray(p.tags) ? p.tags : [],
          image: p.image || null,
          comments: Array.isArray(p.comments) ? p.comments : [],
        })) : [];
        setFeedPosts(normalized);
      }
    } catch (e) {}
    try {
      const savedCollage = window.localStorage?.getItem("letsconnect-collage");
      if (savedCollage) setCollagePhotos(JSON.parse(savedCollage));
    } catch (e) {}
    try {
      const savedStatus = window.localStorage?.getItem("letsconnect-online");
      if (savedStatus) setOnlineStatus(JSON.parse(savedStatus));
    } catch (e) {}
  }, []);

  // Persist photos
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Only persist non-blob metadata (tags, captions, times) – src blobs don't survive reload
        window.localStorage?.setItem("letsconnect-photos", JSON.stringify(allPhotos));
      } catch (e) {}
    }
  }, [allPhotos]);

  // Persist posts
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage?.setItem("letsconnect-posts", JSON.stringify(feedPosts));
      } catch (e) {}
    }
  }, [feedPosts]);

  // Persist collage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage?.setItem("letsconnect-collage", JSON.stringify(collagePhotos));
      } catch (e) {}
    }
  }, [collagePhotos]);

  // Update online status when user logs in/out
  useEffect(() => {
    if (!currentUser) return;
    const updateStatus = () => {
      const next = { ...onlineStatus, [currentUser.id]: new Date().toISOString() };
      setOnlineStatus(next);
      try { window.localStorage?.setItem("letsconnect-online", JSON.stringify(next)); } catch (e) {}
    };
    updateStatus();
    const interval = setInterval(updateStatus, 60000); // heartbeat every minute
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleLogin = (user, token) => {
    setCurrentUser(user); setAuthToken(token);
    if (typeof window !== "undefined") {
      window.localStorage?.setItem("letsconnect-session", JSON.stringify({ user, token }));
    }
    // mark online
    const next = { ...((() => { try { return JSON.parse(window.localStorage?.getItem("letsconnect-online") || "{}"); } catch(e){ return {}; } })()), [user.id]: new Date().toISOString() };
    setOnlineStatus(next);
    try { window.localStorage?.setItem("letsconnect-online", JSON.stringify(next)); } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null); setAuthToken(null);
    if (typeof window !== "undefined") {
      window.localStorage?.removeItem("letsconnect-session");
    }
  };

  /* ---- Profile photo upload ---- */
  const handleProfileUpload = useCallback(async (memberId, files) => {
    const newPhotos = await api.uploadPhotos(memberId, files, authToken);
    setAllPhotos(prev => ({
      ...prev,
      [memberId]: [
        ...(prev[memberId] || []),
        ...newPhotos.map((p, i) => ({
          id: p.id || Date.now() + i,
          memberId,
          src: p.src || p.url,
          color: "#444",
          caption: p.caption || `Photo`,
          tags: p.tags || [],
          uploadedAt: p.uploadedAt || new Date().toISOString(),
        })),
      ],
    }));
  }, [authToken]);

  /* ---- Profile photo delete ---- */
  const handleDeletePhoto = useCallback(async (memberId, photoId) => {
    await api.deletePhoto(memberId, photoId, authToken);
    setAllPhotos(prev => ({
      ...prev,
      [memberId]: (prev[memberId] || []).filter(p => p.id !== photoId),
    }));
  }, [authToken]);

  /* ---- Photo tag update ---- */
  const handleUpdateTags = useCallback((memberId, photoId, tags) => {
    setAllPhotos(prev => ({
      ...prev,
      [memberId]: (prev[memberId] || []).map(p => p.id === photoId ? { ...p, tags } : p),
    }));
  }, []);

  /* ---- Avatar upload ---- */
  const handleUploadAvatar = useCallback(async (memberId, file) => {
    const result = await api.uploadAvatar(memberId, file, authToken);
    const src = result.src || URL.createObjectURL(file);
    setAvatars(prev => ({ ...prev, [memberId]: src }));
    if (currentUser && currentUser.id === memberId) {
      setCurrentUser(u => ({ ...u }));
    }
  }, [authToken, currentUser]);

  /* ---- Avatar delete ---- */
  const handleDeleteAvatar = useCallback(async (memberId) => {
    await api.deleteAvatar(memberId, authToken);
    setAvatars(prev => {
      const next = { ...prev };
      if (next[memberId] && next[memberId].startsWith("blob:")) {
        URL.revokeObjectURL(next[memberId]);
      }
      delete next[memberId];
      return next;
    });
  }, [authToken]);

  /* ---- Collage upload ---- */
  const handleCollageUpload = useCallback(async (files) => {
    const newPhotos = await api.uploadCollagePhotos(files, authToken);
    setCollagePhotos(prev => [
      ...newPhotos.map((p, i) => ({
        id: p.id || `up-${Date.now()}-${i}`,
        src: p.src || p.url,
        color: "#444",
        caption: p.caption || `Germany photo`,
        tags: p.tags || [],
        uploadedAt: p.uploadedAt || new Date().toISOString(),
      })),
      ...prev,
    ]);
  }, [authToken]);

  /* ---- Collage delete ---- */
  const handleCollageDelete = useCallback((photoId) => {
    setCollagePhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo?.src?.startsWith("blob:")) URL.revokeObjectURL(photo.src);
      return prev.filter(p => p.id !== photoId);
    });
  }, []);

  /* ---- Post ---- */
  const handlePost = useCallback((data) => {
    if (!currentUser) return;
    const newPost = {
      id: Date.now(),
      memberId: currentUser.id,
      text: data.text,
      image: data.image || null,
      tags: data.tags || [],
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };
    setFeedPosts(prev => [newPost, ...prev]);
  }, [currentUser]);

  /* ---- Delete post ---- */
  const handleDeletePost = useCallback((postId) => {
    setFeedPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  /* ---- Add comment (anyone can comment) ---- */
  const handleAddComment = useCallback((postId, text) => {
    if (!currentUser || !text.trim()) return;
    const comment = {
      id: `${Date.now()}-${Math.random()}`,
      memberId: currentUser.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setFeedPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, comments: [...(Array.isArray(p.comments) ? p.comments : []), comment] }
        : p
    ));
  }, [currentUser]);

  /* ---- Delete comment (comment author OR the photo/post owner) ---- */
  const handleDeleteComment = useCallback((postId, commentId) => {
    if (!currentUser) return;
    setFeedPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const list = Array.isArray(p.comments) ? p.comments : [];
      return {
        ...p,
        comments: list.filter(c =>
          c.id !== commentId || !(c.memberId === currentUser.id || p.memberId === currentUser.id)
        ),
      };
    }));
  }, [currentUser]);

  /* ---- Remove a tag from a post (owner only) ---- */
  const handleRemovePostTag = useCallback((postId, tag) => {
    if (!currentUser) return;
    setFeedPosts(prev => prev.map(p =>
      p.id === postId && p.memberId === currentUser.id
        ? { ...p, tags: (p.tags || []).filter(t => t !== tag) }
        : p
    ));
  }, [currentUser]);

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  const activeMember = activePage !== "feed" ? MEMBERS.find(m => m.id === parseInt(activePage)) : null;
  const groups = [...new Set(MEMBERS.map(m => m.group))];

  return (
    <>
      <div className="topbar">
        <button className="icon-btn mobile-toggle" onClick={() => setMobileNav(true)} aria-label="Menu">
          <Icon.Menu />
        </button>
        <div className="topbar-logo" onClick={() => setActivePage("feed")}>Lets Connect</div>
        <input className="topbar-search" placeholder="Search members…" />
        <div className="topbar-right">
          <button
            className="icon-btn"
            onClick={() => setShowCreds(true)}
            title="View all credentials (admin)"
            style={{ fontSize: 13 }}
          >
            <Icon.Key />
          </button>
          <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
          </button>
          <div className="user-badge" onClick={() => setActivePage(String(currentUser.id))}>
            <Avatar member={currentUser} size="sm" avatarSrc={avatars[currentUser.id]} />
            <span>{currentUser.name.split(" ")[0]}</span>
          </div>
          <button className="btn-outline" onClick={handleLogout}>Sign out</button>
        </div>
      </div>

      {showCreds && <CredentialsTable onClose={() => setShowCreds(false)} />}

      <div className={`mobile-overlay${mobileNav ? " show" : ""}`} onClick={() => setMobileNav(false)} />

      <div className="layout">
        <div className={`sidebar-left${mobileNav ? " open" : ""}`}>
          {groups.map(g => (
            <div key={g} className="sidebar-section">
              <div className="sidebar-label">{g} Group</div>
              {MEMBERS.filter(m => m.group === g).map(m => {
                const status = formatOnlineStatus(onlineStatus[m.id] || null);
                return (
                  <div
                    key={m.id}
                    className={`member-row${activePage === String(m.id) ? " active" : ""}`}
                    onClick={() => { setActivePage(String(m.id)); setMobileNav(false); }}
                  >
                    <Avatar member={m} size="md" avatarSrc={avatars[m.id]} />
                    <div className="member-info">
                      <div className="member-name">{m.name}</div>
                      <div className="member-role">{m.role}</div>
                      <div className="member-status">
                        <span className={status.online ? "online-dot" : "offline-dot"} />
                        {status.online ? "Online" : (onlineStatus[m.id] ? `Last seen ${status.label}` : "Never logged in")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {activePage === "feed"
          ? <HomeFeed
              collagePhotos={collagePhotos}
              onCollageUpload={handleCollageUpload}
              onCollageDelete={handleCollageDelete}
              avatars={avatars}
              currentUser={currentUser}
              feedPosts={feedPosts}
              onPost={handlePost}
              onDeletePost={handleDeletePost}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onRemoveTag={handleRemovePostTag}
            />
          : activeMember
            ? <ProfilePage
                member={activeMember}
                currentUser={currentUser}
                allPhotos={allPhotos}
                onUpload={handleProfileUpload}
                onDeletePhoto={handleDeletePhoto}
                onUpdateTags={handleUpdateTags}
                avatars={avatars}
                onUploadAvatar={handleUploadAvatar}
                onDeleteAvatar={handleDeleteAvatar}
              />
            : <HomeFeed
                collagePhotos={collagePhotos}
                onCollageUpload={handleCollageUpload}
                onCollageDelete={handleCollageDelete}
                avatars={avatars}
                currentUser={currentUser}
                feedPosts={feedPosts}
                onPost={handlePost}
                onDeletePost={handleDeletePost}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onRemoveTag={handleRemovePostTag}
              />
        }

        <div className="sidebar-right">
          <div className="section-title" style={{ marginBottom: 10 }}>Network Stats</div>
          <div className="featured-card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, fontFamily: "Syne, sans-serif" }}>Lets Connect</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>Germany Business Trip 2025</div>
            <div className="stat-grid">
              <div className="stat-item"><div className="stat-num">17</div><div className="stat-label">Members</div></div>
              <div className="stat-item"><div className="stat-num">4</div><div className="stat-label">Cities</div></div>
              <div className="stat-item"><div className="stat-num">4</div><div className="stat-label">Groups</div></div>
              <div className="stat-item"><div className="stat-num">{feedPosts.length}</div><div className="stat-label">Posts</div></div>
            </div>
          </div>
          <div className="section-title" style={{ marginBottom: 10 }}>All Members</div>
          {MEMBERS.map(m => {
            const status = formatOnlineStatus(onlineStatus[m.id] || null);
            return (
              <div key={m.id} className="member-row" onClick={() => setActivePage(String(m.id))}>
                <Avatar member={m} size="sm" avatarSrc={avatars[m.id]} />
                <div className="member-info">
                  <div className="member-name">{m.name}</div>
                  <div className="member-role">{m.company}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                  <span className="group-tag">{m.group}</span>
                  <span style={{ fontSize: 9, color: status.online ? "var(--success)" : "var(--text2)" }}>
                    {status.online ? "● Online" : (onlineStatus[m.id] ? status.label : "—")}
                  </span>
                </div>
              </div>
            );
          })}
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