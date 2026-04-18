import { and, desc, eq } from 'drizzle-orm'
import { applications, users, documents, statusHistory, investorInterests } from '@tranzitum/db'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const applicationId = getRouterParam(event, 'id')

  if (!applicationId) {
    throw createError({
      statusCode: 400,
      message: 'Application ID is required',
    })
  }

  const db = useDb()

  // Get application with broker info
  const [application] = await db
    .select({
      id: applications.id,
      brokerId: applications.brokerId,
      borrowerName: applications.borrowerName,
      borrowerPhone: applications.borrowerPhone,
      borrowerEmail: applications.borrowerEmail,
      propertyAddress: applications.propertyAddress,
      cadastralNumber: applications.cadastralNumber,
      marketValue: applications.marketValue,
      currentDebt: applications.currentDebt,
      bankAName: applications.bankAName,
      requestedAmount: applications.requestedAmount,
      loanTermDays: applications.loanTermDays,
      bankBInfo: applications.bankBInfo,
      status: applications.status,
      managerComment: applications.managerComment,
      createdAt: applications.createdAt,
      broker: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
      },
    })
    .from(applications)
    .leftJoin(users, eq(applications.brokerId, users.id))
    .where(eq(applications.id, applicationId))
    .limit(1)

  if (!application) {
    throw createError({
      statusCode: 404,
      message: 'Application not found',
    })
  }

  // Check access
  if (user.role === 'broker' && application.brokerId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    })
  }

  if (user.role === 'investor' && application.status !== 'approved') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    })
  }

  // Get documents
  const docs = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      fileSize: documents.fileSize,
    })
    .from(documents)
    .where(eq(documents.applicationId, applicationId))

  // Get status history (for admin)
  let history: Array<{
    id: string
    oldStatus: string | null
    newStatus: string
    comment: string | null
    changedAt: Date
    changedBy: { fullName: string } | null
  }> = []

  if (user.role === 'admin') {
    const historyData = await db
      .select({
        id: statusHistory.id,
        oldStatus: statusHistory.oldStatus,
        newStatus: statusHistory.newStatus,
        comment: statusHistory.comment,
        changedAt: statusHistory.changedAt,
        changedBy: {
          fullName: users.fullName,
        },
      })
      .from(statusHistory)
      .leftJoin(users, eq(statusHistory.changedByUserId, users.id))
      .where(eq(statusHistory.applicationId, applicationId))
      .orderBy(statusHistory.changedAt)

    history = historyData
  }

  // Investor: whether this user has already expressed interest (server-authoritative)
  let hasRequested = false
  if (user.role === 'investor') {
    const [existing] = await db
      .select({ id: investorInterests.id })
      .from(investorInterests)
      .where(and(
        eq(investorInterests.investorId, user.id),
        eq(investorInterests.applicationId, applicationId),
      ))
      .limit(1)
    hasRequested = !!existing
  }

  // Admin: list of investors who expressed interest
  let interests: Array<{
    id: string
    status: string
    createdAt: Date
    investor: { id: string; fullName: string; email: string; phone: string | null } | null
  }> = []
  if (user.role === 'admin') {
    interests = await db
      .select({
        id: investorInterests.id,
        status: investorInterests.status,
        createdAt: investorInterests.createdAt,
        investor: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(investorInterests)
      .leftJoin(users, eq(investorInterests.investorId, users.id))
      .where(eq(investorInterests.applicationId, applicationId))
      .orderBy(desc(investorInterests.createdAt))
  }

  return {
    data: {
      ...application,
      documents: docs,
      statusHistory: history,
      hasRequested,
      interests,
    },
  }
})
