// server_sqlite.js — SQLite version (keeps same endpoints your HTML uses)
import "dotenv/config";
import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3007;

/* =========================
   __dirname (ESM safe)
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   Extra table for reliable match-user lookups
========================= */
db.exec(`
CREATE TABLE IF NOT EXISTS match_users (
  match_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (match_id, user_id)
);
`);

// Backfill match_users from matches.users_json (safe, idempotent)
const backfill = db.prepare(`SELECT match_id, users_json FROM matches`);
const upsertMU = db.prepare(`INSERT OR IGNORE INTO match_users(match_id, user_id) VALUES (?,?)`);
for (const row of backfill.all()) {
  try {
    const arr = JSON.parse(row.users_json || "[]");
    if (Array.isArray(arr)) {
      for (const uid of arr) {
        if (uid) upsertMU.run(row.match_id, uid);
      }
    }
  } catch {}
}

/* =========================
   JWT Security+ (expiry + logout + rotation)
========================= */
const ACCESS_TOKEN_EXPIRY = "15m";

function getSecret() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not set in .env");
  return process.env.JWT_SECRET;
}

function signAccessToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

const qBlacklisted = db.prepare(`SELECT token FROM token_blacklist WHERE token = ? LIMIT 1`);
const insBlacklisted = db.prepare(`INSERT OR REPLACE INTO token_blacklist(token, revoked_at) VALUES (?,?)`);

function requireUser(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Auth required" });
  }

  if (qBlacklisted.get(token)) {
    return res.status(401).json({ error: "Token revoked" });
  }

  try {
    req.user = jwt.verify(token, getSecret());
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* =========================
   Health
========================= */
app.get("/health", (req, res) => {
  res.json({ status: "ok", storage: "sqlite" });
});

/* =========================
   Auth (bcrypt + JWT)
========================= */
const qUserByEmail = db.prepare(`SELECT user_id, email, password FROM users WHERE email = ? LIMIT 1`);
const insUser = db.prepare(`INSERT INTO users(user_id, email, password, created_at) VALUES (?,?,?,?)`);

app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const normalizedEmail = String(email).toLowerCase();
  const existing = qUserByEmail.get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "User exists" });
  }

  const hashedPassword = await bcrypt.hash(String(password), 10);
  const user_id = crypto.randomUUID();

  insUser.run(user_id, normalizedEmail, hashedPassword, new Date().toISOString());

  return res.json({
    message: "Registered",
    access_token: signAccessToken({ user_id, email: normalizedEmail })
  });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const normalizedEmail = String(email).toLowerCase();
  const user = qUserByEmail.get(normalizedEmail);

  if (!user) return res.status(401).json({ error: "Invalid login" });

  const ok = await bcrypt.compare(String(password), user.password);
  if (!ok) return res.status(401).json({ error: "Invalid login" });

  return res.json({
    message: "Logged in",
    access_token: signAccessToken({ user_id: user.user_id, email: user.email })
  });
});

app.post("/auth/logout", requireUser, (req, res) => {
  insBlacklisted.run(req.token, new Date().toISOString());
  res.json({ message: "Logged out" });
});

app.post("/auth/refresh", requireUser, (req, res) => {
  // Rotate token: revoke old, issue new
  insBlacklisted.run(req.token, new Date().toISOString());

  const newToken = signAccessToken({
    user_id: req.user.user_id,
    email: req.user.email
  });

  res.json({ access_token: newToken });
});

/* =========================
   Profile
========================= */
const qProfile = db.prepare(`SELECT data FROM profiles WHERE user_id = ? LIMIT 1`);
const upsertProfile = db.prepare(`INSERT OR REPLACE INTO profiles(user_id, email, data, updated_at) VALUES (?,?,?,?)`);

app.post("/profile/me", requireUser, (req, res) => {
  const p = normalizeProfile(req.body || {}, req.user);

  const stored = {
    ...p,
    user_id: req.user.user_id,
    email: req.user.email,
    updated_at: new Date().toISOString()
  };

  upsertProfile.run(req.user.user_id, req.user.email, JSON.stringify(stored), stored.updated_at);

  res.json({ message: "Profile saved", profile: stored });
});

app.get("/profile/me", requireUser, (req, res) => {
  const row = qProfile.get(req.user.user_id);
  res.json({ profile: row ? JSON.parse(row.data) : null });
});

/* =========================
   Match flow
========================= */
const insMatch = db.prepare(`
INSERT INTO matches(match_id, users_json, invited_email, status, created_at, invited_at, accepted_at, compatibility_history_json)
VALUES (?,?,?,?,?,?,?,?)
`);
const qLatestActiveMatchForUser = db.prepare(`
SELECT m.* FROM matches m
JOIN match_users mu ON mu.match_id = m.match_id
WHERE mu.user_id = ?
AND m.status != 'matched'
ORDER BY m.created_at DESC
LIMIT 1
`);
const qInviteForEmail = db.prepare(`
SELECT * FROM matches
WHERE status = 'invite_sent'
AND lower(ifnull(invited_email,'')) = lower(?)
ORDER BY invited_at DESC
LIMIT 1
`);
const updMatchInvite = db.prepare(`
UPDATE matches SET invited_email=?, status='invite_sent', invited_at=?
WHERE match_id = ?
`);
const updMatchAccept = db.prepare(`
UPDATE matches SET users_json=?, status='matched', accepted_at=?
WHERE match_id = ?
`);
const delMatchById = db.prepare(`DELETE FROM matches WHERE match_id = ?`);
const delMatchUsers = db.prepare(`DELETE FROM match_users WHERE match_id = ?`);
const qMyMatches = db.prepare(`
SELECT m.* FROM matches m
LEFT JOIN match_users mu ON mu.match_id = m.match_id AND mu.user_id = ?
WHERE mu.user_id IS NOT NULL
   OR lower(ifnull(m.invited_email,'')) = lower(?)
ORDER BY m.created_at DESC
`);

app.post("/match/create", requireUser, (req, res) => {
  const match_id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const users = [req.user.user_id];

  insMatch.run(
    match_id,
    JSON.stringify(users),
    null,
    "created",
    created_at,
    null,
    null,
    null
  );

  upsertMU.run(match_id, req.user.user_id);

  res.json({
    message: "Match created",
    match: {
      match_id,
      users,
      invited_email: null,
      status: "created",
      created_at
    }
  });
});

app.post("/match/invite", requireUser, (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Invite email required" });

  const match = qLatestActiveMatchForUser.get(req.user.user_id);
  if (!match) return res.status(404).json({ error: "No active match to invite" });

  const invited_email = String(email).toLowerCase();
  const invited_at = new Date().toISOString();

  updMatchInvite.run(invited_email, invited_at, match.match_id);

  const updated = {
    ...matchRowToObj(match),
    invited_email,
    status: "invite_sent",
    invited_at
  };

  res.json({ message: "Invite sent", match: updated });
});

app.post("/match/accept", requireUser, (req, res) => {
  const myEmail = String(req.user.email).toLowerCase();
  const match = qInviteForEmail.get(myEmail);

  if (!match) return res.status(404).json({ error: "No invite found for you" });

  let users = [];
  try { users = JSON.parse(match.users_json || "[]"); } catch { users = []; }
  if (!Array.isArray(users)) users = [];

  if (!users.includes(req.user.user_id)) {
    users.push(req.user.user_id);
    upsertMU.run(match.match_id, req.user.user_id);
  }

  const accepted_at = new Date().toISOString();
  updMatchAccept.run(JSON.stringify(users), accepted_at, match.match_id);

  const updated = {
    ...matchRowToObj(match),
    users,
    status: "matched",
    accepted_at
  };

  res.json({ message: "Invite accepted", match: updated });
});

app.post("/match/cancel", requireUser, (req, res) => {
  const match = qLatestActiveMatchForUser.get(req.user.user_id);
  if (!match) return res.status(404).json({ error: "No cancellable match found" });

  // Only cancel non-matched
  if (match.status === "matched") {
    return res.status(400).json({ error: "Cannot cancel a matched relationship" });
  }

  delMatchUsers.run(match.match_id);
  delMatchById.run(match.match_id);

  res.json({ message: "Match cancelled", match: matchRowToObj(match) });
});

app.get("/me/matches", requireUser, (req, res) => {
  const myEmail = String(req.user.email).toLowerCase();
  const rows = qMyMatches.all(req.user.user_id, myEmail);
  res.json({ matches: rows.map(matchRowToObj) });
});

/* =========================
   Compatibility (persist history)
========================= */
const qProfileData = db.prepare(`SELECT data FROM profiles WHERE user_id = ? LIMIT 1`);
const qMatchedBetween = db.prepare(`
SELECT m.* FROM matches m
JOIN match_users a ON a.match_id = m.match_id AND a.user_id = ?
JOIN match_users b ON b.match_id = m.match_id AND b.user_id = ?
WHERE m.status = 'matched'
ORDER BY m.accepted_at DESC
LIMIT 1
`);
const updHistory = db.prepare(`UPDATE matches SET compatibility_history_json=? WHERE match_id = ?`);

app.post("/match/evaluate/:otherUserId", requireUser, (req, res) => {
  const otherUserId = req.params.otherUserId;

  const meRow = qProfileData.get(req.user.user_id);
  const otherRow = qProfileData.get(otherUserId);

  if (!meRow || !otherRow) {
    return res.status(400).json({ error: "Profiles incomplete" });
  }

  const match = qMatchedBetween.get(req.user.user_id, otherUserId);
  if (!match) {
    return res.status(404).json({ error: "No matched relationship found" });
  }

  const me = JSON.parse(meRow.data);
  const other = JSON.parse(otherRow.data);

  const result = evaluateCompatibility(me, other);

  let history = [];
  try { history = JSON.parse(match.compatibility_history_json || "[]"); } catch { history = []; }
  if (!Array.isArray(history)) history = [];

  const snapshot = {
    evaluated_at: new Date().toISOString(),
    score: result.score,
    grade: result.grade,
    compatible: result.compatible,
    notes: result.notes || (Array.isArray(result.reasons) ? result.reasons.join(" | ") : "")
  };

  history.push(snapshot);
  updHistory.run(JSON.stringify(history), match.match_id);

  res.json({ ...result, history_count: history.length });
});

/* =========================
   Helpers
========================= */
function matchRowToObj(row) {
  let users = [];
  let history = [];
  try { users = JSON.parse(row.users_json || "[]"); } catch { users = []; }
  try { history = JSON.parse(row.compatibility_history_json || "[]"); } catch { history = []; }

  return {
    match_id: row.match_id,
    users: Array.isArray(users) ? users : [],
    invited_email: row.invited_email ?? null,
    status: row.status,
    created_at: row.created_at,
    invited_at: row.invited_at ?? null,
    accepted_at: row.accepted_at ?? null,
    compatibility_history: Array.isArray(history) ? history : []
  };
}

/* =========================
   Compatibility Engine (same logic as your JSON version)
========================= */
function evaluateCompatibility(a, b) {
  const required = ["gender", "seeking_gender", "age", "location", "intent"];
  for (const k of required) {
    if (a[k] == null || b[k] == null || a[k] === "" || b[k] === "") {
      return reject("One or both profiles missing required fields");
    }
  }

  const allowedGenders = new Set(["male", "female"]);
  if (!allowedGenders.has(a.gender) || !allowedGenders.has(b.gender)) {
    return reject("Only heterosexual matching is supported (male/female)");
  }
  if (a.gender === b.gender) {
    return reject("Only heterosexual matching is supported (opposite gender required)");
  }

  if (a.seeking_gender !== b.gender || b.seeking_gender !== a.gender) {
    return reject("Seeking preference mismatch (not mutually compatible)");
  }

  if (String(a.intent) !== String(b.intent)) {
    return reject("Different relationship intent");
  }

  const aMin = numOr(a.age_range_min, 18);
  const aMax = numOr(a.age_range_max, 99);
  const bMin = numOr(b.age_range_min, 18);
  const bMax = numOr(b.age_range_max, 99);

  const reasons = [];
  if (b.age < aMin || b.age > aMax) reasons.push("Other user outside your age range");
  if (a.age < bMin || a.age > bMax) reasons.push("You are outside the other user's age range");
  if (reasons.length) return reject(reasons.join(" | "));

  const d = distanceKm(a.location, b.location);
  const aDist = numOr(a.max_distance_km, 50);
  const bDist = numOr(b.max_distance_km, 50);
  const maxAllowed = Math.min(aDist, bDist);
  if (d > maxAllowed) {
    return reject(`Distance too far (${d}km > ${maxAllowed}km)`);
  }

  let score = 0;
  score += scoreAge(a.age, b.age);                 // 15
  score += scoreDistance(d);                       // 15
  score += 20;                                     // intent (gated)
  score += scoreOverlap(a.values, b.values, 20);   // 20
  score += scoreOverlap(a.lifestyle, b.lifestyle, 15); // 15
  score += scoreDealbreakers(a, b);                // 15

  return {
    compatible: score >= 60,
    score,
    grade: grade(score),
    distance_km: d,
    notes: explain(score)
  };

  function reject(reason) {
    return { compatible: false, score: 0, grade: "Rejected", reasons: [reason] };
  }
}

function explain(score) {
  if (score >= 85) return "Excellent match: strong alignment across major factors.";
  if (score >= 70) return "Strong match: good alignment with minor differences.";
  if (score >= 60) return "Moderate match: workable, but discuss expectations early.";
  return "Weak match: proceed carefully; major differences likely.";
}

function scoreAge(a, b) {
  const diff = Math.abs(a - b);
  if (diff <= 2) return 15;
  if (diff <= 5) return 10;
  if (diff <= 8) return 5;
  return 0;
}

function scoreDistance(d) {
  if (d <= 5) return 15;
  if (d <= 15) return 10;
  if (d <= 30) return 5;
  return 0;
}

function scoreOverlap(a = [], b = [], max) {
  const A = Array.isArray(a) ? a : [];
  const B = Array.isArray(b) ? b : [];
  if (A.length === 0 || B.length === 0) return 0;
  const setB = new Set(B.map(x => String(x).toLowerCase()));
  const overlap = A.map(x => String(x).toLowerCase()).filter(x => setB.has(x)).length;
  const denom = Math.max(A.length, B.length);
  return Math.round((overlap / denom) * max);
}

function scoreDealbreakers(a, b) {
  const aDeal = Array.isArray(a.dealbreakers) ? a.dealbreakers : [];
  const bDeal = Array.isArray(b.dealbreakers) ? b.dealbreakers : [];
  for (const k of aDeal) if (b[k] === true) return 0;
  for (const k of bDeal) if (a[k] === true) return 0;
  return 15;
}

function grade(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 60) return "Moderate";
  return "Weak";
}

function numOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Placeholder distance:
// - If location missing: treat as 0 (neutral) for MVP
// - Same string: 0km
// - Different: 30km
function distanceKm(locA, locB) {
  const a = String(locA || "").trim().toLowerCase();
  const b = String(locB || "").trim().toLowerCase();
  if (!a || !b) return 0;
  if (a === b) return 0;
  return 30;
}

/* =========================
   Profile normalization
========================= */
function normalizeProfile(input, user) {
  const p = { ...input };

  if (p.gender) p.gender = String(p.gender).toLowerCase();
  if (p.seeking_gender) p.seeking_gender = String(p.seeking_gender).toLowerCase();

  if (!p.seeking_gender && (p.gender === "male" || p.gender === "female")) {
    p.seeking_gender = p.gender === "male" ? "female" : "male";
  }

  if (p.age != null) p.age = Number(p.age);
  if (p.intent) p.intent = String(p.intent).toLowerCase();

  p.values = toArray(p.values);
  p.lifestyle = toArray(p.lifestyle);
  p.dealbreakers = toArray(p.dealbreakers);

  if (p.age_range_min == null) p.age_range_min = 18;
  if (p.age_range_max == null) p.age_range_max = 99;
  if (p.max_distance_km == null) p.max_distance_km = 50;

  if (p.location) p.location = String(p.location);

  p.email = user.email;
  p.user_id = user.user_id;

  return p;
}

function toArray(v) {
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}

/* =========================
   Start
========================= */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`UI: http://localhost:${PORT}/index.html`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Storage: SQLite`);
});
