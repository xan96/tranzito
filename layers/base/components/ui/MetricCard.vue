<script setup lang="ts">
type Tone = 'default' | 'amber' | 'green' | 'red' | 'blue'

interface Props {
  label: string
  value?: string | number
  subtitle?: string
  tone?: Tone
  /** Tone for subtitle; defaults to same as `tone` so LTV-style cards match. Pass 'default' to keep subtitle gray. */
  subtitleTone?: Tone
  /** Truncate long single-line values (e.g. bank name) */
  truncate?: boolean
  /** Use smaller mobile size for long money values (base/2xl instead of xl/2xl) */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'default',
  truncate: false,
  compact: false,
})

const subtitleToneResolved = computed(() => props.subtitleTone ?? props.tone)
</script>

<template>
  <div class="t-metric-card">
    <p class="t-metric-card__label">
      {{ label }}
    </p>
    <p
      class="t-metric-card__value"
      :class="[
        compact ? 't-metric-card__value--compact' : 't-metric-card__value--normal',
        truncate ? 'truncate' : '',
        `t-tone-value--${tone}`,
      ]"
    >
      <slot>{{ value }}</slot>
    </p>
    <p v-if="subtitle" class="t-metric-card__subtitle" :class="`t-tone-label--${subtitleToneResolved}`">
      {{ subtitle }}
    </p>
  </div>
</template>

<style scoped>
.t-metric-card {
  @apply bg-white rounded-2xl p-3 md:p-5 border border-[#0010241f] min-w-0;
}

.t-metric-card__label {
  @apply text-xs text-gray-500 mb-1;
}

.t-metric-card__value {
  @apply font-bold leading-tight;
}

.t-metric-card__value--normal {
  @apply text-xl md:text-2xl;
}

.t-metric-card__value--compact {
  @apply text-base md:text-2xl;
}

.t-metric-card__subtitle {
  @apply text-xs mt-1;
}

.t-tone-value--default { @apply text-gray-900; }
.t-tone-value--amber { @apply text-amber-600; }
.t-tone-value--green { @apply text-green-600; }
.t-tone-value--red { @apply text-red-600; }
.t-tone-value--blue { @apply text-[#428bf9]; }

.t-tone-label--default { @apply text-gray-500; }
.t-tone-label--amber { @apply text-amber-600; }
.t-tone-label--green { @apply text-green-600; }
.t-tone-label--red { @apply text-red-600; }
.t-tone-label--blue { @apply text-[#428bf9]; }
</style>
