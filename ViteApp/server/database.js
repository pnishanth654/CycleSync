const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.NODE_ENV === 'production' ? '/data/cyclesync.db' : path.resolve(__dirname, 'cyclesync.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB connect err', err);
  else console.log('Connected to CycleSync SQLite database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    dob TEXT,
    email TEXT UNIQUE,
    mobile TEXT,
    password_hash TEXT,
    reminders TEXT,
    created_at TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    date TEXT,
    flowLevel INTEGER,
    painLevel INTEGER,
    moodLevel INTEGER,
    symptoms TEXT,
    notes TEXT,
    bloodColor TEXT,
    clotting INTEGER,
    energyLevel INTEGER,
    discharge TEXT,
    saved_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

module.exports = db;
