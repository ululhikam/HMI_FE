<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useArticleStore } from '@/stores/articles'
import { useSiteStore } from '@/stores/site'
import { useEventStore } from '@/stores/events'
import { useGalleryStore } from '@/stores/gallery'

const articleStore = useArticleStore()
const siteStore = useSiteStore()
const eventStore = useEventStore()
const galleryStore = useGalleryStore()

const latestArticles = computed(() => articleStore.latestArticles)
const home = computed(() => siteStore.home)
const stats = computed(() => siteStore.stats)

const activities = computed(() => {
  if (eventStore.events.length > 0) {
    return eventStore.events.slice(0, 6).map((e) => ({
      title: e.title,
      description: e.description,
      image: e.coverImage || '',
      category: e.category,
      to: '/agenda',
    }))
  }
  return (home.value?.activities ?? []).map((a) => ({
    ...a,
    to: '/agenda',
  }))
})

const committees = computed(() => home.value?.committees ?? [])

const galleryPhotos = computed(() => {
  if (galleryStore.items.length > 0) {
    return galleryStore.items
      .map((item) => item.thumbnail || item.url)
      .filter((url): url is string => Boolean(url))
  }
  return (home.value?.galleryPreview ?? []).filter(Boolean)
})
const visionPhotos = computed(() => (home.value?.vision.photos ?? []).filter(Boolean))
const currentYear = new Date().getFullYear()


const quickStats = computed(() => {
  const value = stats.value
  return [
    {
      value: value ? `${value.totalKader}+` : '—',
      label: 'Kader Aktif',
      className: 'bg-[#009246] shadow-[#009246]/20',
    },
    {
      value: value ? `${value.totalKomisariat}` : '—',
      label: 'Komisariat',
      className: 'bg-[#006837] shadow-[#006837]/20',
    },
    {
      value: value && value.yearFounded ? `${currentYear - value.yearFounded}th` : '—',
      label: 'Berdiri',
      className: 'bg-[#111212] shadow-black/20',
    },
  ]
})

// Counter animation
const counters = ref({ kader: 0, komisariat: 0, alumni: 0, tahun: 0 })
let animationStarted = false

function animateCounters() {
  if (animationStarted || !stats.value) return
  animationStarted = true
  const targets = {
    kader: stats.value.totalKader,
    komisariat: stats.value.totalKomisariat,
    alumni: stats.value.totalAlumni,
    tahun: stats.value.yearFounded ? currentYear - stats.value.yearFounded : 0,
  }
  const duration = 1500
  const start = Date.now()
  const timer = setInterval(() => {
    const elapsed = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    counters.value = {
      kader: Math.floor(ease * targets.kader),
      komisariat: Math.floor(ease * targets.komisariat),
      alumni: Math.floor(ease * targets.alumni),
      tahun: Math.floor(ease * targets.tahun),
    }
    if (progress >= 1) clearInterval(timer)
  }, 16)
}

function setupCounterObserver() {
  const statsEl = document.getElementById('stats-section')
  if (!statsEl || !stats.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) animateCounters()
    },
    { threshold: 0.3 },
  )
  observer.observe(statsEl)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Gallery carousel
const carouselIndex = ref(0)
let carouselTimer: ReturnType<typeof setInterval> | null = null

function nextSlide() {
  const length = galleryPhotos.value.length
  if (!length) return
  carouselIndex.value = (carouselIndex.value + 1) % length
}
function prevSlide() {
  const length = galleryPhotos.value.length
  if (!length) return
  carouselIndex.value = (carouselIndex.value - 1 + length) % length
}
function startCarousel() {
  if (carouselTimer) return
  carouselTimer = setInterval(nextSlide, 4000)
}
function pauseCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer)
    carouselTimer = null
  }
}

let observer: IntersectionObserver | undefined

watch(galleryPhotos, () => {
  if (carouselIndex.value >= galleryPhotos.value.length) carouselIndex.value = 0
})

onMounted(async () => {
  await Promise.all([
    siteStore.fetchHome(),
    articleStore.fetchPublished(),
    eventStore.fetchAll(),
    galleryStore.fetchItems(),
  ])
  if (galleryPhotos.value.length > 0) {
    startCarousel()
  }
  setupCounterObserver()
})

onUnmounted(() => {
  pauseCarousel()
  observer?.disconnect()
})
</script>

<template>
  <!-- ══════════════════════════════════════════════════════════
       1. HERO — Full-width overlay like CIMSA reference
  ══════════════════════════════════════════════════════════ -->
  <section class="relative h-screen min-h-[600px] max-h-[800px] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#009246] via-[#006837] to-[#111212]">
    <!-- Background photo -->
    <img
      v-if="home.hero.backgroundImage"
      :src="home.hero.backgroundImage"
      :alt="home.hero.title"
      class="absolute inset-0 w-full h-full object-cover object-center"
    />
    <!-- Overlays -->
    <div class="absolute inset-0 bg-[#0a0a0a]/70" />
    <div class="absolute inset-0 bg-gradient-to-t from-[#111212] via-transparent to-[#111212]/30" />
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#111212]" />

    <!-- Center badge logo -->
    <div class="relative z-10 flex flex-col items-center text-center px-4">
      <div class="h-28 w-28 mb-4 drop-shadow-2xl animate-float flex items-center justify-center">
        <img
          v-if="siteStore.settings.logoUrl"
          :src="siteStore.settings.logoUrl"
          :alt="`Logo ${siteStore.settings.organizationName || 'HMI'}`"
          class="h-full w-full object-contain rounded-full ring-2 ring-white/20 shadow-[0_0_35px_rgba(0,146,70,0.5)]"
        />
        <span v-else class="w-full h-full rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black text-white">
          HMI
        </span>
      </div>

      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-2 text-shadow-lg">
        {{ home.hero.title }}
      </h1>
      <p class="text-[#009246] font-bold text-base sm:text-lg tracking-[0.2em] uppercase mb-3">
        {{ home.hero.eyebrow }}
      </p>
      <p class="text-white/60 text-sm sm:text-base max-w-lg leading-relaxed mb-8">
        {{ home.hero.tagline }}
      </p>
      <div class="flex flex-wrap gap-3 justify-center">
        <RouterLink
          to="/daftar"
          class="px-7 py-3 bg-[#009246] hover:bg-[#006837] text-white font-bold text-sm uppercase tracking-wider rounded transition-all duration-300 shadow-xl shadow-[#009246]/30 hover:shadow-[#009246]/50 hover:-translate-y-0.5"
        >
          Daftar LK 1
        </RouterLink>
        <RouterLink
          to="/tentang"
          class="px-7 py-3 border border-white/30 hover:border-[#009246] text-white hover:text-[#009246] font-bold text-sm uppercase tracking-wider rounded transition-all duration-300"
        >
          Tentang HMI
        </RouterLink>
      </div>
    </div>

    <!-- Scroll hint -->
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 z-10">
      <div class="w-px h-10 bg-gradient-to-b from-transparent to-white/30" />
      <span class="text-[10px] font-bold uppercase tracking-[0.3em]">Scroll</span>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════
       2. ABOUT SECTION — Two column (Card + Text) like CIMSA
  ══════════════════════════════════════════════════════════ -->
  <section class="bg-[#f8f8f8] py-16">
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6">
      <div class="grid lg:grid-cols-[380px_1fr] gap-10 items-start">

        <!-- Left: Feature Card -->
        <div class="relative rounded-xl overflow-hidden shadow-2xl group">
          <img
            v-if="home.about.imageUrl"
            :src="home.about.imageUrl"
            :alt="siteStore.settings.organizationName || 'HMI'"
            class="w-full h-[300px] lg:h-[380px] object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div
            v-else
            class="w-full h-[300px] lg:h-[380px] bg-gradient-to-br from-[#009246] to-[#111212] flex items-center justify-center text-white/70 text-sm font-bold"
          >
            Foto belum tersedia
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-[#111212]/90 via-[#111212]/30 to-transparent" />
          <!-- Overlay badge -->
          <div class="absolute top-4 left-4">
            <div class="bg-[#009246] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded">
              {{ home.about.badge }}
            </div>
          </div>
          <!-- Bottom text overlay like CIMSA -->
          <div class="absolute bottom-0 left-0 right-0 p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="h-9 w-9 flex-shrink-0 flex items-center justify-center">
                <img
                  v-if="siteStore.settings.secondaryLogoUrl"
                  :src="siteStore.settings.secondaryLogoUrl"
                  :alt="`Logo ${siteStore.settings.organizationShortName || 'HMI'}`"
                  class="max-h-full max-w-full object-contain rounded drop-shadow"
                />
              </div>
              <div>
                <div class="text-white font-black text-sm leading-none uppercase">{{ siteStore.settings.organizationName }}</div>
                <div class="text-[#009246] text-[10px] font-bold tracking-widest uppercase">{{ home.hero.eyebrow }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Text Content -->
        <div class="pt-2">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-6 h-0.5 bg-[#009246]" />
            <span class="text-[#009246] text-xs font-black uppercase tracking-[0.2em]">{{ home.about.sectionLabel }}</span>
          </div>
          <h2 class="text-3xl lg:text-4xl font-black text-[#111212] mb-4 leading-tight">
            {{ home.about.title }}<br />
            <span class="text-[#009246]">{{ home.about.highlight }}</span>
          </h2>
          <p
            v-for="(paragraph, index) in home.about.paragraphs"
            :key="index"
            class="text-[#4D4D4D] text-sm leading-relaxed mb-3"
            :class="index === home.about.paragraphs.length - 1 ? 'mb-6' : ''"
          >
            {{ paragraph }}
          </p>

          <!-- Quick stats row like CIMSA reference buttons -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <div
              v-for="stat in quickStats"
              :key="stat.label"
              class="text-white text-center py-3 px-2 rounded-lg shadow-lg"
              :class="stat.className"
            >
              <div class="text-xl font-black">{{ stat.value }}</div>
              <div class="text-[10px] font-bold uppercase tracking-wide opacity-80 mt-0.5">{{ stat.label }}</div>
            </div>
          </div>

          <RouterLink
            to="/tentang"
            class="inline-flex items-center gap-2 text-[#009246] font-bold text-sm hover:gap-3 transition-all group uppercase tracking-wider"
          >
            Selengkapnya 
          </RouterLink>
        </div>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════
       3. VISION — Centered title + right text + photo strip
  ══════════════════════════════════════════════════════════ -->
  <section class="bg-white py-16">
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6">
      <div class="grid lg:grid-cols-[200px_1fr] gap-10 items-start mb-10">
        <div>
          <h2 class="text-4xl font-black text-[#111212] leading-tight">Our<br /><span class="text-[#009246]">Vision</span></h2>
        </div>
        <div class="space-y-3 pt-1">
          <p class="text-[#4D4D4D] text-sm leading-relaxed border-l-4 border-[#009246] pl-5 italic text-base font-medium text-[#231F20]">
            "{{ home.vision.quote }}"
          </p>
          <p class="text-[#4D4D4D] text-sm leading-relaxed pl-5">
            {{ home.vision.description }}
          </p>
        </div>
      </div>

      <!-- Horizontal photo strip like CIMSA reference -->
      <div
        v-if="visionPhotos.length"
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 rounded-xl overflow-hidden"
      >
        <div
          v-for="(photo, i) in visionPhotos"
          :key="i"
          class="relative aspect-[3/2] overflow-hidden group"
        >
          <img
            :src="photo"
            :alt="`Kegiatan HMI ${i + 1}`"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div class="absolute inset-0 bg-[#009246]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════
       4. MISSION — Dark green full-width like CIMSA red section
  ══════════════════════════════════════════════════════════ -->
  <section class="bg-[#006837] py-16 relative overflow-hidden">
    <!-- Pattern overlay -->
    <div class="absolute inset-0 opacity-5" style="background-image: repeating-linear-gradient(45deg, white, white 1px, transparent 1px, transparent 12px)" />
    <div class="absolute right-0 top-0 w-[400px] h-full bg-[#009246]/20 skew-x-[-10deg] translate-x-20 pointer-events-none" />

    <div class="relative max-w-[1200px] mx-auto px-4 sm:px-6">
      <div class="grid lg:grid-cols-[220px_1fr] gap-10 items-start mb-10">
        <div>
          <h2 class="text-4xl font-black text-white leading-tight">Our<br /><span class="text-[#B7E1CD]">Mission</span></h2>
        </div>
        <div class="space-y-4">
          <p class="text-white/90 text-sm leading-relaxed">
            {{ home.mission.intro }}
          </p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div
              v-for="(pillar, i) in home.mission.pillars"
              :key="pillar.title"
              class="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15 hover:bg-white/15 transition-colors"
            >
              <span class="text-2xl flex-shrink-0 font-black text-white/35">{{ String(i + 1).padStart(2, '0') }}</span>
              <div>
                <h4 class="text-white font-bold text-sm mb-1">{{ pillar.title }}</h4>
                <p class="text-white/65 text-xs leading-relaxed">{{ pillar.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════
       5. ACTIVITIES — Card grid like CIMSA reference
  ══════════════════════════════════════════════════════════ -->
  <section class="bg-[#f8f8f8] py-16">
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6">
      <!-- Section header -->
      <div class="text-center mb-10">
        <h2 class="text-3xl font-black text-[#111212] mb-2">Kegiatan & <span class="text-[#009246]">Program</span></h2>
        <p class="text-[#4D4D4D] text-sm max-w-xl mx-auto">Program kaderisasi dan pengabdian HMI Insan Cita yang terstruktur dan berkesinambungan</p>
      </div>

      <!-- 3-column grid of activity cards or clean empty state -->
      <div v-if="activities.length > 0" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <article
          v-for="(act, i) in activities"
          :key="i"
          class="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-400 border border-[#eee] hover:border-[#009246]/20 hover:-translate-y-1"
        >
          <div class="relative overflow-hidden h-44 bg-gradient-to-br from-[#004d25] to-[#009246] flex items-center justify-center">
            <img
              v-if="act.image"
              :src="act.image"
              :alt="act.title"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600"
            />
            <div v-else class="text-white/60 flex flex-col items-center justify-center gap-1.5 p-4 text-center">
              <svg class="w-10 h-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span class="text-[11px] font-black tracking-wider uppercase text-white/80">Agenda HMI</span>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#111212]/60 via-transparent to-transparent pointer-events-none" />
            <span class="absolute top-3 left-3 bg-[#009246] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
              {{ act.category }}
            </span>
          </div>
          <div class="p-5">
            <h3 class="text-[#111212] font-black text-sm mb-2 leading-snug group-hover:text-[#009246] transition-colors">
              {{ act.title }}
            </h3>
            <p class="text-[#4D4D4D] text-xs leading-relaxed mb-4 line-clamp-2">{{ act.description }}</p>
            <RouterLink
              :to="act.to || '/agenda'"
              class="inline-flex items-center gap-1.5 text-[#009246] font-bold text-xs uppercase tracking-wider border border-[#009246]/30 hover:bg-[#009246] hover:text-white px-3 py-1.5 rounded transition-all duration-200"
            >
              Selengkapnya 
            </RouterLink>
          </div>
        </article>
      </div>

      <div
        v-else
        class="text-center py-14 px-6 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-lg mx-auto"
      >
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 text-[#009246] flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-gray-900 mb-1">Belum Ada Agenda Mendatang</h3>
        <p class="text-xs text-gray-500 mb-5">Program kegiatan dan kaderisasi yang telah diagendakan akan tampil di sini.</p>
        <RouterLink
          to="/agenda"
          class="inline-flex items-center gap-2 px-4 py-2 bg-[#009246] hover:bg-[#006837] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
        >
          Buka Jadwal Agenda
        </RouterLink>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════
       6. STANDING COMMITTEE / BIDANG — Logo strip like CIMSA
  ══════════════════════════════════════════════════════════ -->
  <section class="bg-white py-12 border-y border-[#eee]">
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-black text-[#111212]">Bidang & <span class="text-[#009246]">Departemen</span></h2>
        <p class="text-[#4D4D4D] text-xs mt-1">Struktur kerja fungsional HMI Insan Cita</p>
      </div>
      <!-- Committee icon strip -->
      <div class="flex items-center justify-center flex-wrap gap-6 lg:gap-10">
        <div
          v-for="committee in committees"
          :key="committee.name"
          class="flex flex-col items-center gap-2 group cursor-pointer"
        >
          <!-- Circle icon with abbreviation -->
          <div
            class="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300"
            :style="`background-color: ${committee.color};`"
          >
            {{ committee.abbreviation }}
          </div>
          <span class="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-wide text-center max-w-[80px] leading-tight group-hover:text-[#009246] transition-colors">
            {{ committee.name }}
          </span>
        </div>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════
       7. GALLERY PREVIEW — Carousel
  ══════════════════════════════════════════════════════════ -->
  <section class="bg-[#111212] py-16">
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6">
      <div class="flex items-end justify-between mb-8">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-5 h-0.5 bg-[#009246]" />
            <span class="text-[#009246] text-xs font-black uppercase tracking-[0.2em]">Dokumentasi</span>
          </div>
          <h2 class="text-3xl font-black text-white">Galeri <span class="text-[#009246]">Kegiatan</span></h2>
          <p class="text-white/40 text-xs mt-1">Rekam jejak perkaderan HMI Insan Cita</p>
        </div>
        <RouterLink
          to="/galeri"
          class="hidden sm:inline-flex items-center gap-2 border border-[#009246]/50 text-[#009246] hover:bg-[#009246] hover:text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-all"
        >
          Lihat Semua 
        </RouterLink>
      </div>

      <!-- Carousel container if photos exist -->
      <div
        v-if="galleryPhotos.length > 0"
        class="relative rounded-2xl overflow-hidden group"
        @mouseenter="pauseCarousel"
        @mouseleave="startCarousel"
      >
        <!-- Slides -->
        <div class="relative aspect-[16/7] sm:aspect-[16/6] bg-[#1a1a1a]">
          <img
            v-for="(photo, i) in galleryPhotos"
            :key="i"
            :src="photo"
            :alt="`Kegiatan HMI ${i + 1}`"
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            :class="carouselIndex === i ? 'opacity-100' : 'opacity-0'"
          />
          <!-- Gradient overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-[#111212]/60 via-transparent to-transparent" />
        </div>

        <!-- Prev/Next buttons -->
        <button
          @click="prevSlide"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-[#009246] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button
          @click="nextSlide"
          class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-[#009246] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>

        <!-- Dots -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          <button
            v-for="(_, i) in galleryPhotos"
            :key="i"
            @click="carouselIndex = i"
            class="w-2 h-2 rounded-full transition-all"
            :class="carouselIndex === i ? 'bg-[#009246] w-6' : 'bg-white/40 hover:bg-white/70'"
          />
        </div>
      </div>

      <!-- Empty state when no gallery items exist -->
      <div
        v-else
        class="text-center py-16 px-6 bg-[#181919] rounded-2xl border border-white/5 max-w-lg mx-auto"
      >
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 text-[#009246] flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-white mb-1">Dokumentasi Foto Belum Tersedia</h3>
        <p class="text-xs text-white/50 mb-5">Dokumentasi kegiatan dan arsip perkaderan HMI akan segera dipublikasikan.</p>
        <RouterLink
          to="/galeri"
          class="inline-flex items-center gap-2 px-4 py-2 border border-[#009246] text-[#009246] hover:bg-[#009246] hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
        >
          Buka Halaman Galeri
        </RouterLink>
      </div>

      <div v-if="galleryPhotos.length > 0" class="mt-5 text-center sm:hidden">
        <RouterLink to="/galeri" class="inline-flex items-center gap-2 border border-[#009246]/50 text-[#009246] text-xs font-bold uppercase px-5 py-2.5 rounded transition-all hover:bg-[#009246] hover:text-white">
          Lihat Semua Galeri 
        </RouterLink>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════
       8. STATS COUNTER — Animated numbers
  ══════════════════════════════════════════════════════════ -->
  <section id="stats-section" class="bg-[#009246] py-14 relative overflow-hidden">
    <div class="absolute inset-0 opacity-10" style="background-image: url('data:image/svg+xml,<svg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 fill=%22none%22 xmlns=%22http://www.w3.org/2000/svg%22><circle cx=%2220%22 cy=%2220%22 r=%221%22 fill=%22white%22/></svg>')" />
    <div class="relative max-w-[1200px] mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
        <div>
          <div class="text-5xl font-black mb-1">{{ counters.kader }}+</div>
          <div class="text-white/70 text-xs font-bold uppercase tracking-widest">Kader Aktif</div>
        </div>
        <div>
          <div class="text-5xl font-black mb-1">{{ counters.komisariat }}</div>
          <div class="text-white/70 text-xs font-bold uppercase tracking-widest">Komisariat</div>
        </div>
        <div>
          <div class="text-5xl font-black mb-1">{{ counters.alumni.toLocaleString() }}+</div>
          <div class="text-white/70 text-xs font-bold uppercase tracking-widest">Alumni</div>
        </div>
        <div>
          <div class="text-5xl font-black mb-1">{{ counters.tahun }}</div>
          <div class="text-white/70 text-xs font-bold uppercase tracking-widest">Tahun Berdiri</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════
       9. FOOTER HERO BANNER — Like CIMSA "CIMSA UNHAN" banner
  ══════════════════════════════════════════════════════════ -->
  <section class="relative h-60 overflow-hidden flex items-center bg-gradient-to-r from-[#009246] to-[#111212]">
    <img
      v-if="home.hero.backgroundImage"
      :src="home.hero.backgroundImage"
      :alt="home.hero.title"
      class="absolute inset-0 w-full h-full object-cover"
    />
    <div class="absolute inset-0 bg-[#111212]/80" />
    <div class="absolute inset-0 bg-gradient-to-r from-[#111212]/90 via-[#111212]/60 to-transparent" />
    <div class="relative max-w-[1200px] mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
      <div>
        <h2 class="text-4xl sm:text-5xl font-black text-white leading-none">{{ siteStore.settings.organizationShortName }}</h2>
        <h3 class="text-xl sm:text-2xl font-black text-white leading-none uppercase">{{ siteStore.settings.chapterName }}</h3>
        <p class="text-[#009246] font-bold text-xs uppercase tracking-[0.3em] mt-1">{{ siteStore.settings.tagline }}</p>
      </div>
      <div class="hidden sm:flex items-center gap-4">
        <div v-if="siteStore.settings.logoUrl" class="h-20 w-20 flex items-center justify-center">
          <img
            :src="siteStore.settings.logoUrl"
            :alt="`Logo ${siteStore.settings.organizationName || 'HMI'}`"
            class="h-full w-full object-contain rounded-full ring-2 ring-white/20 shadow-xl"
          />
        </div>
        <div v-if="siteStore.settings.secondaryLogoUrl" class="h-20 w-16 flex items-center justify-center opacity-80">
          <img
            :src="siteStore.settings.secondaryLogoUrl"
            :alt="`Logo ${siteStore.settings.organizationShortName || 'HMI'}`"
            class="max-h-full max-w-full object-contain drop-shadow-xl"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════
       10. BERITA TERBARU — News grid like CIMSA bottom section
  ══════════════════════════════════════════════════════════ -->
  <section class="bg-[#f8f8f8] py-16">
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6">
      <div class="flex items-end justify-between mb-8">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-5 h-0.5 bg-[#009246]" />
            <span class="text-[#009246] text-xs font-black uppercase tracking-[0.2em]">Terkini</span>
          </div>
          <h2 class="text-3xl font-black text-[#111212]">Berita <span class="text-[#009246]">Terbaru</span></h2>
        </div>
        <RouterLink to="/berita" class="hidden sm:inline-flex items-center gap-1.5 text-[#009246] font-bold text-xs uppercase tracking-wider hover:gap-2.5 transition-all group">
          Semua Berita 
        </RouterLink>
      </div>

      <p v-if="latestArticles.length === 0" class="text-sm text-[#4D4D4D] py-6">
        Belum ada berita terbaru.
      </p>
      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <article
          v-for="article in latestArticles"
          :key="article.id"
          class="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[#eee]"
        >
          <div class="relative overflow-hidden h-44 bg-gradient-to-br from-[#009246] to-[#111212]">
            <img
              v-if="article.coverImage"
              :src="article.coverImage"
              :alt="article.title"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600"
            />
            <span
              v-else
              class="w-full h-full flex items-center justify-center text-xs font-bold text-white/70"
            >
              Gambar belum tersedia
            </span>
            <div class="absolute top-3 left-3">
              <span class="bg-[#009246] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                {{ article.category }}
              </span>
            </div>
          </div>
          <div class="p-5">
            <time class="text-[#4D4D4D] text-[11px] font-semibold uppercase tracking-wider">
              {{ formatDate(article.publishedAt) }}
            </time>
            <h3 class="text-[#111212] font-black text-sm mt-1.5 mb-2 leading-snug group-hover:text-[#009246] transition-colors line-clamp-2">
              {{ article.title }}
            </h3>
            <p class="text-[#4D4D4D] text-xs leading-relaxed line-clamp-2 mb-4">{{ article.excerpt }}</p>
            <RouterLink
              :to="`/berita/${article.slug}`"
              class="inline-flex items-center gap-1.5 text-[#009246] font-bold text-xs uppercase tracking-wider border border-[#009246]/30 hover:bg-[#009246] hover:text-white px-3 py-1.5 rounded transition-all duration-200"
            >
              Baca 
            </RouterLink>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.duration-400 { transition-duration: 400ms; }
.duration-600 { transition-duration: 600ms; }
</style>
