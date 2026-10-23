<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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
  { label: 'Akan Datang', value: 'upcoming' },
  { label: 'Sedang Berlangsung', value: 'ongoing' },
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
      (event.speaker && event.speaker.toLowerCase().includes(query))

    const matchCategory =
      selectedCategory.value === 'Semua' || event.category === selectedCategory.value

    const matchStatus =
      selectedStatus.value === 'Semua' || event.status === selectedStatus.value

    return matchQuery && matchCategory && matchStatus
  })
})

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
    isOnline: !!event.isOnline,
    meetingUrl: event.meetingUrl ?? '',
    registrationUrl: event.registrationUrl ?? '',
  })
  formError.value = ''
  showModal.value = true
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
    triggerToast('Agenda berhasil dihapus!')
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
      triggerToast('Agenda berhasil diperbarui!')
    } else {
      formError.value = store.error || 'Gagal menyimpan perubahan agenda.'
    }
  } else {
    const ok = await store.createEvent(payload)
    if (ok) {
      showModal.value = false
      triggerToast('Agenda baru berhasil ditambahkan!')
    } else {
      formError.value = store.error || 'Gagal menambahkan agenda.'
    }
  }
}

function formatDisplayDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('id-ID', {
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

const statusBadgeClass: Record<EventStatus, string> = {
  upcoming: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  ongoing: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  done: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
}

const statusLabel: Record<EventStatus, string> = {
  upcoming: 'Akan Datang',
  ongoing: 'Sedang Berlangsung',
  done: 'Selesai',
}

onMounted(() => {
  store.fetchAll(true)
})
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-[#111212] tracking-tight">Manajemen Agenda & Kegiatan</h1>
        <p class="text-sm text-[#4D4D4D] mt-1">Kelola jadwal perkaderan, kajian, seminar, dan agenda HMI Insan Cita</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#009246] hover:bg-[#006837] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#009246]/20 transition-all duration-200"
      >
        <span class="text-base leading-none">+</span>
        <span>Tambah Agenda</span>
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white rounded-2xl border border-[#E6E6E6] p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
      <div class="relative w-full md:w-80">
        <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Cari judul, lokasi, pemateri..."
          class="w-full pl-9 pr-4 py-2 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246] transition-colors"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <!-- Category Filter -->
        <select
          v-model="selectedCategory"
          class="px-3 py-2 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl text-sm font-medium text-[#111212] focus:outline-none focus:border-[#009246]"
        >
          <option value="Semua">Semua Kategori</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <!-- Status Filter -->
        <select
          v-model="selectedStatus"
          class="px-3 py-2 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl text-sm font-medium text-[#111212] focus:outline-none focus:border-[#009246]"
        >
          <option value="Semua">Semua Status</option>
          <option value="upcoming">Akan Datang</option>
          <option value="ongoing">Sedang Berlangsung</option>
          <option value="done">Selesai</option>
        </select>
      </div>
    </div>

    <!-- Table of Events -->
    <div class="bg-white rounded-2xl border border-[#E6E6E6] overflow-hidden shadow-sm">
      <div v-if="store.isLoading" class="p-12 text-center text-gray-400 text-sm">
        <div class="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2" />
        <p>Memuat data agenda...</p>
      </div>

      <div v-else-if="filteredEvents.length === 0" class="p-16 text-center">
        <div class="w-14 h-14 mx-auto mb-3 bg-emerald-50 text-[#009246] rounded-2xl flex items-center justify-center">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="font-bold text-[#111212] text-base mb-1">Belum Ada Agenda</h3>
        <p class="text-sm text-gray-500 max-w-sm mx-auto mb-5">
          {{ search || selectedCategory !== 'Semua' || selectedStatus !== 'Semua' ? 'Tidak ada agenda yang cocok dengan filter yang dipilih.' : 'Mulai buat agenda pertama untuk ditampilkan pada portal website HMI.' }}
        </p>
        <button
          v-if="!search && selectedCategory === 'Semua' && selectedStatus === 'Semua'"
          @click="openCreate"
          class="px-4 py-2 bg-[#009246] hover:bg-[#006837] text-white text-xs font-bold rounded-xl transition-all"
        >
          + Tambah Agenda Pertama
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-[#111212]">
          <thead class="bg-[#F7F7F5] border-b border-[#E6E6E6] text-xs uppercase font-extrabold text-[#4D4D4D] tracking-wider">
            <tr>
              <th class="px-5 py-3.5">Agenda</th>
              <th class="px-4 py-3.5">Kategori</th>
              <th class="px-4 py-3.5">Jadwal & Lokasi</th>
              <th class="px-4 py-3.5">Pemateri</th>
              <th class="px-4 py-3.5">Status</th>
              <th class="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E6E6E6]">
            <tr v-for="event in filteredEvents" :key="event.id" class="hover:bg-gray-50/80 transition-colors">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="event.coverImage"
                    :src="event.coverImage"
                    :alt="event.title"
                    class="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                  />
                  <div
                    v-else
                    class="w-14 h-14 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0"
                  >
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-[#111212] line-clamp-1 text-sm">{{ event.title }}</div>
                    <div class="text-xs text-gray-500 line-clamp-1 mt-0.5">{{ event.description }}</div>
                    <div v-if="event.totalSeats" class="text-[11px] text-gray-400 mt-1">
                      Kursi: <span class="font-semibold text-emerald-600">{{ event.seatsLeft ?? event.totalSeats }}</span> / {{ event.totalSeats }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="px-4 py-4 whitespace-nowrap">
                <span class="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200">
                  {{ event.category }}
                </span>
              </td>

              <td class="px-4 py-4 whitespace-nowrap">
                <div class="font-medium text-xs">{{ formatDisplayDate(event.date) }}</div>
                <div class="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <span v-if="event.isOnline" class="text-indigo-600 font-semibold flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                    Online
                  </span>
                  <span v-else class="truncate max-w-[150px] flex items-center gap-1">
                    <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {{ event.location }}
                  </span>
                </div>
              </td>

              <td class="px-4 py-4 whitespace-nowrap">
                <div v-if="event.speaker" class="text-xs font-semibold text-[#111212]">{{ event.speaker }}</div>
                <div v-if="event.speakerRole" class="text-[11px] text-gray-500">{{ event.speakerRole }}</div>
                <div v-if="!event.speaker" class="text-xs text-gray-400 italic">—</div>
              </td>

              <td class="px-4 py-4 whitespace-nowrap">
                <span
                  class="px-2.5 py-1 text-xs font-bold rounded-lg border inline-flex items-center gap-1.5"
                  :class="statusBadgeClass[event.status]"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-current" />
                  {{ statusLabel[event.status] }}
                </span>
              </td>

              <td class="px-4 py-4 whitespace-nowrap text-right">
                <div class="inline-flex items-center gap-1">
                  <button
                    @click="openEdit(event)"
                    class="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Edit Agenda"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(event)"
                    class="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Agenda"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form Tambah / Edit -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
    >
      <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 my-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <h2 class="text-xl font-bold text-[#111212]">
            {{ editingEvent ? 'Edit Agenda' : 'Tambah Agenda Baru' }}
          </h2>
          <button
            @click="showModal = false"
            class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Tutup"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="formError" class="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {{ formError }}
        </div>

        <form @submit.prevent="handleSave" class="space-y-4">
          <!-- Judul -->
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Judul Agenda *</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="Contoh: Latihan Kader 1 (Basic Training) Batch XVI"
              class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
              required
            />
          </div>

          <!-- Kategori & Status -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Kategori *</label>
              <select
                v-model="form.category"
                class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Status *</label>
              <select
                v-model="form.status"
                class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
              >
                <option v-for="st in statuses" :key="st.value" :value="st.value">{{ st.label }}</option>
              </select>
            </div>
          </div>

          <!-- Tanggal Mulai & Tanggal Selesai -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Waktu Mulai *</label>
              <input
                v-model="form.date"
                type="datetime-local"
                class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Waktu Selesai (Opsional)</label>
              <input
                v-model="form.endDate"
                type="datetime-local"
                class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
              />
            </div>
          </div>

          <!-- Lokasi & Online Toggle -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Lokasi *</label>
              <input
                v-model="form.location"
                type="text"
                placeholder="Contoh: Gedung Dakwah / Zoom Meeting"
                class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
                required
              />
            </div>
            <div class="flex items-center gap-2 pb-2.5">
              <input
                id="isOnline"
                v-model="form.isOnline"
                type="checkbox"
                class="w-4 h-4 text-[#009246] rounded focus:ring-0"
              />
              <label for="isOnline" class="text-sm font-semibold text-gray-700 cursor-pointer">Online Event</label>
            </div>
          </div>

          <!-- Meeting URL if online -->
          <div v-if="form.isOnline">
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Meeting URL / Link Zoom</label>
            <input
              v-model="form.meetingUrl"
              type="url"
              placeholder="https://zoom.us/j/..."
              class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
            />
          </div>

          <!-- Cover Image Upload -->
          <div>
            <ImageUploadField
              v-model="form.coverImage"
              label="Cover Agenda"
              aspect-ratio="video"
            />
          </div>

          <!-- Speaker & Speaker Role -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nama Pemateri</label>
              <input
                v-model="form.speaker"
                type="text"
                placeholder="Contoh: Dr. H. Ahmad Fauzi, M.Ag"
                class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Peran / Institusi Pemateri</label>
              <input
                v-model="form.speakerRole"
                type="text"
                placeholder="Contoh: Dosen & Penulis NDP"
                class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
              />
            </div>
          </div>

          <!-- Kuota Kursi -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Total Kuota Kursi</label>
              <input
                v-model.number="form.totalSeats"
                type="number"
                min="0"
                class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Sisa Kursi Tersedia</label>
              <input
                v-model.number="form.seatsLeft"
                type="number"
                min="0"
                class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
              />
            </div>
          </div>

          <!-- Link Registrasi Khusus / External -->
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Link Pendaftaran Eksternal (Opsional)</label>
            <input
              v-model="form.registrationUrl"
              type="url"
              placeholder="https://forms.gle/... (biarkan kosong jika menggunakan form internal portal)"
              class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
            />
          </div>

          <!-- Deskripsi -->
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Deskripsi Lengkap *</label>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="Tuliskan deskripsi mengenai tujuan kegiatan, topik pembahasan, dan peserta yang ditargetkan..."
              class="w-full px-4 py-2.5 bg-[#F7F7F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#009246]"
              required
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              @click="showModal = false"
              class="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="store.isSaving"
              class="px-6 py-2.5 bg-[#009246] hover:bg-[#006837] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#009246]/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <span v-if="store.isSaving" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              <span>{{ editingEvent ? 'Simpan Perubahan' : 'Tambah Agenda' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div class="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl">
        <div class="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-[#111212] mb-2">Hapus Agenda Ini?</h3>
        <p class="text-sm text-gray-500 mb-6">
          Apakah Anda yakin ingin menghapus agenda <strong class="text-gray-900">"{{ eventToDelete?.title }}"</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div class="flex items-center justify-center gap-3">
          <button
            @click="showDeleteConfirm = false"
            class="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors"
          >
            Batal
          </button>
          <button
            @click="handleDelete"
            :disabled="store.isSaving"
            class="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all"
          >
            {{ store.isSaving ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition name="fade">
      <div
        v-if="showToast"
        class="fixed bottom-6 right-6 z-50 px-5 py-3 bg-[#111212] text-white text-sm font-bold rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
      >
        <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
