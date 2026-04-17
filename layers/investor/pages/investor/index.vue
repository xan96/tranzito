<script setup lang="ts">
definePageMeta({
  layout: 'investor',
  middleware: ['auth', 'role-investor'],
})

const { user } = useAuth()

const { data: applications, pending } = useApi<{
  data: Array<{
    id: string
    requestedAmount: number
    loanTermDays: number
    marketValue: number
    currentDebt: number
    propertyAddress: string
    createdAt: string
  }>
}>('/api/applications?status=approved')

const sortBy = ref<SortBy>('new')
const showCollateralInfo = ref(false)
const showKnowledgeBase = ref(false)
const showHowItWorks = ref(false)

const dailyRatePercent = DAILY_INTEREST_RATE * 100

const howItWorksSteps = [
  {
    icon: 'i-heroicons-magnifying-glass',
    title: 'Выберите заявку в витрине',
    description:
      'Все заявки уже проверены менеджерами: документы, LTV, кредитная история заёмщика. Оцените параметры — сумму, срок, LTV, доходность — и нажмите «Инвестировать».',
    circleClass: 'bg-[#ffdd2d] text-gray-900',
  },
  {
    icon: 'i-heroicons-document-check',
    title: 'Менеджер организует сделку',
    description:
      'Мы оформляем ипотеку в Росреестре в вашу пользу, готовим договор займа и согласовываем его с заёмщиком. Всё юридическое сопровождение — на нас.',
    circleClass: 'bg-[#ffdd2d] text-gray-900',
  },
  {
    icon: 'i-heroicons-banknotes',
    title: 'Перечислите средства',
    description:
      'После регистрации залога вы переводите сумму заёмщику по реквизитам из договора. Обременение уже защищает вашу позицию.',
    circleClass: 'bg-[#ffdd2d] text-gray-900',
  },
  {
    icon: 'i-heroicons-check-circle',
    title: 'Получите возврат с процентами',
    description:
      `Через ${LOAN_TERM_RANGE_LABEL} дней заёмщик рефинансируется в другом банке и возвращает сумму + проценты (${dailyRatePercent}% в день). Залог снимается, сделка закрыта.`,
    circleClass: 'bg-green-500 text-white',
  },
]

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount)
}

function formatCompact(amount: number) {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace('.0', '') + ' млн'
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + ' тыс'
  return String(amount)
}

function shortenAddress(address: string) {
  if (address.length <= 50) return address
  return address.substring(0, 50) + '...'
}

function ltvColor(ltv: number) {
  if (ltv < 50) return 'text-green-600 bg-green-50'
  if (ltv < 70) return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

const list = computed(() => applications.value?.data ?? [])

const stats = computed(() => {
  const items = list.value
  if (!items.length) return null
  const totalAmount = items.reduce((s, a) => s + Number(a.requestedAmount), 0)
  const avgLtv = items.reduce((s, a) => s + calculateLTV(Number(a.currentDebt), Number(a.marketValue)), 0) / items.length
  const avgTerm = Math.round(items.reduce((s, a) => s + a.loanTermDays, 0) / items.length)
  const avgYield = items.reduce((s, a) => s + calculateYieldPercent(Number(a.requestedAmount), a.loanTermDays), 0) / items.length
  return {
    count: items.length,
    totalAmount,
    avgLtv: avgLtv.toFixed(1),
    avgTerm,
    avgYield: avgYield.toFixed(1),
  }
})

const sortedList = computed(() => {
  const items = [...list.value]
  switch (sortBy.value) {
    case 'amount':
      return items.sort((a, b) => Number(b.requestedAmount) - Number(a.requestedAmount))
    case 'yield':
      return items.sort((a, b) =>
        calculateYieldPercent(Number(b.requestedAmount), b.loanTermDays)
        - calculateYieldPercent(Number(a.requestedAmount), a.loanTermDays))
    case 'ltv':
      return items.sort((a, b) =>
        calculateLTV(Number(a.currentDebt), Number(a.marketValue))
        - calculateLTV(Number(b.currentDebt), Number(b.marketValue)))
    default:
      return items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }
})

type SortBy = 'new' | 'amount' | 'yield' | 'ltv'

const sortOptions: Array<{ value: SortBy; label: string }> = [
  { value: 'new', label: 'Сначала новые' },
  { value: 'amount', label: 'По сумме' },
  { value: 'yield', label: 'По доходности' },
  { value: 'ltv', label: 'По LTV' },
]

const greetingName = computed(() => {
  const name = user.value?.fullName || ''
  return name.split(' ')[1] || name.split(' ')[0] || 'инвестор'
})
</script>

<template>
  <div class="px-4 md:px-6 py-6 space-y-6">
    <!-- Hero -->
    <section class="bg-gradient-to-br from-[#ffdd2d] to-[#fab619] rounded-3xl p-6 md:p-10 relative overflow-hidden">
      <div class="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10" />
      <div class="absolute -right-20 bottom-0 w-40 h-40 rounded-full bg-white/10" />
      <div class="relative">
        <p class="text-sm font-medium text-gray-900/70 mb-1">
          Добрый день, {{ greetingName }}
        </p>
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Витрина заявок
        </h1>
        <p class="text-gray-900/80 max-w-xl">
          Транзитное финансирование ипотечных долгов. Фиксированная доходность, обеспечение недвижимостью.
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <TButton
            size="md"
            variant="secondary"
            icon="i-heroicons-academic-cap"
            @click="showHowItWorks = true"
          >
            Как это работает
          </TButton>
          <TButton
            size="md"
            variant="ghost"
            icon="i-heroicons-book-open"
            @click="showKnowledgeBase = true"
          >
            База знаний
          </TButton>
        </div>
      </div>
    </section>

    <!-- Portfolio stats -->
    <section v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <TStatCard
        icon="i-heroicons-rectangle-stack"
        label="Доступно заявок"
        :value="stats.count"
      />
      <TStatCard
        icon="i-heroicons-banknotes"
        label="Общая сумма"
        :value="`${formatCompact(stats.totalAmount)} ₽`"
        compact
      />
      <TStatCard
        icon="i-heroicons-arrow-trending-up"
        label="Средняя доходность"
        :value="`${stats.avgYield}%`"
        tone="green"
      />
      <TStatCard
        icon="i-heroicons-calendar-days"
        label="Средний срок"
      >
        {{ stats.avgTerm }} <span class="text-base font-medium text-gray-500">дн.</span>
      </TStatCard>
    </section>

    <!-- Toolbar -->
    <section class="space-y-3 md:flex md:items-center md:justify-between md:gap-3 md:space-y-0">
      <h2 class="text-xl md:text-2xl font-semibold text-gray-900">
        Все заявки
      </h2>
      <TFilterPills
        v-model="sortBy"
        :options="sortOptions"
        layout="wrap"
      />
    </section>

    <!-- List -->
    <section>
      <div v-if="pending" class="grid md:grid-cols-2 gap-4">
        <USkeleton v-for="i in 4" :key="i" class="h-48 rounded-2xl" />
      </div>

      <div v-else-if="!sortedList.length" class="bg-white rounded-2xl border border-[#0010241f] py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
          <UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-gray-400" />
        </div>
        <p class="text-lg font-medium text-gray-900">
          Пока нет доступных заявок
        </p>
        <p class="text-sm text-gray-500 mt-1">
          Новые предложения появятся здесь после одобрения
        </p>
      </div>

      <div v-else class="grid md:grid-cols-2 gap-4">
        <NuxtLink
          v-for="app in sortedList"
          :key="app.id"
          :to="`/investor/applications/${app.id}`"
          class="group bg-white rounded-2xl p-4 md:p-5 border border-[#0010241f] hover:border-[#ffdd2d] hover:shadow-lg hover:shadow-[#ffdd2d]/10 transition-all"
        >
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="min-w-0">
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Сумма инвестиции
              </p>
              <p class="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {{ formatMoney(Number(app.requestedAmount)) }} <span class="text-base md:text-xl">₽</span>
              </p>
            </div>
            <span
              class="px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0"
              :class="ltvColor(calculateLTV(Number(app.currentDebt), Number(app.marketValue)))"
            >
              LTV {{ calculateLTV(Number(app.currentDebt), Number(app.marketValue)) }}%
            </span>
          </div>

          <div class="grid grid-cols-3 gap-3 py-4 border-y border-gray-100">
            <div>
              <p class="text-xs text-gray-500 mb-0.5">Срок</p>
              <p class="text-sm font-semibold text-gray-900">
                {{ app.loanTermDays }} дн.
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-0.5">Доход</p>
              <p class="text-sm font-semibold text-green-600">
                +{{ formatCompact(calculateExpectedReturn(Number(app.requestedAmount), app.loanTermDays)) }} ₽
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-0.5">Ставка</p>
              <p class="text-sm font-semibold text-gray-900">
                {{ calculateYieldPercent(Number(app.requestedAmount), app.loanTermDays) }}%
              </p>
            </div>
          </div>

          <div class="flex items-start gap-2 mt-4">
            <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-gray-600 flex-1">
              {{ shortenAddress(app.propertyAddress) }}
            </p>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <span class="text-xs text-gray-400">
              {{ new Date(app.createdAt).toLocaleDateString('ru-RU') }}
            </span>
            <span class="text-sm font-medium text-[#428bf9] group-hover:text-[#126df7] flex items-center gap-1">
              Подробнее
              <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Info promo -->
    <section class="grid md:grid-cols-2 gap-4 mt-2">
      <div class="bg-gray-900 text-white rounded-3xl p-6 md:p-8">
        <div class="w-12 h-12 rounded-xl bg-[#ffdd2d] flex items-center justify-center mb-4">
          <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-gray-900" />
        </div>
        <h3 class="text-xl font-bold mb-2">
          Обеспечение недвижимостью
        </h3>
        <p class="text-white/70 text-sm mb-4">
          Каждая сделка обеспечена недвижимостью заёмщика. Юридическая проверка включена.
        </p>
        <button
          type="button"
          class="text-[#ffdd2d] hover:text-white text-sm font-medium flex items-center gap-1 transition-colors"
          @click="showCollateralInfo = true"
        >
          Узнать больше
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
        </button>
      </div>

      <div class="bg-white rounded-3xl p-6 md:p-8 border border-[#0010241f]">
        <div class="w-12 h-12 rounded-xl bg-[#428bf9]/10 flex items-center justify-center mb-4">
          <UIcon name="i-heroicons-academic-cap" class="w-6 h-6 text-[#428bf9]" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">
          Обучение для инвесторов
        </h3>
        <p class="text-gray-600 text-sm mb-4">
          Бесплатные материалы о транзитном финансировании, оценке рисков и анализе заявок.
        </p>
        <button
          type="button"
          class="text-[#428bf9] hover:text-[#126df7] text-sm font-medium flex items-center gap-1 transition-colors"
          @click="showKnowledgeBase = true"
        >
          Открыть базу знаний
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
        </button>
      </div>
    </section>

    <!-- Collateral info modal -->
    <TInfoModal
      v-model="showCollateralInfo"
      title="Обеспечение недвижимостью"
      subtitle="Как защищены инвестиции"
      icon="i-heroicons-shield-check"
    >
      <TInfoSection icon="i-heroicons-home-modern" title="Что в залоге">
        <p>
          Квартиры и апартаменты заёмщика в крупных городах РФ. Коммерческая
          недвижимость и земельные участки — после дополнительной оценки.
          Права требования и доли не принимаются.
        </p>
      </TInfoSection>

      <TInfoSection icon="i-heroicons-scale" title="LTV и лимиты">
        <ul class="space-y-1 pl-1">
          <li class="flex items-start gap-2">
            <span class="text-[#fab619]">•</span>
            <span>Максимум <strong>70%</strong> от рыночной стоимости объекта</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#fab619]">•</span>
            <span>Средний LTV по портфелю — <strong>55–60%</strong></span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#fab619]">•</span>
            <span>Рыночная стоимость подтверждается независимой оценкой</span>
          </li>
        </ul>
      </TInfoSection>

      <TInfoSection icon="i-heroicons-document-check" title="Оформление обременения">
        <p>
          Ипотека регистрируется в Росреестре в пользу инвестора до перечисления
          средств. Снятие возможно только при полном погашении займа. Выписка из
          ЕГРН подтверждает залог.
        </p>
      </TInfoSection>

      <TInfoSection icon="i-heroicons-clipboard-document-list" title="Юридическая проверка">
        <ul class="space-y-1 pl-1">
          <li class="flex items-start gap-2">
            <span class="text-[#fab619]">•</span>
            <span>Чистота объекта — история сделок, обременения, аресты</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#fab619]">•</span>
            <span>Подтверждение права собственности заёмщика</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#fab619]">•</span>
            <span>Согласие супруга, отсутствие несовершеннолетних собственников</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#fab619]">•</span>
            <span>Проверка заёмщика по базам ФССП, банкротства, розыска</span>
          </li>
        </ul>
      </TInfoSection>

      <TInfoSection
        icon="i-heroicons-exclamation-triangle"
        title="При дефолте заёмщика"
        variant="warning"
      >
        <p>
          Если заёмщик не исполняет обязательства, инвестор обращает взыскание на
          предмет залога через суд. Средства от реализации объекта направляются
          на погашение займа и процентов. Низкий LTV создаёт запас на издержки и
          возможное снижение цены.
        </p>
      </TInfoSection>
    </TInfoModal>

    <!-- Knowledge base modal -->
    <TInfoModal
      v-model="showKnowledgeBase"
      title="База знаний для инвестора"
      subtitle="Что нужно понимать перед инвестированием"
      icon="i-heroicons-academic-cap"
      icon-bg="bg-[#428bf9]/10"
      icon-color="text-[#428bf9]"
    >
      <TInfoSection icon="i-heroicons-light-bulb" title="Что такое транзитное финансирование">
        <p>
          Это короткий заём (обычно {{ LOAN_TERM_RANGE_LABEL }} дней), который заёмщик берёт под залог
          своей недвижимости, чтобы погасить старую ипотеку и получить
          предодобрение в другом банке на более выгодных условиях.
          После рефинансирования в банке Б заёмщик возвращает заём инвестору.
        </p>
      </TInfoSection>

      <TInfoSection icon="i-heroicons-chart-bar" title="Как считается доходность">
        <ul class="space-y-1 pl-1">
          <li class="flex items-start gap-2">
            <span class="text-[#428bf9]">•</span>
            <span>Ставка — <strong>{{ dailyRatePercent }}% в день</strong> на основную сумму</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#428bf9]">•</span>
            <span>
              Пропорциональна сроку: займ на {{ LOAN_TERM_MIN_DAYS }} дней = {{ dailyRatePercent * LOAN_TERM_MIN_DAYS }}%,
              на {{ LOAN_TERM_MAX_DAYS }} = {{ dailyRatePercent * LOAN_TERM_MAX_DAYS }}%
            </span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#428bf9]">•</span>
            <span>Годовая эффективная доходность при реинвестировании — <strong>{{ (dailyRatePercent * 365).toFixed(0) }}%</strong></span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#428bf9]">•</span>
            <span>Проценты выплачиваются единовременно в конце срока</span>
          </li>
        </ul>
      </TInfoSection>

      <TInfoSection icon="i-heroicons-magnifying-glass" title="Как оценивать заявку">
        <ul class="space-y-2 pl-1">
          <li class="flex items-start gap-2">
            <span class="text-[#428bf9]">•</span>
            <span>
              <strong>LTV ниже — безопаснее.</strong> LTV &lt;50% — зелёная зона,
              50–70% — средний риск, &gt;70% не кредитуем.
            </span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#428bf9]">•</span>
            <span>
              <strong>Срок короче — оборачиваемость выше.</strong> Предпочтительны
              займы на {{ LOAN_TERM_MIN_DAYS }}–{{ LOAN_TERM_DEFAULT_DAYS }} дней: быстрее возврат, меньше рыночных рисков.
            </span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#428bf9]">•</span>
            <span>
              <strong>Наличие Банка Б.</strong> Подтверждённое предодобрение в
              другом банке сильно снижает риск — источник возврата понятен.
            </span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-[#428bf9]">•</span>
            <span>
              <strong>Тип недвижимости.</strong> Квартиры в городах-миллионниках
              ликвиднее апартаментов или загородной недвижимости.
            </span>
          </li>
        </ul>
      </TInfoSection>

      <TInfoSection icon="i-heroicons-cog-6-tooth" title="Жизненный цикл сделки">
        <ol class="space-y-2 pl-1">
          <li class="flex items-start gap-2">
            <span class="font-semibold text-[#428bf9] min-w-[1.5rem]">1.</span>
            <span>Брокер создаёт заявку, менеджер проверяет документы и одобряет</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="font-semibold text-[#428bf9] min-w-[1.5rem]">2.</span>
            <span>Вы выбираете заявку в витрине и подтверждаете интерес</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="font-semibold text-[#428bf9] min-w-[1.5rem]">3.</span>
            <span>Менеджер организует сделку: регистрация ипотеки в Росреестре</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="font-semibold text-[#428bf9] min-w-[1.5rem]">4.</span>
            <span>После регистрации обременения вы перечисляете средства заёмщику</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="font-semibold text-[#428bf9] min-w-[1.5rem]">5.</span>
            <span>Заёмщик рефинансируется в Банке Б и возвращает сумму + проценты</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="font-semibold text-[#428bf9] min-w-[1.5rem]">6.</span>
            <span>Снятие обременения, сделка закрыта</span>
          </li>
        </ol>
      </TInfoSection>

      <TInfoSection icon="i-heroicons-receipt-percent" title="Налогообложение">
        <p>
          Доход с процентов по займам облагается НДФЛ 13% (15% на сумму свыше
          5 млн в год). Для физлиц удобно работать через ИП на УСН 6% или
          самозанятость — при соблюдении лимитов. Мы предоставим документы для
          налоговой по каждой сделке.
        </p>
      </TInfoSection>

      <TInfoSection
        icon="i-heroicons-shield-exclamation"
        title="Риски, о которых важно помнить"
        variant="warning"
      >
        <ul class="space-y-1 pl-1">
          <li class="flex items-start gap-2">
            <span class="text-amber-600">•</span>
            <span>Заёмщику откажут в Банке Б — срок займа может затянуться</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-600">•</span>
            <span>Падение цен на недвижимость между выдачей и взысканием</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-600">•</span>
            <span>Судебное взыскание при дефолте — 6–12 месяцев, требует издержек</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-600">•</span>
            <span>Диверсифицируйте: не вкладывайте больше 10–20% капитала в одну сделку</span>
          </li>
        </ul>
      </TInfoSection>
    </TInfoModal>

    <!-- How it works modal -->
    <TInfoModal
      v-model="showHowItWorks"
      title="Как это работает"
      subtitle="4 шага от выбора заявки до возврата средств"
      icon="i-heroicons-academic-cap"
    >
      <div class="space-y-4">
        <div
          v-for="(step, idx) in howItWorksSteps"
          :key="idx"
          class="flex gap-4"
        >
          <div class="flex flex-col items-center flex-shrink-0">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              :class="step.circleClass"
            >
              {{ idx + 1 }}
            </div>
            <div
              v-if="idx < howItWorksSteps.length - 1"
              class="w-0.5 flex-1 mt-2 bg-gradient-to-b from-[#ffdd2d] to-gray-200"
            />
          </div>
          <div class="flex-1 pb-2">
            <div class="flex items-center gap-2 mb-1">
              <UIcon :name="step.icon" class="w-5 h-5 text-[#fab619]" />
              <h3 class="font-semibold text-gray-900">
                {{ step.title }}
              </h3>
            </div>
            <p class="text-sm text-gray-600">
              {{ step.description }}
            </p>
          </div>
        </div>
      </div>

      <TInfoSection
        icon="i-heroicons-sparkles"
        title="Главное преимущество"
        variant="warning"
      >
        <p>
          Вы получаете фиксированный доход с первого дня, а недвижимость в залоге
          защищает капитал. Никаких скрытых комиссий — всё прозрачно, с юридическим
          сопровождением от платформы.
        </p>
      </TInfoSection>
    </TInfoModal>
  </div>
</template>
