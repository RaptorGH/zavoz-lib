<script setup>
definePageMeta({ middleware: 'auth' })

const db = useSupabaseClient()
const dialogs = ref([])
const err = ref('')
const loaded = ref(false)

onMounted(async () => {
  const { data, error } = await db
    .from('telegram_users')
    .select('telegram_id, display_name, username, last_message_at')
    .order('last_message_at', { ascending: false })
  if (error) err.value = 'Ошибка: ' + error.message
  else dialogs.value = data
  loaded.value = true
})

function fmt(iso) {
  return iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
}
</script>

<template>
  <section>
    <p class="z-muted">Диалоги</p>
    <NuxtLink v-for="d in dialogs" :key="d.telegram_id" :to="'/chat/' + d.telegram_id" class="z-card">
      <strong>{{ d.display_name || d.username || d.telegram_id }}</strong>
      <div class="z-meta">{{ d.username }} · последнее сообщение {{ fmt(d.last_message_at) }}</div>
    </NuxtLink>
    <p v-if="loaded && !dialogs.length && !err" class="z-muted">Нет доступных диалогов. У аккаунта должна быть роль viewer.</p>
    <div class="z-err">{{ err }}</div>
  </section>
</template>
