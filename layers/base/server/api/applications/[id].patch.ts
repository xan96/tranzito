import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { applications, statusHistory, users } from '@tranzito/db'
import { requireRole } from '../../utils/auth'
import { useMailService, renderMailTemplate } from '../../utils/mail'
import {
  APPLICATION_STATUS_LABELS,
  isAllowedStatusTransition,
  type ApplicationStatus,
} from '../../../utils/constants'

const updateSchema = z.object({
  status: z.enum(['pending', 'approved', 'in_progress', 'completed', 'rejected']).optional(),
  managerComment: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['admin'])
  const applicationId = getRouterParam(event, 'id')

  if (!applicationId) {
    throw createError({
      statusCode: 400,
      message: 'Application ID is required',
    })
  }

  const body = await readBody(event)
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.flatten(),
    })
  }

  const db = useDb()

  // Get current application
  const [currentApplication] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1)

  if (!currentApplication) {
    throw createError({
      statusCode: 404,
      message: 'Application not found',
    })
  }

  const { status, managerComment } = result.data
  const oldStatus = currentApplication.status as ApplicationStatus

  // Validate status transition
  if (status && !isAllowedStatusTransition(oldStatus, status)) {
    throw createError({
      statusCode: 400,
      message: `Недопустимый переход статуса: «${APPLICATION_STATUS_LABELS[oldStatus]}» → «${APPLICATION_STATUS_LABELS[status]}»`,
    })
  }

  // Update application
  const [updated] = await db
    .update(applications)
    .set({
      ...(status && { status }),
      ...(managerComment !== undefined && { managerComment }),
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId))
    .returning()

  // Record status change
  if (status && status !== oldStatus) {
    await db.insert(statusHistory).values({
      applicationId,
      oldStatus,
      newStatus: status,
      changedByUserId: user.id,
      comment: managerComment,
    })

    // Send email notification to broker (fire-and-forget)
    void (async () => {
      try {
        const [broker] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, currentApplication.brokerId))
          .limit(1)

        if (!broker) return

        const mailService = useMailService()
        const template = renderMailTemplate('application-status-changed', {
          applicationId: applicationId.slice(0, 8),
          newStatus: status,
          comment: managerComment,
        })

        await mailService.send({
          to: broker.email,
          ...template,
        })
      } catch (error) {
        console.error('Failed to send email notification:', error)
      }
    })()

    // If approved, notify all investors (fire-and-forget)
    if (status === 'approved') {
      void (async () => {
        try {
          const investors = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.role, 'investor'))

          const mailService = useMailService()
          const template = renderMailTemplate('application-published', {
            applicationId: applicationId.slice(0, 8),
            amount: currentApplication.requestedAmount,
            termDays: currentApplication.loanTermDays,
          })

          await Promise.allSettled(
            investors.map(investor =>
              mailService.send({ to: investor.email, ...template })
            )
          )
        } catch (error) {
          console.error('Failed to send investor notifications:', error)
        }
      })()
    }
  }

  return { data: updated }
})
