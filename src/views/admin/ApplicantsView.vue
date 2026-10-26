<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import WhatsAppComposer from '@/components/common/WhatsAppComposer.vue'
import { useApplicantStore } from '@/stores/applicants'
import { useSiteStore } from '@/stores/site'
import type { ApplicantStatus, LK1Applicant } from '@/types'
import { isValidWhatsAppNumber } from '@/utils/whatsapp'

const store = useApplicantStore()
const siteStore = useSiteStore()
const detail = ref<LK1Applicant | null>(null)
const toastMessage = ref('')
const showToast = ref(false)
const waComposer = ref<LK1Applicant | null>(null)

const filters: Array<{ value: ApplicantStatus | 'Semua'; label: string }> = [
  { value: 'Semua', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'accepted', label: 'Diterima' },
  { value: 'rejected', label: 'Ditolak' },
]

const summary = computed(() => [
  { label: 'Total pendaftar', value: store.stats.total || store.applicants.length },
  { label: 'Menunggu review', value: store.stats.pending },
  { label: 'Diterima', value: store.stats.accepted },
  { label: 'Ditolak', value: store.stats.rejected },
])

const hasFilters = computed(() => Boolean(store.search) || store.statusFilter !== 'Semua')

function statusLabel(status: ApplicantStatus) {
  return status === 'pending' ? 'Menunggu' : status === 'accepted' ? 'Diterima' : 'Ditolak'
}

function statusClass(status: ApplicantStatus) {
  return status === 'accepted'
    ? 'bg-lime/30 text-forest'
    : status === 'rejected'
      ? 'bg-red-50 text-red-600'
      : 'bg-amber-50 text-amber-700'
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function triggerToast(message: string) {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3200)
}

function hasWhatsApp(applicant: LK1Applicant) {
  return isValidWhatsAppNumber(applicant.phone)
}

function acceptanceMessage(applicant: LK1Applicant) {
  const organization = siteStore.settings.organizationName || 'HMI Komisariat Insan Cita'
  const chapter = siteStore.settings.chapterName ? ` ${siteStore.settings.chapterName}` : ''
  return [
    `Selamat, ${applicant.fullName}!`,
    '',
    `Pendaftaran Anda sebagai peserta Latihan Kader 1 (LK 1) ${organization}${chapter} telah DITERIMA.`,
    '',
    'Silakan menunggu informasi jadwal, kelompok, dan teknis pelaksanaan dari panitia. Pastikan nomor WhatsApp ini aktif agar tidak tertinggal informasi.',
    '',
    'Sampai jumpa di proses kaderisasi.',
    'Yakin Usaha Sampai!',
  ].join('\n')
}

function openWhatsApp(applicant: LK1Applicant) {
  if (!hasWhatsApp(applicant)) {
    triggerToast('Nomor WhatsApp pendaftar belum tersedia atau tidak valid.')
    return
  }
  waComposer.value = applicant
}

async function updateStatus(applicant: LK1Applicant, status: ApplicantStatus) {
  const ok = await store.updateStatus(applicant.id, status)
  if (!ok) {
    triggerToast(store.error || 'Gagal memperbarui status pendaftar.')
    return
  }
  if (detail.value?.id === applicant.id) {
    const updated = store.applicants.find((item) => item.id === applicant.id)
    detail.value = updated ?? { ...detail.value, status }
  }
  if (status === 'accepted') {
    const updated = store.applicants.find((item) => item.id === applicant.id) ?? { ...applicant, status }
    if (hasWhatsApp(updated)) {
      waComposer.value = updated
      triggerToast('Pendaftar diterima. Kirim konfirmasi penerimaan melalui WhatsApp.')
    } else {
      triggerToast('Pendaftar diterima, tetapi nomor WhatsApp tidak valid. Hubungi pendaftar secara manual.')
    }
    return
  }
  triggerToast(
    status === 'rejected'
      ? 'Pendaftar ditandai sebagai ditolak.'
      : 'Status pendaftar diperbarui.',
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function resetFilters() {
  store.search = ''
  store.statusFilter = 'Semua'
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (waComposer.value) {
    waComposer.value = null
    return
  }
  detail.value = null
}

watch([detail, waComposer], ([currentDetail, currentComposer]) => {
  document.body.style.overflow = currentDetail || currentComposer ? 'hidden' : ''
})

onMounted(() => {
  void store.fetchApplicants(true)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="space-y-5">
    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="showToast"
        class="fixed bottom-5 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold text-white shadow-2xl"
      >
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-white">
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <span class="eyebrow eyebrow-ink">Penerimaan kader</span>
        <h1 class="display-md mt-4">Pendaftar LK 1<span class="text-moss">.</span></h1>
        <p class="mt-2 max-w-xl text-xs font-semibold leading-relaxed text-muted">
          Tinjau formulir calon peserta Latihan Kader 1 dan tentukan status penerimaan.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <button type="button" class="admin-btn admin-btn-ghost" :disabled="store.isLoading" @click="store.fetchApplicants(true)">
          <svg class="h-3.5 w-3.5" :class="{ 'animate-spin': store.isLoading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Segarkan
        </button>
        <button type="button" class="admin-btn admin-btn-dark" :disabled="!store.filteredApplicants.length" @click="store.exportCsv">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Ekspor CSV
        </button>
      </div>
    </div>

    <p v-if="store.error && !detail" class="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
      {{ store.error }}
    </p>

    <!-- Summary -->
    <div class="admin-card grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
      <div v-for="(item, index) in summary" :key="item.label" class="p-4 sm:p-5" :class="index >= 2 ? 'border-t border-line sm:border-t-0' : ''">
        <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">{{ item.label }}</p>
        <p class="mt-2 font-display text-2xl font-bold leading-none tracking-tight text-ink">{{ item.value }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="admin-card p-3 sm:p-4">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div class="relative flex-1 xl:max-w-sm">
          <svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" stroke-linecap="round" />
          </svg>
          <input v-model="store.search" type="search" placeholder="Cari nama, NIM, atau universitas..." class="admin-input pl-9" />
        </div>

        <div class="hide-scrollbar flex items-center gap-1.5 overflow-x-auto">
          <button
            v-for="filter in filters"
            :key="filter.value"
            type="button"
            class="flex-shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.08em] transition-colors"
            :class="store.statusFilter === filter.value ? 'border-ink bg-ink text-lime-soft' : 'border-line bg-white text-muted hover:border-ink/30 hover:text-ink'"
            @click="store.statusFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <div class="flex items-center gap-3 xl:ml-auto">
          <span class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{{ store.filteredApplicants.length }} pendaftar</span>
          <button v-if="hasFilters" type="button" class="text-[8px] font-black uppercase tracking-[0.08em] text-moss transition-colors hover:text-ink" @click="resetFilters">
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card overflow-hidden">
      <div v-if="store.isLoading" class="p-14 text-center">
        <span class="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-line border-t-moss" />
        <p class="mt-3 text-[10px] font-semibold text-muted">Memuat pendaftar...</p>
      </div>

      <div v-else-if="store.filteredApplicants.length === 0" class="p-14 text-center">
        <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper text-moss">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <p class="mt-4 text-xs font-bold text-ink">{{ hasFilters ? 'Tidak ada pendaftar yang cocok.' : 'Belum ada pendaftar LK 1.' }}</p>
        <p class="mx-auto mt-1.5 max-w-sm text-[10px] font-semibold leading-relaxed text-muted">
          {{ hasFilters ? 'Ubah kata kunci atau status untuk menemukan pendaftar lain.' : 'Formulir pendaftaran dari halaman publik akan muncul di sini.' }}
        </p>
        <button v-if="hasFilters" type="button" class="admin-btn admin-btn-ghost mt-4" @click="resetFilters">Reset filter</button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Pendaftar</th>
              <th class="hidden md:table-cell">Kampus</th>
              <th class="hidden xl:table-cell">Kontak</th>
              <th class="hidden lg:table-cell">Tanggal daftar</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="applicant in store.filteredApplicants" :key="applicant.id">
              <td class="max-w-[260px]">
                <div class="flex items-center gap-2.5">
                  <span class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-paper text-[8px] font-black text-moss">
                    {{ initials(applicant.fullName) }}
                  </span>
                  <div class="min-w-0">
                    <button type="button" class="block max-w-full truncate text-left text-[11px] font-extrabold text-ink transition-colors hover:text-moss" @click="detail = applicant">
                      {{ applicant.fullName }}
                    </button>
                    <p class="mt-0.5 truncate text-[9px] font-semibold text-muted">{{ applicant.nim }} · {{ applicant.faculty }}</p>
                  </div>
                </div>
              </td>
              <td class="hidden md:table-cell">
                <p class="max-w-[180px] truncate text-[10px] font-bold text-ink">{{ applicant.university }}</p>
                <p class="mt-0.5 max-w-[180px] truncate text-[9px] font-semibold text-muted">{{ applicant.major }}</p>
              </td>
              <td class="hidden xl:table-cell">
                <a :href="`mailto:${applicant.email}`" class="block max-w-[180px] truncate text-[10px] font-semibold text-muted hover:text-moss">{{ applicant.email }}</a>
                <a :href="`tel:${applicant.phone}`" class="mt-0.5 block text-[9px] font-semibold text-muted hover:text-moss">{{ applicant.phone }}</a>
              </td>
              <td class="hidden text-[10px] font-semibold text-muted lg:table-cell">{{ formatDate(applicant.submittedAt) }}</td>
              <td>
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em]" :class="statusClass(applicant.status)">
                  <span class="h-1 w-1 rounded-full bg-current" />
                  {{ statusLabel(applicant.status) }}
                </span>
              </td>
              <td>
                <div class="flex items-center justify-end gap-1">
                  <button
                    v-if="applicant.status !== 'accepted'"
                    type="button"
                    :disabled="store.isSaving"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-moss transition-colors hover:bg-lime/20 disabled:opacity-40"
                    title="Terima pendaftar"
                    @click="updateStatus(applicant, 'accepted')"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                      <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button
                    v-else-if="hasWhatsApp(applicant)"
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-lime/15 text-moss transition-colors hover:bg-lime hover:text-white"
                    title="Kirim WhatsApp penerimaan"
                    aria-label="Kirim WhatsApp penerimaan"
                    @click="openWhatsApp(applicant)"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2a9.9 9.9 0 00-8.5 15.02L2 22l5.1-1.5A9.9 9.9 0 1012.04 2zm0 18.1a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.02.89.9-2.95-.2-.31A8.2 8.2 0 1112.04 20.1zm4.5-6.14c-.25-.13-1.47-.73-1.7-.81-.23-.09-.4-.13-.56.12-.17.25-.64.81-.78.98-.14.16-.29.18-.53.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.12.17 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.23-.17-.48-.3z" />
                    </svg>
                  </button>
                  <button
                    v-if="applicant.status !== 'rejected'"
                    type="button"
                    :disabled="store.isSaving"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                    title="Tolak pendaftar"
                    @click="updateStatus(applicant, 'rejected')"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                      <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
                    title="Lihat detail"
                    @click="detail = applicant"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke-linecap="round" stroke-linejoin="round" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="detail"
          class="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          @click.self="detail = null"
        >
          <div class="modal-viewport flex w-full max-w-2xl flex-col overflow-hidden rounded-[1.6rem] border border-line bg-paper shadow-2xl">
            <div class="flex flex-shrink-0 items-start justify-between gap-4 border-b border-line bg-white px-5 py-4">
              <div class="flex min-w-0 items-center gap-3">
                <span class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-lime-soft">
                  {{ initials(detail.fullName) }}
                </span>
                <div class="min-w-0">
                  <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">Formulir pendaftar</p>
                  <h2 class="mt-1 truncate font-display text-xl font-bold tracking-tight text-ink">{{ detail.fullName }}</h2>
                  <p class="mt-0.5 truncate text-[9px] font-semibold text-muted">{{ detail.nim }} · {{ detail.faculty }} — {{ detail.major }}</p>
                </div>
              </div>
              <button type="button" class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink" aria-label="Tutup" @click="detail = null">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto p-5">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em]" :class="statusClass(detail.status)">
                  <span class="h-1 w-1 rounded-full bg-current" />
                  {{ statusLabel(detail.status) }}
                </span>
                <span class="rounded-full border border-line px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.06em] text-muted">
                  Daftar {{ formatDate(detail.submittedAt) }}
                </span>
              </div>

              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div class="rounded-[1rem] border border-line bg-white p-4">
                  <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Universitas</p>
                  <p class="mt-1.5 text-[11px] font-bold text-ink">{{ detail.university }}</p>
                </div>
                <div class="rounded-[1rem] border border-line bg-white p-4">
                  <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Fakultas / jurusan</p>
                  <p class="mt-1.5 text-[11px] font-bold text-ink">{{ detail.faculty }} — {{ detail.major }}</p>
                </div>
                <div class="rounded-[1rem] border border-line bg-white p-4">
                  <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Email</p>
                  <a :href="`mailto:${detail.email}`" class="mt-1.5 block break-all text-[11px] font-bold text-moss hover:underline">{{ detail.email }}</a>
                </div>
                <div class="rounded-[1rem] border border-line bg-white p-4">
                  <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Telepon</p>
                  <a :href="`tel:${detail.phone}`" class="mt-1.5 block text-[11px] font-bold text-moss hover:underline">{{ detail.phone }}</a>
                </div>
                <div class="rounded-[1rem] border border-line bg-white p-4 sm:col-span-2">
                  <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Alamat</p>
                  <p class="mt-1.5 text-[11px] font-semibold leading-relaxed text-ink/70">{{ detail.address }}</p>
                </div>
              </div>

              <div class="mt-3 rounded-[1rem] bg-ink p-4 text-paper">
                <div class="flex items-center gap-2">
                  <span class="h-1 w-1 rounded-full bg-lime" />
                  <p class="text-[8px] font-black uppercase tracking-[0.16em] text-lime-soft">Motivasi bergabung</p>
                </div>
                <p class="mt-2.5 whitespace-pre-line text-[11px] font-medium leading-relaxed text-white/65">{{ detail.motivation }}</p>
              </div>

              <p v-if="store.error" class="mt-3 rounded-[0.9rem] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-600">{{ store.error }}</p>
            </div>

            <div class="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line bg-white px-5 py-4">
              <button type="button" class="admin-btn admin-btn-ghost" @click="detail = null">Tutup</button>
              <div class="flex items-center gap-2">
                <button
                  v-if="detail.status === 'accepted' && hasWhatsApp(detail)"
                  type="button"
                  class="admin-btn admin-btn-lime"
                  @click="openWhatsApp(detail)"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2a9.9 9.9 0 00-8.5 15.02L2 22l5.1-1.5A9.9 9.9 0 1012.04 2zm0 18.1a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.02.89.9-2.95-.2-.31A8.2 8.2 0 1112.04 20.1zm4.5-6.14c-.25-.13-1.47-.73-1.7-.81-.23-.09-.4-.13-.56.12-.17.25-.64.81-.78.98-.14.16-.29.18-.53.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.12.17 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.23-.17-.48-.3z" />
                  </svg>
                  Kirim WhatsApp
                </button>
                <button
                  v-if="detail.status !== 'rejected'"
                  type="button"
                  :disabled="store.isSaving"
                  class="admin-btn border border-red-200 bg-white text-red-500 hover:bg-red-50 disabled:opacity-60"
                  @click="updateStatus(detail, 'rejected')"
                >
                  Tolak
                </button>
                <button
                  v-if="detail.status !== 'accepted'"
                  type="button"
                  :disabled="store.isSaving"
                  class="admin-btn admin-btn-lime disabled:opacity-60"
                  @click="updateStatus(detail, 'accepted')"
                >
                  {{ store.isSaving ? 'Menyimpan...' : 'Terima pendaftar' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Dialog komposer WhatsApp -->
    <WhatsAppComposer
      v-if="waComposer"
      :recipient-name="waComposer.fullName"
      :phone="waComposer.phone"
      :default-message="acceptanceMessage(waComposer)"
      eyebrow="Pendaftar LK 1 diterima"
      title="Kirim konfirmasi WhatsApp"
      @close="waComposer = null"
    />
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(14px) scale(0.985);
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 200ms ease, transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
