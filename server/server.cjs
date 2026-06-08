/**
 * ConnectNet — Minimal VPS backend
 * Stack: Node + Express + JWT + multer (file uploads) + lowdb (file DB, swap for Postgres later)
 *
 * Install:
 *   npm init -y
 *   npm install express cors bcrypt jsonwebtoken multer lowdb dotenv
 *
 * Run:
 *   node server.js
 *
 * Production:
 *   pm2 start server.js --name connectnet
 *   nginx reverse-proxy → https://your-vps-domain.com/api
 */

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

// ── Simple JSON DB (replace with Postgres in production) ────────────────────
const dbPath = path.join(__dirname, "db.json");
const readDB = () => {
  if (!fs.existsSync(dbPath)) {
    const seed = { members: [], photos: [], collage: [] };
    fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(dbPath));
};
const writeDB = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

// ── Multer storage ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Auth middleware ─────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ── Routes ──────────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  const { memberId, password } = req.body;
  const db = readDB();
  const member = db.members.find(m => m.id === parseInt(memberId));
  if (!member) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, member.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: member.id, name: member.name }, JWT_SECRET, { expiresIn: "7d" });
  const { passwordHash, ...safe } = member;
  res.json({ token, user: safe });
});

app.get("/api/members", (_, res) => {
  const db = readDB();
  res.json(db.members.map(({ passwordHash, ...m }) => m));
});

app.get("/api/members/:id/photos", (req, res) => {
  const db = readDB();
  res.json(db.photos.filter(p => p.memberId === parseInt(req.params.id)));
});

app.post("/api/members/:id/photos", auth, upload.array("photos", 20), (req, res) => {
  const db = readDB();
  const memberId = parseInt(req.params.id);
  if (req.user.id !== memberId) return res.status(403).json({ error: "Forbidden" });
  const newPhotos = req.files.map(f => ({
    id: Date.now() + Math.random(),
    memberId,
    src: `/uploads/${f.filename}`,
    caption: f.originalname,
    uploadedAt: new Date().toISOString(),
  }));
  db.photos.push(...newPhotos);
  writeDB(db);
  res.json(newPhotos);
});

app.get("/api/collage/germany-trip", (_, res) => {
  const db = readDB();
  res.json(db.collage || []);
});

app.post("/api/collage/germany-trip", auth, upload.array("photos", 20), (req, res) => {
  const db = readDB();
  const newPhotos = req.files.map(f => ({
    id: `${Date.now()}-${Math.random()}`,
    src: `/uploads/${f.filename}`,
    caption: f.originalname,
    uploadedBy: req.user.id,
    uploadedAt: new Date().toISOString(),
  }));
  db.collage = [...newPhotos, ...(db.collage || [])];
  writeDB(db);
  res.json(newPhotos);
});

// ── Seed members script (run once) ──────────────────────────────────────────
app.post("/api/admin/seed", async (req, res) => {
  if (req.body.secret !== process.env.SEED_SECRET) return res.status(403).end();
  const seed = require("./seed-members.json");
  const members = await Promise.all(seed.map(async m => ({
    ...m,
    passwordHash: await bcrypt.hash(m.password, 10),
  })));
  writeDB({ members, photos: [], collage: [] });
  res.json({ ok: true, count: members.length });
});

app.listen(PORT, () => console.log(`ConnectNet API running on :${PORT}`));
