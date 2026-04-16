import Database from 'better-sqlite3';
import path from 'path';

let db;

function initDb() {
  const dbPath = path.join(process.cwd(), 'euroscore3.db');
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scoreboards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      point_system TEXT NOT NULL,
      vote_mode TEXT NOT NULL DEFAULT 'manual',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      scoreboard_id TEXT NOT NULL,
      country TEXT NOT NULL,
      artist TEXT NOT NULL,
      song TEXT NOT NULL,
      FOREIGN KEY(scoreboard_id) REFERENCES scoreboards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS juries (
      id TEXT PRIMARY KEY,
      scoreboard_id TEXT NOT NULL,
      name TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      has_voted INTEGER DEFAULT 0,
      FOREIGN KEY(scoreboard_id) REFERENCES scoreboards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      jury_id TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      FOREIGN KEY(jury_id) REFERENCES juries(id) ON DELETE CASCADE,
      FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE
    );
  `);

  const scoreboardColumns = db.prepare("PRAGMA table_info(scoreboards)").all();
  const hasVoteMode = scoreboardColumns.some((col) => col.name === 'vote_mode');
  if (!hasVoteMode) {
    db.exec("ALTER TABLE scoreboards ADD COLUMN vote_mode TEXT NOT NULL DEFAULT 'manual'");
  }
}

if (!db) {
  initDb();
}

export default db;
