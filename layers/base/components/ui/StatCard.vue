<script setup lang="ts">
type Tone = 'default' | 'amber' | 'green' | 'red' | 'blue'

interface Props {
  icon?: string
  label: string
  value?: string | number
  tone?: Tone
  /** Use smaller mobile font size for long money values */
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  tone: 'default',
  compact: false,
})
</script>

<template>
  <div class="t-stat-card">
    <div class="t-stat-card__head" :class="`t-tone-label--${tone}`">
      <UIcon v-if="icon" :name="icon" class="w-4 h-4" />
      <span>{{ label }}</span>
    </div>
    <p
      class="t-stat-card__value"
      :class="[
        compact ? 't-stat-card__value--compact' : 't-stat-card__value--normal',
        `t-tone-value--${tone}`,
      ]"
    >
      <slot>{{ value }}</slot>
    </p>
  </div>
</template>

<style scoped>
.t-stat-card {
  @apply bg-white rounded-2xl p-3 md:p-5 border border-[#0010241f] min-w-0;
}

.t-stat-card__head {
  @apply flex items-center gap-2 text-xs mb-2;
}

.t-stat-card__value {
  @apply font-bold leading-tight;
}

.t-stat-card__value--normal {
  @apply text-xl md:text-3xl;
}

.t-stat-card__value--compact {
  @apply text-lg md:text-3xl;
}

.t-tone-label--default { @apply text-gray-500; }
.t-tone-label--amber { @apply text-amber-600; }
.t-tone-label--green { @apply text-green-600; }
.t-tone-label--red { @apply text-red-600; }
.t-tone-label--blue { @apply text-[#428bf9]; }

.t-tone-value--default { @apply text-gray-900; }
.t-tone-value--amber { @apply text-amber-600; }
.t-tone-value--green { @apply text-green-600; }
.t-tone-value--red { @apply text-red-600; }
.t-tone-value--blue { @apply text-[#428bf9]; }
</style>
