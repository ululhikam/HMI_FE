<script setup lang="ts">
import { ref, watch } from 'vue'
import { getErrorMessage } from '@/api/errors'
import { mediaService } from '@/api/services'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    hint?: string
    required?: boolean
    aspectRatio?: 'square' | 'video' | 'banner'
  }>(),
  {
    modelValue: '',
    label: 'Gambar / Foto',
    hint: 'Mendukung format JPG, PNG, atau WebP (maks. 3MB)',
    required: false,
    aspectRatio: 'video',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const activeTab = ref<'upload' | 'url'>('upload')
const urlInput = ref(props.modelValue || '')
const isUploading = ref(false)
const uploadError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

// Sinkronkan input URL ketika nilai dari luar berubah.
watch(
  () => props.modelValue,
  (newVal) => {
    urlInput.value = newVal || ''
    if (newVal && (newVal.startsWith('http://') || newVal.startsWith('https://')) && !newVal.includes('/uploads/')) {
      activeTab.value = 'url'
    }
  },
  { immediate: true },
)

function onUrlChange() {
  const value = urlInput.value.trim()
  if (value.startsWith('data:')) {
    uploadError.value = 'Data gambar base64 tidak diizinkan. Unggah berkas melalui tab Unggah.'
    return
  }
  uploadError.value = ''
  emit('update:modelValue', value)
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) processFile(file)
  target.value = ''
}

function processFile(file: File) {
  uploadError.value = ''

  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Berkas yang dipilih harus berupa gambar (JPG, PNG, WebP).'
    return
  }

  if (file.size > 3 * 1024 * 1024) {
    uploadError.value =
      'Ukuran berkas melebihi batas maksimal 3MB. Kompres gambar terlebih dahulu.'
    return
  }

  isUploading.value = true
  const reader = new FileReader()

  reader.onload = async () => {
    const base64Data = reader.result as string

    try {
      const res = await mediaService.upload(base64Data, file.name)
      if (!res?.url) {
        throw new Error('Server tidak mengembalikan URL gambar.')
      }
      emit('update:modelValue', res.url)
      urlInput.value = res.url
    } catch (err) {
      uploadError.value = getErrorMessage(err, 'Gagal mengunggah gambar. Silakan coba lagi.')
    } finally {
      isUploading.value = false
    }
  }

  reader.onerror = () => {
    uploadError.value = 'Gagal membaca berkas gambar.'
    isUploading.value = false
  }

  reader.readAsDataURL(file)
}

function removeImage() {
  urlInput.value = ''
  uploadError.value = ''
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="space-y-2.5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <label class="admin-label mb-0">
        {{ label }} <span v-if="required" class="text-red-500">*</span>
      </label>

      <div class="inline-flex items-center gap-0.5 rounded-full border border-line bg-paper p-0.5">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] transition-colors"
          :class="activeTab === 'upload' ? 'bg-ink text-lime-soft' : 'text-muted hover:text-ink'"
          @click="activeTab = 'upload'"
        >
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Unggah
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] transition-colors"
          :class="activeTab === 'url' ? 'bg-ink text-lime-soft' : 'text-muted hover:text-ink'"
          @click="activeTab = 'url'"
        >
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          URL
        </button>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="hidden"
      @change="handleFileSelect"
    />

    <div v-if="activeTab === 'upload'">
      <div
        v-if="!modelValue"
        class="cursor-pointer rounded-[1rem] border border-dashed p-5 text-center transition-colors"
        :class="isDragging ? 'border-moss bg-lime/15' : 'border-line bg-paper/60 hover:border-moss hover:bg-white'"
        role="button"
        tabindex="0"
        @click="triggerFileInput"
        @keydown.enter="triggerFileInput"
        @keydown.space.prevent="triggerFileInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
      >
        <div v-if="isUploading" class="py-3">
          <span class="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-line border-t-moss" />
          <p class="mt-2 text-[10px] font-bold text-ink">Mengunggah gambar...</p>
        </div>

        <div v-else class="py-1">
          <span class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-lime/35 text-moss">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <p class="mt-2.5 text-[10px] font-bold text-ink">
            <span class="text-moss underline">Pilih berkas</span> atau seret ke area ini
          </p>
          <p class="mt-1 text-[8px] font-semibold text-muted">{{ hint }}</p>
        </div>
      </div>
    </div>

    <div v-else>
      <input
        v-model="urlInput"
        type="url"
        placeholder="https://example.com/foto.jpg"
        class="admin-input"
        @input="onUrlChange"
      />
      <p class="mt-1 text-[8px] font-semibold text-muted">Tempelkan tautan gambar langsung dari web publik.</p>
    </div>

    <p v-if="uploadError" class="text-[9px] font-semibold text-red-600">{{ uploadError }}</p>

    <div
      v-if="modelValue"
      class="group relative overflow-hidden rounded-[1rem] border border-line bg-paper"
      :class="{
        'aspect-video': aspectRatio === 'video',
        'aspect-square max-w-[200px]': aspectRatio === 'square',
        'aspect-[21/9]': aspectRatio === 'banner',
      }"
    >
      <img :src="modelValue" alt="Pratinjau gambar" class="h-full w-full object-cover" />

      <div
        v-if="isUploading"
        class="absolute inset-0 flex flex-col items-center justify-center bg-ink/75 text-white"
      >
        <span class="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-lime-soft" />
        <p class="mt-2 text-[8px] font-black uppercase tracking-[0.1em] text-lime-soft">Mengunggah...</p>
      </div>

      <div
        v-else
        class="absolute inset-0 flex items-center justify-center gap-1.5 bg-ink/45 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
      >
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.06em] text-ink transition-colors hover:bg-lime hover:text-white"
          @click="triggerFileInput"
        >
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Ganti
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.06em] text-white transition-colors hover:bg-red-700"
          @click="removeImage"
        >
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Hapus
        </button>
      </div>
    </div>
  </div>
</template>
