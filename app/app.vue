<script setup lang="ts">
const { fetchUser } = useAuth()

// Fetch user on app mount
onMounted(() => {
  fetchUser()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
