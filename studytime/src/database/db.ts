import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto'

export type User = { id: number; name: string; email: string };

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Abre o banco uma única vez e reaproveita
export function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('studytime.db');
  return dbPromise;
}

// Cria as tabelas se ainda não existirem
export async function initDb() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id INTEGER NOT NULL REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notification_id TEXT,
      title TEXT NOT NULL,
      sent INTEGER NOT NULL DEFAULT 0,
      scheduled_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      data_entrega TEXT NOT NULL,            -- ISO: 2026-11-03T14:00
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'Média'
        CHECK (priority IN ('Alta', 'Média', 'Baixa')),
      reminder INTEGER NOT NULL DEFAULT 0,   -- 0 ou 1
      completed INTEGER NOT NULL DEFAULT 0,  -- 0 ou 1
      url_image TEXT,                        -- JSON de URLs
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      notifications_id INTEGER REFERENCES notifications(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activities_user_date
      ON activities (user_id, data_entrega);
  `);
}

// A pergunta central: quem está logado?
export async function getLoggedUser(): Promise<User | null> {
  const db = await getDb();
  return db.getFirstAsync<User>(
    `SELECT u.id, u.name, u.email
       FROM session s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = 1`
  );
}

export async function startSession(userId: number) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO session (id, user_id) VALUES (1, ?)',
    userId
  );
}

export async function endSession() {
  const db = await getDb();
  await db.runAsync('DELETE FROM session');
}

export async function hashPassword(password: string){
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password)
}

export async function createUser(name: string, email: string, password: string){
  const db = await getDb()
  const hash = await hashPassword(password)
  const result = await db.runAsync(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', 
    name, email, hash
  )
  return result.lastInsertRowId
}

export async function verifyLogin(email: string, password: string): Promise<number | null>{
  const db = await getDb()
  const hash = await hashPassword(password)
  const row = await db.getFirstAsync<{id: number}>(
    'SELECT id FROM users WHERE email = ? AND password_hash = ?',
    email, hash
  )
  return row ? row.id : null
}