export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()

  if (user.value?.role !== 'broker') {
    return navigateTo('/')
  }
})
