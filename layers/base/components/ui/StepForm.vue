<script setup lang="ts">
interface Step {
  title: string
  description?: string
}

interface Props {
  steps: Step[]
  currentStep: number
  loading?: boolean
  disabled?: boolean
  submitText?: string
  nextText?: string
  /** Offset from viewport bottom for the sticky footer. Default '4rem' = mobile bottom nav height. Pass '0px' for desktop without nav. */
  footerOffset?: string
  /** Size of next/submit button */
  buttonSize?: 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  submitText: 'Отправить заявку',
  nextText: 'Продолжить',
  footerOffset: '4rem',
  buttonSize: 'xl',
})

const footerStyle = computed(() => ({
  bottom: `calc(${props.footerOffset} + env(safe-area-inset-bottom))`,
}))

const emit = defineEmits<{
  'update:currentStep': [step: number]
  next: []
  prev: []
  submit: []
}>()

const progress = computed(() => {
  return ((props.currentStep + 1) / props.steps.length) * 100
})

const isFirstStep = computed(() => props.currentStep === 0)
const isLastStep = computed(() => props.currentStep === props.steps.length - 1)

function goNext() {
  if (!isLastStep.value) {
    emit('update:currentStep', props.currentStep + 1)
    emit('next')
  } else {
    emit('submit')
  }
}

function goPrev() {
  if (!isFirstStep.value) {
    emit('update:currentStep', props.currentStep - 1)
    emit('prev')
  }
}
</script>

<template>
  <div class="t-step-form">
    <!-- Progress bar -->
    <div class="t-step-progress">
      <div class="t-step-progress-bar" :style="{ width: `${progress}%` }" />
    </div>

    <!-- Step header -->
    <div class="t-step-header">
      <button
        v-if="!isFirstStep"
        type="button"
        class="t-step-back"
        @click="goPrev"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div v-else class="w-10" />

      <div class="t-step-info">
        <div class="t-step-counter">
          Шаг {{ currentStep + 1 }} из {{ steps.length }}
        </div>
        <h2 class="t-step-title">
          {{ steps[currentStep].title }}
        </h2>
        <p v-if="steps[currentStep].description" class="t-step-description">
          {{ steps[currentStep].description }}
        </p>
      </div>

      <div class="w-10" />
    </div>

    <!-- Content -->
    <div class="t-step-content">
      <Transition name="slide" mode="out-in">
        <div :key="currentStep">
          <slot :name="`step-${currentStep}`" />
        </div>
      </Transition>
    </div>

    <!-- Bottom button -->
    <div class="t-step-footer" :style="footerStyle">
      <TButton
        :loading="loading"
        :disabled="disabled"
        :size="buttonSize"
        block
        @click="goNext"
      >
        {{ isLastStep ? submitText : nextText }}
      </TButton>
    </div>
  </div>
</template>

<style scoped>
.t-step-form {
  @apply flex flex-col min-h-screen bg-white;
}

.t-step-progress {
  @apply h-1 bg-gray-100 fixed top-0 left-0 right-0 z-50;
}

.t-step-progress-bar {
  @apply h-full transition-all duration-300 ease-out;
  background-color: #ffdd2d;
}

.t-step-header {
  @apply flex items-start gap-2 px-4 pt-8 pb-4;
}

.t-step-back {
  @apply w-10 h-10 flex items-center justify-center;
  @apply text-gray-600 hover:text-gray-900;
  @apply rounded-full hover:bg-gray-100;
  @apply transition-colors duration-150;
}

.t-step-info {
  @apply flex-1 text-center;
}

.t-step-counter {
  @apply text-sm text-gray-500 mb-1;
}

.t-step-title {
  @apply text-xl font-semibold text-gray-900;
}

.t-step-description {
  @apply text-sm text-gray-500 mt-1;
}

.t-step-content {
  @apply flex-1 px-4 py-6 pb-40;
}

.t-step-footer {
  @apply fixed left-0 right-0 z-50;
  @apply px-4 py-4 bg-white;
  @apply border-t border-gray-100;
  /* Position controlled via :style binding from footerOffset prop. */
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease-out;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
