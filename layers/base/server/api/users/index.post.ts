import { z } from 'zod'
import { users } from '@tranzitum/db'
import { requireRole, hashPassword } from '../../utils/auth'

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['admin', 'broker', 'investor']),
  password: z.string().min(6),
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])

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
    .where((await import('drizzle-orm')).eq(users.email, email.toLowerCase()))
    .limit(1)

  if (existing.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Email already exists',
    })
  }

  const passwordHash = await hashPassword(password)

  const [user] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      fullName,
      phone: phone || null,
      role,
      passwordHash,
    })
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })

  return { data: user }
})
