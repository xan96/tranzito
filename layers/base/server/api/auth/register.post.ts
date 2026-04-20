import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { users } from '@tranzitum/db'
import { hashPassword } from '../../utils/auth'
import { useMailService, renderMailTemplate } from '../../utils/mail'
import { SELF_REGISTRATION_ROLES, type SelfRegistrationRole } from '../../../utils/constants'

const registerSchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(1).max(255),
  phone: z.string().max(20).optional(),
  role: z.enum(SELF_REGISTRATION_ROLES),
  password: z.string().min(6).max(128),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: parsed.error.flatten(),
    })
  }

  const { email, fullName, phone, role, password } = parsed.data
  const db = useDb()

  const existing = await db
    .select({ id: users.id, approvalStatus: users.approvalStatus })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  if (existing.length > 0) {
    // If user is still waiting for admin decision — treat repeat submit as ok
    // (don't reveal account existence and don't spam admin with extra mail).
    if (existing[0].approvalStatus === 'pending') {
      return { ok: true }
    }
    throw createError({
      statusCode: 409,
      message: 'Email already registered',
      data: { code: 'EMAIL_TAKEN' },
    })
  }

  const passwordHash = await hashPassword(password)

  const [created] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      fullName,
      phone: phone || null,
      role,
      passwordHash,
      approvalStatus: 'pending',
    })
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
    })

  // Notify admin. Mail failures must not break the registration.
  try {
    const config = useRuntimeConfig()
    const adminEmail = (config.adminEmail as string | undefined) || ''
    if (adminEmail) {
      const adminUrl = `${config.public.appUrl || ''}/admin/users?status=pending`
      const rendered = renderMailTemplate('user-registration-request', {
        email: created.email,
        fullName: created.fullName,
        role: created.role as SelfRegistrationRole,
        adminUrl,
      })
      await useMailService().send({
        to: adminEmail,
        ...rendered,
      })
    } else {
      console.warn('[auth/register] NUXT_ADMIN_EMAIL is not set; skipping admin notification')
    }
  } catch (err) {
    console.error('[auth/register] admin mail failed:', err)
  }

  return { ok: true }
})
