<script setup lang="ts">
interface ApplicationItem {
  id: string
  borrowerName?: string
  requestedAmount?: number
  loanTermDays?: number
  status?: string
  managerComment?: string | null
  createdAt: string
  broker?: { fullName?: string }
}

interface PendingUserItem {
  id: string
  email: string
  fullName: string
  role: UserRole
  approvalStatus: UserApprovalStatus
  createdAt: string
}

const { user } = useAuth()

const { data } = useApi<{ data: ApplicationItem[] }>('/api/applications', {
  lazy: true,
  default: () => ({ data: [] }),
})

// Admin-only: pending registration requests. Non-admins would get 403, so
// we gate the fetch via `immediate` and trigger it only for admins.
const { data: pendingUsers, refresh: refreshPendingUsers } = useApi<{ data: PendingUserItem[] }>(
  '/api/users?status=pending',
  {
    lazy: true,
    immediate: false,
    default: () => ({ data: [] }),
    key: 'api:/api/users?status=pending',
  },
)

watch(
  () => user.value?.role,
  (role) => {
    if (role === 'admin') refreshPendingUsers()
  },
  { immediate: true },
)

const lastSeenKey = computed(() => `tranzitum:notifications-seen:${user.value?.id ?? 'anon'}`)
const lastSeen = ref<number>(0)

onMounted(() => {
  const saved = localStorage.getItem(lastSeenKey.value)
  lastSeen.value = saved ? Number(saved) : 0
})

interface Notification {
  id: string
  applicationId: string
  icon: string
  iconColor: string
  title: string
  message: string
  timestamp: number
  href: string
}

const role = computed(() => user.value?.role)
const linkBase = computed(() =>
  role.value ? ROLE_APPLICATION_PATHS[role.value] : ROLE_APPLICATION_PATHS.investor,
)

const notifications = computed<Notification[]>(() => {
  const items = data.value?.data ?? []
  const result: Notification[] = []

  if (role.value === 'admin') {
    for (const u of pendingUsers.value?.data ?? []) {
      result.push({
        id: `user-${u.id}`,
        applicationId: u.id,
        icon: 'i-heroicons-user-plus',
        iconColor: 'text-[#428bf9] bg-[#428bf9]/10',
        title: 'Заявка на регистрацию',
        message: `${u.fullName} · ${USER_ROLE_SHORT_LABELS[u.role] ?? u.role}`,
        timestamp: new Date(u.createdAt).getTime(),
        href: '/admin/users?status=pending',
      })
    }
  }

  for (const app of items) {
    const ts = new Date(app.createdAt).getTime()
    const shortId = app.id.slice(0, 8)

    if (role.value === 'admin') {
      if (app.status === 'pending') {
        result.push({
          id: `new-${app.id}`,
          applicationId: app.id,
          icon: 'i-heroicons-inbox-arrow-down',
          iconColor: 'text-amber-600 bg-amber-50',
          title: `Новая заявка №${shortId}`,
          message: `${app.broker?.fullName || 'Брокер'} · ${formatMoney(app.requestedAmount ?? 0)} ₽`,
          timestamp: ts,
          href: `${linkBase.value}/${app.id}`,
        })
      }
    } else if (role.value === 'broker') {
      if (app.managerComment) {
        result.push({
          id: `comment-${app.id}`,
          applicationId: app.id,
          icon: 'i-heroicons-chat-bubble-left-ellipsis',
          iconColor: 'text-[#428bf9] bg-[#428bf9]/10',
          title: `Комментарий по заявке №${shortId}`,
          message: app.managerComment,
          timestamp: ts,
          href: `${linkBase.value}/${app.id}`,
        })
      }
      if (app.status && app.status !== 'pending') {
        result.push({
          id: `status-${app.id}`,
          applicationId: app.id,
          icon: 'i-heroicons-sparkles',
          iconColor: 'text-[#fab619] bg-[#ffdd2d]/20',
          title: `Статус заявки №${shortId}`,
          message: statusLabel(app.status),
          timestamp: ts,
          href: `${linkBase.value}/${app.id}`,
        })
      }
    } else if (role.value === 'investor') {
      if (app.status === 'approved') {
        result.push({
          id: `approved-${app.id}`,
          applicationId: app.id,
          icon: 'i-heroicons-banknotes',
          iconColor: 'text-green-600 bg-green-50',
          title: `Новая заявка для инвестирования`,
          message: `${formatMoney(app.requestedAmount ?? 0)} ₽ · ${app.loanTermDays ?? 0} дней`,
          timestamp: ts,
          href: `${linkBase.value}/${app.id}`,
        })
      }
    }
  }

  return result.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
})

const unreadCount = computed(() =>
  notifications.value.filter(n => n.timestamp > lastSeen.value).length
)

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount)
}

function statusLabel(status: string) {
  return APPLICATION_STATUS_LABELS[status as ApplicationStatus] ?? status
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} ч назад`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} дн назад`
  return new Date(ts).toLocaleDateString('ru-RU')
}

function markAllSeen() {
  lastSeen.value = Date.now()
  localStorage.setItem(lastSeenKey.value, String(lastSeen.value))
}

const isOpen = ref(false)

watch(isOpen, (open) => {
  if (open && unreadCount.value > 0) {
    // Mark as seen after a short delay so badge fade is visible
    setTimeout(markAllSeen, 1500)
  }
})
</script>

<template>
  <UPopover v-model:open="isOpen" :popper="{ placement: 'bottom-end' }">
    <button
      class="relative hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
      aria-label="Уведомления"
    >
      <UIcon name="i-heroicons-bell" class="w-5 h-5 text-gray-600" />
      <span
        v-if="unreadCount > 0"
        class="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <template #panel>
      <div class="w-[360px] max-w-[90vw] bg-white rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 class="font-semibold text-gray-900">
            Уведомления
          </h3>
          <button
            v-if="unreadCount > 0"
            class="text-xs text-[#428bf9] hover:text-[#126df7] font-medium"
            @click="markAllSeen"
          >
            Прочитать все
          </button>
        </div>

        <div v-if="!notifications.length" class="px-4 py-12 text-center">
          <div class="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-3">
            <UIcon name="i-heroicons-bell-slash" class="w-6 h-6 text-gray-400" />
          </div>
          <p class="text-sm font-medium text-gray-900">
            Пока нет уведомлений
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Здесь будут появляться события по заявкам
          </p>
        </div>

        <ul v-else class="max-h-[70vh] overflow-y-auto">
          <li
            v-for="n in notifications"
            :key="n.id"
            class="border-b border-gray-50 last:border-0"
          >
            <NuxtLink
              :to="n.href"
              class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              @click="isOpen = false"
            >
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                :class="n.iconColor"
              >
                <UIcon :name="n.icon" class="w-5 h-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ n.title }}
                  </p>
                  <span
                    v-if="n.timestamp > lastSeen"
                    class="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5"
                  />
                </div>
                <p class="text-xs text-gray-600 line-clamp-2 mt-0.5">
                  {{ n.message }}
                </p>
                <p class="text-[11px] text-gray-400 mt-1">
                  {{ relativeTime(n.timestamp) }}
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </template>
  </UPopover>
</template>
