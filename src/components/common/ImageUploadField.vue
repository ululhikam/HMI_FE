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
    hint: 'Mendukung format JPG, PNG, atau WebP (Maks. 5MB)',
    required: false,
    aspectRatio: 'video',
  }
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

// Sync urlInput when modelValue changes externally
watch(
  () => props.modelValue,
  (newVal) => {
    urlInput.value = newVal || ''
    if (newVal && (newVal.startsWith('http://') || newVal.startsWith('https://')) && !newVal.includes('/uploads/')) {
      activeTab.value = 'url'
    }
  },
  { immediate: true }
)

function onUrlChange() {
  const value = urlInput.value.trim()
  if (value.startsWith('data:')) {
    uploadError.value = 'Data gambar base64 tidak diizinkan. Unggah berkas melalui tab Upload.'
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

  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'Ukuran berkas melebihi batas maksimal 5MB.'
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
    <!-- Label & Mode Tabs -->
    <div class="flex items-center justify-between">
      <label class="text-xs font-bold text-[#111212]">
        {{ label }} <span v-if="required" class="text-red-500">*</span>
      </label>

      <!-- Tabs (Upload vs URL) -->
      <div class="inline-flex items-center p-0.5 bg-gray-100 rounded-lg text-[11px] font-semibold border border-gray-200">
        <button
          type="button"
          @click="activeTab = 'upload'"
          class="px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5"
          :class="activeTab === 'upload' ? 'bg-white text-[#009246] shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>Unggah Berkas</span>
        </button>
        <button
          type="button"
          @click="activeTab = 'url'"
          class="px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5"
          :class="activeTab === 'url' ? 'bg-white text-[#009246] shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Tautan URL</span>
        </button>
      </div>
    </div>

    <!-- Hidden native file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Active Tab: Upload Box -->
    <div v-if="activeTab === 'upload'">
      <!-- Dropzone when no image -->
      <div
        v-if="!modelValue"
        @click="triggerFileInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
        class="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200"
        :class="isDragging ? 'border-[#009246] bg-emerald-50/50 scale-[0.99]' : 'border-gray-200 bg-[#FBFBFA] hover:border-[#009246] hover:bg-white'"
      >
        <div v-if="isUploading" class="py-4">
          <div class="animate-spin w-8 h-8 border-3 border-[#009246] border-t-transparent rounded-full mx-auto mb-2" />
          <p class="text-xs font-bold text-gray-700">Mengunggah gambar...</p>
        </div>

        <div v-else class="space-y-2">
          <div class="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#009246] flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <span class="text-xs font-bold text-[#009246] hover:underline">Pilih berkas</span>
            <span class="text-xs text-gray-500"> atau seret ke area ini</span>
          </div>
          <p class="text-[11px] text-gray-400">{{ hint }}</p>
        </div>
      </div>
    </div>

    <!-- Active Tab: URL Input -->
    <div v-else class="space-y-2">
      <div class="relative">
        <input
          v-model="urlInput"
          type="url"
          placeholder="https://example.com/foto.jpg"
          class="w-full pl-9 pr-4 py-2.5 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl text-xs focus:outline-none focus:border-[#009246] focus:bg-white transition-colors"
          @input="onUrlChange"
        />
        <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <p class="text-[11px] text-gray-400">Tempelkan link gambar langsung dari web.</p>
    </div>

    <!-- Error message -->
    <p v-if="uploadError" class="text-xs text-red-500 font-medium">{{ uploadError }}</p>

    <!-- Preview Box when image is set -->
    <div
      v-if="modelValue"
      class="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 group"
      :class="{
        'aspect-video': aspectRatio === 'video',
        'aspect-square max-w-[200px]': aspectRatio === 'square',
        'aspect-[21/9]': aspectRatio === 'banner'
      }"
    >
      <img
        :src="modelValue"
        alt="Pratinjau Foto"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          type="button"
          @click="triggerFileInput"
          class="px-3 py-1.5 bg-white text-gray-800 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors shadow flex items-center gap-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Ganti
        </button>
        <button
          type="button"
          @click="removeImage"
          class="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow flex items-center gap-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Hapus
        </button>
      </div>
    </div>
  </div>
</template>
