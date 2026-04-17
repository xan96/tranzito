<script setup lang="ts">
interface Tab {
  label: string
  value: string
  disabled?: boolean
}

interface Props {
  tabs: Tab[]
  modelValue: string
  variant?: 'pills' | 'underline' | 'solid'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'pills',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const activeIndex = computed(() => {
  return props.tabs.findIndex((t) => t.value === props.modelValue)
})

function selectTab(tab: Tab) {
  if (!tab.disabled) {
    emit('update:modelValue', tab.value)
  }
}
</script>

<template>
  <div class="t-tabs" :class="`t-tabs--${variant}`">
    <div class="t-tabs-list">
      <!-- Marker for pills variant -->
      <div
        v-if="variant === 'pills'"
        class="t-tabs-marker"
        :style="{
          width: `${100 / tabs.length}%`,
          transform: `translateX(${activeIndex * 100}%)`,
        }"
      />

      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="t-tabs-tab"
        :class="{
          'is-active': tab.value === modelValue,
          'is-disabled': tab.disabled,
        }"
        :disabled="tab.disabled"
        @click="selectTab(tab)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="t-tabs-content">
      <slot :name="modelValue" />
    </div>
  </div>
</template>

<style scoped>
.t-tabs {
  @apply w-full;
}

/* Pills variant */
.t-tabs--pills .t-tabs-list {
  @apply relative flex p-1 bg-gray-100 rounded-xl;
}

.t-tabs--pills .t-tabs-marker {
  @apply absolute top-1 bottom-1 left-1;
  @apply bg-white rounded-lg shadow-sm;
  @apply transition-transform duration-200 ease-out;
}

.t-tabs--pills .t-tabs-tab {
  @apply relative z-10 flex-1 py-2.5 px-4;
  @apply text-sm font-medium text-gray-600;
  @apply rounded-lg transition-colors duration-150;
}

.t-tabs--pills .t-tabs-tab.is-active {
  @apply text-gray-900;
}

.t-tabs--pills .t-tabs-tab:not(.is-active):hover {
  @apply text-gray-900;
}

/* Underline variant */
.t-tabs--underline .t-tabs-list {
  @apply flex border-b border-gray-200;
}

.t-tabs--underline .t-tabs-tab {
  @apply relative py-3 px-4;
  @apply text-sm font-medium text-gray-600;
  @apply transition-colors duration-150;
}

.t-tabs--underline .t-tabs-tab::after {
  @apply absolute bottom-0 left-0 right-0 h-0.5;
  @apply bg-transparent;
  @apply transition-colors duration-150;
  content: '';
}

.t-tabs--underline .t-tabs-tab.is-active {
  @apply text-gray-900;
}

.t-tabs--underline .t-tabs-tab.is-active::after {
  background-color: #ffdd2d;
}

.t-tabs--underline .t-tabs-tab:not(.is-active):hover {
  @apply text-gray-900;
}

/* Solid variant */
.t-tabs--solid .t-tabs-list {
  @apply flex gap-2;
}

.t-tabs--solid .t-tabs-tab {
  @apply py-2.5 px-5;
  @apply text-sm font-medium text-gray-600;
  @apply bg-gray-100 rounded-lg;
  @apply transition-all duration-150;
}

.t-tabs--solid .t-tabs-tab.is-active {
  @apply text-gray-900;
  background-color: #ffdd2d;
}

.t-tabs--solid .t-tabs-tab:not(.is-active):hover {
  @apply bg-gray-200 text-gray-900;
}

/* Disabled state */
.t-tabs-tab.is-disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Content */
.t-tabs-content {
  @apply mt-4;
}
</style>
