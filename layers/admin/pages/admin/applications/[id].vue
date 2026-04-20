<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role-admin'],
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
    managerComment: string | null
    createdAt: string
    broker: {
      fullName: string
      email: string
      phone: string
    }
    documents: Array<{
      id: string
      fileName: string
      fileSize?: number
    }>
    statusHistory: Array<{
      id: string
      oldStatus: string | null
      newStatus: string
      comment: string | null
      changedAt: string
      changedBy: {
        fullName: string
      }
    }>
    interests: Array<{
      id: string
      status: InterestStatus
      createdAt: string
      investor: {
        id: string
        fullName: string
        email: string
        phone: string | null
      } | null
    }>
  }
}>(`/api/applications/${applicationId}`)

const allowedNextStatuses = computed<ApplicationStatus[]>(() => {
  const current = application.value?.data?.status as ApplicationStatus | undefined
  if (!current) return [...APPLICATION_STATUSES]
  return [current, ...APPLICATION_STATUS_TRANSITIONS[current]]
})

const statusSelectOptions = computed(() =>
  APPLICATION_STATUSES.map(value => ({
    value,
    label: APPLICATION_STATUS_LABELS[value],
    disabled: !allowedNextStatuses.value.includes(value),
  })),
)

const newInterests = computed(() =>
  application.value?.data?.interests?.filter(i => i.status === 'new') ?? [],
)

const isUpdating = ref(false)
const updateError = ref('')
const newStatus = ref('')
const newComment = ref('')

watch(application, (val) => {
  if (val?.data) {
    newStatus.value = val.data.status
    newComment.value = val.data.managerComment || ''
  }
}, { immediate: true })

const data = computed(() => application.value?.data)
const ltv = computed(() => data.value ? calculateLTV(Number(data.value.currentDebt), Number(data.value.marketValue)) : 0)

const hasChanges = computed(() => {
  const current = data.value
  if (!current) return false
  return newStatus.value !== current.status
    || newComment.value !== (current.managerComment || '')
})

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount)
}

function formatBytes(bytes?: number) {
  if (!bytes) return ''
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

function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ltvTone(ltv: number) {
  if (ltv < 50) return { color: 'text-green-600', label: 'Низкий риск' }
  if (ltv < 70) return { color: 'text-amber-600', label: 'Средний риск' }
  return { color: 'text-red-600', label: 'Повышенный риск' }
}

function statusLabel(s: string | null) {
  if (!s) return ''
  return APPLICATION_STATUS_LABELS[s as ApplicationStatus] || s
}

const interestUpdatingId = ref<string | null>(null)
const interestError = ref('')

async function updateInterestStatus(interestId: string, status: InterestStatus) {
  interestUpdatingId.value = interestId
  interestError.value = ''
  try {
    await $fetch(`/api/applications/${applicationId}/interests/${interestId}`, {
      method: 'PATCH',
      body: { status },
    })
    await refresh()
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }; statusMessage?: string }
    interestError.value = err?.data?.message || err?.statusMessage || 'Не удалось обновить статус интереса'
    console.error('Failed to update interest status:', error)
  } finally {
    interestUpdatingId.value = null
  }
}

async function updateApplication() {
  isUpdating.value = true
  updateError.value = ''
  try {
    await $fetch(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      body: {
        status: newStatus.value,
        managerComment: newComment.value,
      },
    })
    await refresh()
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }; statusMessage?: string }
    updateError.value = err?.data?.message || err?.statusMessage || 'Не удалось сохранить изменения'
    console.error('Failed to update application:', error)
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <div class="px-4 md:px-6 py-6 space-y-4 md:space-y-6">
    <!-- Back -->
    <div>
      <NuxtLink
        to="/admin"
        class="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        К списку
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
              Создана {{ formatDate(data.createdAt) }} · брокер {{ data.broker?.fullName }}
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

      <!-- Main + sidebar -->
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
                    <p v-if="doc.fileSize" class="text-xs text-gray-500">{{ formatBytes(doc.fileSize) }}</p>
                  </div>
                  <UIcon
                    name="i-heroicons-arrow-down-tray"
                    class="w-5 h-5 text-gray-400 group-hover:text-[#428bf9] flex-shrink-0"
                  />
                </a>
              </li>
            </ul>
          </TDetailSection>

          <!-- Investor interests -->
          <TDetailSection
            v-if="data.interests?.length"
            title="Интерес инвесторов"
            icon="i-heroicons-user-group"
            icon-bg="bg-green-50"
            icon-color="text-green-600"
          >
            <p
              v-if="newInterests.length"
              class="-mt-2 mb-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ffdd2d] text-xs font-semibold text-gray-900"
            >
              <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5" />
              {{ newInterests.length }}
              {{ newInterests.length === 1 ? 'новый отклик' : 'новых откликов' }}
            </p>
            <div
              v-if="interestError"
              class="mb-3 flex items-start gap-2 bg-red-50 text-red-700 rounded-xl px-3 py-2"
            >
              <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p class="text-xs leading-relaxed">
                {{ interestError }}
              </p>
            </div>
            <ul class="divide-y divide-gray-100">
              <li
                v-for="interest in data.interests"
                :key="interest.id"
                class="py-3 first:pt-0 last:pb-0"
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <p class="text-sm font-semibold text-gray-900 truncate">
                        {{ interest.investor?.fullName || 'Инвестор' }}
                      </p>
                      <span
                        v-if="interest.status === 'new'"
                        class="px-2 py-0.5 rounded-full bg-[#ffdd2d]/20 text-[#fab619] text-[11px] font-semibold flex-shrink-0"
                      >
                        {{ INTEREST_STATUS_LABELS.new }}
                      </span>
                      <span
                        v-else-if="interest.status === 'contacted'"
                        class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold flex-shrink-0"
                      >
                        {{ INTEREST_STATUS_LABELS.contacted }}
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold flex-shrink-0"
                      >
                        {{ INTEREST_STATUS_LABELS.closed }}
                      </span>
                    </div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                      <a
                        v-if="interest.investor?.email"
                        :href="`mailto:${interest.investor.email}`"
                        class="flex items-center gap-1 hover:text-gray-900"
                      >
                        <UIcon name="i-heroicons-envelope" class="w-3.5 h-3.5" />
                        {{ interest.investor.email }}
                      </a>
                      <a
                        v-if="interest.investor?.phone"
                        :href="`tel:${interest.investor.phone}`"
                        class="flex items-center gap-1 hover:text-gray-900"
                      >
                        <UIcon name="i-heroicons-phone" class="w-3.5 h-3.5" />
                        {{ interest.investor.phone }}
                      </a>
                    </div>
                  </div>
                  <span class="text-xs text-gray-400 flex-shrink-0">
                    {{ formatDateTime(interest.createdAt) }}
                  </span>
                </div>
                <div v-if="interest.status !== 'closed'" class="flex items-center gap-2">
                  <TButton
                    v-if="interest.status === 'new'"
                    size="sm"
                    variant="secondary"
                    :loading="interestUpdatingId === interest.id"
                    :disabled="interestUpdatingId !== null"
                    @click="updateInterestStatus(interest.id, 'contacted')"
                  >
                    Связались
                  </TButton>
                  <TButton
                    size="sm"
                    variant="ghost"
                    :loading="interestUpdatingId === interest.id"
                    :disabled="interestUpdatingId !== null"
                    @click="updateInterestStatus(interest.id, 'closed')"
                  >
                    Закрыть
                  </TButton>
                </div>
              </li>
            </ul>
          </TDetailSection>

          <!-- Status history -->
          <TDetailSection
            v-if="data.statusHistory?.length"
            title="История изменений"
            icon="i-heroicons-clock"
          >
            <ul class="space-y-4">
              <li
                v-for="(entry, idx) in data.statusHistory"
                :key="entry.id"
                class="flex gap-3"
              >
                <div class="flex flex-col items-center flex-shrink-0">
                  <div class="w-2.5 h-2.5 rounded-full bg-[#ffdd2d] mt-1.5" />
                  <div
                    v-if="idx < data.statusHistory.length - 1"
                    class="w-px flex-1 bg-gray-200 mt-1"
                  />
                </div>
                <div class="flex-1 pb-2 min-w-0">
                  <p class="text-sm text-gray-900">
                    <span v-if="entry.oldStatus" class="text-gray-500">{{ statusLabel(entry.oldStatus) }} → </span>
                    <strong>{{ statusLabel(entry.newStatus) }}</strong>
                  </p>
                  <p v-if="entry.comment" class="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                    {{ entry.comment }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ entry.changedBy?.fullName }} · {{ formatDateTime(entry.changedAt) }}
                  </p>
                </div>
              </li>
            </ul>
          </TDetailSection>
        </div>

        <!-- Sidebar -->
        <aside class="space-y-4 md:space-y-6">
          <TDetailSection
            title="Управление"
            icon="i-heroicons-cog-6-tooth"
            icon-bg="bg-[#ffdd2d]/20"
            icon-color="text-[#fab619]"
            class="lg:sticky lg:top-20 lg:z-10"
          >
            <div class="space-y-4">
              <TSelect
                v-model="newStatus"
                label="Статус"
                :options="statusSelectOptions"
              />
              <p class="text-xs text-gray-500 -mt-2">
                Доступные переходы из статуса «{{ statusLabel(data.status) }}»
                подсвечены активными.
              </p>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">
                  Комментарий для брокера
                </label>
                <textarea
                  v-model="newComment"
                  placeholder="Что сообщить брокеру..."
                  rows="4"
                  class="w-full px-4 py-3 rounded-xl text-sm text-gray-900 bg-[#f1eee8] hover:bg-[#ebe8e2] focus:bg-[#ebe8e2] focus:outline-none transition-colors resize-none"
                />
              </div>

              <TButton
                block
                size="lg"
                :variant="hasChanges ? 'primary' : 'secondary'"
                :disabled="!hasChanges"
                :loading="isUpdating"
                :class="hasChanges ? 'ring-2 ring-offset-2 ring-[#ffdd2d] shadow-lg shadow-[#ffdd2d]/30 animate-save-pulse' : ''"
                @click="updateApplication"
              >
                {{ hasChanges ? 'Сохранить изменения' : 'Нет изменений' }}
              </TButton>
              <p
                v-if="hasChanges && !updateError"
                class="text-xs text-[#fab619] font-medium text-center -mt-1"
              >
                Есть несохранённые изменения
              </p>
              <div
                v-if="updateError"
                class="flex items-start gap-2 bg-red-50 text-red-700 rounded-xl px-3 py-2 -mt-1"
              >
                <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p class="text-xs leading-relaxed">
                  {{ updateError }}
                </p>
              </div>
            </div>
          </TDetailSection>

          <TDetailSection title="Брокер" icon="i-heroicons-identification">
            <dl class="divide-y divide-gray-100">
              <div class="flex items-center justify-between py-3">
                <dt class="text-sm text-gray-500">ФИО</dt>
                <dd class="text-sm font-medium text-gray-900 truncate max-w-[60%]">
                  {{ data.broker?.fullName }}
                </dd>
              </div>
              <div class="flex items-center justify-between py-3">
                <dt class="text-sm text-gray-500">Email</dt>
                <dd class="text-sm font-medium text-gray-900 truncate max-w-[60%]">
                  {{ data.broker?.email }}
                </dd>
              </div>
              <div v-if="data.broker?.phone" class="flex items-center justify-between py-3">
                <dt class="text-sm text-gray-500">Телефон</dt>
                <dd class="text-sm font-medium text-gray-900">
                  {{ data.broker?.phone }}
                </dd>
              </div>
            </dl>
          </TDetailSection>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
@keyframes save-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 221, 45, 0.5), 0 10px 15px -3px rgba(255, 221, 45, 0.3);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 221, 45, 0), 0 10px 15px -3px rgba(255, 221, 45, 0.5);
  }
}

.animate-save-pulse {
  animation: save-pulse 1.6s ease-in-out infinite;
}
</style>
