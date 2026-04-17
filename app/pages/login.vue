<script setup lang="ts">
const { login, isAuthenticated, user } = useAuth()
const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)
const error = ref('')

// Redirect if already authenticated
watch(isAuthenticated, (value) => {
  if (value && user.value) {
    redirectToRole(user.value.role)
  }
}, { immediate: true })

const roleRoutes: Record<string, string> = {
  broker: '/broker',
  investor: '/investor',
  admin: '/admin',
}

function redirectToRole(role: string) {
  router.push(roleRoutes[role] || '/')
}

async function handleSubmit() {
  error.value = ''
  isLoading.value = true

  try {
    const loggedInUser = await login(form)
    redirectToRole(loggedInUser.role)
  } catch (e: unknown) {
    error.value = 'Неверный email или пароль'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#f6f7f8] px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-3">
          <TLogo :size="44" />
          <span class="text-3xl font-bold text-gray-900">Транзито</span>
        </NuxtLink>
        <p class="text-gray-500 mt-2">
          Войдите в свой аккаунт
        </p>
      </div>

      <!-- Login form -->
      <div class="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Error alert -->
          <div
            v-if="error"
            class="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm"
          >
            {{ error }}
          </div>

          <TInput
            v-model="form.email"
            label="Email"
            type="email"
            required
          />

          <TInput
            v-model="form.password"
            label="Пароль"
            type="password"
            required
          />

          <TButton
            type="submit"
            size="xl"
            block
            :loading="isLoading"
          >
            Войти
          </TButton>
        </form>
      </div>

      <p class="text-center text-sm text-gray-500 mt-6">
        Нет аккаунта? Обратитесь к администратору
      </p>
    </div>
  </div>
</template>
