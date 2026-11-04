import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto'
import { toLocalISO } from '@/utils/dates';

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

export type Priority = 'Alta' | 'Média' | 'Baixa';

export type Activity = {
  id: number;
  name: string;
  data_entrega: string;
  priority: Priority;
  completed: number; // 0 ou 1
};

// "7 de 10": total e concluídas dentro de um intervalo de datas
export async function getWeekProgress(userId: number, start: string, end: string) {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number; done: number }>(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(completed), 0) AS done
       FROM activities
      WHERE user_id = ? AND data_entrega >= ? AND data_entrega < ?`,
    userId, start, end
  );
  return row ?? { total: 0, done: 0 };
}

// Próximas pendentes, da mais próxima para a mais distante
export async function getUpcomingActivities(userId: number, from: string, limit = 3) {
  const db = await getDb();
  return db.getAllAsync<Activity>(
    `SELECT id, name, data_entrega, priority, completed
       FROM activities
      WHERE user_id = ? AND completed = 0 AND data_entrega >= ?
      ORDER BY data_entrega ASC
      LIMIT ?`,
    userId, from, limit
  );
}

// TEMPORÁRIO: cria atividades de exemplo até existir a tela "Nova atividade"
export async function seedDemoActivities(userId: number) {
  const db = await getDb();
  const count = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM activities WHERE user_id = ?', userId
  );
  if (count && count.n > 0) return;

  const at = (days: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return toLocalISO(d);
  };

  const rows: [string, string, Priority, number][] = [
    ['Prova de Matemática', at(0, 23), 'Alta', 0],
    ['Trabalho de Programação', at(1, 9), 'Média', 0],
    ['Revisão de Biologia', at(2, 19), 'Baixa', 0],
    ['Lista de Exercícios', at(0, 8), 'Baixa', 1],
  ];

  for (const [name, due, priority, completed] of rows) {
    await db.runAsync(
      `INSERT INTO activities (name, data_entrega, priority, completed, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      name, due, priority, completed, userId
    );
  }
}