import { getAuthUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  // Skip auth for public routes
  const path = getRequestURL(event).pathname
  const publicPaths = ['/api/auth/login', '/api/health']

  if (publicPaths.some((p) => path.startsWith(p))) {
    return
  }

  // Skip auth for non-API routes
  if (!path.startsWith('/api/')) {
    return
  }

  const user = await getAuthUser(event)
  event.context.user = user
})
