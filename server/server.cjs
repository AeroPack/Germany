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
const DATA_DIR = process.env.DATA_DIR || "/app/data";
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_PATH = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api|\/uploads).*$/, (_, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ── Simple JSON DB ──────────────────────────────────────────────────────────
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    const seed = { members: [], photos: [], collage: [], posts: [], comments: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(DB_PATH));
};
const writeDB = (db) => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

// ── Auto-seed on first start ────────────────────────────────────────────────
const autoSeed = async () => {
  if (fs.existsSync(DB_PATH)) return;
  const seedPath = path.join(__dirname, "seed-members.json");
  if (!fs.existsSync(seedPath)) return;
  const raw = JSON.parse(fs.readFileSync(seedPath));
  const members = await Promise.all(raw.map(async m => ({
    ...m,
    passwordHash: await bcrypt.hash(m.password, 10),
  })));
  const db = { members, photos: [], collage: [], posts: [], comments: [] };
  writeDB(db);
  console.log(`Auto-seeded ${members.length} members`);
};
autoSeed().catch(console.error);

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

const stripPassword = (member) => {
  const { passwordHash, password, ...rest } = member;
  return rest;
};

// ── Auth routes ─────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  const { memberId, password } = req.body;
  const db = readDB();
  const member = db.members.find(m => m.id === parseInt(memberId));
  if (!member) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, member.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: member.id, name: member.name }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: stripPassword(member) });
});

// ── Member routes ───────────────────────────────────────────────────────────
app.get("/api/members", (_, res) => {
  const db = readDB();
  res.json(db.members.map(stripPassword));
});

// ── Photo routes ────────────────────────────────────────────────────────────
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

app.delete("/api/members/:id/photos/:photoId", auth, (req, res) => {
  const db = readDB();
  const memberId = parseInt(req.params.id);
  const photoId = parseFloat(req.params.photoId);
  if (req.user.id !== memberId) return res.status(403).json({ error: "Forbidden" });
  const idx = db.photos.findIndex(p => p.id === photoId && p.memberId === memberId);
  if (idx === -1) return res.status(404).json({ error: "Photo not found" });
  const [photo] = db.photos.splice(idx, 1);
  const filePath = path.join(UPLOAD_DIR, path.basename(photo.src));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  writeDB(db);
  res.json({ ok: true });
});

// ── Collage routes ──────────────────────────────────────────────────────────
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

// ── Post routes ─────────────────────────────────────────────────────────────
app.post("/api/posts", auth, upload.array("images", 10), (req, res) => {
  const db = readDB();
  const member = db.members.find(m => m.id === req.user.id);
  if (!member) return res.status(404).json({ error: "Member not found" });
  const post = {
    id: `${Date.now()}-${Math.random()}`,
    authorId: req.user.id,
    text: req.body.text || "",
    images: (req.files || []).map(f => `/uploads/${f.filename}`),
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };
  db.posts.unshift(post);
  writeDB(db);
  res.json({ ...post, author: stripPassword(member) });
});

app.get("/api/posts", (req, res) => {
  const db = readDB();
  const posts = db.posts.map(p => {
    const author = db.members.find(m => m.id === p.authorId);
    const postComments = (db.comments || []).filter(c => c.postId === p.id);
    return { ...p, author: author ? stripPassword(author) : null, commentCount: postComments.length };
  });
  res.json(posts);
});

app.delete("/api/posts/:id", auth, (req, res) => {
  const db = readDB();
  const idx = db.posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Post not found" });
  if (db.posts[idx].authorId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  const [post] = db.posts.splice(idx, 1);
  post.images.forEach(img => {
    const filePath = path.join(UPLOAD_DIR, path.basename(img));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
  db.comments = (db.comments || []).filter(c => c.postId !== post.id);
  writeDB(db);
  res.json({ ok: true });
});

app.post("/api/posts/:id/like", auth, (req, res) => {
  const db = readDB();
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const userId = req.user.id;
  const alreadyLiked = post.likedBy.includes(userId);
  if (alreadyLiked) {
    post.likedBy = post.likedBy.filter(id => id !== userId);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy.push(userId);
    post.likes = (post.likes || 0) + 1;
  }
  writeDB(db);
  res.json({ likes: post.likes, likedBy: post.likedBy, liked: !alreadyLiked });
});

// ── Comment routes ──────────────────────────────────────────────────────────
app.post("/api/posts/:id/comments", auth, (req, res) => {
  const db = readDB();
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const member = db.members.find(m => m.id === req.user.id);
  if (!member) return res.status(404).json({ error: "Member not found" });
  const comment = {
    id: `${Date.now()}-${Math.random()}`,
    postId: req.params.id,
    authorId: req.user.id,
    text: req.body.text || "",
    createdAt: new Date().toISOString(),
  };
  if (!db.comments) db.comments = [];
  db.comments.push(comment);
  writeDB(db);
  res.json({ ...comment, author: stripPassword(member) });
});

app.get("/api/posts/:id/comments", (req, res) => {
  const db = readDB();
  const comments = (db.comments || []).filter(c => c.postId === req.params.id).map(c => {
    const author = db.members.find(m => m.id === c.authorId);
    return { ...c, author: author ? stripPassword(author) : null };
  });
  res.json(comments);
});

// ── Seed members (admin only, preserves existing data) ──────────────────────
app.post("/api/admin/seed", async (req, res) => {
  if (req.body.secret !== process.env.SEED_SECRET) return res.status(403).end();
  const seedPath = path.join(__dirname, "seed-members.json");
  if (!fs.existsSync(seedPath)) return res.status(404).json({ error: "seed-members.json not found" });
  const raw = JSON.parse(fs.readFileSync(seedPath));
  const newMembers = await Promise.all(raw.map(async m => ({
    ...m,
    passwordHash: await bcrypt.hash(m.password, 10),
  })));
  const db = readDB();
  db.members = newMembers;
  writeDB(db);
  res.json({ ok: true, count: newMembers.length });
});

app.listen(PORT, () => console.log(`ConnectNet API running on :${PORT}`));
