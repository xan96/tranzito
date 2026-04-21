<script setup lang="ts">
interface Props {
  status: ApplicationStatus
}

defineProps<Props>()

const statusClasses: Record<ApplicationStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  approved: 'bg-[#428bf9]/10 text-[#428bf9]',
  in_progress: 'bg-[#ffdd2d]/20 text-[#fab619]',
  completed: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
}
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
    :class="statusClasses[status]"
  >
    {{ APPLICATION_STATUS_LABELS[status] }}
  </span>
</template>
