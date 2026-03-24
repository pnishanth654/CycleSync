const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.on('connect', () => console.log('Connected to Neon PostgreSQL database.'));
pool.on('error', (err) => console.error('PG error:', err));

// Create tables natively for Postgres
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        dob TEXT,
        email TEXT UNIQUE,
        mobile TEXT,
        password_hash TEXT,
        reminders TEXT,
        created_at TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
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
        saved_at TEXT
      )
    `);
    console.log("Postgres tables verified.");
  } catch (err) {
    console.error("Init err:", err);
  }
}

initDB();

// Helper to convert SQLite syntax to Postgres syntax
function convertQuery(sql) {
  if (sql.includes("INSERT OR REPLACE INTO logs")) {
    return `INSERT INTO logs (id, user_id, date, flowLevel, painLevel, moodLevel, symptoms, notes, bloodColor, clotting, energyLevel, discharge, saved_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO UPDATE SET 
            "flowLevel"=EXCLUDED."flowLevel", "painLevel"=EXCLUDED."painLevel", "moodLevel"=EXCLUDED."moodLevel", 
            symptoms=EXCLUDED.symptoms, notes=EXCLUDED.notes, "bloodColor"=EXCLUDED."bloodColor", 
            clotting=EXCLUDED.clotting, "energyLevel"=EXCLUDED."energyLevel", discharge=EXCLUDED.discharge, 
            saved_at=EXCLUDED.saved_at`;
  }
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

const db = {
  get: async (sql, params = [], cb) => {
    if (typeof params === 'function') { cb = params; params = []; }
    try { 
      const res = await pool.query(convertQuery(sql), params); 
      if (cb) cb(null, res.rows[0]); 
    } catch(e) { console.error("DB GET ERR:", e); if(cb) cb(e, null); }
  },
  all: async (sql, params = [], cb) => {
    if (typeof params === 'function') { cb = params; params = []; }
    try { 
      const res = await pool.query(convertQuery(sql), params); 
      if (cb) cb(null, res.rows); 
    } catch(e) { console.error("DB ALL ERR:", e); if(cb) cb(e, null); }
  },
  run: async (sql, params = [], cb) => {
    if (typeof params === 'function') { cb = params; params = []; }
    try { 
      await pool.query(convertQuery(sql), params); 
      if (cb) cb(null); 
    } catch(e) { console.error("DB RUN ERR:", e); if(cb) cb(e); }
  }
};

module.exports = db;
