<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGalleryStore } from '@/stores/gallery'
import type { GalleryItem } from '@/types'

const store = useGalleryStore()

const categories = computed(() => store.categories)
const filtered = computed(() => store.filteredItems)
const lightboxPhoto = ref<GalleryItem | null>(null)

function openLightbox(photo: GalleryItem) {
  lightboxPhoto.value = photo
}
function closeLightbox() {
  lightboxPhoto.value = null
}

onMounted(() => {
  void store.fetchItems()
})
</script>

<template>
  <div class="pt-[67px]">
    <!-- Hero -->
    <section class="bg-[#111212] relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-[#009246]/15 via-transparent to-[#111212]" />
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div class="inline-flex items-center gap-2 text-[#009246] text-xs font-bold uppercase tracking-widest mb-4">
          <span class="w-8 h-0.5 bg-[#009246] rounded-full" />
          Dokumentasi Kegiatan
          <span class="w-8 h-0.5 bg-[#009246] rounded-full" />
        </div>
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white mb-4">Galeri Kegiatan</h1>
        <p class="text-white/50 max-w-xl mx-auto">Rekam jejak perkaderan dan kegiatan sosial HMI Insan Cita.</p>
      </div>
    </section>

    <!-- Filter -->
    <div class="sticky top-[72px] z-20 bg-white border-b border-[#E6E6E6] shadow-sm py-3">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 overflow-x-auto">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="store.activeCategory = cat"
          class="flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all duration-200"
          :class="store.activeCategory === cat
            ? 'bg-[#009246] text-white shadow-lg shadow-[#009246]/20'
            : 'text-[#4D4D4D] hover:bg-[#009246]/10 hover:text-[#009246]'"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Masonry Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <p v-if="store.isLoading" class="text-center text-sm text-[#4D4D4D] py-10">Memuat galeri...</p>
      <p v-else-if="!filtered.length" class="text-center text-sm text-[#4D4D4D] py-10">Belum ada dokumentasi pada kategori ini.</p>
      <div v-else class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        <div
          v-for="photo in filtered"
          :key="photo.id"
          class="break-inside-avoid group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
          @click="openLightbox(photo)"
        >
          <img
            :src="photo.thumbnail || photo.url"
            :alt="photo.title"
            class="w-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-[#111212]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
            <div class="p-4">
              <p class="text-white font-bold text-sm">{{ photo.title }}</p>
              <span class="text-[#00A651] text-xs font-semibold">{{ photo.category }} · {{ photo.event }}</span>
            </div>
          </div>
          <span
            v-if="photo.type === 'video'"
            class="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
          >
            Video
          </span>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Transition name="fade">
      <div
        v-if="lightboxPhoto"
        class="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        @click.self="closeLightbox"
      >
        <div class="relative max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl bg-[#111212]">
          <video
            v-if="lightboxPhoto.type === 'video'"
            :src="lightboxPhoto.url"
            :poster="lightboxPhoto.thumbnail"
            controls
            class="w-full max-h-[80vh] object-contain"
          />
          <img v-else :src="lightboxPhoto.url || lightboxPhoto.thumbnail" :alt="lightboxPhoto.title" class="w-full max-h-[80vh] object-contain" />
          <div class="absolute top-4 right-4">
            <button @click="closeLightbox" class="w-10 h-10 bg-black/50 hover:bg-[#009246] rounded-full flex items-center justify-center text-white transition-colors text-xl font-bold">×</button>
          </div>
          <div class="p-5">
            <h3 class="text-white font-extrabold text-lg">{{ lightboxPhoto.title }}</h3>
            <p class="text-[#009246] text-sm font-semibold">{{ lightboxPhoto.category }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
