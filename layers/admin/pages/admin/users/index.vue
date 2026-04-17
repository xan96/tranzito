<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role-admin'],
})

const { data: users, pending, refresh } = useApi<{
  data: Array<{
    id: string
    email: string
    fullName: string
    role: string
    phone: string | null
    isActive: boolean
    createdAt: string
  }>
}>('/api/users')

const showCreateModal = ref(false)
const isCreating = ref(false)
const createForm = reactive({
  email: '',
  fullName: '',
  phone: '',
  role: 'broker' as UserRole,
  password: '',
})

const roleFilter = ref<string>('')

function getRoleLabel(role: string) {
  return USER_ROLE_LABELS[role as UserRole] || role
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU')
}

function roleColor(role: string) {
  switch (role) {
    case 'admin': return 'bg-red-50 text-red-700'
    case 'broker': return 'bg-[#428bf9]/10 text-[#428bf9]'
    case 'investor': return 'bg-green-50 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
}

async function createUser() {
  isCreating.value = true
  try {
    await $fetch('/api/users', { method: 'POST', body: createForm })
    showCreateModal.value = false
    createForm.email = ''
    createForm.fullName = ''
    createForm.phone = ''
    createForm.role = 'broker'
    createForm.password = ''
    await refresh()
  } catch (error) {
    console.error('Failed to create user:', error)
  } finally {
    isCreating.value = false
  }
}

async function toggleUserStatus(userId: string, isActive: boolean) {
  try {
    await $fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      body: { isActive: !isActive },
    })
    await refresh()
  } catch (error) {
    console.error('Failed to toggle user status:', error)
  }
}

const stats = computed(() => {
  const items = users.value?.data ?? []
  return {
    total: items.length,
    admins: items.filter(u => u.role === 'admin').length,
    brokers: items.filter(u => u.role === 'broker').length,
    investors: items.filter(u => u.role === 'investor').length,
  }
})

const roleTabs = [
  { value: '', label: 'Все' },
  { value: 'admin', label: 'Админы' },
  { value: 'broker', label: 'Брокеры' },
  { value: 'investor', label: 'Инвесторы' },
]

const filtered = computed(() => {
  const items = users.value?.data ?? []
  if (!roleFilter.value) return items
  return items.filter(u => u.role === roleFilter.value)
})
</script>

<template>
  <div class="px-4 md:px-6 py-6 space-y-6">
    <!-- Hero -->
    <section class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden">
      <div class="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-[#ffdd2d]/10" />
      <div class="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-white/60 mb-1">
            Панель управления
          </p>
          <h1 class="text-3xl md:text-4xl font-bold mb-2">
            Пользователи
          </h1>
          <p class="text-white/70 max-w-xl">
            Управляйте доступом, ролями и активацией аккаунтов.
          </p>
        </div>
        <TButton
          icon="i-heroicons-plus"
          size="lg"
          @click="showCreateModal = true"
        >
          Добавить пользователя
        </TButton>
      </div>
    </section>

    <!-- Stats -->
    <section class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <TStatCard
        icon="i-heroicons-users"
        label="Всего"
        :value="stats.total"
      />
      <TStatCard
        icon="i-heroicons-shield-check"
        label="Админы"
        :value="stats.admins"
        tone="red"
      />
      <TStatCard
        icon="i-heroicons-briefcase"
        label="Брокеры"
        :value="stats.brokers"
        tone="blue"
      />
      <TStatCard
        icon="i-heroicons-banknotes"
        label="Инвесторы"
        :value="stats.investors"
        tone="green"
      />
    </section>

    <!-- Role tabs -->
    <TFilterPills
      v-model="roleFilter"
      :options="roleTabs"
      layout="wrap"
    />

    <!-- List -->
    <section>
      <div v-if="pending" class="space-y-3">
        <USkeleton v-for="i in 5" :key="i" class="h-20 rounded-2xl" />
      </div>

      <!-- Desktop table -->
      <div v-else class="hidden lg:block bg-white rounded-2xl border border-[#0010241f] overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-[#f6f7f8] border-b border-[#0010241f]">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Телефон
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Регистрация
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th class="px-6 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="u in filtered" :key="u.id" class="hover:bg-[#f6f7f8] transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                    {{ initials(u.fullName) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ u.fullName }}</p>
                    <p class="text-xs text-gray-500">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold" :class="roleColor(u.role)">
                  {{ getRoleLabel(u.role) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">
                {{ u.phone || '—' }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ formatDate(u.createdAt) }}
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  :class="u.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="u.isActive ? 'bg-green-500' : 'bg-gray-400'" />
                  {{ u.isActive ? 'Активен' : 'Заблокирован' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  class="text-sm font-medium transition-colors"
                  :class="u.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'"
                  @click="toggleUserStatus(u.id, u.isActive)"
                >
                  {{ u.isActive ? 'Заблокировать' : 'Разблокировать' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div v-if="!pending" class="lg:hidden space-y-3">
        <div
          v-for="u in filtered"
          :key="u.id"
          class="bg-white rounded-2xl p-4 border border-[#0010241f]"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0">
              {{ initials(u.fullName) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 truncate">{{ u.fullName }}</p>
                  <p class="text-xs text-gray-500 truncate">{{ u.email }}</p>
                </div>
                <span class="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0" :class="roleColor(u.role)">
                  {{ getRoleLabel(u.role) }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span
                  class="inline-flex items-center gap-1.5 text-xs"
                  :class="u.isActive ? 'text-green-700' : 'text-gray-500'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="u.isActive ? 'bg-green-500' : 'bg-gray-400'" />
                  {{ u.isActive ? 'Активен' : 'Заблокирован' }}
                </span>
                <button
                  class="text-xs font-medium"
                  :class="u.isActive ? 'text-red-600' : 'text-green-600'"
                  @click="toggleUserStatus(u.id, u.isActive)"
                >
                  {{ u.isActive ? 'Заблокировать' : 'Разблокировать' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Create user modal -->
    <UModal v-model="showCreateModal">
      <UCard :ui="{ rounded: 'rounded-2xl' }">
        <template #header>
          <h3 class="text-lg font-semibold">
            Добавить пользователя
          </h3>
        </template>

        <form class="space-y-4" @submit.prevent="createUser">
          <UFormGroup label="ФИО" required>
            <UInput v-model="createForm.fullName" />
          </UFormGroup>

          <UFormGroup label="Email" required>
            <UInput v-model="createForm.email" type="email" />
          </UFormGroup>

          <UFormGroup label="Телефон">
            <UInput v-model="createForm.phone" type="tel" />
          </UFormGroup>

          <UFormGroup label="Роль" required>
            <USelect
              v-model="createForm.role"
              :options="USER_ROLE_OPTIONS"
              option-attribute="label"
              value-attribute="value"
            />
          </UFormGroup>

          <UFormGroup label="Временный пароль" required>
            <UInput v-model="createForm.password" type="password" />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex justify-end gap-3">
            <TButton variant="secondary" @click="showCreateModal = false">
              Отмена
            </TButton>
            <TButton :loading="isCreating" @click="createUser">
              Создать
            </TButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
