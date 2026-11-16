// Клиент Supabase (одиночка). Значения берутся из runtimeConfig.public (как в Nuxt).
let client = null

export function useSupabaseClient() {
  if (!client) {
    const cfg = useRuntimeConfig().public
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey)
  }
  return client
}
