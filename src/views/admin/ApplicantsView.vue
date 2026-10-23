<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useApplicantStore } from '@/stores/applicants'
import type { ApplicantStatus, LK1Applicant } from '@/types'

const store = useApplicantStore()
const detail = ref<LK1Applicant | null>(null)

const filters: Array<{ value: ApplicantStatus | 'Semua'; label: string }> = [
  { value: 'Semua', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Diterima' },
  { value: 'rejected', label: 'Ditolak' },
]

function statusLabel(status: ApplicantStatus) {
  return status === 'pending' ? 'Pending' : status === 'accepted' ? 'Diterima' : 'Ditolak'
}

function statusClass(status: ApplicantStatus) {
  return {
    'bg-yellow-100 text-yellow-700': status === 'pending',
    'bg-green-100 text-green-700': status === 'accepted',
    'bg-red-100 text-red-700': status === 'rejected',
  }
}

async function updateStatus(applicant: LK1Applicant, status: ApplicantStatus) {
  const updated = await store.updateStatus(applicant.id, status)
  const current = detail.value
  if (updated && current && current.id === applicant.id) {
    detail.value = { ...current, status }
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(() => {
  void store.fetchApplicants()
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-extrabold text-[#111212]">Pendaftar LK 1</h1>
        <p class="text-[#4D4D4D] text-sm mt-0.5">
          {{ store.stats.total || store.applicants.length }} total pendaftar
        </p>
      </div>
      <button
        @click="store.exportCsv"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#006837] hover:bg-[#004a27] text-white font-bold text-sm rounded-xl transition-all"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export CSV
      </button>
    </div>

    <p v-if="store.error && !detail" class="mb-4 text-sm text-red-500">{{ store.error }}</p>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl border border-[#E6E6E6] p-4 text-center">
        <div class="text-2xl font-extrabold text-yellow-600">{{ store.stats.pending }}</div>
        <div class="text-xs text-[#4D4D4D] font-semibold mt-1">Pending</div>
      </div>
      <div class="bg-white rounded-2xl border border-[#E6E6E6] p-4 text-center">
        <div class="text-2xl font-extrabold text-green-600">{{ store.stats.accepted }}</div>
        <div class="text-xs text-[#4D4D4D] font-semibold mt-1">Diterima</div>
      </div>
      <div class="bg-white rounded-2xl border border-[#E6E6E6] p-4 text-center">
        <div class="text-2xl font-extrabold text-red-500">{{ store.stats.rejected }}</div>
        <div class="text-xs text-[#4D4D4D] font-semibold mt-1">Ditolak</div>
      </div>
    </div>

    <!-- Search & filter -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative max-w-sm flex-1 min-w-[220px]">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#C9C9C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          v-model="store.search"
          type="text"
          placeholder="Cari nama atau NIM..."
          class="w-full pl-10 pr-8 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246] transition-all"
        />
        <button v-if="store.search" @click="store.search = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#C9C9C9] hover:text-[#4D4D4D]" title="Hapus pencarian">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex gap-1.5">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="store.statusFilter = filter.value"
          class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all"
          :class="store.statusFilter === filter.value
            ? 'bg-[#009246] text-white border-[#009246]'
            : 'bg-white text-[#4D4D4D] border-[#E6E6E6] hover:border-[#009246]'"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-[#E6E6E6] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-[#F7F7F5] border-b border-[#E6E6E6]">
              <th class="text-left px-5 py-3 text-xs font-bold text-[#4D4D4D] uppercase tracking-wider">Nama / NIM</th>
              <th class="text-left px-4 py-3 text-xs font-bold text-[#4D4D4D] uppercase tracking-wider hidden md:table-cell">Universitas</th>
              <th class="text-left px-4 py-3 text-xs font-bold text-[#4D4D4D] uppercase tracking-wider hidden lg:table-cell">Kontak</th>
              <th class="text-left px-4 py-3 text-xs font-bold text-[#4D4D4D] uppercase tracking-wider">Status</th>
              <th class="text-left px-4 py-3 text-xs font-bold text-[#4D4D4D] uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E6E6E6]">
            <tr v-for="ap in store.filteredApplicants" :key="ap.id" class="hover:bg-[#F7F7F5] transition-colors">
              <td class="px-5 py-3">
                <button @click="detail = ap" class="font-semibold text-[#111212] text-left hover:text-[#009246] transition-colors">
                  {{ ap.fullName }}
                </button>
                <div class="text-xs text-[#4D4D4D]">{{ ap.nim }} · {{ ap.faculty }}</div>
              </td>
              <td class="px-4 py-3 text-xs text-[#4D4D4D] hidden md:table-cell">{{ ap.university }}</td>
              <td class="px-4 py-3 hidden lg:table-cell">
                <div class="text-xs text-[#4D4D4D]">{{ ap.email }}</div>
                <div class="text-xs text-[#4D4D4D]">{{ ap.phone }}</div>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full" :class="statusClass(ap.status)">
                  {{ statusLabel(ap.status) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-1.5">
                  <button
                    @click="updateStatus(ap, 'accepted')"
                    v-if="ap.status !== 'accepted'"
                    :disabled="store.isSaving"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-100 transition-colors disabled:opacity-40"
                    title="Terima"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    @click="updateStatus(ap, 'rejected')"
                    v-if="ap.status !== 'rejected'"
                    :disabled="store.isSaving"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40"
                    title="Tolak"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    @click="detail = ap"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-[#4D4D4D] hover:bg-[#009246]/10 hover:text-[#009246] transition-colors"
                    title="Lihat detail"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="store.filteredApplicants.length === 0">
              <td colspan="5" class="py-10 text-center text-[#4D4D4D] text-sm">
                {{ store.isLoading ? 'Memuat pendaftar...' : 'Tidak ada pendaftar ditemukan' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail modal -->
    <Transition name="fade">
      <div v-if="detail" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" @click.self="detail = null">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto">
          <div class="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 class="text-xl font-extrabold text-[#111212]">{{ detail.fullName }}</h2>
              <p class="text-sm text-[#4D4D4D] mt-0.5">{{ detail.nim }} · {{ detail.faculty }} — {{ detail.major }}</p>
            </div>
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0" :class="statusClass(detail.status)">
              {{ statusLabel(detail.status) }}
            </span>
          </div>

          <dl class="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-xs font-bold text-[#4D4D4D] uppercase tracking-wider mb-0.5">Universitas</dt>
              <dd class="text-[#111212]">{{ detail.university }}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-[#4D4D4D] uppercase tracking-wider mb-0.5">Tanggal Daftar</dt>
              <dd class="text-[#111212]">{{ formatDate(detail.submittedAt) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-[#4D4D4D] uppercase tracking-wider mb-0.5">Email</dt>
              <dd class="text-[#111212] break-all">{{ detail.email }}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-[#4D4D4D] uppercase tracking-wider mb-0.5">Telepon</dt>
              <dd class="text-[#111212]">{{ detail.phone }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs font-bold text-[#4D4D4D] uppercase tracking-wider mb-0.5">Alamat</dt>
              <dd class="text-[#111212]">{{ detail.address }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs font-bold text-[#4D4D4D] uppercase tracking-wider mb-0.5">Motivasi</dt>
              <dd class="text-[#111212] whitespace-pre-line">{{ detail.motivation }}</dd>
            </div>
          </dl>

          <p v-if="store.error" class="mt-4 text-sm text-red-500">{{ store.error }}</p>

          <div class="flex gap-3 pt-6">
            <button @click="detail = null" class="flex-1 py-2.5 border border-[#E6E6E6] text-[#4D4D4D] font-bold rounded-xl text-sm hover:border-[#009246] hover:text-[#009246] transition-colors">Tutup</button>
            <button
              v-if="detail.status !== 'accepted'"
              @click="updateStatus(detail, 'accepted')"
              :disabled="store.isSaving"
              class="flex-1 py-2.5 bg-green-600 disabled:opacity-60 text-white font-bold rounded-xl text-sm hover:bg-green-700 transition-colors"
            >
              Terima
            </button>
            <button
              v-if="detail.status !== 'rejected'"
              @click="updateStatus(detail, 'rejected')"
              :disabled="store.isSaving"
              class="flex-1 py-2.5 bg-red-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition-colors"
            >
              Tolak
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
