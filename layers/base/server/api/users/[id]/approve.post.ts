import { eq } from 'drizzle-orm'
import { users } from '@tranzitum/db'
import { requireRole } from '../../../utils/auth'
import { useMailService, renderMailTemplate } from '../../../utils/mail'

export default defineEventHandler(async (event) => {
  const admin = requireRole(event, ['admin'])

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, message: 'User ID is required' })
  }

  const db = useDb()

  const [target] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      approvalStatus: users.approvalStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!target) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  if (target.approvalStatus === 'approved') {
    throw createError({ statusCode: 409, message: 'User is already approved' })
  }

  const now = new Date()

  const [updated] = await db
    .update(users)
    .set({
      approvalStatus: 'approved',
      approvedAt: now,
      approvedByUserId: admin.id,
      rejectionReason: null,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      phone: users.phone,
      isActive: users.isActive,
      approvalStatus: users.approvalStatus,
      approvedAt: users.approvedAt,
    })

  const config = useRuntimeConfig()
  const loginUrl = `${config.public.appUrl || ''}/login`
  const rendered = renderMailTemplate('user-approved', {
    fullName: target.fullName,
    loginUrl,
  })
  useMailService().notify({ to: target.email, ...rendered }, 'users/approve')

  return { data: updated }
})
