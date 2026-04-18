import { createDb, type Database } from '@tranzitum/db'

let db: Database | null = null

export function useDb(): Database {
  if (!db) {
    const config = useRuntimeConfig()
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is not configured')
    }
    db = createDb(config.databaseUrl)
  }
  return db
}
