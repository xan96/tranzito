import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { users } from '@tranzitum/db'
import { requireRole, hashPassword } from '../../utils/auth'
import { USER_ROLES } from '../../../utils/constants'

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES),
  password: z.string().min(6),
})

export default defineEventHandler(async (event) => {
  const admin = requireRole(event, ['admin'])

  const body = await readBody(event)
  const result = createUserSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten(),
    })
  }

  const { email, fullName, phone, role, password } = result.data
  const db = useDb()

  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  if (existing.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Email already exists',
    })
  }

  const passwordHash = await hashPassword(password)

  // Пользователи, которых создаёт админ вручную, сразу одобрены.
  const [user] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      fullName,
      phone: phone || null,
      role,
      passwordHash,
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedByUserId: admin.id,
    })
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      phone: users.phone,
      isActive: users.isActive,
      approvalStatus: users.approvalStatus,
      createdAt: users.createdAt,
    })

  return { data: user }
})
