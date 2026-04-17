<script setup lang="ts">
interface Props {
  title: string
  icon?: string
  iconBg?: string
  iconColor?: string
  padding?: 'sm' | 'md'
}

withDefaults(defineProps<Props>(), {
  iconBg: 'bg-gray-100',
  iconColor: 'text-gray-600',
  padding: 'md',
})
</script>

<template>
  <section
    class="bg-white rounded-2xl border border-[#0010241f]"
    :class="padding === 'md' ? 'p-5 md:p-6' : 'p-4 md:p-5'"
  >
    <div v-if="title || icon" class="flex items-center gap-3 mb-5">
      <div
        v-if="icon"
        class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="iconBg"
      >
        <UIcon :name="icon" class="w-5 h-5" :class="iconColor" />
      </div>
      <h3 class="font-semibold text-gray-900 text-lg">
        {{ title }}
      </h3>
    </div>
    <slot />
  </section>
</template>
