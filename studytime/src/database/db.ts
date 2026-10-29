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