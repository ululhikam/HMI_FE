import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type { Paginated, QueryParams } from '@/api/types'
import type {
  AdminRole,
  AdminUser,
  AdminUserCreateInput,
  AdminUserUpdateInput,
} from '@/types'

export interface AdminUserListQuery {
  page?: number
  perPage?: number
  search?: string
  role?: AdminRole | 'Semua'
  isActive?: boolean
}

function toQuery(query: AdminUserListQuery): QueryParams {
  return {
    page: query.page,
    perPage: query.perPage,
    search: query.search,
    role: query.role === 'Semua' ? undefined : query.role,
    isActive: query.isActive,
  }
}

export const adminUsersService = {
  list(query: AdminUserListQuery = {}): Promise<Paginated<AdminUser>> {
    return http.paginated<AdminUser>(endpoints.adminUsers.list, toQuery(query))
  },

  create(input: AdminUserCreateInput): Promise<AdminUser> {
    return http.post<AdminUser>(endpoints.adminUsers.list, input)
  },

  update(id: string, input: AdminUserUpdateInput): Promise<AdminUser> {
    return http.patch<AdminUser>(endpoints.adminUsers.detail(id), input)
  },

  remove(id: string): Promise<{ message: string }> {
    return http.delete<{ message: string }>(endpoints.adminUsers.detail(id))
  },

  resetPassword(id: string, password: string): Promise<{ message: string }> {
    return http.post<{ message: string }>(endpoints.adminUsers.resetPassword(id), { password })
  },
}
