<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#f6f7f8] px-4 py-10">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-3">
          <TLogo :size="44" />
          <span class="text-3xl font-bold text-gray-900">Tranzitum</span>
        </NuxtLink>
      </div>

      <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-[#fffde6] flex items-center justify-center">
          <svg class="w-8 h-8 text-[#fab619]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-3">
          Заявка отправлена
        </h1>
        <p class="text-gray-600 leading-relaxed">
          Администратор рассмотрит её в ближайшее время — вы получите письмо с результатом.
          После одобрения сможете войти под своим email и паролем.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 mt-8">
          <TButton to="/" variant="outline" block>
            На главную
          </TButton>
          <TButton to="/login" block>
            К входу
          </TButton>
        </div>
      </div>
    </div>
  </div>
</template>
