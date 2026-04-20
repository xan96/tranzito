<script setup lang="ts">
const { isAuthenticated, user } = useAuth()

const redirectPath = computed(() => {
  if (!user.value) return '/login'

  switch (user.value.role) {
    case 'broker':
      return '/broker'
    case 'investor':
      return '/investor'
    case 'admin':
      return '/admin'
    default:
      return '/login'
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f6f7f8]">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white border-b border-gray-200/60">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="flex items-center gap-2.5">
            <TLogo :size="36" />
            <h1 class="text-2xl font-bold text-gray-900">
              Tranzitum
            </h1>
          </NuxtLink>
          <nav class="hidden md:flex items-center gap-6">
            <a href="#how-it-works" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Как это работает
            </a>
            <a href="#for-brokers" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Для брокеров
            </a>
            <a href="#for-investors" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Для инвесторов
            </a>
          </nav>
        </div>
        <TButton
          v-if="isAuthenticated"
          :to="redirectPath"
          size="md"
        >
          В кабинет
        </TButton>
        <TButton
          v-else
          to="/login"
          size="md"
        >
          Войти
        </TButton>
      </div>
    </header>

    <!-- Hero section -->
    <section class="relative overflow-hidden bg-white">
      <!-- Yellow accent blob -->
      <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ffdd2d] rounded-full blur-[120px] opacity-30 -translate-y-1/2 translate-x-1/3" />
      <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#ffdd2d] rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/3" />

      <div class="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
        <div class="max-w-3xl">
          <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight break-words">
            Транзитное финансирование для сделок с недвижимостью
          </h2>
          <p class="text-lg md:text-xl text-gray-600 mt-6 max-w-2xl">
            Помогаем погасить ипотечный долг и снять обременение для продажи или рефинансирования недвижимости за {{ LOAN_TERM_RANGE_LABEL }} дней
          </p>
          <div v-if="isAuthenticated" class="flex flex-col sm:flex-row gap-4 mt-10">
            <TButton :to="redirectPath" size="xl">
              В кабинет
            </TButton>
            <TButton to="#how-it-works" variant="outline" size="xl">
              Узнать больше
            </TButton>
          </div>
          <div v-else class="mt-10 space-y-3">
            <div class="flex flex-col sm:flex-row gap-3">
              <TButton to="/register?role=broker" size="xl" class="sm:flex-1">
                Регистрация для брокеров
              </TButton>
              <TButton to="/register?role=investor" size="xl" class="sm:flex-1">
                Регистрация для инвесторов
              </TButton>
            </div>
            <p class="text-sm text-gray-500">
              Уже есть аккаунт?
              <NuxtLink to="/login" class="text-gray-900 font-medium hover:underline">
                Войти
              </NuxtLink>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats section -->
    <section class="bg-[#f6f7f8] py-16">
      <div class="max-w-6xl mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-gray-900">{{ LOAN_TERM_RANGE_LABEL }}</div>
            <div class="text-sm text-gray-500 mt-1">дней срок займа</div>
          </div>
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-gray-900">до 70%</div>
            <div class="text-sm text-gray-500 mt-1">LTV</div>
          </div>
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-gray-900">{{ DAILY_INTEREST_RATE * 100 }}%</div>
            <div class="text-sm text-gray-500 mt-1">ставка в день</div>
          </div>
          <div class="text-center">
            <div class="text-3xl md:text-4xl font-bold text-gray-900">24ч</div>
            <div class="text-sm text-gray-500 mt-1">одобрение</div>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how-it-works" class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-4">
        <h3 class="text-3xl font-bold text-center text-gray-900 mb-16">
          Как это работает
        </h3>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="relative">
            <div class="w-14 h-14 bg-[#ffdd2d] rounded-2xl flex items-center justify-center mb-5">
              <span class="text-2xl font-bold text-gray-900">1</span>
            </div>
            <h4 class="text-xl font-semibold text-gray-900 mb-3">
              Подача заявки
            </h4>
            <p class="text-gray-600 leading-relaxed">
              Брокер заполняет заявку с данными заёмщика, объекта недвижимости и прикладывает документы
            </p>
          </div>

          <div class="relative">
            <div class="w-14 h-14 bg-[#ffdd2d] rounded-2xl flex items-center justify-center mb-5">
              <span class="text-2xl font-bold text-gray-900">2</span>
            </div>
            <h4 class="text-xl font-semibold text-gray-900 mb-3">
              Финансирование
            </h4>
            <p class="text-gray-600 leading-relaxed">
              Инвестор выбирает заявку на витрине и предоставляет средства для погашения долга
            </p>
          </div>

          <div class="relative">
            <div class="w-14 h-14 bg-[#ffdd2d] rounded-2xl flex items-center justify-center mb-5">
              <span class="text-2xl font-bold text-gray-900">3</span>
            </div>
            <h4 class="text-xl font-semibold text-gray-900 mb-3">
              Завершение сделки
            </h4>
            <p class="text-gray-600 leading-relaxed">
              После продажи или рефинансирования инвестор получает возврат тела займа и проценты
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- For brokers -->
    <section id="for-brokers" class="py-20 bg-[#f6f7f8]">
      <div class="max-w-5xl mx-auto px-4">
        <div class="bg-white rounded-3xl p-6 md:p-12">
          <div class="w-14 h-14 bg-[#ffdd2d] rounded-xl flex items-center justify-center mb-6">
            <svg class="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Для брокеров
          </h3>
          <p class="text-gray-600 text-lg mb-8 max-w-2xl">
            Закройте задачу клиента с просроченной ипотекой за несколько дней и получите комиссию с каждой сделки.
          </p>
          <ul class="space-y-4 max-w-2xl">
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Быстрое оформление заявок через удобные формы</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Отслеживание статуса заявок в реальном времени</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Доступ к широкому пулу инвесторов — без поиска и переговоров</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Уведомления о всех изменениях по заявкам</span>
            </li>
          </ul>
          <TButton :to="isAuthenticated ? '/broker' : '/register?role=broker'" class="mt-8" size="lg">
            {{ isAuthenticated ? 'В кабинет' : 'Стать брокером' }}
          </TButton>
        </div>
      </div>
    </section>

    <!-- For investors -->
    <section id="for-investors" class="py-20 bg-white">
      <div class="max-w-5xl mx-auto px-4">
        <div class="bg-[#fffde6] rounded-3xl p-6 md:p-12">
          <div class="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-7 h-7 text-[#ffdd2d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Для инвесторов
          </h3>
          <p class="text-gray-600 text-lg mb-8 max-w-2xl">
            Короткие займы под залог недвижимости с доходностью до 36% годовых — понятные сделки и прозрачные условия.
          </p>
          <ul class="space-y-4 max-w-2xl">
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Прозрачные условия и полная документация по каждой заявке</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Короткий срок инвестирования — от {{ LOAN_TERM_MIN_DAYS }} до {{ LOAN_TERM_MAX_DAYS }} дней</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Обеспечение недвижимостью с низким LTV</span>
            </li>
            <li class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Доходность до 36% годовых</span>
            </li>
          </ul>
          <TButton :to="isAuthenticated ? '/investor' : '/register?role=investor'" class="mt-8" size="lg">
            {{ isAuthenticated ? 'В кабинет' : 'Стать инвестором' }}
          </TButton>
        </div>
      </div>
    </section>

    <!-- CTA section -->
    <section class="py-20 bg-white">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h3 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Готовы начать?
        </h3>
        <p class="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Присоединяйтесь к платформе Tranzitum и получите доступ к быстрому транзитному финансированию
        </p>
        <TButton :to="isAuthenticated ? redirectPath : '/register'" size="xl">
          {{ isAuthenticated ? 'В кабинет' : 'Зарегистрироваться' }}
        </TButton>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
      <div class="max-w-6xl mx-auto px-4">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-2.5">
            <TLogo :size="32" />
            <div class="text-2xl font-bold">Tranzitum</div>
          </div>
          <div class="text-gray-400 text-sm">
            &copy; 2026 Tranzitum. Все права защищены.
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
