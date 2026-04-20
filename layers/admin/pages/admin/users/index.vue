<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role-admin'],
})

interface AdminUser {
  id: string
  email: string
  fullName: string
  role: string
  phone: string | null
  isActive: boolean
  approvalStatus: 'pending' | 'approved' | 'rejected'
  rejectionReason: string | null
  approvedAt: string | null
  createdAt: string
}

const { data: users, pending, refresh } = useApi<{ data: AdminUser[] }>('/api/users')

const toast = useToast()

const showCreateModal = ref(false)
const isCreating = ref(false)
const createError = ref('')
const createForm = reactive({
  email: '',
  fullName: '',
  phone: '',
  role: 'broker' as UserRole,
  password: '',
})

const roleFilter = ref<string>('')

const showRejectModal = ref(false)
const rejectTarget = ref<AdminUser | null>(null)
const rejectReason = ref('')
const isRejecting = ref(false)
const actingId = ref<string | null>(null)

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

function approvalColor(status: AdminUser['approvalStatus']) {
  switch (status) {
    case 'pending': return 'bg-amber-50 text-amber-700'
    case 'rejected': return 'bg-red-50 text-red-700'
    case 'approved':
    default: return 'bg-green-50 text-green-700'
  }
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
}

async function createUser() {
  isCreating.value = true
  createError.value = ''
  try {
    await $fetch('/api/users', { method: 'POST', body: createForm })
    showCreateModal.value = false
    createForm.email = ''
    createForm.fullName = ''
    createForm.phone = ''
    createForm.role = 'broker'
    createForm.password = ''
    await refresh()
    toast.add({ title: 'Пользователь создан', color: 'green' })
  } catch (err: unknown) {
    createError.value = (err as { data?: { message?: string } })?.data?.message || 'Не удалось создать пользователя'
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

async function approve(user: AdminUser) {
  actingId.value = user.id
  try {
    await $fetch(`/api/users/${user.id}/approve`, { method: 'POST' })
    await refresh()
    toast.add({ title: `Заявка ${user.fullName} одобрена`, color: 'green' })
  } catch (err) {
    console.error('approve failed', err)
    toast.add({ title: 'Не удалось одобрить заявку', color: 'red' })
  } finally {
    actingId.value = null
  }
}

function openRejectModal(user: AdminUser) {
  rejectTarget.value = user
  rejectReason.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!rejectTarget.value) return
  isRejecting.value = true
  try {
    await $fetch(`/api/users/${rejectTarget.value.id}/reject`, {
      method: 'POST',
      body: { reason: rejectReason.value || undefined },
    })
    const name = rejectTarget.value.fullName
    showRejectModal.value = false
    rejectTarget.value = null
    rejectReason.value = ''
    await refresh()
    toast.add({ title: `Заявка ${name} отклонена`, color: 'green' })
  } catch (err) {
    console.error('reject failed', err)
    toast.add({ title: 'Не удалось отклонить заявку', color: 'red' })
  } finally {
    isRejecting.value = false
  }
}

const items = computed<AdminUser[]>(() => users.value?.data ?? [])

const pendingUsers = computed(() => items.value.filter(u => u.approvalStatus === 'pending'))

const stats = computed(() => ({
  total: items.value.length,
  admins: items.value.filter(u => u.role === 'admin').length,
  brokers: items.value.filter(u => u.role === 'broker').length,
  investors: items.value.filter(u => u.role === 'investor').length,
  pending: pendingUsers.value.length,
}))

const roleTabs = [
  { value: '', label: 'Все' },
  { value: 'admin', label: 'Админы' },
  { value: 'broker', label: 'Брокеры' },
  { value: 'investor', label: 'Инвесторы' },
]

const filtered = computed(() => {
  // В общем списке не показываем pending — они в отдельной секции сверху.
  const base = items.value.filter(u => u.approvalStatus !== 'pending')
  if (!roleFilter.value) return base
  return base.filter(u => u.role === roleFilter.value)
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
            Управляйте доступом, ролями и заявками на регистрацию.
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
    <section class="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
      <TStatCard
        icon="i-heroicons-users"
        label="Всего"
        :value="stats.total"
      />
      <TStatCard
        icon="i-heroicons-clock"
        label="На рассмотрении"
        :value="stats.pending"
        tone="amber"
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

    <!-- Pending registration requests -->
    <section v-if="pendingUsers.length" class="bg-white rounded-2xl border border-amber-200 overflow-hidden">
      <header class="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-amber-900">
            Заявки на регистрацию
          </h2>
          <p class="text-sm text-amber-700">
            Новые пользователи ждут одобрения — они не могут войти до вашей реакции.
          </p>
        </div>
        <span class="inline-flex items-center justify-center min-w-[2rem] h-8 px-3 rounded-full bg-amber-200 text-amber-900 text-sm font-bold">
          {{ pendingUsers.length }}
        </span>
      </header>

      <ul class="divide-y divide-amber-100">
        <li
          v-for="u in pendingUsers"
          :key="u.id"
          class="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4"
        >
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center text-xs font-semibold text-amber-900">
              {{ initials(u.fullName) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ u.fullName }}
              </p>
              <p class="text-xs text-gray-500 truncate">
                {{ u.email }} · {{ getRoleLabel(u.role) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 md:justify-end">
            <TButton
              size="sm"
              :loading="actingId === u.id"
              :disabled="actingId === u.id"
              @click="approve(u)"
            >
              Одобрить
            </TButton>
            <TButton
              size="sm"
              variant="outline"
              :disabled="actingId === u.id"
              @click="openRejectModal(u)"
            >
              Отклонить
            </TButton>
          </div>
        </li>
      </ul>
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
                <div class="flex flex-wrap items-center gap-1.5">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold"
                    :class="approvalColor(u.approvalStatus)"
                    :title="u.approvalStatus === 'rejected' && u.rejectionReason ? u.rejectionReason : undefined"
                  >
                    {{ USER_APPROVAL_STATUS_LABELS[u.approvalStatus] }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    :class="u.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="u.isActive ? 'bg-green-500' : 'bg-gray-400'" />
                    {{ u.isActive ? 'Активен' : 'Заблокирован' }}
                  </span>
                </div>
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
              <div class="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                <span
                  class="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold"
                  :class="approvalColor(u.approvalStatus)"
                >
                  {{ USER_APPROVAL_STATUS_LABELS[u.approvalStatus] }}
                </span>
                <span
                  class="inline-flex items-center gap-1.5 text-xs"
                  :class="u.isActive ? 'text-green-700' : 'text-gray-500'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="u.isActive ? 'bg-green-500' : 'bg-gray-400'" />
                  {{ u.isActive ? 'Активен' : 'Заблокирован' }}
                </span>
                <button
                  class="ml-auto text-xs font-medium"
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
          <div
            v-if="createError"
            class="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm"
          >
            {{ createError }}
          </div>

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

    <!-- Reject modal -->
    <UModal v-model="showRejectModal">
      <UCard :ui="{ rounded: 'rounded-2xl' }">
        <template #header>
          <h3 class="text-lg font-semibold">
            Отклонить заявку
          </h3>
        </template>

        <div v-if="rejectTarget" class="space-y-4">
          <p class="text-sm text-gray-600">
            Заявка <strong>{{ rejectTarget.fullName }}</strong> ({{ rejectTarget.email }}) будет отклонена. Пользователь получит письмо с указанной причиной.
          </p>

          <UFormGroup label="Причина (необязательно)">
            <UTextarea v-model="rejectReason" :rows="3" placeholder="Например: недостаточно данных" />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <TButton variant="secondary" @click="showRejectModal = false">
              Отмена
            </TButton>
            <TButton :loading="isRejecting" @click="confirmReject">
              Отклонить
            </TButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
