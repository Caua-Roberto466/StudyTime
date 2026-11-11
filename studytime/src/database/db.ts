import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { removeDeadlineFromCalendar } from '@/utils/deviceCalendar';

/* ───────────── Tipos ───────────── */

export type User = { id: number; name: string; email: string; avatar: string | null };
export type Priority = 'Alta' | 'Média' | 'Baixa';

export type Settings = {
  calendar_alarms: number;   // 1 = cria evento na agenda para prioridade alta
  default_reminder: number;  // 1 = "Lembrete" já vem ligado em novas atividades
};
export const DEFAULT_SETTINGS: Settings = { calendar_alarms: 1, default_reminder: 1 };

export type Activity = {
  id: number;
  name: string;
  data_entrega: string;          // ISO: 2026-11-03T14:00
  description: string | null;
  priority: Priority;
  reminder: number;              // 0 ou 1
  completed: number;             // 0 ou 1
  url_image: string | null;      // JSON: ["171234-ab12.jpg", ...]
  user_id: number;
  calendar_event_id: string | null;
  icon: string | null;
  subject_id: number | null;
  // vêm do JOIN com subjects
  subject_name: string | null;
  subject_icon: string | null;
  subject_color: string | null;
};

export type Subject = { id: number; name: string; icon: string; color: string };
export type SubjectWithCount = Subject & { total: number; pending: number };

// Notificação registrada (ex.: entrega de atividade). Ligada à atividade via activities.notifications_id.
export type Notification = {
  id: number;
  notification_id: string | null;
  title: string;
  sent: number;               // 0 ou 1
  scheduled_date: string;
};

/* ───────────── Conexão e migrações ───────────── */

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('studytime.db');
  return dbPromise;
}

const SCHEMA_VERSION = 4;

export async function initDb() {
  const db = await getDb();
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= SCHEMA_VERSION) return; // banco já está atualizado

  await db.withTransactionAsync(async () => {
    // Versão 1: schema original. NUNCA edite este bloco.
    if (version < 1) {
      await db.execAsync(`
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
          data_entrega TEXT NOT NULL,
          description TEXT,
          priority TEXT NOT NULL DEFAULT 'Média'
            CHECK (priority IN ('Alta', 'Média', 'Baixa')),
          reminder INTEGER NOT NULL DEFAULT 0,
          completed INTEGER NOT NULL DEFAULT 0,
          url_image TEXT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          notifications_id INTEGER REFERENCES notifications(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_activities_user_date
          ON activities (user_id, data_entrega);
      `);
    }

    // Versão 2: id do evento criado na agenda do celular
    if (version < 2) {
      await db.execAsync('ALTER TABLE activities ADD COLUMN calendar_event_id TEXT;');
    }

    // Versão 3: matérias + ícone da atividade
    if (version < 3) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS subjects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL COLLATE NOCASE,
          icon TEXT NOT NULL DEFAULT 'book-outline',
          color TEXT NOT NULL DEFAULT '#7C3AED',
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE (user_id, name)
        );
        ALTER TABLE activities ADD COLUMN icon TEXT;
        ALTER TABLE activities
          ADD COLUMN subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_activities_subject ON activities (subject_id);
      `);
    }

    // Versão 4: foto de perfil + preferências do usuário
    if (version < 4) {
      await db.execAsync(`
        ALTER TABLE users ADD COLUMN avatar TEXT;
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          calendar_alarms INTEGER NOT NULL DEFAULT 1,
          default_reminder INTEGER NOT NULL DEFAULT 1
        );
      `);
    }

    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  });
}

/* ───────────── Sessão ───────────── */

export async function getLoggedUser(): Promise<User | null> {
  const db = await getDb();
  return db.getFirstAsync<User>(
    `SELECT u.id, u.name, u.email, u.avatar
       FROM session s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = 1`
  );
}

export async function startSession(userId: number) {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO session (id, user_id) VALUES (1, ?)', userId);
}

export async function endSession() {
  const db = await getDb();
  await db.runAsync('DELETE FROM session');
}

/* ───────────── Cadastro, login e perfil ───────────── */

export async function hashPassword(password: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export async function createUser(name: string, email: string, password: string) {
  const db = await getDb();
  const hash = await hashPassword(password);
  const result = await db.runAsync(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    name, email, hash
  );
  return result.lastInsertRowId;
}

export async function verifyLogin(email: string, password: string): Promise<number | null> {
  const db = await getDb();
  const hash = await hashPassword(password);
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM users WHERE email = ? AND password_hash = ?',
    email, hash
  );
  return row ? row.id : null;
}

// Lança erro se o e-mail já pertencer a outra conta (UNIQUE)
export async function updateProfile(userId: number, name: string, email: string) {
  const db = await getDb();
  await db.runAsync('UPDATE users SET name = ?, email = ? WHERE id = ?', name, email, userId);
}

// Guarda só o NOME do arquivo da foto (ou null para remover)
export async function setAvatar(userId: number, avatar: string | null) {
  const db = await getDb();
  await db.runAsync('UPDATE users SET avatar = ? WHERE id = ?', avatar, userId);
}

// Devolve false se a senha atual estiver errada
export async function changePassword(userId: number, current: string, next: string) {
  const db = await getDb();
  const currentHash = await hashPassword(current);
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM users WHERE id = ? AND password_hash = ?',
    userId, currentHash
  );
  if (!row) return false;

  await db.runAsync(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    await hashPassword(next), userId
  );
  return true;
}

/* ───────────── Preferências ───────────── */

// Sem linha salva, vale o padrão
export async function getSettings(userId: number): Promise<Settings> {
  const db = await getDb();
  const row = await db.getFirstAsync<Settings>(
    'SELECT calendar_alarms, default_reminder FROM user_settings WHERE user_id = ?',
    userId
  );
  return row ?? DEFAULT_SETTINGS;
}

// "Upsert": insere a linha na primeira vez e atualiza nas seguintes
export async function saveSettings(userId: number, s: Settings) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO user_settings (user_id, calendar_alarms, default_reminder)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       calendar_alarms = excluded.calendar_alarms,
       default_reminder = excluded.default_reminder`,
    userId, s.calendar_alarms, s.default_reminder
  );
}

/* ───────────── Atividades ───────────── */

// Junta cada atividade com a sua matéria. LEFT JOIN mantém as que não têm matéria.
const ACTIVITY_SELECT = `
  SELECT a.*,
         s.name  AS subject_name,
         s.icon  AS subject_icon,
         s.color AS subject_color
    FROM activities a
    LEFT JOIN subjects s ON s.id = a.subject_id`;

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

export async function getUpcomingActivities(userId: number, from: string, limit = 3) {
  const db = await getDb();
  return db.getAllAsync<Activity>(
    `${ACTIVITY_SELECT}
      WHERE a.user_id = ? AND a.completed = 0 AND a.data_entrega >= ?
      ORDER BY a.data_entrega ASC
      LIMIT ?`,
    userId, from, limit
  );
}

export async function getAllActivities(userId: number) {
  const db = await getDb();
  return db.getAllAsync<Activity>(
    `${ACTIVITY_SELECT}
      WHERE a.user_id = ?
      ORDER BY a.data_entrega ASC`,
    userId
  );
}

// Notificações do usuário (via JOIN com as atividades que as originaram)
export async function getNotifications(userId: number) {
  const db = await getDb();
  return db.getAllAsync<Notification>(
    `SELECT n.id, n.notification_id, n.title, n.sent, n.scheduled_date
       FROM notifications n
       JOIN activities a ON a.notifications_id = n.id
      WHERE a.user_id = ?
      ORDER BY n.scheduled_date DESC`,
    userId
  );
}

export async function getActivitiesBySubject(userId: number, subjectId: number) {
  const db = await getDb();
  return db.getAllAsync<Activity>(
    `${ACTIVITY_SELECT}
      WHERE a.user_id = ? AND a.subject_id = ?
      ORDER BY a.completed ASC, a.data_entrega ASC`,
    userId, subjectId
  );
}

type NewActivity = {
  userId: number;
  name: string;
  dueAt: string;                 // '2026-11-03T14:00'
  description: string | null;
  priority: Priority;
  reminder: boolean;
  images: string[];              // nomes dos arquivos já salvos
  subjectId: number | null;
  icon: string | null;
};

export async function createActivity(a: NewActivity) {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO activities
       (name, data_entrega, description, priority, reminder, url_image, user_id, subject_id, icon)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    a.name, a.dueAt, a.description, a.priority, a.reminder ? 1 : 0,
    JSON.stringify(a.images), a.userId, a.subjectId, a.icon
  );
  const activityId = result.lastInsertRowId;

  // lembrete ligado: registra a notificação e guarda o vínculo com a atividade
  if (a.reminder) {
    const notif = await db.runAsync(
      'INSERT INTO notifications (notification_id, title, sent, scheduled_date) VALUES (?, ?, 0, ?)',
      String(activityId), a.name, a.dueAt
    );
    await db.runAsync(
      'UPDATE activities SET notifications_id = ? WHERE id = ?',
      notif.lastInsertRowId, activityId
    );
  }

  return activityId;
}

export async function setActivityCompleted(id: number, userId: number, completed: boolean) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE activities SET completed = ? WHERE id = ? AND user_id = ?',
    completed ? 1 : 0, id, userId
  );
}

export async function setCalendarEventId(
  activityId: number, userId: number, eventId: string | null
) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE activities SET calendar_event_id = ? WHERE id = ? AND user_id = ?',
    eventId, activityId, userId
  );
}

// Busca uma atividade pelo id (com a matéria via JOIN)
export async function getActivity(userId: number, activityId: number): Promise<Activity | null> {
  const db = await getDb();
  return db.getFirstAsync<Activity>(
    `${ACTIVITY_SELECT}
      WHERE a.id = ? AND a.user_id = ?`,
    activityId, userId
  );
}

export type ActivityInput = {
  name: string;
  dueAt: string;                 // '2026-11-03T14:00'
  description: string | null;
  priority: Priority;
  reminder: boolean;
  subjectId: number | null;
  icon: string | null;
};

// Atualiza uma atividade (usado pela página de edição)
export async function updateActivity(id: number, userId: number, data: ActivityInput) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE activities
        SET name = ?, data_entrega = ?, description = ?, priority = ?, reminder = ?,
            subject_id = ?, icon = ?
      WHERE id = ? AND user_id = ?`,
    data.name, data.dueAt, data.description, data.priority, data.reminder ? 1 : 0,
    data.subjectId, data.icon, id, userId
  );
}

// Exclui uma atividade do usuário (limpa também o evento da agenda, se houver)
export async function deleteActivity(id: number, userId: number) {
  const db = await getDb();
  const row = await db.getFirstAsync<{ calendar_event_id: string | null }>(
    'SELECT calendar_event_id FROM activities WHERE id = ? AND user_id = ?',
    id, userId
  );
  if (row?.calendar_event_id) {
    try {
      await removeDeadlineFromCalendar(row.calendar_event_id);
    } catch {
      // evento já foi apagado: ignorar
    }
  }
  await db.runAsync('DELETE FROM activities WHERE id = ? AND user_id = ?', id, userId);
}

/* ───────────── Matérias ───────────── */

// Matérias com a contagem de atividades (total e pendentes)
export async function getSubjects(userId: number) {
  const db = await getDb();
  return db.getAllAsync<SubjectWithCount>(
    `SELECT s.id, s.name, s.icon, s.color,
            COUNT(a.id) AS total,
            COALESCE(SUM(CASE WHEN a.completed = 0 THEN 1 ELSE 0 END), 0) AS pending
       FROM subjects s
       LEFT JOIN activities a ON a.subject_id = s.id
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.name COLLATE NOCASE`,
    userId
  );
}

export async function getSubject(userId: number, subjectId: number) {
  const db = await getDb();
  return db.getFirstAsync<Subject>(
    'SELECT id, name, icon, color FROM subjects WHERE id = ? AND user_id = ?',
    subjectId, userId
  );
}

export async function createSubject(s: {
  userId: number; name: string; icon: string; color: string;
}) {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO subjects (name, icon, color, user_id) VALUES (?, ?, ?, ?)',
    s.name, s.icon, s.color, s.userId
  );
  return result.lastInsertRowId;
}

// As atividades da matéria NÃO são apagadas: o banco zera o subject_id delas
export async function deleteSubject(userId: number, subjectId: number) {
  const db = await getDb();
  await db.runAsync('DELETE FROM subjects WHERE id = ? AND user_id = ?', subjectId, userId);
}