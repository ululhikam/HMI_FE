import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Restore user session before mounting (token divalidasi ke GET /auth/me).
const auth = useAuthStore()
void auth.restoreSession()

// Sesi kedaluwarsa dari http client -> bersihkan state dan kembali ke login.
window.addEventListener('hmi:unauthorized', () => {
  auth.clearSession()
  const current = router.currentRoute.value
  if (current.name !== 'login') {
    void router.push({ name: 'login', query: { redirect: current.fullPath } })
  }
})

app.mount('#app')
