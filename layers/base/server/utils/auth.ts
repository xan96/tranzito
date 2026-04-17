import jwt from 'jsonwebtoken'
import { compare, hash } from 'bcrypt'
import type { H3Event } from 'h3'
import { users } from '@tranzito/db'
import { eq } from 'drizzle-orm'

export interface JwtPayload {
  userId: string
  email: string
  role: 'admin' | 'broker' | 'investor'
}

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'broker' | 'investor'
  phone: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash)
}

export function createToken(payload: JwtPayload): string {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const config = useRuntimeConfig()
    return jwt.verify(token, config.jwtSecret) as JwtPayload
  } catch {
    return null
  }
}

export function getTokenFromEvent(event: H3Event): string | null {
  // Check Authorization header
  const authHeader = getHeader(event, 'Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Check cookie
  const token = getCookie(event, 'auth_token')
  return token || null
}

export async function getAuthUser(event: H3Event): Promise<AuthUser | null> {
  const token = getTokenFromEvent(event)
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const db = useDb()
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1)

  if (!user) return null

  return user
}

export function requireAuth(event: H3Event): AuthUser {
  const user = event.context.user as AuthUser | undefined
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }
  return user
}

export function requireRole(event: H3Event, roles: Array<'admin' | 'broker' | 'investor'>): AuthUser {
  const user = requireAuth(event)
  if (!roles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    })
  }
  return user
}
