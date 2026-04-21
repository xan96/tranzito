<script setup lang="ts">
interface Props {
  title: string
  icon?: string
  iconColor?: string
  variant?: 'default' | 'warning' | 'muted'
}

const props = withDefaults(defineProps<Props>(), {
  icon: '',
  // Pressed yellow — better contrast on white bg than primary #ffdd2d.
  iconColor: 'text-[#fab619]',
  variant: 'default',
})

const sectionClass = computed(() => {
  switch (props.variant) {
    case 'warning':
      return 'bg-[#f6f7f8] rounded-xl p-4'
    case 'muted':
      return 'bg-gray-50 rounded-xl p-4'
    default:
      return ''
  }
})

const resolvedIconColor = computed(() => {
  if (props.variant === 'warning') return 'text-amber-600'
  return props.iconColor
})
</script>

<template>
  <section :class="sectionClass">
    <h3 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
      <UIcon v-if="icon" :name="icon" class="w-5 h-5" :class="resolvedIconColor" />
      {{ title }}
    </h3>
    <div class="text-gray-700">
      <slot />
    </div>
  </section>
</template>
