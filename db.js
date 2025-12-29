// db.js — SQLite engine + schema (persistent, Render-safe)
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

/* =========================
   Persistent DB location
========================= */
const DATA_DIR = "./data";
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "hitched.sqlite");

/* =========================
   Open database
========================= */
export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

/* =========================
   Schema
========================= */
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  match_id TEXT PRIMARY KEY,
  users_json TEXT,
  invited_email TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  invited_at TEXT,
  accepted_at TEXT,
  compatibility_history_json TEXT
);

CREATE TABLE IF NOT EXISTS match_users (
  match_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (match_id, user_id)
);

CREATE TABLE IF NOT EXISTS token_blacklist (
  token TEXT PRIMARY KEY,
  revoked_at TEXT NOT NULL
);
`);
