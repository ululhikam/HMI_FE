import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type { DashboardStats } from '@/types'

export const dashboardService = {
  getStats(): Promise<DashboardStats> {
    return http.get<DashboardStats>(endpoints.admin.dashboard)
  },
}
