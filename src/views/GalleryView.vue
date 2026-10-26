<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGalleryStore } from '@/stores/gallery'
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHero from '@/components/ui/PageHero.vue'
import type { GalleryItem } from '@/types'

const store = useGalleryStore()

const categories = computed(() => store.categories)
const filtered = computed(() => store.filteredItems)
const featuredPhoto = computed<GalleryItem | null>(() => filtered.value[0] ?? null)
const remainingPhotos = computed(() => filtered.value.slice(1))
const lightboxIndex = ref(-1)
const lightboxPhoto = computed<GalleryItem | null>(() => filtered.value[lightboxIndex.value] ?? null)

const categoryCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = { Semua: store.items.length }
  for (const category of store.categories) {
    if (category === 'Semua') continue
    counts[category] = store.items.filter((item) => item.category === category).length
  }
  return counts
})

const photoCount = computed(() => filtered.value.filter((item) => item.type === 'photo').length)
const videoCount = computed(() => filtered.value.filter((item) => item.type === 'video').length)

function openLightbox(photo: GalleryItem) {
  const index = filtered.value.findIndex((item) => item.id === photo.id)
  lightboxIndex.value = index >= 0 ? index : 0
}

function closeLightbox() {
  lightboxIndex.value = -1
}

function nextPhoto() {
  if (!filtered.value.length) return
  lightboxIndex.value = (lightboxIndex.value + 1) % filtered.value.length
}

function prevPhoto() {
  if (!filtered.value.length) return
  lightboxIndex.value = (lightboxIndex.value - 1 + filtered.value.length) % filtered.value.length
}

function selectLightboxPhoto(index: number) {
  lightboxIndex.value = index
}

function formatDate(value?: string) {
  if (!value) return 'Dokumentasi HMI'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (lightboxIndex.value < 0) return
  if (event.key === 'Escape') closeLightbox()
  if (event.key === 'ArrowRight') nextPhoto()
  if (event.key === 'ArrowLeft') prevPhoto()
}

watch(lightboxIndex, (index) => {
  document.body.style.overflow = index >= 0 ? 'hidden' : ''
})

watch(
  () => store.activeCategory,
  () => {
    closeLightbox()
  },
)

onMounted(() => {
  void store.fetchItems()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="bg-paper text-ink">
    <PageHero
      eyebrow="Galeri kegiatan"
      title="Rekam jejak"
      accent="pergerakan."
      description="Momen, proses, dan manusia di balik gerakan HMI Komisariat Insan Cita — dikurasi dari setiap agenda dan proses kaderisasi."
      :meta="`${store.items.length} dokumentasi · ${categories.length - 1} kategori`"
      :image="filtered[0]?.thumbnail || filtered[0]?.url || ''"
    />

    <!-- Filter -->
    <div class="sticky-under-nav sticky z-30 border-b border-line bg-paper/95 backdrop-blur-xl">
      <div class="container-wide">
        <div class="hide-scrollbar flex items-center gap-2 overflow-x-auto py-3">
          <span class="mr-1 hidden flex-shrink-0 text-[8px] font-black uppercase tracking-[0.18em] text-muted sm:block">Kategori</span>
          <button
            v-for="category in categories"
            :key="category"
            type="button"
            class="chip flex-shrink-0"
            :class="store.activeCategory === category ? 'chip-active' : ''"
            :aria-pressed="store.activeCategory === category"
            @click="store.activeCategory = category"
          >
            {{ category }}
            <span
              class="rounded-full px-1.5 py-0.5 text-[8px] font-black leading-none"
              :class="store.activeCategory === category ? 'bg-white/15 text-white' : 'bg-paper-deep text-muted'"
            >
              {{ categoryCounts[category] ?? 0 }}
            </span>
          </button>
          <span class="ml-auto hidden flex-shrink-0 items-center gap-2 pl-4 text-[9px] font-bold uppercase tracking-[0.12em] text-muted md:flex">
            <span class="h-1.5 w-1.5 rounded-full bg-moss" />
            {{ filtered.length }} dokumentasi
          </span>
        </div>
      </div>
    </div>

    <div class="container-wide py-[clamp(2rem,5svh,3.5rem)]">
      <div v-if="store.isLoading" class="space-y-4">
        <div class="h-[clamp(16rem,40svh,28rem)] animate-pulse rounded-[1.75rem] bg-paper-deep" />
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="index in 3" :key="index" class="h-[clamp(12rem,26svh,18rem)] animate-pulse rounded-[1.4rem] bg-paper-deep" />
        </div>
      </div>

      <template v-else-if="filtered.length">
        <!-- Sorotan -->
        <section v-if="featuredPhoto" aria-labelledby="gallery-featured-title">
          <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span class="eyebrow">Sorotan dokumentasi</span>
              <h2 id="gallery-featured-title" class="display-md mt-3">Momen utama<span class="text-moss">.</span></h2>
            </div>
            <div class="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
              <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-moss" />{{ photoCount }} foto</span>
              <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-ink" />{{ videoCount }} video</span>
            </div>
          </div>

          <button
            type="button"
            class="group relative flex min-h-[clamp(20rem,54svh,36rem)] w-full items-end overflow-hidden rounded-[1.75rem] border border-line bg-ink text-left text-white shadow-soft"
            :aria-label="`Buka dokumentasi ${featuredPhoto.title}`"
            @click="openLightbox(featuredPhoto)"
          >
            <img
              :src="featuredPhoto.thumbnail || featuredPhoto.url"
              :alt="featuredPhoto.title"
              class="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent" />
            <div class="absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
              <span class="rounded-full bg-lime px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-white">{{ featuredPhoto.category }}</span>
              <span v-if="featuredPhoto.type === 'video'" class="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-ink">
                <svg class="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Video
              </span>
            </div>

            <div class="relative z-10 w-full p-5 sm:p-8 lg:p-10">
              <p class="text-[9px] font-black uppercase tracking-[0.16em] text-lime-soft">
                {{ featuredPhoto.event || 'Dokumentasi HMI' }} · {{ formatDate(featuredPhoto.date) }}
              </p>
              <h3 class="mt-3 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                {{ featuredPhoto.title }}
              </h3>
              <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4">
                <span class="text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">Klik untuk melihat dokumentasi</span>
                <span class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink transition-transform duration-300 group-hover:translate-x-1">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          </button>
        </section>

        <!-- Grid dokumentasi -->
        <section v-if="remainingPhotos.length" class="mt-[clamp(2.5rem,7svh,5rem)]" aria-labelledby="gallery-grid-title">
          <div class="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
            <div>
              <span class="eyebrow">Arsip visual</span>
              <h2 id="gallery-grid-title" class="display-md mt-3">Momen lainnya<span class="text-moss">.</span></h2>
            </div>
            <span class="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{{ remainingPhotos.length }} dokumentasi</span>
          </div>

          <div class="mt-5 columns-1 gap-4 sm:columns-2 xl:columns-3">
            <button
              v-for="(photo, index) in remainingPhotos"
              :key="photo.id"
              type="button"
              v-reveal="{ delay: (index % 3) * 60 }"
              class="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-[1.4rem] border border-line bg-white text-left transition duration-300 hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-soft"
              :aria-label="`Buka dokumentasi ${photo.title}`"
              @click="openLightbox(photo)"
            >
              <div class="relative overflow-hidden bg-paper-deep">
                <img
                  :src="photo.thumbnail || photo.url"
                  :alt="photo.title"
                  loading="lazy"
                  decoding="async"
                  class="w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span class="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-ink backdrop-blur">
                  {{ photo.category }}
                </span>
                <span v-if="photo.type === 'video'" class="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-white">
                  <svg class="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Video
                </span>
                <span class="absolute bottom-3 right-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>

              <div class="p-4">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] font-black uppercase tracking-[0.12em]">
                  <span class="text-moss">{{ photo.event || 'Dokumentasi HMI' }}</span>
                  <span class="h-0.5 w-0.5 rounded-full bg-muted" />
                  <span class="font-bold tracking-[0.08em] text-muted">{{ formatDate(photo.date) }}</span>
                </div>
                <h3 class="mt-2 line-clamp-2 font-display text-base font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-moss">
                  {{ photo.title }}
                </h3>
              </div>
            </button>
          </div>
        </section>
      </template>

      <EmptyState
        v-else
        title="Belum ada dokumentasi"
        description="Dokumentasi pada kategori ini belum tersedia. Silakan pilih kategori lain atau tampilkan semua dokumentasi."
      >
        <button type="button" class="btn btn-ink mt-2" @click="store.activeCategory = 'Semua'">Tampilkan semua</button>
      </EmptyState>

      <p v-if="store.error" class="mt-6 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
        {{ store.error }}
      </p>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div
          v-if="lightboxPhoto"
          class="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-ink/95 p-3 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          :aria-label="`Dokumentasi ${lightboxPhoto.title}`"
          @click.self="closeLightbox"
        >
          <div class="my-auto w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-ink-soft" @click.stop>
            <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div class="flex min-w-0 items-center gap-2">
                <span class="rounded-full bg-lime px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-white">{{ lightboxPhoto.category }}</span>
                <span class="truncate text-[9px] font-bold uppercase tracking-[0.1em] text-white/60">{{ lightboxPhoto.event || 'Dokumentasi HMI' }}</span>
              </div>
              <button
                type="button"
                class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-lime hover:bg-lime hover:text-white"
                aria-label="Tutup galeri"
                @click="closeLightbox"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <div class="relative">
              <div class="lightbox-media flex items-center justify-center bg-black/60">
                <video
                  v-if="lightboxPhoto.type === 'video'"
                  :src="lightboxPhoto.url"
                  :poster="lightboxPhoto.thumbnail"
                  controls
                  autoplay
                  class="lightbox-media w-full object-contain"
                />
                <img
                  v-else
                  :src="lightboxPhoto.url || lightboxPhoto.thumbnail"
                  :alt="lightboxPhoto.title"
                  class="lightbox-media w-full object-contain"
                />
              </div>

              <button
                type="button"
                class="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink/45 text-white backdrop-blur transition-colors hover:border-lime hover:bg-lime hover:text-white"
                aria-label="Dokumentasi sebelumnya"
                @click="prevPhoto"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              <button
                type="button"
                class="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink/45 text-white backdrop-blur transition-colors hover:border-lime hover:bg-lime hover:text-white"
                aria-label="Dokumentasi berikutnya"
                @click="nextPhoto"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>

            <div class="border-t border-white/10 p-4 sm:p-5">
              <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div class="min-w-0">
                  <h3 class="font-display text-xl font-semibold leading-tight tracking-tight text-white">{{ lightboxPhoto.title }}</h3>
                  <p class="mt-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white/60">
                    {{ formatDate(lightboxPhoto.date) }}
                    <span class="mx-1.5 text-white/20">·</span>
                    Geser dengan ← →
                  </p>
                </div>
                <div class="flex flex-shrink-0 items-center gap-3">
                  <span class="font-display text-sm font-bold text-white/60">{{ String(lightboxIndex + 1).padStart(2, '0') }} / {{ String(filtered.length).padStart(2, '0') }}</span>
                  <a
                    v-if="lightboxPhoto.type !== 'video'"
                    :href="lightboxPhoto.url || lightboxPhoto.thumbnail"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex h-9 items-center gap-2 rounded-full border border-white/15 px-3 text-[9px] font-black uppercase tracking-[0.1em] text-white/60 transition-colors hover:border-lime-soft hover:text-lime-soft"
                  >
                    Buka gambar
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>

              <div class="hide-scrollbar mt-4 flex gap-2 overflow-x-auto border-t border-white/10 pt-3">
                <button
                  v-for="(photo, index) in filtered"
                  :key="photo.id"
                  type="button"
                  class="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-[0.6rem] border transition-all"
                  :class="index === lightboxIndex ? 'border-lime-soft opacity-100' : 'border-white/10 opacity-45 hover:opacity-80'"
                  :aria-label="`Tampilkan ${photo.title}`"
                  @click="selectLightboxPhoto(index)"
                >
                  <img :src="photo.thumbnail || photo.url" :alt="photo.title" class="h-full w-full object-cover" loading="lazy" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 220ms ease;
}
.lightbox-enter-active > div,
.lightbox-leave-active > div {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
.lightbox-enter-from > div,
.lightbox-leave-to > div {
  transform: scale(0.98) translateY(8px);
}
</style>
