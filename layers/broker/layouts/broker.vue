<script setup lang="ts">
const { user, logout } = useAuth()

const navigation = [
  { label: 'Заявки', to: '/broker', icon: 'i-heroicons-document-text' },
  { label: 'Новая', to: '/broker/applications/new', icon: 'i-heroicons-plus-circle' },
]

const initials = computed(() => {
  const name = user.value?.fullName || ''
  return name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'Б'
})
</script>

<template>
  <div class="min-h-screen bg-[#f6f7f8]">
    <!-- Top header -->
    <header class="bg-white border-b border-[#0010241f] sticky top-0 z-40">
      <div class="max-w-[1240px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <div class="flex items-center gap-8">
          <NuxtLink to="/broker" class="flex items-center gap-2">
            <TLogo :size="32" />
            <span class="font-semibold text-gray-900 hidden sm:block">Транзито</span>
            <span class="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded-md hidden sm:block">
              Брокер
            </span>
          </NuxtLink>

          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              class="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              active-class="bg-[#ffdd2d]/20 text-gray-900 font-medium"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <div class="flex items-center gap-2">
          <TNotificationsBell />

          <UDropdown
            :items="[[
              { label: user?.fullName || '', disabled: true },
              { label: user?.email || '', disabled: true },
            ], [
              { label: 'Выйти', icon: 'i-heroicons-arrow-right-on-rectangle', click: logout },
            ]]"
          >
            <button class="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-[#ffdd2d] to-[#fab619] flex items-center justify-center font-semibold text-gray-900 text-sm">
                {{ initials }}
              </div>
              <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 text-gray-500 hidden sm:block" />
            </button>
          </UDropdown>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-[1240px] mx-auto pb-20 md:pb-10">
      <slot />
    </main>

    <!-- Mobile bottom nav -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#0010241f] z-30">
      <div class="flex">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex-1 flex flex-col items-center py-2.5 text-gray-500 transition-colors"
          active-class="text-gray-900"
        >
          <UIcon :name="item.icon" class="w-6 h-6" />
          <span class="text-[10px] mt-0.5">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
