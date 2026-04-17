<script setup lang="ts">
definePageMeta({
  layout: 'broker',
  middleware: ['auth', 'role-broker'],
})

const route = useRoute()
const applicationId = route.params.id as string

const { data: application, pending } = useApi<{
  data: {
    id: string
    borrowerName: string
    borrowerPhone: string
    borrowerEmail: string | null
    propertyAddress: string
    cadastralNumber: string | null
    marketValue: number
    currentDebt: number
    bankAName: string
    requestedAmount: number
    loanTermDays: number
    bankBInfo: string | null
    status: string
    managerComment: string | null
    createdAt: string
    documents: Array<{
      id: string
      fileName: string
      fileSize: number
    }>
  }
}>(`/api/applications/${applicationId}`)

const data = computed(() => application.value?.data)
const ltv = computed(() => data.value ? calculateLTV(Number(data.value.currentDebt), Number(data.value.marketValue)) : 0)

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount)
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ltvTone(ltv: number) {
  if (ltv < 50) return { color: 'text-green-600', label: 'Низкий риск' }
  if (ltv < 70) return { color: 'text-amber-600', label: 'Средний риск' }
  return { color: 'text-red-600', label: 'Повышенный риск' }
}
</script>

<template>
  <div class="px-4 md:px-6 py-6 space-y-4 md:space-y-6">
    <!-- Back -->
    <div>
      <NuxtLink
        to="/broker"
        class="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        К заявкам
      </NuxtLink>
    </div>

    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-40 rounded-3xl" />
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <USkeleton v-for="i in 4" :key="i" class="h-24 rounded-2xl" />
      </div>
      <USkeleton class="h-64 rounded-2xl" />
    </div>

    <template v-else-if="data">
      <!-- Hero -->
      <section class="bg-white rounded-3xl p-5 md:p-8 border border-[#0010241f]">
        <div class="flex flex-wrap items-start justify-between gap-3 mb-5 md:mb-6">
          <div class="min-w-0">
            <p class="text-sm text-gray-500 mb-1">
              Заявка № {{ data.id.slice(0, 8).toUpperCase() }}
            </p>
            <h1 class="text-xl md:text-3xl font-bold text-gray-900 break-words">
              {{ data.borrowerName }}
            </h1>
            <p class="text-xs md:text-sm text-gray-500 mt-1">
              Создана {{ formatDate(data.createdAt) }}
            </p>
          </div>
          <TStatusBadge :status="data.status" />
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div class="min-w-0">
            <p class="text-xs text-gray-500 mb-1">Сумма</p>
            <p class="text-lg md:text-3xl font-bold text-gray-900 leading-tight">
              {{ formatMoney(Number(data.requestedAmount)) }} <span class="text-sm md:text-lg">₽</span>
            </p>
          </div>
          <div class="min-w-0">
            <p class="text-xs text-gray-500 mb-1">Срок</p>
            <p class="text-lg md:text-3xl font-bold text-gray-900 leading-tight">
              {{ data.loanTermDays }} <span class="text-sm md:text-base font-medium text-gray-500">дней</span>
            </p>
          </div>
          <div class="col-span-2 md:col-span-1 min-w-0">
            <p class="text-xs text-gray-500 mb-1">LTV</p>
            <p class="text-lg md:text-3xl font-bold" :class="ltvTone(ltv).color">
              {{ ltv }}%
            </p>
            <p class="text-xs mt-0.5" :class="ltvTone(ltv).color">
              {{ ltvTone(ltv).label }}
            </p>
          </div>
        </div>
      </section>

      <!-- Manager comment -->
      <section
        v-if="data.managerComment"
        class="bg-[#428bf9]/5 border border-[#428bf9]/20 rounded-2xl p-5 md:p-6"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-[#428bf9]/15 flex items-center justify-center flex-shrink-0">
            <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-5 h-5 text-[#428bf9]" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 mb-1">
              Комментарий менеджера
            </p>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">
              {{ data.managerComment }}
            </p>
          </div>
        </div>
      </section>

      <!-- Key metrics -->
      <section class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <TMetricCard
          label="Стоимость объекта"
          :value="formatMoney(Number(data.marketValue))"
          subtitle="₽"
          compact
        />
        <TMetricCard
          label="Текущий долг"
          :value="formatMoney(Number(data.currentDebt))"
          subtitle="₽"
          compact
        />
        <TMetricCard
          label="Банк-залогодержатель"
          truncate
        >
          <span class="text-sm md:text-lg">{{ data.bankAName }}</span>
        </TMetricCard>
        <TMetricCard
          label="Документов"
          :value="data.documents?.length || 0"
          subtitle="загружено"
        />
      </section>

      <!-- Main sections -->
      <div class="grid lg:grid-cols-2 gap-4 md:gap-6">
        <TDetailSection
          title="Объект недвижимости"
          icon="i-heroicons-building-office"
          icon-bg="bg-[#428bf9]/10"
          icon-color="text-[#428bf9]"
        >
          <dl class="divide-y divide-gray-100">
            <div class="flex items-start justify-between gap-4 py-3">
              <dt class="text-sm text-gray-500">Адрес</dt>
              <dd class="text-sm font-medium text-gray-900 text-right max-w-[60%]">
                {{ data.propertyAddress }}
              </dd>
            </div>
            <div v-if="data.cadastralNumber" class="flex items-center justify-between py-3">
              <dt class="text-sm text-gray-500">Кадастровый номер</dt>
              <dd class="text-sm font-medium text-gray-900">
                {{ data.cadastralNumber }}
              </dd>
            </div>
            <div v-if="data.bankBInfo" class="flex items-start justify-between gap-4 py-3">
              <dt class="text-sm text-gray-500">Банк Б</dt>
              <dd class="text-sm font-medium text-gray-900 text-right max-w-[60%]">
                {{ data.bankBInfo }}
              </dd>
            </div>
          </dl>
        </TDetailSection>

        <TDetailSection title="Заёмщик" icon="i-heroicons-user">
          <dl class="divide-y divide-gray-100">
            <div class="flex items-center justify-between py-3">
              <dt class="text-sm text-gray-500">ФИО</dt>
              <dd class="text-sm font-medium text-gray-900">
                {{ data.borrowerName }}
              </dd>
            </div>
            <div class="flex items-center justify-between py-3">
              <dt class="text-sm text-gray-500">Телефон</dt>
              <dd class="text-sm font-medium text-gray-900">
                {{ data.borrowerPhone }}
              </dd>
            </div>
            <div v-if="data.borrowerEmail" class="flex items-center justify-between py-3">
              <dt class="text-sm text-gray-500">Email</dt>
              <dd class="text-sm font-medium text-gray-900 truncate max-w-[60%]">
                {{ data.borrowerEmail }}
              </dd>
            </div>
          </dl>
        </TDetailSection>
      </div>

      <!-- Documents -->
      <TDetailSection
        v-if="data.documents?.length"
        title="Документы"
        icon="i-heroicons-document-text"
      >
        <ul class="space-y-2">
          <li v-for="doc in data.documents" :key="doc.id">
            <a
              :href="`/api/documents/${doc.id}`"
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div class="w-9 h-9 rounded-lg bg-[#428bf9]/10 flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-document" class="w-5 h-5 text-[#428bf9]" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 truncate">{{ doc.fileName }}</p>
                <p class="text-xs text-gray-500">{{ formatBytes(doc.fileSize) }}</p>
              </div>
              <UIcon
                name="i-heroicons-arrow-down-tray"
                class="w-5 h-5 text-gray-400 group-hover:text-[#428bf9] flex-shrink-0"
              />
            </a>
          </li>
        </ul>
      </TDetailSection>
    </template>
  </div>
</template>
