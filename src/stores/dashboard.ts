import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import type { DashboardStats } from '@/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats | null>(null)
  const isLoading = ref(false)
  const error = ref('')

  async function fetchStats(force = false) {
    if (stats.value && !force) return
    isLoading.value = true
    error.value = ''
    try {
      stats.value = await dashboardService.getStats()
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat ringkasan dashboard.')
    } finally {
      isLoading.value = false
    }
  }

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  }
})
