<script setup lang="ts">
interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  options: Option[]
  error?: string
  disabled?: boolean
  required?: boolean
  searchable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Выберите...',
  searchable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = useId()
const isOpen = ref(false)
const search = ref('')
const selectRef = ref<HTMLElement>()

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})

const filteredOptions = computed(() => {
  if (!props.searchable || !search.value) return props.options
  const query = search.value.toLowerCase()
  return props.options.filter(opt => opt.label.toLowerCase().includes(query))
})

const hasValue = computed(() => !!props.modelValue)

function selectOption(option: Option) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  isOpen.value = false
  search.value = ''
}

function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    search.value = ''
  }
}

// Close on outside click
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(event: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}
</script>

<template>
  <div ref="selectRef" class="t-select" :class="{ 'has-error': error, 'is-disabled': disabled, 'is-open': isOpen }">
    <div class="t-select-box" @click="toggle">
      <label v-if="label" :for="inputId" class="t-select-label" :class="{ 'is-floating': hasValue || isOpen }">
        {{ label }}
        <span v-if="required" class="t-select-required">*</span>
      </label>

      <div class="t-select-value">
        <span v-if="selectedOption && !(searchable && isOpen)">{{ selectedOption.label }}</span>
      </div>

      <div class="t-select-arrow">
        <svg class="w-5 h-5" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="t-select-dropdown">
        <div v-if="searchable" class="t-select-search-wrap">
          <svg class="t-select-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            v-model="search"
            type="text"
            class="t-select-search"
            placeholder="Поиск..."
            autofocus
            @click.stop
          />
        </div>
        <div class="t-select-options">
          <div
            v-for="option in filteredOptions"
            :key="option.value"
            class="t-select-option"
            :class="{
              'is-selected': option.value === modelValue,
              'is-option-disabled': option.disabled,
            }"
            @click="selectOption(option)"
          >
            <span class="truncate">{{ option.label }}</span>
            <svg v-if="option.value === modelValue" class="w-4 h-4 text-[#fab619] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div v-if="filteredOptions.length === 0" class="t-select-empty">
            Ничего не найдено
          </div>
        </div>
      </div>
    </Transition>

    <!-- Error -->
    <Transition name="error-slide">
      <p v-if="error" class="t-select-error">
        {{ error }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.t-select {
  @apply relative mb-4;
}

.t-select-box {
  @apply relative h-16 px-4 cursor-pointer;
  @apply border border-transparent rounded-xl;
  @apply transition-colors duration-200;
  background: rgb(241, 238, 232);
}

.t-select-box:hover {
  background: rgb(235, 232, 226);
}

.t-select.is-open .t-select-box {
  background: rgb(235, 232, 226);
}

.t-select-label {
  @apply absolute left-4 text-gray-500;
  @apply pointer-events-none;
  @apply transition-all duration-200 ease-out;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
}

.t-select-label.is-floating {
  top: 8px;
  transform: translateY(0);
  font-size: 11px;
}

.t-select-required {
  @apply ml-0.5 text-gray-400;
}

.t-select-value {
  @apply absolute left-4 right-12 bottom-3;
  @apply text-base text-gray-900;
}

.t-select-placeholder {
  @apply text-gray-400;
}

.t-select-arrow {
  @apply absolute right-4 top-1/2 -translate-y-1/2;
  @apply text-gray-400 transition-transform duration-200;
}

/* Dropdown — floating card above the box */
.t-select-dropdown {
  @apply absolute left-0 right-0 bottom-full z-50 mb-2;
  @apply bg-white rounded-2xl overflow-hidden;
  box-shadow:
    0 0 0 1px rgba(0, 16, 36, 0.08),
    0 12px 32px -4px rgba(0, 16, 36, 0.12),
    0 4px 12px -2px rgba(0, 16, 36, 0.08);
}

.t-select-search-wrap {
  @apply relative px-3 pt-3 pb-2 border-b border-gray-100;
}

.t-select-search-icon {
  @apply absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none;
  margin-top: 2px;
}

.t-select-search {
  @apply w-full bg-[#f6f7f8] rounded-xl pl-9 pr-3 py-2;
  @apply text-sm text-gray-900 placeholder:text-gray-400;
  @apply outline-none focus:bg-gray-100 transition-colors;
  border: 0;
}

.t-select-options {
  @apply max-h-60 overflow-y-auto py-1;
}

.t-select-option {
  @apply flex items-center justify-between gap-2;
  @apply mx-1 px-3 py-2 rounded-lg cursor-pointer;
  @apply text-sm text-gray-900;
  @apply hover:bg-[#f6f7f8] transition-colors;
}

.t-select-option.is-selected {
  @apply bg-[#ffdd2d]/15 font-medium text-gray-900;
}

.t-select-option.is-option-disabled {
  @apply text-gray-400 cursor-not-allowed;
}

.t-select-option.is-option-disabled:hover {
  @apply bg-transparent;
}

.t-select-empty {
  @apply px-4 py-6 text-sm text-gray-400 text-center;
}

/* Error */
.t-select-error {
  @apply mt-2 text-sm font-medium;
  color: #ef4444;
}

.t-select.has-error .t-select-box {
  @apply border-transparent;
  background-color: #fee2e2;
}

/* Disabled */
.t-select.is-disabled .t-select-box {
  @apply bg-gray-50 cursor-not-allowed;
}

.t-select.is-disabled .t-select-value {
  @apply text-gray-400;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease-out;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

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
