import * as SQLite from 'expo-sqlite'

export type User = {id: number; name: string; email: string}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null