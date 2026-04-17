<script setup lang="ts">
type Status = 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'

interface Props {
  status: Status
}

defineProps<Props>()

const statusConfig: Record<Status, { label: string; color: string }> = {
  pending: { label: 'На проверке', color: 'gray' },
  approved: { label: 'Одобрена', color: 'blue' },
  in_progress: { label: 'В работе', color: 'yellow' },
  completed: { label: 'Завершена', color: 'green' },
  rejected: { label: 'Отклонена', color: 'red' },
}
</script>

<template>
  <UBadge
    :color="statusConfig[status].color"
    variant="subtle"
  >
    {{ statusConfig[status].label }}
  </UBadge>
</template>
