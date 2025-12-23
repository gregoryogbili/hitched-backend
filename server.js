// server.js
import "dotenv/config";
import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());

/* =========================
   In-memory stores
========================= */
const users = [];
const profiles = [];
const matches = [];

/* =========================
   JWT helpers
========================= */
function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set");
  }
  return process.env.JWT_SECRET;
}

function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

function requireUser(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Auth required" });
  }

  try {
    req.user = jwt.verify(token, getSecret());
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* =========================
   Health
========================= */
app.get("/", (req, res) => {
  res.json({ status: "Hitched running" });
});

/* =========================
   Auth
========================= */
app.post("/auth/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  if (users.find(u => u.email === email.toLowerCase())) {
    return res.status(409).json({ error: "Email exists" });
  }

  const user = {
    user_id: crypto.randomUUID(),
    email: email.toLowerCase(),
    password
  };

  users.push(user);

  res.json({
    message: "Registered",
    token: signToken({ user_id: user.user_id, email: user.email })
  });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(
    u => u.email === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid login" });
  }

  res.json({
    message: "Logged in",
    token: signToken({ user_id: user.user_id, email: user.email })
  });
});

/* =========================
   Profile
========================= */
app.post("/profile/me", requireUser, (req, res) => {
  const profile = {
    user_id: req.user.user_id,
    data: req.body,
    updated_at: new Date().toISOString()
  };

  const idx = profiles.findIndex(p => p.user_id === req.user.user_id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);

  res.json({ message: "Profile saved", profile });
});

/* =========================
   Match create
========================= */
app.post("/match/create", requireUser, (req, res) => {
  const profile = profiles.find(p => p.user_id === req.user.user_id);
  if (!profile) {
    return res.status(400).json({ error: "Create profile first" });
  }

  const match = {
    match_id: crypto.randomUUID(),
    users: [req.user.user_id],
    status: "matched",
    created_at: new Date().toISOString()
  };

  matches.push(match);
  res.json({ message: "Match created", match });
});

/* =========================
   Match invite
========================= */
app.post("/match/invite", requireUser, (req, res) => {
  const match = matches.at(-1);

  if (!match || !match.users.includes(req.user.user_id)) {
    return res.status(403).json({ error: "No active match" });
  }

  match.status = "invite_sent";
  match.invited_at = new Date().toISOString();

  res.json({ message: "Invite sent", match });
});

/* =========================
   Match accept ✅
========================= */
app.post("/match/accept", requireUser, (req, res) => {
  const match = matches.at(-1);

  if (!match || !match.users.includes(req.user.user_id)) {
    return res.status(403).json({ error: "No active match" });
  }

  match.status = "invite_accepted";
  match.accepted_at = new Date().toISOString();

  res.json({ message: "Invite accepted", match });
});

/* =========================
   Start server
========================= */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
