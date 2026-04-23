<script setup lang="ts">
const router = useRouter()
const route = useRoute()

const initialRole: 'broker' | 'investor' =
  route.query.role === 'investor' ? 'investor' : 'broker'

const form = reactive({
  email: '',
  fullName: '',
  phone: '',
  role: initialRole,
  password: '',
  passwordConfirm: '',
})

const errors = reactive({
  email: '',
  fullName: '',
  phone: '',
  password: '',
  passwordConfirm: '',
})

const isLoading = ref(false)
const submitError = ref('')

const roleOptions = [
  {
    value: 'broker' as const,
    title: 'Брокер',
    description: 'Создаю заявки на финансирование',
  },
  {
    value: 'investor' as const,
    title: 'Инвестор',
    description: 'Финансирую заявки брокеров',
  },
]

// Validation helpers (same patterns as broker/applications/new.vue)
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateFio(name: string): boolean {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
}

function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 11
}

const phoneInputRef = ref()

// Auto-fill +7 prefix on focus
function handlePhoneFocus() {
  if (!form.phone) {
    form.phone = '+7 ('
    setTimeout(() => phoneInputRef.value?.setCursor(4), 10)
  }
}

// On blur — if user left only the prefix, clear it (phone is optional)
function handlePhoneBlur() {
  if (form.phone.replace(/\D/g, '') === '7') {
    form.phone = ''
  }
  validateField('phone')
}

// Format phone number as user types: +7 (XXX) XXX-XX-XX
watch(() => form.phone, (newVal, oldVal) => {
  if (!newVal || newVal.length < (oldVal?.length || 0)) return // skip on delete

  const digits = newVal.replace(/\D/g, '').slice(1) // strip country code

  let formatted = '+7 ('
  if (digits.length > 0) formatted += digits.slice(0, 3)
  if (digits.length >= 3) formatted += ') '
  if (digits.length > 3) formatted += digits.slice(3, 6)
  if (digits.length >= 6) formatted += '-'
  if (digits.length > 6) formatted += digits.slice(6, 8)
  if (digits.length >= 8) formatted += '-'
  if (digits.length > 8) formatted += digits.slice(8, 10)

  if (formatted !== newVal) {
    form.phone = formatted
    setTimeout(() => phoneInputRef.value?.setCursor(formatted.length), 0)
  }
})

function validateField(field: keyof typeof errors) {
  switch (field) {
    case 'fullName':
      if (!form.fullName.trim()) {
        errors.fullName = 'Укажите ФИО'
      } else if (!validateFio(form.fullName)) {
        errors.fullName = 'Укажите фамилию и имя через пробел'
      } else {
        errors.fullName = ''
      }
      break

    case 'email':
      if (!form.email.trim()) {
        errors.email = 'Укажите email'
      } else if (!validateEmail(form.email)) {
        errors.email = 'Некорректный email'
      } else {
        errors.email = ''
      }
      break

    case 'phone':
      // Optional field
      if (form.phone && !validatePhone(form.phone)) {
        errors.phone = 'Некорректный номер телефона'
      } else {
        errors.phone = ''
      }
      break

    case 'password':
      if (!form.password) {
        errors.password = 'Укажите пароль'
      } else if (form.password.length < 6) {
        errors.password = 'Минимум 6 символов'
      } else {
        errors.password = ''
      }
      // Re-check confirm if it was already filled
      if (form.passwordConfirm && form.password !== form.passwordConfirm) {
        errors.passwordConfirm = 'Пароли не совпадают'
      } else if (form.passwordConfirm) {
        errors.passwordConfirm = ''
      }
      break

    case 'passwordConfirm':
      if (!form.passwordConfirm) {
        errors.passwordConfirm = 'Повторите пароль'
      } else if (form.password !== form.passwordConfirm) {
        errors.passwordConfirm = 'Пароли не совпадают'
      } else {
        errors.passwordConfirm = ''
      }
      break
  }
}

function validateAll(): boolean {
  ;(Object.keys(errors) as Array<keyof typeof errors>).forEach(validateField)
  return Object.values(errors).every(v => !v)
}

async function handleSubmit() {
  submitError.value = ''
  if (!validateAll()) return

  isLoading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: form.email,
        fullName: form.fullName,
        phone: form.phone || undefined,
        role: form.role,
        password: form.password,
      },
    })
    router.replace('/registration-success')
  } catch (e: unknown) {
    const err = e as { data?: { data?: { code?: string }; message?: string }; statusCode?: number }
    if (err.data?.data?.code === 'EMAIL_TAKEN' || err.statusCode === 409) {
      errors.email = 'Этот email уже зарегистрирован'
    } else if (err.statusCode === 400) {
      submitError.value = 'Проверьте корректность введённых данных'
    } else {
      submitError.value = 'Не удалось отправить заявку. Попробуйте позже.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#f6f7f8] px-4 py-10">
    <div class="w-full max-w-lg">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-3">
          <TLogo :size="44" />
          <span class="text-3xl font-bold text-gray-900">Tranzitum</span>
        </NuxtLink>
        <p class="text-gray-500 mt-2">
          Создайте аккаунт — админ одобрит заявку
        </p>
      </div>

      <!-- Form -->
      <div class="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Generic submit error -->
          <div
            v-if="submitError"
            class="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm"
          >
            {{ submitError }}
          </div>

          <!-- Role picker -->
          <div>
            <p class="text-sm font-medium text-gray-700 mb-2">
              Кто вы?
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                v-for="opt in roleOptions"
                :key="opt.value"
                type="button"
                class="text-left rounded-xl border-2 p-4 transition-colors"
                :class="form.role === opt.value
                  ? 'border-[#ffdd2d] bg-[#fffde6]'
                  : 'border-gray-200 hover:border-gray-300 bg-white'"
                @click="form.role = opt.value"
              >
                <p class="font-semibold text-gray-900">{{ opt.title }}</p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ opt.description }}
                </p>
              </button>
            </div>
          </div>

          <TInput
            v-model="form.fullName"
            label="ФИО"
            placeholder="Иванов Иван Иванович"
            :error="errors.fullName"
            required
            @blur="validateField('fullName')"
          />

          <TInput
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="email@example.com"
            :error="errors.email"
            required
            @blur="validateField('email')"
          />

          <TInput
            ref="phoneInputRef"
            v-model="form.phone"
            label="Телефон (необязательно)"
            type="tel"
            placeholder="+7 (999) 123-45-67"
            :filter="/[\d+() -]/"
            :error="errors.phone"
            show-mask
            @focus="handlePhoneFocus"
            @blur="handlePhoneBlur"
          />

          <TInput
            v-model="form.password"
            label="Пароль"
            type="password"
            :error="errors.password"
            required
            @blur="validateField('password')"
          />

          <TInput
            v-model="form.passwordConfirm"
            label="Повторите пароль"
            type="password"
            :error="errors.passwordConfirm"
            required
            @blur="validateField('passwordConfirm')"
          />

          <TButton
            type="submit"
            size="xl"
            block
            :loading="isLoading"
          >
            Отправить заявку
          </TButton>
        </form>
      </div>

      <p class="text-center text-sm text-gray-500 mt-6">
        Уже есть аккаунт?
        <NuxtLink to="/login" class="text-gray-900 font-medium hover:underline">
          Войти
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
