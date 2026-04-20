<script setup lang="ts">
definePageMeta({
  layout: 'broker',
  middleware: ['auth', 'role-broker'],
})

const { user } = useAuth()

const { data: applications, pending } = useApi<{
  data: Array<{
    id: string
    borrowerName: string
    requestedAmount: number
    status: string
    createdAt: string
    managerComment: string | null
  }>
}>('/api/applications')

const statusFilter = ref('')

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

const list = computed(() => applications.value?.data ?? [])

const stats = computed(() => {
  const items = list.value
  const pending = items.filter(a => a.status === 'pending').length
  const approved = items.filter(a => ['approved', 'in_progress'].includes(a.status)).length
  const completed = items.filter(a => a.status === 'completed').length
  const totalAmount = items
    .filter(a => ['approved', 'in_progress', 'completed'].includes(a.status))
    .reduce((s, a) => s + Number(a.requestedAmount), 0)
  return { total: items.length, pending, approved, completed, totalAmount }
})

const statusTabs = [
  { value: '', label: 'Все' },
  { value: 'pending', label: 'На проверке' },
  { value: 'approved', label: 'Одобрены' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершены' },
  { value: 'rejected', label: 'Отклонены' },
]

function statusCount(value: string) {
  if (!value) return list.value.length
  return list.value.filter(a => a.status === value).length
}

const filtered = computed(() => {
  if (!statusFilter.value) return list.value
  return list.value.filter(a => a.status === statusFilter.value)
})

const greetingName = computed(() => {
  const name = user.value?.fullName || ''
  return name.split(' ')[1] || name.split(' ')[0] || 'брокер'
})
</script>

<template>
  <div class="px-4 md:px-6 py-6 space-y-6">
    <!-- Hero -->
    <section class="bg-gradient-to-br from-[#ffdd2d] to-[#fab619] rounded-3xl p-6 md:p-10 relative overflow-hidden">
      <div class="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10" />
      <div class="absolute -right-20 bottom-0 w-40 h-40 rounded-full bg-white/10" />
      <div class="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-gray-900/70 mb-1">
            Добрый день, {{ greetingName }}
          </p>
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Мои заявки
          </h1>
          <p class="text-gray-900/80 max-w-xl">
            Создавайте заявки для клиентов и отслеживайте их статусы на всех этапах.
          </p>
        </div>
        <TButton
          to="/broker/applications/new"
          icon="i-heroicons-plus"
          size="lg"
          variant="secondary"
        >
          Новая заявка
        </TButton>
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
        label="В процессе"
        :value="stats.pending + stats.approved"
        tone="amber"
      />
      <TStatCard
        icon="i-heroicons-check-badge"
        label="Завершено"
        :value="stats.completed"
        tone="green"
      />
      <TStatCard
        icon="i-heroicons-banknotes"
        label="Сумма одобренных"
        :value="`${formatCompact(stats.totalAmount)} ₽`"
        compact
      />
    </section>

    <!-- Tabs -->
    <TFilterPills
      v-model="statusFilter"
      :options="statusTabs.map(t => ({ ...t, count: statusCount(t.value) }))"
      layout="wrap"
    />

    <!-- List -->
    <section>
      <div v-if="pending" class="grid md:grid-cols-2 gap-4">
        <USkeleton v-for="i in 4" :key="i" class="h-32 rounded-2xl" />
      </div>

      <div
        v-else-if="!filtered.length"
        class="bg-white rounded-2xl border border-[#0010241f] py-16 text-center"
      >
        <div class="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
          <UIcon name="i-heroicons-document-text" class="w-8 h-8 text-gray-400" />
        </div>
        <p class="text-lg font-medium text-gray-900">
          {{ list.length ? 'Нет заявок с таким статусом' : 'У вас пока нет заявок' }}
        </p>
        <p class="text-sm text-gray-500 mt-1 mb-5">
          {{ list.length ? 'Попробуйте сменить фильтр' : 'Создайте первую заявку, чтобы начать работу' }}
        </p>
        <TButton v-if="!list.length" to="/broker/applications/new" icon="i-heroicons-plus">
          Создать заявку
        </TButton>
      </div>

      <div v-else class="grid md:grid-cols-2 gap-4">
        <NuxtLink
          v-for="app in filtered"
          :key="app.id"
          :to="`/broker/applications/${app.id}`"
          class="group bg-white rounded-2xl p-4 md:p-5 border border-[#0010241f] hover:border-[#ffdd2d] hover:shadow-lg hover:shadow-[#ffdd2d]/10 transition-all"
        >
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="min-w-0">
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Заёмщик
              </p>
              <p class="font-semibold text-gray-900 truncate">
                {{ app.borrowerName }}
              </p>
              <p class="text-xl md:text-2xl font-bold text-gray-900 mt-1 leading-tight">
                {{ formatMoney(app.requestedAmount) }} ₽
              </p>
            </div>
            <TStatusBadge :status="app.status" class="flex-shrink-0" />
          </div>

          <div
            v-if="app.managerComment"
            class="mt-3 pt-3 border-t border-gray-100 flex items-start gap-2"
          >
            <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-4 h-4 text-[#428bf9] flex-shrink-0 mt-0.5" />
            <p class="text-sm text-gray-600 line-clamp-2 flex-1">
              {{ app.managerComment }}
            </p>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <span class="text-xs text-gray-400">
              {{ formatDate(app.createdAt) }}
            </span>
            <span class="text-sm font-medium text-[#428bf9] group-hover:text-[#126df7] flex items-center gap-1">
              Открыть
              <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
