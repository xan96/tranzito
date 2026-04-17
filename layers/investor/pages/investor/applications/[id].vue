<script setup lang="ts">
definePageMeta({
  layout: 'investor',
  middleware: ['auth', 'role-investor'],
})

const route = useRoute()
const applicationId = route.params.id as string

const { data: application, pending, refresh } = useApi<{
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
    createdAt: string
    hasRequested: boolean
    documents: Array<{
      id: string
      fileName: string
    }>
  }
}>(`/api/applications/${applicationId}`)

const isRequesting = ref(false)
const hasRequested = computed(() => application.value?.data?.hasRequested ?? false)

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount)
}


function ltvTone(ltv: number) {
  if (ltv < 50) return { color: 'text-green-600', bg: 'bg-green-50', label: 'Низкий риск' }
  if (ltv < 70) return { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Средний риск' }
  return { color: 'text-red-600', bg: 'bg-red-50', label: 'Повышенный риск' }
}

async function requestDetails() {
  isRequesting.value = true
  try {
    await $fetch(`/api/applications/${applicationId}/interest`, { method: 'POST' })
    await refresh()
  } catch (error) {
    console.error('Failed to request details:', error)
  } finally {
    isRequesting.value = false
  }
}

const data = computed(() => application.value?.data)
const ltv = computed(() => data.value ? calculateLTV(Number(data.value.currentDebt), Number(data.value.marketValue)) : 0)
const profit = computed(() => data.value ? calculateExpectedReturn(Number(data.value.requestedAmount), data.value.loanTermDays) : 0)
const yieldPct = computed(() => data.value ? calculateYieldPercent(Number(data.value.requestedAmount), data.value.loanTermDays) : 0)
</script>

<template>
  <div class="px-4 md:px-6 py-6 space-y-4 md:space-y-6">
    <!-- Back -->
    <div>
      <NuxtLink
        to="/investor"
        class="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        К витрине
      </NuxtLink>
    </div>

    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-48 rounded-3xl" />
      <div class="grid md:grid-cols-3 gap-4">
        <USkeleton class="h-24 rounded-2xl" />
        <USkeleton class="h-24 rounded-2xl" />
        <USkeleton class="h-24 rounded-2xl" />
      </div>
      <USkeleton class="h-64 rounded-2xl" />
    </div>

    <template v-else-if="data">
      <!-- Hero -->
      <section class="bg-gradient-to-br from-[#ffdd2d] to-[#fab619] rounded-3xl p-5 md:p-10 relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10" />
        <div class="relative grid md:grid-cols-[1fr_auto] gap-5 md:gap-6 items-end">
          <div>
            <p class="text-sm font-medium text-gray-900/70 mb-2">
              Сумма инвестиции
            </p>
            <p class="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
              {{ formatMoney(Number(data.requestedAmount)) }} ₽
            </p>
            <p class="text-sm md:text-base text-gray-900/80 mt-2">
              На {{ data.loanTermDays }} дней · {{ yieldPct }}% ставка
            </p>
          </div>
          <div class="bg-white/25 backdrop-blur rounded-2xl p-4 md:p-5">
            <p class="text-xs text-gray-900/70 mb-1">Ожидаемый доход</p>
            <p class="text-xl md:text-3xl font-bold text-gray-900 leading-tight">
              +{{ formatMoney(profit) }} ₽
            </p>
          </div>
        </div>
      </section>

      <!-- Key metrics -->
      <section class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <TMetricCard
          label="LTV"
          :value="`${ltv}%`"
          :subtitle="ltvTone(ltv).label"
          :tone="ltv < 50 ? 'green' : ltv < 70 ? 'amber' : 'red'"
        />
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
          label="Доходность"
          :value="`${yieldPct}%`"
          :subtitle="`за ${data.loanTermDays} дн.`"
          tone="green"
          subtitle-tone="default"
        />
      </section>

      <div class="grid lg:grid-cols-3 gap-4 md:gap-6">
        <div class="lg:col-span-2 space-y-4 md:space-y-6">
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
              <div class="flex items-center justify-between py-3">
                <dt class="text-sm text-gray-500">Банк-залогодержатель</dt>
                <dd class="text-sm font-medium text-gray-900">
                  {{ data.bankAName }}
                </dd>
              </div>
              <div v-if="data.bankBInfo" class="flex items-start justify-between gap-4 py-3">
                <dt class="text-sm text-gray-500">Банк-рефинансер</dt>
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
                <dd class="text-sm font-medium text-gray-900">
                  {{ data.borrowerEmail }}
                </dd>
              </div>
            </dl>
          </TDetailSection>

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
                  <span class="flex-1 text-sm text-gray-900 truncate">
                    {{ doc.fileName }}
                  </span>
                  <UIcon
                    name="i-heroicons-arrow-down-tray"
                    class="w-5 h-5 text-gray-400 group-hover:text-[#428bf9] flex-shrink-0"
                  />
                </a>
              </li>
            </ul>
          </TDetailSection>
        </div>

        <!-- Sidebar -->
        <aside class="space-y-4 md:space-y-6">
          <!-- Action card -->
          <section class="bg-gray-900 text-white rounded-2xl p-5 md:p-6 lg:sticky lg:top-20">
            <h3 class="text-lg font-semibold mb-1">
              Заинтересовала заявка?
            </h3>
            <p class="text-sm text-white/70 mb-5">
              Менеджер свяжется с вами в ближайшее время и расскажет детали сделки.
            </p>

            <TButton
              v-if="!hasRequested"
              block
              size="lg"
              :loading="isRequesting"
              @click="requestDetails"
            >
              Связаться с менеджером
            </TButton>
            <div
              v-else
              class="flex items-start gap-3 bg-green-500/20 text-green-200 rounded-xl p-3"
            >
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium">
                  Запрос отправлен
                </p>
                <p class="text-xs mt-0.5 text-green-200/80">
                  Менеджер свяжется с вами в ближайшее время
                </p>
              </div>
            </div>

            <div class="mt-5 pt-5 border-t border-white/10 space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-white/60">Сумма</span>
                <span class="font-semibold">{{ formatMoney(Number(data.requestedAmount)) }} ₽</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-white/60">Срок</span>
                <span class="font-semibold">{{ data.loanTermDays }} дней</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-white/60">Доход</span>
                <span class="font-semibold text-[#ffdd2d]">+{{ formatMoney(profit) }} ₽</span>
              </div>
            </div>
          </section>

          <TDetailSection
            title="Гарантии"
            icon="i-heroicons-shield-check"
            icon-bg="bg-[#ffdd2d]/20"
            icon-color="text-[#fab619]"
          >
            <ul class="space-y-3 text-sm text-gray-700">
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-600 flex-shrink-0" />
                Обеспечение недвижимостью
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-600 flex-shrink-0" />
                Юридическая проверка
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-600 flex-shrink-0" />
                Фиксированная ставка
              </li>
            </ul>
          </TDetailSection>
        </aside>
      </div>
    </template>
  </div>
</template>
