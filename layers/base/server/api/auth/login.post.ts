import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { users } from '@tranzito/db'
import { verifyPassword, createToken } from '../../utils/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = loginSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten(),
    })
  }

  const { email, password } = result.data
  const db = useDb()

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  if (!user || !user.isActive) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash)
  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  }

  const token = createToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  // Set cookie
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
    },
    token,
  }
})
