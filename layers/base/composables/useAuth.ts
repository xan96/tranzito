import type { AuthUser } from '../server/utils/auth'
import type { UserRole } from '../utils/constants'

interface LoginCredentials {
  email: string
  password: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
}

export function useAuth() {
  const state = useState<AuthState>('auth', () => ({
    user: null,
    token: null,
    isLoading: true,
  }))

  const isAuthenticated = computed(() => !!state.value.user)
  const user = computed(() => state.value.user)
  const isLoading = computed(() => state.value.isLoading)

  async function login(credentials: LoginCredentials) {
    const response = await $fetch<{ user: AuthUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })

    state.value.user = response.user
    state.value.token = response.token

    return response.user
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    state.value.user = null
    state.value.token = null
    await navigateTo('/login')
  }

  async function fetchUser() {
    state.value.isLoading = true
    try {
      // Forward the browser cookie during SSR so the internal /api/auth/me
      // call sees the JWT. Without this the server would always treat the
      // visitor as anonymous and the initial HTML would flip to "logged in"
      // only after client hydration.
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const response = await $fetch<{ user: AuthUser }>('/api/auth/me', { headers })
      state.value.user = response.user
    } catch {
      state.value.user = null
      state.value.token = null
    } finally {
      state.value.isLoading = false
    }
  }

  function hasRole(roles: readonly UserRole[]) {
    return state.value.user && roles.includes(state.value.user.role)
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    fetchUser,
    hasRole,
  }
}
