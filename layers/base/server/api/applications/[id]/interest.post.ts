import { and, eq } from 'drizzle-orm'
import { applications, investorInterests, users } from '@tranzito/db'
import { requireRole } from '../../../utils/auth'
import { useMailService, renderMailTemplate } from '../../../utils/mail'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['investor'])
  const applicationId = getRouterParam(event, 'id')

  if (!applicationId) {
    throw createError({
      statusCode: 400,
      message: 'Application ID is required',
    })
  }

  const db = useDb()

  // Check if application exists and is approved
  const [application] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1)

  if (!application) {
    throw createError({
      statusCode: 404,
      message: 'Application not found',
    })
  }

  if (application.status !== 'approved') {
    throw createError({
      statusCode: 400,
      message: 'Application is not available for interest',
    })
  }

  // Idempotency: if this investor already expressed interest, return existing
  // record without creating a duplicate or re-notifying admins.
  const [existing] = await db
    .select()
    .from(investorInterests)
    .where(and(
      eq(investorInterests.investorId, user.id),
      eq(investorInterests.applicationId, applicationId),
    ))
    .limit(1)

  if (existing) {
    return { data: existing, alreadyRequested: true }
  }

  // Create interest record
  const [interest] = await db
    .insert(investorInterests)
    .values({
      investorId: user.id,
      applicationId,
      status: 'new',
    })
    .returning()

  // Send email notification to all active admins (fire-and-forget)
  void (async () => {
    try {
      const admins = await db
        .select({ email: users.email })
        .from(users)
        .where(and(eq(users.role, 'admin'), eq(users.isActive, true)))

      if (!admins.length) return

      const mailService = useMailService()
      const template = renderMailTemplate('investor-interest', {
        investorName: user.fullName,
        investorEmail: user.email,
        applicationId: applicationId.slice(0, 8),
      })

      await Promise.allSettled(
        admins.map(admin => mailService.send({ to: admin.email, ...template })),
      )
    } catch (error) {
      console.error('Failed to send email notification:', error)
    }
  })()

  return { data: interest, alreadyRequested: false }
})
