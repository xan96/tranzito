import type { UseFetchOptions } from 'nuxt/app'

export function useApi<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
  // useFetch auto-generates a key from the call site. Since every useApi call
  // hits the same line here, all of them would collide on one key — and Nuxt
  // would warn about incompatible options (default/lazy/transform) between
  // unrelated callers. Derive a per-URL key to avoid that.
  const initialUrl = typeof url === 'function' ? url() : url
  const key = options.key ?? `api:${initialUrl}`

  return useFetch(url, {
    ...options,
    key,
    $fetch: useNuxtApp().$fetch,
  })
}

export function $api<T>(url: string, options: Parameters<typeof $fetch>[1] = {}) {
  return $fetch<T>(url, {
    ...options,
  })
}
