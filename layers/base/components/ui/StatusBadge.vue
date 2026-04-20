<script setup lang="ts">
interface Props {
  status: ApplicationStatus
}

defineProps<Props>()

const statusColors: Record<ApplicationStatus, string> = {
  pending: 'gray',
  approved: 'blue',
  in_progress: 'yellow',
  completed: 'green',
  rejected: 'red',
}
</script>

<template>
  <UBadge
    :color="statusColors[status]"
    variant="subtle"
  >
    {{ APPLICATION_STATUS_LABELS[status] }}
  </UBadge>
</template>
