<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useEventStore } from '@/stores/events'
import type { Event, EventCategory, EventStatus } from '@/types'
import ImageUploadField from '@/components/common/ImageUploadField.vue'

const store = useEventStore()

const search = ref('')
const selectedCategory = ref<string>('Semua')
const selectedStatus = ref<string>('Semua')
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const eventToDelete = ref<Event | null>(null)
const editingEvent = ref<Event | null>(null)
const formError = ref('')
const toastMessage = ref('')
const showToast = ref(false)

const categories: EventCategory[] = ['LK1', 'LK2', 'Training', 'Baksos', 'Kajian', 'Rapat']
const statuses: { label: string; value: EventStatus }[] = [
  { label: 'Akan datang', value: 'upcoming' },
  { label: 'Berlangsung', value: 'ongoing' },
  { label: 'Selesai', value: 'done' },
]

function emptyForm() {
  return {
    title: '',
    description: '',
    date: '',
    endDate: '',
    location: '',
    category: 'Kajian' as EventCategory,
    status: 'upcoming' as EventStatus,
    coverImage: '',
    speaker: '',
    speakerRole: '',
    totalSeats: null as number | null,
    seatsLeft: null as number | null,
    isOnline: false,
    meetingUrl: '',
    registrationUrl: '',
  }
}

const form = reactive(emptyForm())

const filteredEvents = computed(() => {
  const query = search.value.toLowerCase().trim()
  return store.events.filter((event) => {
    const matchQuery =
      !query ||
      event.title.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      (event.speaker && event.speaker.toLowerCase().includes(query))

    const matchCategory =
      selectedCategory.value === 'Semua' || event.category === selectedCategory.value

    const matchStatus =
      selectedStatus.value === 'Semua' || event.status === selectedStatus.value

    return matchQuery && matchCategory && matchStatus
  })
})

const summary = computed(() => [
  { label: 'Total agenda', value: store.events.length },
  { label: 'Akan datang', value: store.events.filter((event) => event.status === 'upcoming').length },
  { label: 'Berlangsung', value: store.events.filter((event) => event.status === 'ongoing').length },
  { label: 'Selesai', value: store.events.filter((event) => event.status === 'done').length },
])

const hasFilters = computed(() => Boolean(search.value) || selectedCategory.value !== 'Semua' || selectedStatus.value !== 'Semua')

function triggerToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3500)
}

function openCreate() {
  editingEvent.value = null
  Object.assign(form, emptyForm())
  formError.value = ''
  showModal.value = true
}

function openEdit(event: Event) {
  editingEvent.value = event
  Object.assign(form, {
    title: event.title,
    description: event.description,
    date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
    endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
    location: event.location,
    category: event.category,
    status: event.status,
    coverImage: event.coverImage,
    speaker: event.speaker ?? '',
    speakerRole: event.speakerRole ?? '',
    totalSeats: event.totalSeats ?? null,
    seatsLeft: event.seatsLeft ?? event.totalSeats ?? null,
    isOnline: Boolean(event.isOnline),
    meetingUrl: event.meetingUrl ?? '',
    registrationUrl: event.registrationUrl ?? '',
  })
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  if (store.isSaving) return
  showModal.value = false
}

function confirmDelete(event: Event) {
  eventToDelete.value = event
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!eventToDelete.value) return
  const ok = await store.deleteEvent(eventToDelete.value.id)
  showDeleteConfirm.value = false
  if (ok) {
    triggerToast('Agenda berhasil dihapus.')
  } else {
    triggerToast('Gagal menghapus agenda: ' + store.error)
  }
}

async function handleSave() {
  formError.value = ''
  if (!form.title.trim()) {
    formError.value = 'Judul agenda wajib diisi.'
    return
  }
  if (!form.description.trim()) {
    formError.value = 'Deskripsi agenda wajib diisi.'
    return
  }
  if (!form.date) {
    formError.value = 'Tanggal agenda wajib diisi.'
    return
  }
  const eventDate = new Date(form.date)
  if (Number.isNaN(eventDate.getTime())) {
    formError.value = 'Tanggal agenda tidak valid.'
    return
  }
  const endDate = form.endDate ? new Date(form.endDate) : null
  if (endDate && Number.isNaN(endDate.getTime())) {
    formError.value = 'Tanggal selesai tidak valid.'
    return
  }
  if (!form.location.trim()) {
    formError.value = 'Lokasi agenda wajib diisi.'
    return
  }

  const payload: Partial<Event> = {
    title: form.title.trim(),
    description: form.description.trim(),
    date: eventDate.toISOString(),
    endDate: endDate ? endDate.toISOString() : undefined,
    location: form.location.trim(),
    category: form.category,
    status: form.status,
    coverImage: form.coverImage.trim(),
    speaker: form.speaker.trim() || undefined,
    speakerRole: form.speakerRole.trim() || undefined,
    totalSeats: Number(form.totalSeats) || undefined,
    seatsLeft: Number(form.seatsLeft) || undefined,
    isOnline: Boolean(form.isOnline),
    meetingUrl: form.meetingUrl.trim() || undefined,
    registrationUrl: form.registrationUrl.trim() || undefined,
  }

  if (editingEvent.value) {
    const ok = await store.updateEvent(editingEvent.value.id, payload)
    if (ok) {
      showModal.value = false
      triggerToast('Agenda berhasil diperbarui.')
    } else {
      formError.value = store.error || 'Gagal menyimpan perubahan agenda.'
    }
  } else {
    const ok = await store.createEvent(payload)
    if (ok) {
      showModal.value = false
      triggerToast('Agenda baru berhasil ditambahkan.')
    } else {
      formError.value = store.error || 'Gagal menambahkan agenda.'
    }
  }
}

function formatDisplayDate(iso: string) {
  try {
    const date = new Date(iso)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB'
  } catch {
    return iso
  }
}

function resetFilters() {
  search.value = ''
  selectedCategory.value = 'Semua'
  selectedStatus.value = 'Semua'
}

const statusBadgeClass: Record<EventStatus, string> = {
  upcoming: 'bg-amber-50 text-amber-700',
  ongoing: 'bg-lime/30 text-forest',
  done: 'bg-paper text-muted',
}

const statusLabel: Record<EventStatus, string> = {
  upcoming: 'Akan datang',
  ongoing: 'Berlangsung',
  done: 'Selesai',
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (showDeleteConfirm.value) {
    showDeleteConfirm.value = false
    return
  }
  closeModal()
}

watch([showModal, showDeleteConfirm], ([modal, deleteModal]) => {
  document.body.style.overflow = modal || deleteModal ? 'hidden' : ''
})

onMounted(() => {
  void store.fetchAll(true)
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
        class="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold text-white shadow-2xl"
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
        <span class="eyebrow eyebrow-ink">Kelola agenda</span>
        <h1 class="display-md mt-4">Agenda<span class="text-moss">.</span></h1>
        <p class="mt-2 max-w-xl text-xs font-semibold leading-relaxed text-muted">
          Atur jadwal perkaderan, kajian, seminar, dan kegiatan komisariat.
        </p>
      </div>
      <button type="button" class="admin-btn admin-btn-lime self-start sm:self-auto" @click="openCreate">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        Tambah agenda
      </button>
    </div>

    <!-- Summary -->
    <div class="admin-card grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
      <div v-for="(item, index) in summary" :key="item.label" class="p-4 sm:p-5" :class="index >= 2 ? 'border-t border-line sm:border-t-0' : ''">
        <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">{{ item.label }}</p>
        <p class="mt-2 font-display text-2xl font-bold leading-none tracking-tight text-ink">{{ item.value }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="admin-card p-3 sm:p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="relative flex-1 lg:max-w-sm">
          <svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" stroke-linecap="round" />
          </svg>
          <input v-model="search" type="search" placeholder="Cari judul, lokasi, atau pemateri..." class="admin-input pl-9" />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select v-model="selectedCategory" class="admin-input w-auto text-[10px] font-bold">
            <option value="Semua">Semua kategori</option>
            <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
          </select>
          <select v-model="selectedStatus" class="admin-input w-auto text-[10px] font-bold">
            <option value="Semua">Semua status</option>
            <option v-for="status in statuses" :key="status.value" :value="status.value">{{ status.label }}</option>
          </select>
        </div>
        <div class="flex items-center gap-3 lg:ml-auto">
          <span class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{{ filteredEvents.length }} agenda</span>
          <button v-if="hasFilters" type="button" class="text-[8px] font-black uppercase tracking-[0.08em] text-moss transition-colors hover:text-ink" @click="resetFilters">Reset</button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card overflow-hidden">
      <div v-if="store.isLoading" class="p-14 text-center">
        <span class="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-line border-t-moss" />
        <p class="mt-3 text-[10px] font-semibold text-muted">Memuat agenda...</p>
      </div>

      <div v-else-if="filteredEvents.length === 0" class="p-14 text-center">
        <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper text-moss">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <p class="mt-4 text-xs font-bold text-ink">{{ hasFilters ? 'Tidak ada agenda yang cocok.' : 'Belum ada agenda.' }}</p>
        <p class="mx-auto mt-1.5 max-w-sm text-[10px] font-semibold leading-relaxed text-muted">
          {{ hasFilters ? 'Ubah kata kunci atau filter untuk menemukan agenda lain.' : 'Tambahkan agenda pertama untuk ditampilkan di portal publik.' }}
        </p>
        <button v-if="hasFilters" type="button" class="admin-btn admin-btn-ghost mt-4" @click="resetFilters">Reset filter</button>
        <button v-else type="button" class="admin-btn admin-btn-lime mt-4" @click="openCreate">Tambah agenda</button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Agenda</th>
              <th class="hidden md:table-cell">Kategori</th>
              <th>Jadwal & lokasi</th>
              <th class="hidden xl:table-cell">Pemateri</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in filteredEvents" :key="event.id">
              <td class="max-w-[280px]">
                <div class="flex items-center gap-3">
                  <span class="hidden h-11 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-paper sm:block">
                    <img v-if="event.coverImage" :src="event.coverImage" :alt="event.title" class="h-full w-full object-cover" />
                    <span v-else class="flex h-full w-full items-center justify-center text-moss">
                      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                  </span>
                  <div class="min-w-0">
                    <button type="button" class="block max-w-full truncate text-left text-[11px] font-extrabold text-ink transition-colors hover:text-moss" @click="openEdit(event)">
                      {{ event.title }}
                    </button>
                    <p class="mt-0.5 line-clamp-1 text-[9px] font-medium text-muted">{{ event.description }}</p>
                    <p v-if="event.totalSeats" class="mt-1 text-[8px] font-bold text-moss">
                      Kursi {{ event.seatsLeft ?? event.totalSeats }} / {{ event.totalSeats }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="hidden md:table-cell">
                <span class="rounded-full bg-paper px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.05em] text-moss">{{ event.category }}</span>
              </td>
              <td>
                <p class="text-[10px] font-bold text-ink">{{ formatDisplayDate(event.date) }}</p>
                <p class="mt-0.5 flex max-w-[180px] items-center gap-1 truncate text-[9px] font-semibold text-muted">
                  <span v-if="event.isOnline" class="rounded-full bg-paper px-1.5 py-0.5 text-[7px] font-black uppercase text-moss">Online</span>
                  <template v-else>{{ event.location }}</template>
                </p>
              </td>
              <td class="hidden xl:table-cell">
                <p class="max-w-[160px] truncate text-[10px] font-bold text-ink">{{ event.speaker || '—' }}</p>
                <p v-if="event.speakerRole" class="mt-0.5 max-w-[160px] truncate text-[9px] font-semibold text-muted">{{ event.speakerRole }}</p>
              </td>
              <td>
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em]" :class="statusBadgeClass[event.status]">
                  <span class="h-1 w-1 rounded-full bg-current" />
                  {{ statusLabel[event.status] }}
                </span>
              </td>
              <td>
                <div class="flex items-center justify-end gap-1">
                  <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-moss" title="Edit agenda" @click="openEdit(event)">
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500" title="Hapus agenda" @click="confirmDelete(event)">
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

    <!-- Form modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showModal"
          class="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          @click.self="closeModal"
        >
          <div class="modal-viewport flex w-full max-w-3xl flex-col overflow-hidden rounded-[1.6rem] border border-line bg-paper shadow-2xl">
            <div class="flex flex-shrink-0 items-center justify-between gap-4 border-b border-line bg-white px-5 py-4">
              <div>
                <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">{{ editingEvent ? 'Perbarui agenda' : 'Agenda baru' }}</p>
                <h2 class="mt-1 font-display text-xl font-bold tracking-tight text-ink">{{ editingEvent ? 'Edit agenda' : 'Tambah agenda' }}</h2>
              </div>
              <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink" aria-label="Tutup" @click="closeModal">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="handleSave">
              <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                <p v-if="formError" class="rounded-[0.9rem] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-600">{{ formError }}</p>

                <section>
                  <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">Informasi utama</p>
                  <div class="mt-3 space-y-3">
                    <div>
                      <label class="admin-label" for="event-title">Judul agenda <span class="text-red-500">*</span></label>
                      <input id="event-title" v-model="form.title" type="text" placeholder="Contoh: Latihan Kader 1 Batch XVI" class="admin-input" required />
                    </div>
                    <div>
                      <label class="admin-label" for="event-description">Deskripsi <span class="text-red-500">*</span></label>
                      <textarea id="event-description" v-model="form.description" rows="3" placeholder="Jelaskan tujuan, topik, dan target peserta kegiatan..." class="admin-input resize-none" required />
                    </div>
                    <div class="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label class="admin-label" for="event-category">Kategori</label>
                        <select id="event-category" v-model="form.category" class="admin-input">
                          <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
                        </select>
                      </div>
                      <div>
                        <label class="admin-label" for="event-status">Status</label>
                        <select id="event-status" v-model="form.status" class="admin-input">
                          <option v-for="status in statuses" :key="status.value" :value="status.value">{{ status.label }}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">Waktu & lokasi</p>
                  <div class="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="admin-label" for="event-date">Waktu mulai <span class="text-red-500">*</span></label>
                      <input id="event-date" v-model="form.date" type="datetime-local" class="admin-input" required />
                    </div>
                    <div>
                      <label class="admin-label" for="event-end-date">Waktu selesai</label>
                      <input id="event-end-date" v-model="form.endDate" type="datetime-local" class="admin-input" />
                    </div>
                    <div class="sm:col-span-2">
                      <label class="admin-label" for="event-location">Lokasi <span class="text-red-500">*</span></label>
                      <input id="event-location" v-model="form.location" type="text" placeholder="Gedung dakwah, kampus, atau tautan daring" class="admin-input" required />
                    </div>
                  </div>
                  <label class="mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-[0.9rem] border border-line bg-white px-4 py-3">
                    <span>
                      <span class="block text-[10px] font-bold text-ink">Agenda daring</span>
                      <span class="mt-0.5 block text-[9px] font-semibold text-muted">Tampilkan sebagai kegiatan online</span>
                    </span>
                    <input v-model="form.isOnline" type="checkbox" class="h-4 w-4 accent-lime" />
                  </label>
                  <div v-if="form.isOnline" class="mt-3">
                    <label class="admin-label" for="event-meeting-url">Tautan meeting</label>
                    <input id="event-meeting-url" v-model="form.meetingUrl" type="url" placeholder="https://zoom.us/j/..." class="admin-input" />
                  </div>
                </section>

                <section>
                  <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">Pemateri & kuota</p>
                  <div class="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="admin-label" for="event-speaker">Nama pemateri</label>
                      <input id="event-speaker" v-model="form.speaker" type="text" placeholder="Nama lengkap pemateri" class="admin-input" />
                    </div>
                    <div>
                      <label class="admin-label" for="event-speaker-role">Peran / institusi</label>
                      <input id="event-speaker-role" v-model="form.speakerRole" type="text" placeholder="Dosen, pengurus, atau lembaga" class="admin-input" />
                    </div>
                    <div>
                      <label class="admin-label" for="event-total-seats">Total kuota</label>
                      <input id="event-total-seats" v-model.number="form.totalSeats" type="number" min="0" class="admin-input" />
                    </div>
                    <div>
                      <label class="admin-label" for="event-seats-left">Sisa kursi</label>
                      <input id="event-seats-left" v-model.number="form.seatsLeft" type="number" min="0" class="admin-input" />
                    </div>
                  </div>
                </section>

                <section>
                  <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">Media & tautan</p>
                  <div class="mt-3">
                    <ImageUploadField v-model="form.coverImage" label="Cover agenda" aspect-ratio="video" />
                  </div>
                  <div class="mt-3">
                    <label class="admin-label" for="event-registration-url">Tautan pendaftaran eksternal</label>
                    <input id="event-registration-url" v-model="form.registrationUrl" type="url" placeholder="https://forms.gle/... (opsional)" class="admin-input" />
                    <p class="mt-1 text-[8px] font-semibold text-muted">Kosongkan bila pendaftaran menggunakan formulir internal portal.</p>
                  </div>
                </section>
              </div>

              <div class="flex flex-shrink-0 items-center justify-end gap-2 border-t border-line bg-white px-5 py-4">
                <button type="button" class="admin-btn admin-btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" :disabled="store.isSaving" class="admin-btn admin-btn-lime disabled:opacity-60">
                  <span v-if="store.isSaving" class="h-3 w-3 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                  {{ store.isSaving ? 'Menyimpan...' : editingEvent ? 'Simpan perubahan' : 'Tambah agenda' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDeleteConfirm"
          class="fixed inset-0 z-[95] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          @click.self="showDeleteConfirm = false"
        >
          <div class="w-full max-w-sm rounded-[1.5rem] border border-line bg-paper p-6 text-center shadow-2xl">
            <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" />
              </svg>
            </span>
            <h3 class="mt-4 font-display text-xl font-bold tracking-tight text-ink">Hapus agenda?</h3>
            <p class="mt-2 text-[11px] font-medium leading-relaxed text-muted">
              Agenda <strong class="text-ink">"{{ eventToDelete?.title }}"</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div class="mt-6 flex justify-center gap-2">
              <button type="button" class="admin-btn admin-btn-ghost" @click="showDeleteConfirm = false">Batal</button>
              <button type="button" :disabled="store.isSaving" class="admin-btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-60" @click="handleDelete">
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
