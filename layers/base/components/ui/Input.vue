<script setup lang="ts">
interface Props {
  modelValue?: string | number
  label?: string
  type?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
  inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  filter?: RegExp // Characters to keep (e.g., /[\d+() -]/ for phone)
  showMask?: boolean // Show remaining placeholder as mask (for phone-like inputs)
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'blur': []
  'focus': []
}>()

const inputId = useId()
const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)
const isAutofilled = ref(false)

const hasValue = computed(() => {
  return props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined
})

const isFloating = computed(() => {
  return isFocused.value || hasValue.value || isAutofilled.value
})

// Detect browser autofill via CSS animation hack (Chrome/Safari fire
// onAutoFillStart when :-webkit-autofill matches).
function handleAnimationStart(e: AnimationEvent) {
  if (e.animationName === 'onAutoFillStart') {
    isAutofilled.value = true
  } else if (e.animationName === 'onAutoFillCancel') {
    isAutofilled.value = false
  }
}

// Autofill may happen before Vue mounts and attaches @animationstart, so
// re-check via :-webkit-autofill selector on mount + short retries (Chrome
// sometimes applies autofill after first paint).
onMounted(() => {
  const check = () => {
    const el = inputRef.value
    if (!el) return
    try {
      if (el.matches(':-webkit-autofill')) {
        isAutofilled.value = true
      }
    } catch {
      // Selector unsupported (Firefox) — no-op.
    }
  }
  check()
  setTimeout(check, 100)
  setTimeout(check, 500)
})


// Calculate remaining placeholder mask (only when showMask is enabled)
const placeholderMask = computed(() => {
  if (!props.showMask || !props.placeholder || !isFloating.value) return ''
  const valueStr = String(props.modelValue || '')
  if (valueStr.length >= props.placeholder.length) return ''
  return props.placeholder.slice(valueStr.length)
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  let value = target.value

  // Apply filter if provided
  if (props.filter) {
    const filtered = value.split('').filter(char => props.filter!.test(char)).join('')
    if (filtered !== value) {
      // Restore cursor position
      const cursorPos = target.selectionStart || 0
      const diff = value.length - filtered.length
      target.value = filtered
      target.setSelectionRange(cursorPos - diff, cursorPos - diff)
      value = filtered
    }
  }

  emit('update:modelValue', value)
}

function handleFocus() {
  isFocused.value = true
  emit('focus')
}

function handleBlur() {
  isFocused.value = false
  emit('blur')
}

function clearInput() {
  emit('update:modelValue', '')
}

// Expose input ref for parent to access
defineExpose({
  inputRef,
  focus: () => inputRef.value?.focus(),
  setCursor: (pos: number) => {
    setTimeout(() => {
      inputRef.value?.setSelectionRange(pos, pos)
    }, 0)
  },
})
</script>

<template>
  <div class="t-input" :class="{ 'has-error': error, 'is-disabled': disabled, 'is-focused': isFocused }">
    <div class="t-input-wrapper">
      <!-- Mask overlay showing value + remaining placeholder -->
      <div v-if="showMask && isFloating" class="t-input-mask" aria-hidden="true">
        <span class="t-input-mask-value">{{ modelValue }}</span><span v-if="placeholderMask" class="t-input-mask-placeholder">{{ placeholderMask }}</span>
      </div>
      <input
        ref="inputRef"
        :id="inputId"
        :type="type"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :inputmode="inputmode"
        :placeholder="!showMask && isFloating && placeholder ? placeholder : ''"
        class="t-input-field"
        :class="{ 'has-value': hasValue, 'has-mask': showMask && isFloating }"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @animationstart="handleAnimationStart"
      />
      <label
        v-if="label"
        :for="inputId"
        class="t-input-label"
        :class="{ 'is-floating': isFloating }"
      >
        {{ label }}
        <span v-if="required" class="t-input-required">*</span>
      </label>
      <button
        v-if="hasValue && !disabled"
        type="button"
        class="t-input-clear"
        tabindex="-1"
        @click="clearInput"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <Transition name="error-slide">
      <p v-if="error" class="t-input-error">
        {{ error }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.t-input {
  @apply relative mb-4;
}

.t-input-wrapper {
  @apply relative;
}

.t-input-field {
  @apply w-full h-16 px-4 pt-7 pb-2 text-base text-gray-900;
  @apply border border-transparent rounded-xl;
  @apply transition-all duration-200 ease-out;
  @apply focus:outline-none focus:ring-0;
  background: rgb(241, 238, 232);
  -webkit-appearance: none;
  -moz-appearance: textfield;
}

.t-input-field:focus {
  background: rgb(235, 232, 226);
}

/* Hide number input spinners */
.t-input-field::-webkit-outer-spin-button,
.t-input-field::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.t-input-field::placeholder {
  @apply text-gray-400;
}

/* Mask overlay */
.t-input-mask {
  @apply absolute left-4 right-12 pointer-events-none;
  @apply text-base whitespace-nowrap overflow-hidden;
  @apply pt-7 pb-2;
  top: 0;
  line-height: 1.5;
}

.t-input-mask-value {
  @apply text-gray-900;
}

.t-input-mask-placeholder {
  @apply text-gray-400;
}

.t-input-field.has-mask {
  color: transparent;
  caret-color: #111827;
}

.t-input-label {
  @apply absolute left-4 text-gray-500;
  @apply pointer-events-none;
  @apply transition-all duration-200 ease-out;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
}

.t-input-label.is-floating {
  top: 8px;
  transform: translateY(0);
  font-size: 11px;
  @apply text-gray-500;
}

.is-focused .t-input-label.is-floating {
  @apply text-gray-700;
}

.t-input-clear {
  @apply absolute right-3 top-1/2 -translate-y-1/2;
  @apply p-1 text-gray-400 hover:text-gray-600;
  @apply transition-colors duration-150;
  @apply rounded-full hover:bg-gray-100;
}

.t-input-required {
  @apply ml-0.5 text-gray-400;
}

.t-input-error {
  @apply mt-2 text-sm font-medium;
  color: #ef4444;
}

.t-input.has-error .t-input-field {
  @apply border-transparent;
  background-color: #fee2e2;
}

.t-input.has-error .t-input-field:focus {
  @apply border-transparent;
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

.t-input.is-disabled .t-input-field {
  @apply bg-gray-50 text-gray-400 cursor-not-allowed;
}

.t-input.is-disabled .t-input-label {
  @apply text-gray-400;
}

/* Autofill styles */
.t-input-field:-webkit-autofill,
.t-input-field:-webkit-autofill:hover,
.t-input-field:-webkit-autofill:focus,
.t-input-field:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px rgb(241, 238, 232) inset !important;
  -webkit-text-fill-color: #111827 !important;
  caret-color: #111827;
  transition: background-color 9999s ease-in-out 0s;
  animation-name: onAutoFillStart;
  animation-duration: 0.001s;
}

.t-input-field:not(:-webkit-autofill) {
  animation-name: onAutoFillCancel;
  animation-duration: 0.001s;
}

.t-input-field:focus:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 1000px rgb(235, 232, 226) inset !important;
}

/* Keyframes must exist for animationstart to fire; values don't matter. */
@keyframes onAutoFillStart {
  from { /* noop */ }
  to { /* noop */ }
}

@keyframes onAutoFillCancel {
  from { /* noop */ }
  to { /* noop */ }
}
</style>
