import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authService } from '@/api/services'
import { tokenStorage } from '@/api/token'
import { ApiError, getErrorMessage } from '@/api/errors'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(tokenStorage.getStoredUser<User>())
  const isAuthenticated = ref(Boolean(tokenStorage.getAccessToken() && currentUser.value))
  const isLoading = ref(false)
  const error = ref('')

  async function login(email: string, password: string): Promise<boolean> {
    isLoading.value = true
    error.value = ''
    try {
      const session = await authService.login({ email, password })
      currentUser.value = session.user
      tokenStorage.setTokens(session.accessToken, session.refreshToken)
      tokenStorage.setStoredUser(session.user)
      isAuthenticated.value = true
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Login gagal. Silakan coba lagi.')
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      if (isAuthenticated.value) await authService.logout()
    } catch {
      // Sesi tetap dibersihkan meskipun request logout gagal.
    } finally {
      clearSession()
    }
  }

  function clearSession() {
    currentUser.value = null
    isAuthenticated.value = false
    error.value = ''
    tokenStorage.clearSession()
  }

  /**
   * Restore sesi dari localStorage, lalu validasi token ke `GET /auth/me`.
   * Jika token kedaluwarsa, sesi dibersihkan.
   */
  async function restoreSession() {
    if (!tokenStorage.getAccessToken()) {
      clearSession()
      return
    }

    isAuthenticated.value = true
    try {
      const user = await authService.me()
      currentUser.value = user
      tokenStorage.setStoredUser(user)
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) clearSession()
    }
  }

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearSession,
    restoreSession,
  }
})
