<script setup lang="ts">
interface Props {
  /** Размер квадратного знака в пикселях. */
  size?: number
}

withDefaults(defineProps<Props>(), {
  size: 32,
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    :width="size"
    :height="size"
    aria-hidden="true"
    class="t-logo"
  >
    <rect width="64" height="64" rx="14" fill="#0b1e3e" />
    <g
      fill="none"
      stroke="#ffdd2d"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M46 28 A14 14 0 0 0 18 30" />
      <polyline points="46,16 46,28 34,28" />
      <path d="M18 36 A14 14 0 0 0 46 34" />
      <polyline points="18,48 18,36 30,36" />
    </g>
  </svg>
</template>

<style scoped>
.t-logo {
  display: block;
  flex-shrink: 0;
}
</style>
