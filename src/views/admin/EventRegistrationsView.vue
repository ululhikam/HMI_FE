<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventRegistrationStore } from '@/stores/eventRegistrations'
import type {
  EventRegistrationStatus,
  EventRegistrationWithEvent,
} from '@/types'

const route = useRoute()
const store = useEventRegistrationStore()

const detail = ref<EventRegistrationWithEvent | null>(null)
const registrationToDelete = ref<EventRegistrationWithEvent | null>(null)
const deleteError = ref('')
const toastMessage = ref('')
const showToast = ref(false)

const filters: Array<{ value: EventRegistrationStatus | 'Semua'; label: string }> = [
  { value: 'Semua', label: 'Semua' },
  { value: 'confirmed', label: 'Terkonfirmasi' },
  { value: 'waitlist', label: 'Cadangan' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const summary = computed(() => {
  const scoped = store.scopedRegistrations
  return [
    { label: 'Total pendaftar', value: scoped.length },
    {
      label: 'Terkonfirmasi',
      value: scoped.filter((registration) => registration.status === 'confirmed').length,
    },
    {
      label: 'Cadangan',
      value: scoped.filter((registration) => registration.status === 'waitlist').length,
    },
    {
      label: 'Dibatalkan',
      value: scoped.filter((registration) => registration.status === 'cancelled').length,
    },
  ]
})

const hasFilters = computed(
  () =>
    Boolean(store.search) ||
    store.eventFilter !== 'Semua' ||
    store.statusFilter !== 'Semua',
)

function statusLabel(status: EventRegistrationStatus) {
  return status === 'confirmed'
    ? 'Terkonfirmasi'
    : status === 'waitlist'
      ? 'Cadangan'
      : 'Dibatalkan'
}

function statusClass(status: EventRegistrationStatus) {
  return status === 'confirmed'
    ? 'bg-lime/30 text-forest'
    : status === 'waitlist'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-red-50 text-red-600'
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
  window.setTimeout(() => {
    showToast.value = false
  }, 3200)
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })} WIB`
}

function normalizeWhatsAppNumber(phone?: string) {
  let digits = (phone ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('620')) digits = `62${digits.slice(3)}`
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

function whatsappUrl(registration: EventRegistrationWithEvent) {
  const number = normalizeWhatsAppNumber(registration.phone)
  if (!/^62\d{8,13}$/.test(number)) return ''
  const eventTitle = registration.event?.title
  const message = eventTitle
    ? `Halo ${registration.name}, kami dari panitia agenda "${eventTitle}". Kami ingin mengonfirmasi pendaftaran Anda.`
    : `Halo ${registration.name}, kami dari panitia agenda. Kami ingin mengonfirmasi pendaftaran Anda.`
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

function exportCsv() {
  const headers = [
    'Nama',
    'Email',
    'WhatsApp',
    'Agenda',
    'Kategori',
    'Jadwal agenda',
    'Tanggal daftar',
    'Status',
  ]
  const rows = store.filteredRegistrations.map((registration) => [
    registration.name,
    registration.email,
    registration.phone ?? '',
    registration.event?.title ?? '',
    registration.event?.category ?? '',
    registration.event?.date ?? '',
    registration.createdAt,
    statusLabel(registration.status),
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'pendaftar-agenda.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function resetFilters() {
  store.search = ''
  store.eventFilter = 'Semua'
  store.statusFilter = 'Semua'
}

async function updateStatus(
  registration: EventRegistrationWithEvent,
  status: EventRegistrationStatus,
) {
  if (registration.status === status || store.isSaving) return

  const ok = await store.updateStatus(registration.id, status)
  if (!ok) {
    triggerToast(store.error || 'Gagal memperbarui status pendaftar.')
    return
  }

  if (detail.value?.id === registration.id) {
    detail.value =
      store.registrations.find((item) => item.id === registration.id) ?? {
        ...registration,
        status,
      }
  }

  triggerToast(`Status ${registration.name} diubah menjadi ${statusLabel(status).toLowerCase()}.`)
}

function openDeleteConfirm(registration: EventRegistrationWithEvent) {
  registrationToDelete.value = registration
  deleteError.value = ''
}

function closeDeleteConfirm() {
  if (store.isSaving) return
  registrationToDelete.value = null
  deleteError.value = ''
}

async function handleDelete() {
  if (!registrationToDelete.value || store.isSaving) return

  const target = registrationToDelete.value
  deleteError.value = ''
  const ok = await store.deleteRegistration(target.id)
  if (!ok) {
    deleteError.value = store.error || 'Gagal menghapus pendaftaran agenda.'
    return
  }

  if (detail.value?.id === target.id) detail.value = null
  registrationToDelete.value = null
  triggerToast('Pendaftaran agenda berhasil dihapus.')
}

function setFilterFromRoute(value: unknown) {
  store.eventFilter = typeof value === 'string' && value ? value : 'Semua'
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (registrationToDelete.value) {
    closeDeleteConfirm()
    return
  }
  detail.value = null
}

watch(() => route.query.eventId, setFilterFromRoute)

watch([detail, registrationToDelete], ([currentDetail, currentDelete]) => {
  document.body.style.overflow = currentDetail || currentDelete ? 'hidden' : ''
})

onMounted(() => {
  setFilterFromRoute(route.query.eventId)
  void store.fetchRegistrations(true)
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
        <span class="eyebrow eyebrow-ink">Pendaftaran agenda</span>
        <h1 class="display-md mt-4">Pendaftar Agenda<span class="text-moss">.</span></h1>
        <p class="mt-2 max-w-xl text-xs font-semibold leading-relaxed text-muted">
          Kelola pendaftar agenda selain Latihan Kader 1. Pendaftar LK 1 tetap dikelola melalui menu Pendaftar LK 1.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <button type="button" class="admin-btn admin-btn-ghost" :disabled="store.isLoading" @click="store.fetchRegistrations(true)">
          <svg class="h-3.5 w-3.5" :class="{ 'animate-spin': store.isLoading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Segarkan
        </button>
        <button type="button" class="admin-btn admin-btn-dark" :disabled="!store.filteredRegistrations.length" @click="exportCsv">
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
          <input v-model="store.search" type="search" placeholder="Cari nama, email, atau agenda..." class="admin-input pl-9" />
        </div>

        <select v-model="store.eventFilter" class="admin-input text-[10px] font-bold sm:max-w-xs">
          <option value="Semua">Semua agenda non-LK 1</option>
          <option v-for="event in store.eventOptions" :key="event.id" :value="event.id">{{ event.title }}</option>
        </select>

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
          <span class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{{ store.filteredRegistrations.length }} pendaftar</span>
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
        <p class="mt-3 text-[10px] font-semibold text-muted">Memuat pendaftar agenda...</p>
      </div>

      <div v-else-if="store.filteredRegistrations.length === 0" class="p-14 text-center">
        <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper text-moss">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <p class="mt-4 text-xs font-bold text-ink">{{ hasFilters ? 'Tidak ada pendaftar yang cocok.' : 'Belum ada pendaftar agenda.' }}</p>
        <p class="mx-auto mt-1.5 max-w-sm text-[10px] font-semibold leading-relaxed text-muted">
          {{ hasFilters ? 'Ubah agenda, status, atau kata kunci untuk menemukan pendaftar lain.' : store.eventOptions.length ? 'Pendaftaran dari formulir internal halaman Agenda akan muncul di sini.' : 'Belum ada agenda non-LK 1. Tambahkan agenda terlebih dahulu untuk membuka pendaftaran.' }}
        </p>
        <button v-if="hasFilters" type="button" class="admin-btn admin-btn-ghost mt-4" @click="resetFilters">Reset filter</button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Pendaftar</th>
              <th>Agenda</th>
              <th class="hidden xl:table-cell">Kontak</th>
              <th class="hidden lg:table-cell">Tanggal daftar</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="registration in store.filteredRegistrations" :key="registration.id">
              <td class="max-w-[250px]">
                <div class="flex items-center gap-2.5">
                  <span class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-paper text-[8px] font-black text-moss">
                    {{ initials(registration.name) }}
                  </span>
                  <div class="min-w-0">
                    <button type="button" class="block max-w-full truncate text-left text-[11px] font-extrabold text-ink transition-colors hover:text-moss" @click="detail = registration">
                      {{ registration.name }}
                    </button>
                    <p class="mt-0.5 truncate text-[9px] font-semibold text-muted">{{ registration.email }}</p>
                  </div>
                </div>
              </td>
              <td class="max-w-[250px]">
                <p class="truncate text-[10px] font-bold text-ink">{{ registration.event?.title ?? 'Agenda tidak ditemukan' }}</p>
                <p class="mt-0.5 truncate text-[9px] font-semibold text-muted">
                  <span v-if="registration.event" class="font-black uppercase tracking-[0.04em] text-moss">{{ registration.event.category }}</span>
                  <span v-if="registration.event"> · {{ formatDate(registration.event.date) }}</span>
                </p>
              </td>
              <td class="hidden xl:table-cell">
                <a :href="`mailto:${registration.email}`" class="block max-w-[180px] truncate text-[10px] font-semibold text-muted hover:text-moss">{{ registration.email }}</a>
                <a v-if="registration.phone" :href="`tel:${registration.phone}`" class="mt-0.5 block text-[9px] font-semibold text-muted hover:text-moss">{{ registration.phone }}</a>
                <span v-else class="mt-0.5 block text-[9px] font-semibold text-muted">—</span>
              </td>
              <td class="hidden text-[10px] font-semibold text-muted lg:table-cell">{{ formatDateTime(registration.createdAt) }}</td>
              <td>
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em]" :class="statusClass(registration.status)">
                  <span class="h-1 w-1 rounded-full bg-current" />
                  {{ statusLabel(registration.status) }}
                </span>
              </td>
              <td>
                <div class="flex items-center justify-end gap-1">
                  <a
                    v-if="whatsappUrl(registration)"
                    :href="whatsappUrl(registration)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-lime/15 text-moss transition-colors hover:bg-lime hover:text-white"
                    title="Hubungi via WhatsApp"
                    aria-label="Hubungi pendaftar via WhatsApp"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2a9.9 9.9 0 00-8.5 15.02L2 22l5.1-1.5A9.9 9.9 0 1012.04 2zm0 18.1a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.02.89.9-2.95-.2-.31A8.2 8.2 0 1112.04 20.1zm4.5-6.14c-.25-.13-1.47-.73-1.7-.81-.23-.09-.4-.13-.56.12-.17.25-.64.81-.78.98-.14.16-.29.18-.53.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.12.17 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.23-.17-.48-.3z" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
                    title="Lihat detail"
                    @click="detail = registration"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke-linecap="round" stroke-linejoin="round" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Hapus pendaftaran"
                    @click="openDeleteConfirm(registration)"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round" />
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
          aria-labelledby="event-registration-detail-title"
          @click.self="detail = null"
        >
          <div class="modal-viewport flex w-full max-w-2xl flex-col overflow-hidden rounded-[1.6rem] border border-line bg-paper shadow-2xl">
            <div class="flex flex-shrink-0 items-start justify-between gap-4 border-b border-line bg-white px-5 py-4">
              <div class="flex min-w-0 items-center gap-3">
                <span class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-lime-soft">
                  {{ initials(detail.name) }}
                </span>
                <div class="min-w-0">
                  <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">Pendaftar agenda</p>
                  <h2 id="event-registration-detail-title" class="mt-1 truncate font-display text-xl font-bold tracking-tight text-ink">{{ detail.name }}</h2>
                  <p class="mt-0.5 truncate text-[9px] font-semibold text-muted">{{ detail.event?.title ?? 'Agenda tidak ditemukan' }}</p>
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
                  Daftar {{ formatDateTime(detail.createdAt) }}
                </span>
              </div>

              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div class="rounded-[1rem] border border-line bg-white p-4 sm:col-span-2">
                  <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Agenda</p>
                  <p class="mt-1.5 text-[11px] font-bold text-ink">{{ detail.event?.title ?? 'Agenda tidak ditemukan' }}</p>
                  <p v-if="detail.event" class="mt-1 text-[9px] font-semibold text-muted">
                    {{ detail.event.category }} · {{ formatDate(detail.event.date) }} · {{ detail.event.location }}
                  </p>
                </div>
                <div class="rounded-[1rem] border border-line bg-white p-4">
                  <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Email</p>
                  <a :href="`mailto:${detail.email}`" class="mt-1.5 block break-all text-[11px] font-bold text-moss hover:underline">{{ detail.email }}</a>
                </div>
                <div class="rounded-[1rem] border border-line bg-white p-4">
                  <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">WhatsApp</p>
                  <a v-if="detail.phone" :href="`tel:${detail.phone}`" class="mt-1.5 block text-[11px] font-bold text-moss hover:underline">{{ detail.phone }}</a>
                  <p v-else class="mt-1.5 text-[11px] font-bold text-muted">Belum diisi</p>
                </div>
              </div>

              <p class="mt-3 rounded-[0.9rem] bg-paper px-3 py-2.5 text-[9px] font-semibold leading-relaxed text-muted">
                Pendaftaran ini berasal dari formulir internal halaman Agenda. Agenda kategori LK 1 tidak ditampilkan di sini karena dikelola melalui menu Pendaftar LK 1.
              </p>

              <p v-if="store.error" class="mt-3 rounded-[0.9rem] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-600">{{ store.error }}</p>
            </div>

            <div class="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line bg-white px-5 py-4">
              <button type="button" class="admin-btn admin-btn-ghost" @click="detail = null">Tutup</button>
              <div class="flex flex-wrap items-center gap-2">
                <a
                  v-if="whatsappUrl(detail)"
                  :href="whatsappUrl(detail)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="admin-btn admin-btn-dark"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2a9.9 9.9 0 00-8.5 15.02L2 22l5.1-1.5A9.9 9.9 0 1012.04 2zm0 18.1a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.02.89.9-2.95-.2-.31A8.2 8.2 0 1112.04 20.1zm4.5-6.14c-.25-.13-1.47-.73-1.7-.81-.23-.09-.4-.13-.56.12-.17.25-.64.81-.78.98-.14.16-.29.18-.53.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.12.17 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.23-.17-.48-.3z" />
                  </svg>
                  WhatsApp
                </a>
                <button
                  v-if="detail.status !== 'cancelled'"
                  type="button"
                  :disabled="store.isSaving"
                  class="admin-btn border border-red-200 bg-white text-red-500 hover:bg-red-50 disabled:opacity-60"
                  @click="updateStatus(detail, 'cancelled')"
                >
                  Batalkan
                </button>
                <button
                  v-if="detail.status !== 'waitlist'"
                  type="button"
                  :disabled="store.isSaving"
                  class="admin-btn admin-btn-ghost disabled:opacity-60"
                  @click="updateStatus(detail, 'waitlist')"
                >
                  Cadangan
                </button>
                <button
                  v-if="detail.status !== 'confirmed'"
                  type="button"
                  :disabled="store.isSaving"
                  class="admin-btn admin-btn-lime disabled:opacity-60"
                  @click="updateStatus(detail, 'confirmed')"
                >
                  {{ store.isSaving ? 'Menyimpan...' : 'Konfirmasi' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="registrationToDelete"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-event-registration-title"
          @click.self="closeDeleteConfirm"
        >
          <div class="w-full max-w-sm rounded-[1.5rem] border border-line bg-paper p-6 text-center shadow-2xl">
            <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <h3 id="delete-event-registration-title" class="mt-4 font-display text-xl font-bold tracking-tight text-ink">Hapus pendaftaran?</h3>
            <p class="mt-2 text-[11px] font-medium leading-relaxed text-muted">
              Pendaftaran <strong class="text-ink">{{ registrationToDelete.name }}</strong> untuk agenda
              <strong class="text-ink">{{ registrationToDelete.event?.title ?? 'ini' }}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <p v-if="deleteError" class="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-600">
              {{ deleteError }}
            </p>
            <div class="mt-6 flex justify-center gap-2">
              <button type="button" :disabled="store.isSaving" class="admin-btn admin-btn-ghost disabled:opacity-60" @click="closeDeleteConfirm">Batal</button>
              <button type="button" :disabled="store.isSaving" class="admin-btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-60" @click="handleDelete">
                <span v-if="store.isSaving" class="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {{ store.isSaving ? 'Menghapus...' : 'Ya, hapus' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
