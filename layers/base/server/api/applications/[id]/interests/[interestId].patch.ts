import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { investorInterests } from '@tranzitum/db'
import { requireRole } from '../../../../utils/auth'
import {
  INTEREST_STATUSES,
  INTEREST_STATUS_LABELS,
  isAllowedInterestTransition,
  type InterestStatus,
} from '../../../../../utils/constants'

const updateSchema = z.object({
  status: z.enum(INTEREST_STATUSES),
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['admin'])

  const applicationId = getRouterParam(event, 'id')
  const interestId = getRouterParam(event, 'interestId')

  if (!applicationId || !interestId) {
    throw createError({
      statusCode: 400,
      message: 'Application ID and interest ID are required',
    })
  }

  const body = await readBody(event)
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: parsed.error.flatten(),
    })
  }

  const db = useDb()

  const [current] = await db
    .select()
    .from(investorInterests)
    .where(and(
      eq(investorInterests.id, interestId),
      eq(investorInterests.applicationId, applicationId),
    ))
    .limit(1)

  if (!current) {
    throw createError({
      statusCode: 404,
      message: 'Interest not found',
    })
  }

  const oldStatus = current.status as InterestStatus
  const newStatus = parsed.data.status

  if (!isAllowedInterestTransition(oldStatus, newStatus)) {
    throw createError({
      statusCode: 400,
      message: `Недопустимый переход статуса интереса: «${INTEREST_STATUS_LABELS[oldStatus]}» → «${INTEREST_STATUS_LABELS[newStatus]}»`,
    })
  }

  const [updated] = await db
    .update(investorInterests)
    .set({ status: newStatus })
    .where(eq(investorInterests.id, interestId))
    .returning()

  return { data: updated }
})
