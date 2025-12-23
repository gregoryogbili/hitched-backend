// store.js
import fs from "fs";

const DATA_DIR = "./data";
const USERS = `${DATA_DIR}/users.json`;
const PROFILES = `${DATA_DIR}/profiles.json`;
const MATCHES = `${DATA_DIR}/matches.json`;

function ensure(file, fallback) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
}

export function initStore() {
  ensure(USERS, []);
  ensure(PROFILES, {});
  ensure(MATCHES, []);
}

/* USERS */
export function saveUser(user) {
  const users = JSON.parse(fs.readFileSync(USERS));
  users.push(user);
  fs.writeFileSync(USERS, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email) {
  const users = JSON.parse(fs.readFileSync(USERS));
  return users.find(u => u.email === email.toLowerCase());
}

/* PROFILES */
export function saveProfile(user_id, profile) {
  const profiles = JSON.parse(fs.readFileSync(PROFILES));
  profiles[user_id] = profile;
  fs.writeFileSync(PROFILES, JSON.stringify(profiles, null, 2));
}

export function getProfile(user_id) {
  const profiles = JSON.parse(fs.readFileSync(PROFILES));
  return profiles[user_id] || null;
}

export function getAllProfiles() {
  const profiles = JSON.parse(fs.readFileSync(PROFILES));
  return Object.values(profiles);
}

/* MATCHES */
export function saveMatch(match) {
  const matches = JSON.parse(fs.readFileSync(MATCHES));
  matches.push(match);
  fs.writeFileSync(MATCHES, JSON.stringify(matches, null, 2));
}

export function getMatches() {
  return JSON.parse(fs.readFileSync(MATCHES));
}
