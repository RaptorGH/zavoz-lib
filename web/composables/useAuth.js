// Вход через Supabase Auth. Сессию хранит supabase-js в localStorage браузера (не в куках).
let initPromise = null

export function useAuth() {
  const db = useSupabaseClient()
  const session = useState('auth:session', () => null)

  function init() {
    if (!initPromise) {
      initPromise = db.auth.getSession().then(({ data }) => {
        session.value = data.session
        db.auth.onAuthStateChange((_event, s) => {
          session.value = s
        })
      })
    }
    return initPromise
  }

  async function signIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password })
    if (error) return error.message
    session.value = data.session
    return null
  }

  async function signOut() {
    await db.auth.signOut()
    session.value = null
    navigateTo('/login')
  }

  return { session, init, signIn, signOut }
}
