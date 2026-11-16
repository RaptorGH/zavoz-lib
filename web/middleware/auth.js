// Закрывает страницы от неавторизованных (подключается через definePageMeta({ middleware: 'auth' })).
export default defineNuxtRouteMiddleware(async (to) => {
  const { session, init } = useAuth()
  await init()
  if (!session.value && to.path !== '/login') return navigateTo('/login')
})
