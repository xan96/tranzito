export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()

  if (user.value?.role !== 'investor') {
    return navigateTo('/')
  }
})
