<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useGalleryStore } from '@/stores/gallery'
import type { GalleryCategory, GalleryItem, GalleryItemInput } from '@/types'
import ImageUploadField from '@/components/common/ImageUploadField.vue'

const store = useGalleryStore()

const search = ref('')
const showModal = ref(false)
const editingItem = ref<GalleryItem | null>(null)
const formError = ref('')

const categories: GalleryCategory[] = ['LK1', 'LK2', 'Training', 'Baksos', 'Kajian', 'Rapat', 'Lainnya']

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
  if (!query) return store.items
  return store.items.filter(
    (item) =>
      item.title.toLowerCase().includes(query) ||
      item.event.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query),
  )
})

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
    closeModal()
  } else {
    formError.value = store.error
  }
}

async function deleteItem(item: GalleryItem) {
  if (confirm(`Hapus item galeri "${item.title}"?`)) {
    await store.deleteItem(item.id)
  }
}

function closeModal() {
  showModal.value = false
  editingItem.value = null
  formError.value = ''
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(() => {
  void store.fetchItems(true)
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-extrabold text-[#111212]">Manajemen Galeri</h1>
        <p class="text-[#4D4D4D] text-sm mt-0.5">Kelola {{ store.items.length }} foto dan video kegiatan HMI.</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#009246] hover:bg-[#006837] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#009246]/20"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Item
      </button>
    </div>

    <p v-if="store.error && !showModal" class="mb-4 text-sm text-red-500">{{ store.error }}</p>

    <!-- Search -->
    <div class="relative mb-5 max-w-sm">
      <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#C9C9C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
      <input
        v-model="search"
        type="text"
        placeholder="Cari judul, kegiatan, kategori..."
        class="w-full pl-10 pr-8 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246] transition-all"
      />
      <button v-if="search" @click="search = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#C9C9C9] hover:text-[#4D4D4D]" title="Hapus pencarian">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Grid -->
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <article
        v-for="item in filtered"
        :key="item.id"
        class="bg-white rounded-2xl border border-[#E6E6E6] overflow-hidden shadow-sm hover:shadow-md hover:border-[#009246]/40 transition-all group"
      >
        <div class="relative aspect-video bg-[#F7F7F5] overflow-hidden">
          <img
            :src="item.thumbnail || item.url"
            :alt="item.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <span class="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-[#009246]">
            {{ item.category }}
          </span>
          <span
            class="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
            :class="item.type === 'video' ? 'bg-red-500 text-white' : 'bg-black/60 text-white'"
          >
            <svg v-if="item.type === 'video'" class="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{{ item.type === 'video' ? 'Video' : 'Foto' }}</span>
          </span>
          <p class="absolute bottom-2.5 left-3 right-3 text-white text-sm font-bold truncate">{{ item.title }}</p>
        </div>

        <div class="p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-semibold text-[#111212] truncate">{{ item.event }}</p>
              <p class="text-xs text-[#4D4D4D]">{{ formatDate(item.date) }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click="openEdit(item)"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-[#4D4D4D] hover:bg-[#009246]/10 hover:text-[#009246] transition-colors"
                title="Edit"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="deleteItem(item)"
                :disabled="store.isSaving"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-[#4D4D4D] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                title="Hapus"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </article>

      <div
        v-if="filtered.length === 0"
        class="sm:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-dashed border-[#E6E6E6] p-12 text-center"
      >
        <p class="text-sm text-[#4D4D4D]">
          {{ store.isLoading ? 'Memuat galeri...' : search ? 'Tidak ada item yang cocok.' : 'Belum ada item galeri.' }}
        </p>
      </div>
    </div>

    <!-- Modal -->
    <Transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" @click.self="closeModal">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-extrabold text-[#111212]">{{ editingItem ? 'Edit Item Galeri' : 'Tambah Item Galeri' }}</h2>
            <button @click="closeModal" class="w-9 h-9 rounded-lg flex items-center justify-center text-[#4D4D4D] hover:bg-[#E6E6E6] transition-colors" title="Tutup">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-bold text-[#111212] mb-1.5 block">Judul <span class="text-red-500">*</span></label>
              <input v-model="form.title" type="text" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Tipe</label>
                <select v-model="form.type" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]">
                  <option value="photo">Foto</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Kategori</label>
                <select v-model="form.category" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]">
                  <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
                </select>
              </div>
            </div>

            <!-- URL Media: upload for photo, URL input for video -->
            <div v-if="form.type === 'photo'">
              <ImageUploadField
                v-model="form.url"
                label="Foto"
                :required="true"
                aspect-ratio="video"
              />
            </div>
            <div v-else>
              <label class="text-sm font-bold text-[#111212] mb-1.5 block">URL Video <span class="text-red-500">*</span></label>
              <input v-model="form.url" type="url" placeholder="https://youtube.com/... atau link video" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>

            <!-- Thumbnail: upload field -->
            <div v-if="form.type === 'video'">
              <ImageUploadField
                v-model="form.thumbnail"
                label="Thumbnail Video (Opsional)"
                aspect-ratio="video"
              />
            </div>

            <div>
              <label class="text-sm font-bold text-[#111212] mb-1.5 block">Kegiatan</label>
              <input v-model="form.event" type="text" placeholder="cth. LK 1 Batch XV" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>

            <div>
              <label class="text-sm font-bold text-[#111212] mb-1.5 block">Tanggal</label>
              <input v-model="form.date" type="date" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>

            <p v-if="formError" class="text-sm text-red-500">{{ formError }}</p>

            <div class="flex gap-3 pt-2">
              <button @click="closeModal" class="flex-1 py-2.5 border border-[#E6E6E6] text-[#4D4D4D] font-bold rounded-xl text-sm hover:border-[#009246] hover:text-[#009246] transition-colors">Batal</button>
              <button @click="saveItem" :disabled="store.isSaving" class="flex-1 py-2.5 bg-[#009246] disabled:opacity-60 text-white font-bold rounded-xl text-sm hover:bg-[#006837] transition-colors">
                {{ store.isSaving ? 'Menyimpan...' : 'Simpan Item' }}
              </button>
            </div>
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
