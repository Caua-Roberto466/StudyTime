import * as SQLite from 'expo-sqlite';

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