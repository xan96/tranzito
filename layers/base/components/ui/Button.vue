<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  block?: boolean
  disabled?: boolean
  loading?: boolean
  to?: string
  href?: string
  icon?: string
  iconRight?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  block: false,
  disabled: false,
  loading: false,
})

const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() => {
  const base = [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200 ease-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ]

  // Size
  const sizes = {
    sm: 'text-sm px-4 py-2 rounded-lg',
    md: 'text-base px-5 py-3 rounded-lg',
    lg: 'text-base px-6 py-3.5 rounded-xl',
    xl: 'text-lg px-8 py-4 rounded-xl',
  }

  // Variant
  const variants = {
    primary: 'bg-[#ffdd2d] hover:bg-[#ffcd33] active:bg-[#fab619] text-gray-900',
    secondary: 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900',
    outline: 'bg-transparent hover:bg-gray-50 active:bg-gray-100 text-gray-900 border border-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700',
    link: 'bg-transparent text-[#428bf9] hover:text-[#126df7] hover:underline underline-offset-4 p-0',
  }

  return [
    ...base,
    sizes[props.size],
    variants[props.variant],
    props.block ? 'w-full' : '',
  ]
})

const component = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return 'button'
})

const componentProps = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: '_blank', rel: 'noopener' }
  return { type: props.type, disabled: isDisabled.value }
})
</script>

<template>
  <component
    :is="component"
    :class="classes"
    v-bind="componentProps"
  >
    <!-- Loading spinner -->
    <svg
      v-if="loading"
      class="animate-spin h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>

    <!-- Icon left -->
    <UIcon v-else-if="icon" :name="icon" class="w-5 h-5" />

    <!-- Content -->
    <span v-if="$slots.default">
      <slot />
    </span>

    <!-- Icon right -->
    <UIcon v-if="iconRight && !loading" :name="iconRight" class="w-5 h-5" />
  </component>
</template>
