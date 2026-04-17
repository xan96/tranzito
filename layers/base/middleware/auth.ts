export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, isLoading, fetchUser } = useAuth()

  // Fetch user if not loaded yet
  if (isLoading.value) {
    await fetchUser()
  }

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
