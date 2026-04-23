import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { users } from '@tranzitum/db'
import { requireRole } from '../../../utils/auth'
import { useMailService, renderMailTemplate } from '../../../utils/mail'

const rejectSchema = z.object({
  reason: z.string().max(500).optional(),
})

export default defineEventHandler(async (event) => {
  const admin = requireRole(event, ['admin'])

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, message: 'User ID is required' })
  }

  const body = await readBody(event).catch(() => ({}))
  const parsed = rejectSchema.safeParse(body ?? {})
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: parsed.error.flatten(),
    })
  }
  const reason = parsed.data.reason?.trim() || null

  const db = useDb()

  const [target] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      approvalStatus: users.approvalStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!target) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  if (target.approvalStatus !== 'pending') {
    throw createError({
      statusCode: 409,
      message: 'Only pending users can be rejected',
    })
  }

  const now = new Date()

  const [updated] = await db
    .update(users)
    .set({
      approvalStatus: 'rejected',
      rejectionReason: reason,
      approvedAt: now,
      approvedByUserId: admin.id,
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
      rejectionReason: users.rejectionReason,
    })

  const rendered = renderMailTemplate('user-rejected', {
    fullName: target.fullName,
    role: target.role,
    reason: reason ?? undefined,
  })
  useMailService().notify({ to: target.email, ...rendered }, 'users/reject')

  return { data: updated }
})
