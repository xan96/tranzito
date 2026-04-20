<script setup lang="ts">
const { fetchUser } = useAuth()

// Run once per full page load: on SSR it populates auth state before render
// (so the serialized useState carries it to the client), on a pure SPA boot
// it runs on the client instead. Subsequent SPA navigations reuse the state
// and don't refetch.
await callOnce(() => fetchUser())
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
