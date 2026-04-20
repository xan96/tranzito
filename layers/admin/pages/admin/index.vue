<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role-admin'],
})

const router = useRouter()
const statusFilter = ref('')

const { data: applications, pending, refresh } = useApi<{
  data: Array<{
    id: string
    borrowerName: string
    requestedAmount: number
    status: string
    createdAt: string
    broker: {
      fullName: string
    }
    newInterestsCount?: number
  }>
}>(() => `/api/applications${statusFilter.value ? `?status=${statusFilter.value}` : ''}`)

const { data: allApplications } = useApi<{
  data: Array<{ status: string; requestedAmount: number }>
}>('/api/applications')

const statusOptions = [
  { value: '', label: 'Все', icon: 'i-heroicons-inbox' },
  { value: 'pending', label: 'На проверке', icon: 'i-heroicons-clock' },
  { value: 'approved', label: 'Одобрены', icon: 'i-heroicons-check-circle' },
  { value: 'in_progress', label: 'В работе', icon: 'i-heroicons-arrow-path' },
  { value: 'completed', label: 'Завершены', icon: 'i-heroicons-check-badge' },
  { value: 'rejected', label: 'Отклонены', icon: 'i-heroicons-x-circle' },
]

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount)
}

function formatCompact(amount: number) {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace('.0', '') + ' млн'
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + ' тыс'
  return String(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU')
}

watch(statusFilter, () => refresh())

const stats = computed(() => {
  const items = allApplications.value?.data ?? []
  const pendingCount = items.filter(a => a.status === 'pending').length
  const approvedCount = items.filter(a => a.status === 'approved').length
  const inProgressCount = items.filter(a => a.status === 'in_progress').length
  const totalAmount = items.reduce((s, a) => s + Number(a.requestedAmount), 0)
  return {
    total: items.length,
    pending: pendingCount,
    approved: approvedCount,
    inProgress: inProgressCount,
    totalAmount,
  }
})

function statusCount(value: string) {
  const items = allApplications.value?.data ?? []
  if (!value) return items.length
  return items.filter(a => a.status === value).length
}
</script>

<template>
  <div class="px-4 md:px-6 py-6 space-y-6">
    <!-- Hero -->
    <section class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden">
      <div class="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-[#ffdd2d]/10" />
      <div class="absolute -right-20 bottom-0 w-40 h-40 rounded-full bg-[#ffdd2d]/10" />
      <div class="relative">
        <p class="text-sm font-medium text-white/60 mb-1">
          Панель управления
        </p>
        <h1 class="text-3xl md:text-4xl font-bold mb-2">
          Заявки
        </h1>
        <p class="text-white/70 max-w-xl">
          Проверяйте, одобряйте и управляйте заявками на транзитное финансирование.
        </p>
      </div>
    </section>

    <!-- Stats -->
    <section class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <TStatCard
        icon="i-heroicons-inbox"
        label="Всего заявок"
        :value="stats.total"
      />
      <TStatCard
        icon="i-heroicons-clock"
        label="На проверке"
        :value="stats.pending"
        tone="amber"
      />
      <TStatCard
        icon="i-heroicons-check-circle"
        label="Активные"
        :value="stats.approved + stats.inProgress"
        tone="green"
      />
      <TStatCard
        icon="i-heroicons-banknotes"
        label="Общая сумма"
        :value="`${formatCompact(stats.totalAmount)} ₽`"
        compact
      />
    </section>

    <!-- Filter pills -->
    <TFilterPills
      v-model="statusFilter"
      :options="statusOptions.map(o => ({ ...o, count: statusCount(o.value) }))"
      layout="wrap"
    />

    <!-- List -->
    <section>
      <div v-if="pending" class="space-y-3">
        <USkeleton v-for="i in 5" :key="i" class="h-20 rounded-2xl" />
      </div>

      <div
        v-else-if="!applications?.data?.length"
        class="bg-white rounded-2xl border border-[#0010241f] py-16 text-center"
      >
        <div class="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
          <UIcon name="i-heroicons-document-text" class="w-8 h-8 text-gray-400" />
        </div>
        <p class="text-lg font-medium text-gray-900">
          Нет заявок
        </p>
        <p class="text-sm text-gray-500 mt-1">
          Попробуйте сменить фильтр
        </p>
      </div>

      <!-- Desktop table -->
      <div v-else class="hidden lg:block bg-white rounded-2xl border border-[#0010241f] overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-[#f6f7f8] border-b border-[#0010241f]">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Заёмщик
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Сумма
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Брокер
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата
              </th>
              <th class="px-6 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="app in applications.data"
              :key="app.id"
              class="hover:bg-[#f6f7f8] cursor-pointer transition-colors"
              @click="router.push(`/admin/applications/${app.id}`)"
            >
              <td class="px-6 py-4 text-sm text-gray-500 font-mono">
                {{ app.id.slice(0, 8) }}
              </td>
              <td class="px-6 py-4 text-sm font-medium text-gray-900">
                {{ app.borrowerName }}
              </td>
              <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                {{ formatMoney(app.requestedAmount) }} ₽
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">
                {{ app.broker?.fullName }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <TStatusBadge :status="app.status" />
                  <span
                    v-if="app.newInterestsCount"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffdd2d] text-[11px] font-semibold text-gray-900"
                    :title="`${app.newInterestsCount} новых откликов инвесторов`"
                  >
                    <UIcon name="i-heroicons-sparkles" class="w-3 h-3" />
                    {{ app.newInterestsCount }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ formatDate(app.createdAt) }}
              </td>
              <td class="px-6 py-4 text-right">
                <span class="text-sm font-medium text-[#428bf9] hover:text-[#126df7]">
                  Открыть →
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div v-if="applications?.data?.length" class="lg:hidden space-y-3">
        <NuxtLink
          v-for="app in applications.data"
          :key="app.id"
          :to="`/admin/applications/${app.id}`"
          class="block bg-white rounded-2xl p-4 border border-[#0010241f] hover:border-[#ffdd2d] transition-colors"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0">
              <p class="font-semibold text-gray-900 truncate">
                {{ app.borrowerName }}
              </p>
              <p class="text-base md:text-lg font-bold text-gray-900 mt-0.5 leading-tight">
                {{ formatMoney(app.requestedAmount) }} ₽
              </p>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <TStatusBadge :status="app.status" />
              <span
                v-if="app.newInterestsCount"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffdd2d] text-[11px] font-semibold text-gray-900"
              >
                <UIcon name="i-heroicons-sparkles" class="w-3 h-3" />
                {{ app.newInterestsCount }}
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-user" class="w-3.5 h-3.5" />
              {{ app.broker?.fullName }}
            </span>
            <span>{{ formatDate(app.createdAt) }}</span>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
