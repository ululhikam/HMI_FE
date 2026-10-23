import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { applicantsService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import type {
  ApplicantStats,
  ApplicantStatus,
  LK1Applicant,
  LK1ApplicationInput,
} from '@/types'

const emptyStats: ApplicantStats = { total: 0, pending: 0, accepted: 0, rejected: 0 }

export const useApplicantStore = defineStore('applicants', () => {
  const applicants = ref<LK1Applicant[]>([])
  const stats = ref<ApplicantStats>({ ...emptyStats })
  const search = ref('')
  const statusFilter = ref<ApplicantStatus | 'Semua'>('Semua')
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  const filteredApplicants = computed(() => {
    let result = [...applicants.value]
    if (statusFilter.value !== 'Semua') {
      result = result.filter((applicant) => applicant.status === statusFilter.value)
    }
    const query = search.value.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (applicant) =>
          applicant.fullName.toLowerCase().includes(query) || applicant.nim.includes(query),
      )
    }
    return result
  })

  async function fetchStats() {
    try {
      stats.value = await applicantsService.getStats()
    } catch {
      // Statistik non-kritis; daftar tetap bisa ditampilkan.
    }
  }

  async function fetchApplicants(force = false) {
    if (applicants.value.length && !force) return
    isLoading.value = true
    error.value = ''
    try {
      const [page] = await Promise.all([applicantsService.list({ perPage: 100 }), fetchStats()])
      applicants.value = page.items
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat data pendaftar.')
    } finally {
      isLoading.value = false
    }
  }

  async function updateStatus(id: string, status: ApplicantStatus): Promise<boolean> {
    isSaving.value = true
    error.value = ''
    try {
      const updated = await applicantsService.updateStatus(id, status)
      const index = applicants.value.findIndex((applicant) => applicant.id === id)
      if (index !== -1) applicants.value[index] = updated
      await fetchStats()
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memperbarui status pendaftar.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  /** Dipakai halaman pendaftaran publik. */
  async function submitApplication(input: LK1ApplicationInput): Promise<LK1Applicant | null> {
    isSaving.value = true
    error.value = ''
    try {
      return await applicantsService.create(input)
    } catch (err) {
      error.value = getErrorMessage(err, 'Pendaftaran gagal dikirim.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  function exportCsv() {
    const headers = 'ID,Nama,NIM,Fakultas,Jurusan,Universitas,Email,HP,Tanggal,Status'
    const rows = filteredApplicants.value.map((applicant) =>
      [
        applicant.id,
        `"${applicant.fullName}"`,
        applicant.nim,
        `"${applicant.faculty}"`,
        `"${applicant.major}"`,
        `"${applicant.university}"`,
        applicant.email,
        applicant.phone,
        applicant.submittedAt,
        applicant.status,
      ].join(','),
    )
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'pendaftar-lk1.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return {
    applicants,
    stats,
    search,
    statusFilter,
    isLoading,
    isSaving,
    error,
    filteredApplicants,
    fetchApplicants,
    fetchStats,
    updateStatus,
    submitApplication,
    exportCsv,
  }
})
