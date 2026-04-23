import { and, eq } from 'drizzle-orm'
import { applications, investorInterests } from '@tranzitum/db'
import { requireRole } from '../../../utils/auth'
import { useMailService, renderMailTemplate } from '../../../utils/mail'
import { getActiveAdminEmails } from '../../../utils/users'

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

  const adminEmails = await getActiveAdminEmails()
  if (adminEmails.length) {
    const template = renderMailTemplate('investor-interest', {
      investorName: user.fullName,
      investorEmail: user.email,
      applicationId: applicationId.slice(0, 8),
    })
    useMailService().notify(
      adminEmails.map(to => ({ to, ...template })),
      'applications/interest',
    )
  }

  return { data: interest, alreadyRequested: false }
})
