<script setup>
const { session, init, signIn } = useAuth()
const email = ref('')
const password = ref('')
const err = ref('')

onMounted(async () => {
  await init()
  if (session.value) navigateTo('/')
})

async function submit() {
  err.value = ''
  const message = await signIn(email.value.trim(), password.value)
  if (message) err.value = 'Не удалось войти: ' + message
  else navigateTo('/')
}
</script>

<template>
  <section class="z-card">
    <label>Почта</label>
    <input v-model="email" type="email" autocomplete="username" />
    <label>Пароль</label>
    <input v-model="password" type="password" autocomplete="current-password" @keyup.enter="submit" />
    <button @click="submit">Войти</button>
    <div class="z-err">{{ err }}</div>
    <p class="z-muted">Доступ только по приглашению. Без входа данные не отдаются.</p>
  </section>
</template>
