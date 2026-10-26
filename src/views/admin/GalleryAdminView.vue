<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useGalleryStore } from '@/stores/gallery'
import type { GalleryCategory, GalleryItem, GalleryItemInput } from '@/types'
import ImageUploadField from '@/components/common/ImageUploadField.vue'

const store = useGalleryStore()

const search = ref('')
const typeFilter = ref<'all' | 'photo' | 'video'>('all')
const categoryFilter = ref('Semua')
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingItem = ref<GalleryItem | null>(null)
const deleteTarget = ref<GalleryItem | null>(null)
const previewItem = ref<GalleryItem | null>(null)
const formError = ref('')
const toastMessage = ref('')
const showToast = ref(false)

const categories: GalleryCategory[] = ['LK1', 'LK2', 'Training', 'Baksos', 'Kajian', 'Rapat', 'Lainnya']
const typeOptions: Array<{ value: 'all' | 'photo' | 'video'; label: string }> = [
  { value: 'all', label: 'Semua media' },
  { value: 'photo', label: 'Foto' },
  { value: 'video', label: 'Video' },
]

function emptyForm() {
  return {
    title: '',
    type: 'photo' as 'photo' | 'video',
    url: '',
    thumbnail: '',
    event: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'Lainnya' as GalleryCategory,
  }
}

const form = reactive(emptyForm())

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return store.items.filter((item) => {
    const matchesQuery =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.event.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    const matchesType = typeFilter.value === 'all' || item.type === typeFilter.value
    const matchesCategory = categoryFilter.value === 'Semua' || item.category === categoryFilter.value
    return matchesQuery && matchesType && matchesCategory
  })
})

const summary = computed(() => [
  { label: 'Total media', value: store.items.length },
  { label: 'Foto', value: store.items.filter((item) => item.type === 'photo').length },
  { label: 'Video', value: store.items.filter((item) => item.type === 'video').length },
  { label: 'Kegiatan', value: new Set(store.items.map((item) => item.event)).size },
])

const hasFilters = computed(
  () => Boolean(search.value) || typeFilter.value !== 'all' || categoryFilter.value !== 'Semua',
)

function triggerToast(message: string) {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3200)
}

function openCreate() {
  editingItem.value = null
  Object.assign(form, emptyForm())
  formError.value = ''
  showModal.value = true
}

function openEdit(item: GalleryItem) {
  editingItem.value = item
  Object.assign(form, {
    title: item.title,
    type: item.type,
    url: item.url,
    thumbnail: item.thumbnail,
    event: item.event,
    date: item.date.slice(0, 10),
    category: item.category,
  })
  formError.value = ''
  showModal.value = true
}

async function saveItem() {
  formError.value = ''
  if (!form.title.trim()) {
    formError.value = 'Judul wajib diisi.'
    return
  }
  if (!form.event.trim()) {
    formError.value = 'Nama kegiatan wajib diisi.'
    return
  }
  if (!form.url.trim()) {
    formError.value = 'URL media wajib diisi.'
    return
  }

  const input: GalleryItemInput = {
    title: form.title.trim(),
    type: form.type,
    url: form.url.trim(),
    thumbnail: form.thumbnail.trim() || form.url.trim(),
    event: form.event.trim(),
    date: form.date,
    category: form.category,
  }

  const result = editingItem.value
    ? await store.updateItem(editingItem.value.id, input)
    : await store.createItem(input)

  if (result) {
    const wasEditing = Boolean(editingItem.value)
    closeModal()
    triggerToast(wasEditing ? 'Item galeri berhasil diperbarui.' : 'Item galeri berhasil ditambahkan.')
  } else {
    formError.value = store.error || 'Gagal menyimpan item galeri.'
  }
}

function confirmDelete(item: GalleryItem) {
  deleteTarget.value = item
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  const ok = await store.deleteItem(deleteTarget.value.id)
  showDeleteConfirm.value = false
  if (ok) {
    triggerToast('Item galeri berhasil dihapus.')
  } else {
    triggerToast('Gagal menghapus item galeri.')
  }
}

function closeModal() {
  if (store.isSaving) return
  showModal.value = false
  editingItem.value = null
  formError.value = ''
}

function resetFilters() {
  search.value = ''
  typeFilter.value = 'all'
  categoryFilter.value = 'Semua'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (previewItem.value) {
    previewItem.value = null
    return
  }
  if (showDeleteConfirm.value) {
    showDeleteConfirm.value = false
    return
  }
  closeModal()
}

watch([showModal, showDeleteConfirm, previewItem], ([modal, deleting, preview]) => {
  document.body.style.overflow = modal || deleting || preview ? 'hidden' : ''
})

onMounted(() => {
  void store.fetchItems(true)
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
        class="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold text-white shadow-2xl"
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
        <span class="eyebrow eyebrow-ink">Arsip visual</span>
        <h1 class="display-md mt-4">Galeri dokumentasi<span class="text-moss">.</span></h1>
        <p class="mt-2 max-w-xl text-xs font-semibold leading-relaxed text-muted">
          Kelola foto dan video kegiatan komisariat yang tampil di portal publik.
        </p>
      </div>
      <button type="button" class="admin-btn admin-btn-lime self-start sm:self-auto" @click="openCreate">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        Tambah media
      </button>
    </div>

    <p v-if="store.error && !showModal" class="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
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
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="relative flex-1 lg:max-w-sm">
          <svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" stroke-linecap="round" />
          </svg>
          <input
            v-model="search"
            type="search"
            placeholder="Cari judul, kegiatan, atau kategori..."
            class="admin-input pl-9"
          />
        </div>

        <div class="hide-scrollbar flex items-center gap-1.5 overflow-x-auto">
          <button
            v-for="option in typeOptions"
            :key="option.value"
            type="button"
            class="flex-shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.08em] transition-colors"
            :class="typeFilter === option.value ? 'border-ink bg-ink text-lime-soft' : 'border-line bg-white text-muted hover:border-ink/30 hover:text-ink'"
            @click="typeFilter = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2 lg:ml-auto">
          <select v-model="categoryFilter" class="admin-input w-auto text-[10px] font-bold">
            <option value="Semua">Semua kategori</option>
            <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
          </select>
          <span class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{{ filtered.length }} item</span>
          <button
            v-if="hasFilters"
            type="button"
            class="text-[8px] font-black uppercase tracking-[0.08em] text-moss transition-colors hover:text-ink"
            @click="resetFilters"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div v-if="store.isLoading" class="admin-card p-14 text-center">
      <span class="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-line border-t-moss" />
      <p class="mt-3 text-[10px] font-semibold text-muted">Memuat galeri...</p>
    </div>

    <div v-else-if="filtered.length === 0" class="admin-card border-dashed p-14 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper text-moss">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <p class="mt-4 text-xs font-bold text-ink">{{ hasFilters ? 'Tidak ada media yang cocok.' : 'Belum ada media galeri.' }}</p>
      <p class="mx-auto mt-1.5 max-w-sm text-[10px] font-semibold leading-relaxed text-muted">
        {{ hasFilters ? 'Ubah kata kunci atau filter untuk menemukan media lain.' : 'Tambahkan foto atau video pertama untuk arsip dokumentasi komisariat.' }}
      </p>
      <button v-if="hasFilters" type="button" class="admin-btn admin-btn-ghost mt-4" @click="resetFilters">Reset filter</button>
      <button v-else type="button" class="admin-btn admin-btn-lime mt-4" @click="openCreate">Tambah media</button>
    </div>

    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="item in filtered"
        :key="item.id"
        class="group overflow-hidden rounded-[1.35rem] border border-line bg-white transition duration-300 hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-soft"
      >
        <div class="relative aspect-video overflow-hidden bg-ink">
          <img
            :src="item.thumbnail || item.url"
            :alt="item.title"
            class="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent" />
          <span class="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-ink backdrop-blur">
            {{ item.category }}
          </span>
          <span
            class="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em]"
            :class="item.type === 'video' ? 'bg-red-500 text-white' : 'bg-ink/60 text-white backdrop-blur'"
          >
            <svg v-if="item.type === 'video'" class="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg v-else class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ item.type === 'video' ? 'Video' : 'Foto' }}
          </span>
          <button
            type="button"
            class="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors hover:bg-ink/25"
            :aria-label="`Pratinjau ${item.title}`"
            @click="previewItem = item"
          >
            <span class="flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-lime text-white opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </span>
          </button>
          <p class="pointer-events-none absolute bottom-3 left-3 right-3 truncate text-xs font-extrabold text-white">{{ item.title }}</p>
        </div>

        <div class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-[10px] font-bold text-ink">{{ item.event }}</p>
              <p class="mt-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-muted">{{ formatDate(item.date) }}</p>
            </div>
            <div class="flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-moss"
                title="Edit media"
                @click="openEdit(item)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                :disabled="store.isSaving"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                title="Hapus media"
                @click="confirmDelete(item)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </article>
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
          <div class="modal-viewport flex w-full max-w-xl flex-col overflow-hidden rounded-[1.6rem] border border-line bg-paper shadow-2xl">
            <div class="flex flex-shrink-0 items-center justify-between gap-4 border-b border-line bg-white px-5 py-4">
              <div>
                <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">{{ editingItem ? 'Perbarui media' : 'Media baru' }}</p>
                <h2 class="mt-1 font-display text-xl font-bold tracking-tight text-ink">{{ editingItem ? 'Edit item galeri' : 'Tambah item galeri' }}</h2>
              </div>
              <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink" aria-label="Tutup" @click="closeModal">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="saveItem">
              <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                <p v-if="formError" class="rounded-[0.9rem] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-600">{{ formError }}</p>

                <div>
                  <label class="admin-label" for="gallery-title">Judul media <span class="text-red-500">*</span></label>
                  <input id="gallery-title" v-model="form.title" type="text" placeholder="Judul foto atau video" class="admin-input" required />
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="admin-label" for="gallery-type">Tipe media</label>
                    <select id="gallery-type" v-model="form.type" class="admin-input">
                      <option value="photo">Foto</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  <div>
                    <label class="admin-label" for="gallery-category">Kategori</label>
                    <select id="gallery-category" v-model="form.category" class="admin-input">
                      <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
                    </select>
                  </div>
                </div>

                <div v-if="form.type === 'photo'">
                  <ImageUploadField
                    v-model="form.url"
                    label="Foto"
                    :required="true"
                    aspect-ratio="video"
                  />
                </div>
                <div v-else>
                  <label class="admin-label" for="gallery-video-url">URL video <span class="text-red-500">*</span></label>
                  <input id="gallery-video-url" v-model="form.url" type="url" placeholder="https://youtube.com/... atau tautan video" class="admin-input" required />
                  <p class="mt-1 text-[8px] font-semibold text-muted">Gunakan tautan video yang dapat diakses publik.</p>
                </div>

                <div v-if="form.type === 'video'">
                  <ImageUploadField
                    v-model="form.thumbnail"
                    label="Thumbnail video (opsional)"
                    aspect-ratio="video"
                  />
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="admin-label" for="gallery-event">Kegiatan <span class="text-red-500">*</span></label>
                    <input id="gallery-event" v-model="form.event" type="text" placeholder="Contoh: LK 1 Batch XV" class="admin-input" required />
                  </div>
                  <div>
                    <label class="admin-label" for="gallery-date">Tanggal</label>
                    <input id="gallery-date" v-model="form.date" type="date" class="admin-input" />
                  </div>
                </div>
              </div>

              <div class="flex flex-shrink-0 items-center justify-end gap-2 border-t border-line bg-white px-5 py-4">
                <button type="button" class="admin-btn admin-btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" :disabled="store.isSaving" class="admin-btn admin-btn-lime disabled:opacity-60">
                  <span v-if="store.isSaving" class="h-3 w-3 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                  {{ store.isSaving ? 'Menyimpan...' : 'Simpan item' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Preview modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="previewItem"
          class="fixed inset-0 z-[92] flex items-center justify-center bg-ink/90 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          @click.self="previewItem = null"
        >
          <div class="w-full max-w-4xl">
            <div class="mb-3 flex items-center justify-between gap-3 text-white">
              <div class="min-w-0">
                <p class="truncate text-xs font-extrabold">{{ previewItem.title }}</p>
                <p class="mt-1 truncate text-[9px] font-semibold text-white/60">{{ previewItem.event }} · {{ formatDate(previewItem.date) }}</p>
              </div>
              <button type="button" class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-lime-soft hover:text-lime-soft" aria-label="Tutup pratinjau" @click="previewItem = null">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
            </div>
            <div class="overflow-hidden rounded-[1.4rem] border border-white/10 bg-ink">
              <img :src="previewItem.thumbnail || previewItem.url" :alt="previewItem.title" class="lightbox-media w-full object-contain" />
            </div>
            <div class="mt-3 flex justify-end">
              <a
                :href="previewItem.url"
                target="_blank"
                rel="noopener noreferrer"
                class="admin-btn admin-btn-lime"
              >
                {{ previewItem.type === 'video' ? 'Buka video' : 'Buka media asli' }}
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
            </div>
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
            <h3 class="mt-4 font-display text-xl font-bold tracking-tight text-ink">Hapus media?</h3>
            <p class="mt-2 text-[11px] font-medium leading-relaxed text-muted">
              Media <strong class="text-ink">"{{ deleteTarget?.title }}"</strong> akan dihapus permanen dari galeri publik.
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
