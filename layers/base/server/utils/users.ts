import { and, eq } from 'drizzle-orm'
import { users } from '@tranzitum/db'
import { useDb } from './db'

/**
 * Email'ы активных админов — получатели системных уведомлений
 * (новая заявка, новый интерес инвестора и т.п.).
 */
export async function getActiveAdminEmails(): Promise<string[]> {
  const rows = await useDb()
    .select({ email: users.email })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.isActive, true)))
  return rows.map(r => r.email)
}
