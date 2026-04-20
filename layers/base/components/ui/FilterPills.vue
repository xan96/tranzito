<script setup lang="ts" generic="T extends string">
interface Option {
  value: T
  label: string
  icon?: string
  count?: number
}

interface Props {
  modelValue: T
  options: Option[]
  layout?: 'wrap' | 'scroll'
}

withDefaults(defineProps<Props>(), {
  layout: 'scroll',
})

defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <div
    class="gap-2"
    :class="layout === 'scroll'
      ? 'flex overflow-x-auto -mx-4 px-4 pb-1 md:mx-0 md:px-0 md:pb-0'
      : 'flex flex-wrap'"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="t-pill"
      :class="[
        modelValue === opt.value ? 't-pill--active' : 't-pill--inactive',
        layout === 'scroll' ? 'flex-shrink-0' : '',
      ]"
      @click="$emit('update:modelValue', opt.value)"
    >
      <UIcon v-if="opt.icon" :name="opt.icon" class="w-4 h-4 hidden sm:block" />
      {{ opt.label }}
      <span
        v-if="opt.count !== undefined"
        class="text-[11px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-md"
        :class="modelValue === opt.value ? 'bg-white/20' : 'bg-gray-100'"
      >
        {{ opt.count }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.t-pill {
  @apply inline-flex items-center gap-1.5 sm:gap-2;
  @apply px-2.5 sm:px-3 md:px-4 py-1.5 md:py-2;
  @apply rounded-full text-xs md:text-sm whitespace-nowrap;
  @apply transition-all border;
}

.t-pill--active {
  @apply bg-gray-900 text-white border-gray-900;
}

.t-pill--inactive {
  @apply bg-white text-gray-600 border-[#0010241f] hover:border-gray-400;
}
</style>
