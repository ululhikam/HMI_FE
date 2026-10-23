const ACCESS_TOKEN_KEY = 'hmi.access_token'
const REFRESH_TOKEN_KEY = 'hmi.refresh_token'
const USER_KEY = 'hmi.auth_user'

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  getStoredUser<T>(): T | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },

  setStoredUser(user: unknown) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  clearStoredUser() {
    localStorage.removeItem(USER_KEY)
  },

  /** Hapus seluruh sesi yang tersimpan. */
  clearSession() {
    this.clearTokens()
    this.clearStoredUser()
  },
}
