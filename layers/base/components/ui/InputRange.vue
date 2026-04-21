<script setup lang="ts">
interface Props {
  modelValue?: number
  label?: string
  min?: number
  max?: number
  step?: number
  suffix?: string
  error?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  suffix: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const inputId = useId()
const isFocused = ref(false)

const displayValue = computed(() => {
  return new Intl.NumberFormat('ru-RU').format(props.modelValue || 0)
})

const minFormatted = computed(() => {
  return new Intl.NumberFormat('ru-RU').format(props.min)
})

const maxFormatted = computed(() => {
  return new Intl.NumberFormat('ru-RU').format(props.max)
})

const progress = computed(() => {
  const range = props.max - props.min
  const value = (props.modelValue || 0) - props.min
  return Math.min(100, Math.max(0, (value / range) * 100))
})

function handleSliderInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', Number(target.value))
}

function handleTextInput(event: Event) {
  const target = event.target as HTMLInputElement
  // Remove non-digits and parse
  const value = parseInt(target.value.replace(/\D/g, '')) || 0
  const clamped = Math.min(props.max, Math.max(props.min, value))
  emit('update:modelValue', clamped)
}

function handleFocus() {
  isFocused.value = true
}

function handleBlur() {
  isFocused.value = false
}
</script>

<template>
  <div class="t-input-range" :class="{ 'has-error': error }">
    <!-- Input box with slider on bottom edge -->
    <div class="t-input-range-box" :class="{ 'is-focused': isFocused }">
      <label v-if="label" :for="inputId" class="t-input-range-label">
        {{ label }}
        <span v-if="required" class="t-input-range-required">*</span>
      </label>
      <div class="t-input-range-value">
        <input
          :id="inputId"
          type="text"
          inputmode="numeric"
          :value="displayValue"
          class="t-input-range-input"
          @input="handleTextInput"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <span v-if="suffix" class="t-input-range-suffix">{{ suffix }}</span>
      </div>

      <!-- Slider on bottom edge -->
      <div class="t-input-range-slider">
        <div class="t-input-range-track">
          <div class="t-input-range-progress" :style="{ width: `${progress}%` }">
            <div class="t-input-range-thumb" />
          </div>
        </div>
        <input
          type="range"
          :min="min"
          :max="max"
          :step="step"
          :value="modelValue"
          class="t-input-range-native"
          @input="handleSliderInput"
        />
      </div>
    </div>

    <!-- Min/Max labels -->
    <div class="t-input-range-limits">
      <span>{{ minFormatted }}</span>
      <span>{{ maxFormatted }}</span>
    </div>

    <!-- Error -->
    <Transition name="error-slide">
      <p v-if="error" class="t-input-range-error">
        {{ error }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.t-input-range {
  @apply mb-4;
}

.t-input-range-box {
  @apply relative h-16 px-4;
  @apply rounded-xl overflow-visible;
  @apply transition-all duration-200;
  background: rgb(241, 238, 232);
}

.t-input-range-box.is-focused {
  background: rgb(235, 232, 226);
}

.t-input-range-label {
  @apply absolute left-4 top-2 text-xs text-gray-500;
}

.t-input-range-required {
  @apply ml-0.5 text-gray-400;
}

.t-input-range-value {
  @apply absolute left-4 right-4 bottom-4 flex items-baseline gap-1;
}

.t-input-range-input {
  @apply flex-1 text-base font-normal text-gray-900 bg-transparent;
  @apply outline-none border-none p-0;
  -webkit-tap-highlight-color: transparent;
}

.t-input-range-input:focus,
.t-input-range-input:focus-visible {
  outline: none;
  box-shadow: none;
}

.t-input-range-suffix {
  @apply text-base text-gray-500;
}

/* Slider on bottom edge of input box */
.t-input-range-slider {
  @apply absolute left-4 right-4 h-4;
  bottom: -8px;
}

.t-input-range-track {
  @apply absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2;
  @apply bg-gray-300 rounded-full;
}

.t-input-range-progress {
  @apply h-full rounded-full relative;
  background-color: #ffdd2d;
}

.t-input-range-thumb {
  @apply absolute right-0 top-1/2;
  @apply w-3.5 h-3.5 rounded-full;
  background-color: #ffdd2d;
  transform: translate(50%, -50%);
}

.t-input-range-native {
  @apply absolute top-0 left-0 w-full h-full;
  @apply appearance-none bg-transparent cursor-pointer;
  -webkit-appearance: none;
}

.t-input-range-native::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 rounded-full;
  @apply cursor-pointer;
  -webkit-appearance: none;
  background-color: transparent;
}

.t-input-range-native::-moz-range-thumb {
  @apply w-4 h-4 rounded-full;
  @apply cursor-pointer;
  background-color: transparent;
  border: none;
}

/* Limits */
.t-input-range-limits {
  @apply flex justify-between mt-3 text-xs text-gray-400;
}

/* Error */
.t-input-range-error {
  @apply mt-2 text-sm font-medium;
  color: #ef4444;
}

.t-input-range.has-error .t-input-range-box {
  background-color: #fee2e2;
}

/* Error transition */
.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.2s ease-out;
  overflow: hidden;
}

.error-slide-enter-from,
.error-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.error-slide-enter-to,
.error-slide-leave-from {
  opacity: 1;
  max-height: 50px;
}
</style>
