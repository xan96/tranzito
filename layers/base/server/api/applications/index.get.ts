import { eq, desc, sql } from 'drizzle-orm'
import { applications, investorInterests, users } from '@tranzitum/db'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const query = getQuery(event)
  const db = useDb()

  let baseQuery = db
    .select({
      id: applications.id,
      borrowerName: applications.borrowerName,
      borrowerPhone: applications.borrowerPhone,
      borrowerEmail: applications.borrowerEmail,
      propertyAddress: applications.propertyAddress,
      marketValue: applications.marketValue,
      currentDebt: applications.currentDebt,
      requestedAmount: applications.requestedAmount,
      loanTermDays: applications.loanTermDays,
      status: applications.status,
      managerComment: applications.managerComment,
      createdAt: applications.createdAt,
      broker: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
      },
    })
    .from(applications)
    .leftJoin(users, eq(applications.brokerId, users.id))
    .orderBy(desc(applications.createdAt))

  // Filter by role
  if (user.role === 'broker') {
    baseQuery = baseQuery.where(eq(applications.brokerId, user.id)) as typeof baseQuery
  } else if (user.role === 'investor') {
    // Investors can only see approved applications
    baseQuery = baseQuery.where(eq(applications.status, 'approved')) as typeof baseQuery
  }

  // Filter by status if provided
  if (query.status && typeof query.status === 'string') {
    baseQuery = baseQuery.where(eq(applications.status, query.status as any)) as typeof baseQuery
  }

  const data = await baseQuery

  // Admins: attach count of unprocessed investor interests per application
  // (status='new'), so the list can surface «X новых интересов» badges on
  // approved applications.
  if (user.role === 'admin' && data.length) {
    const counts = await db
      .select({
        applicationId: investorInterests.applicationId,
        count: sql<number>`count(*)::int`,
      })
      .from(investorInterests)
      .where(eq(investorInterests.status, 'new'))
      .groupBy(investorInterests.applicationId)

    const countMap = new Map(counts.map(c => [c.applicationId, c.count]))
    return {
      data: data.map(app => ({
        ...app,
        newInterestsCount: countMap.get(app.id) ?? 0,
      })),
    }
  }

  return { data }
})
