<script setup>
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const db = useSupabaseClient()
const messages = ref([])
const err = ref('')

function textOf(raw) {
  const m = raw && raw.message ? raw.message : raw || {}
  if (m.text) return m.text
  if (m.voice) return '🎤 голосовое, ' + m.voice.duration + ' с'
  if (m.audio) return '🎵 аудио «' + (m.audio.file_name || 'без имени') + '», ' + Math.round((m.audio.duration || 0) / 60) + ' мин'
  if (m.document) return '📎 документ «' + (m.document.file_name || '') + '»'
  return '(тип сообщения без текста)'
}

function fmt(iso) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function load() {
  err.value = ''
  const { data, error } = await db
    .from('messages')
    .select('id, message_id, direction, raw, status, created_at')
    .eq('telegram_id', route.params.id)
    .order('id', { ascending: true })
  if (error) err.value = 'Ошибка: ' + error.message
  else messages.value = data
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <section>
    <NuxtLink to="/">← Все диалоги</NuxtLink>
    <div v-for="m in messages" :key="m.id" class="z-msg" :class="m.direction">
      {{ textOf(m.raw) }}
      <div class="z-meta">{{ m.direction === 'in' ? 'пользователь' : 'бот' }} · №{{ m.message_id }} · {{ fmt(m.created_at) }} · {{ m.status }}</div>
    </div>
    <p v-if="!messages.length && !err" class="z-muted">Сообщений нет.</p>
    <div class="z-err">{{ err }}</div>
  </section>
</template>
