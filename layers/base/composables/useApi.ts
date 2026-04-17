import type { UseFetchOptions } from 'nuxt/app'

export function useApi<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
  return useFetch(url, {
    ...options,
    $fetch: useNuxtApp().$fetch,
  })
}

export function $api<T>(url: string, options: Parameters<typeof $fetch>[1] = {}) {
  return $fetch<T>(url, {
    ...options,
  })
}
