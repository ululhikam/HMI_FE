import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type { AuthSession, LoginInput, User } from '@/types'

export interface RefreshInput {
  refreshToken: string
}

export const authService = {
  login(input: LoginInput): Promise<AuthSession> {
    return http.post<AuthSession>(endpoints.auth.login, input)
  },

  logout(): Promise<{ message: string }> {
    return http.post<{ message: string }>(endpoints.auth.logout)
  },

  me(): Promise<User> {
    return http.get<User>(endpoints.auth.me)
  },

  refresh(refreshToken: string): Promise<AuthSession> {
    return http.post<AuthSession>(endpoints.auth.refresh, { refreshToken })
  },
}
