import { desc, eq } from 'drizzle-orm'
import { users } from '@tranzitum/db'
import { requireRole } from '../../utils/auth'
import { USER_APPROVAL_STATUSES } from '../../../utils/constants'

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])

  const query = getQuery(event)
  const statusParam = typeof query.status === 'string' ? query.status : ''

  const db = useDb()

  const baseSelect = {
    id: users.id,
    email: users.email,
    fullName: users.fullName,
    role: users.role,
    phone: users.phone,
    isActive: users.isActive,
    approvalStatus: users.approvalStatus,
    rejectionReason: users.rejectionReason,
    approvedAt: users.approvedAt,
    createdAt: users.createdAt,
  }

  const data = (USER_APPROVAL_STATUSES as readonly string[]).includes(statusParam)
    ? await db
        .select(baseSelect)
        .from(users)
        .where(eq(users.approvalStatus, statusParam as (typeof USER_APPROVAL_STATUSES)[number]))
        .orderBy(desc(users.createdAt))
    : await db
        .select(baseSelect)
        .from(users)
        .orderBy(desc(users.createdAt))

  return { data }
})
