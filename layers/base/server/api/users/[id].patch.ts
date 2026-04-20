import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '@tranzitum/db'
import { requireRole } from '../../utils/auth'
import { USER_ROLES } from '../../../utils/constants'

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])

  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required',
    })
  }

  const body = await readBody(event)
  const result = updateUserSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten(),
    })
  }

  const db = useDb()

  const [updated] = await db
    .update(users)
    .set({
      ...result.data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      phone: users.phone,
      isActive: users.isActive,
    })

  if (!updated) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }

  return { data: updated }
})
