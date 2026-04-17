<script setup lang="ts">
interface Props {
  modelValue: boolean
  title: string
  subtitle?: string
  icon?: string
  iconBg?: string
  iconColor?: string
  width?: string
  closeLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'i-heroicons-information-circle',
  iconBg: 'bg-[#ffdd2d]',
  iconColor: 'text-gray-900',
  width: 'sm:max-w-2xl',
  closeLabel: 'Понятно',
  subtitle: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

function close() {
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model="isOpen"
    :ui="{
      width,
      background: 'bg-white',
      ring: '',
      rounded: 'rounded-2xl',
    }"
  >
    <div class="bg-white rounded-2xl p-6 md:p-8">
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="iconBg"
          >
            <UIcon :name="icon" class="w-6 h-6" :class="iconColor" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">
              {{ title }}
            </h2>
            <p v-if="subtitle" class="text-sm text-gray-500">
              {{ subtitle }}
            </p>
          </div>
        </div>
        <button
          class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Закрыть"
          @click="close"
        >
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div class="space-y-5 text-sm text-gray-700 leading-relaxed">
        <slot />
      </div>

      <div class="mt-6 pt-5 border-t border-gray-100 flex justify-end">
        <slot name="footer" :close="close">
          <TButton variant="primary" @click="close">
            {{ closeLabel }}
          </TButton>
        </slot>
      </div>
    </div>
  </UModal>
</template>
