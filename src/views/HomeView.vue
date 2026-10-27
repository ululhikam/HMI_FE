<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useArticleStore } from '@/stores/articles'
import { useSiteStore } from '@/stores/site'
import { useEventStore } from '@/stores/events'
import { useGalleryStore } from '@/stores/gallery'
import EmptyState from '@/components/ui/EmptyState.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import StarMark from '@/components/ui/StarMark.vue'

const articleStore = useArticleStore()
const siteStore = useSiteStore()
const eventStore = useEventStore()
const galleryStore = useGalleryStore()

const latestArticles = computed(() => articleStore.latestArticles)
const home = computed(() => siteStore.home)
const stats = computed(() => siteStore.stats)
const settings = computed(() => siteStore.settings)
const currentYear = new Date().getFullYear()

const featuredArticle = computed(() => latestArticles.value[0] ?? null)
const remainingArticles = computed(() => latestArticles.value.slice(1, 4))

const displayTitle = computed(
  () => home.value.hero.title || settings.value.organizationName || 'Membina Insan Cita Melalui Gagasan & Aksi Nyata',
)
const displayEyebrow = computed(
  () => home.value.hero.eyebrow || settings.value.organizationShortName || 'Himpunan Mahasiswa Islam',
)
const displayTagline = computed(() => home.value.hero.tagline || settings.value.tagline)
const displayDescription = computed(() => home.value.hero.description || settings.value.description)
const heroImage = computed(() => home.value.hero.backgroundImage || '/images/hero_student.jpg')
const foundedYear = computed(() => stats.value?.yearFounded || settings.value.yearFounded || 1947)
const yearsActive = computed(() => currentYear - (foundedYear.value || 1947))

const activities = computed(() => {
  if (eventStore.events.length > 0) {
    return eventStore.events.slice(0, 3).map((event) => ({
      title: event.title,
      description: event.description,
      image: event.coverImage || '',
      category: event.category,
      to: '/agenda',
    }))
  }
  return (home.value?.activities ?? []).slice(0, 3).map((activity) => ({
    ...activity,
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
const missionPillars = computed(() => home.value?.mission.pillars ?? [])

const activeTab = ref<'vision' | 'mission'>('vision')
const activePillar = ref(0)

// Counter animation
const counters = ref({ kader: 0, komisariat: 0, alumni: 0, tahun: 0 })
let animationStarted = false

function animateCounters() {
  if (animationStarted) return
  animationStarted = true
  const targets = {
    kader: stats.value?.totalKader && stats.value.totalKader > 0 ? stats.value.totalKader : 2000,
    komisariat: stats.value?.totalKomisariat && stats.value.totalKomisariat > 0 ? stats.value.totalKomisariat : 10,
    alumni: stats.value?.totalAlumni && stats.value.totalAlumni > 0 ? stats.value.totalAlumni : 800,
    tahun: foundedYear.value || 1947,
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

let observer: IntersectionObserver | undefined

function setupCounterObserver() {
  const statsElement = document.getElementById('stats-section')
  if (!statsElement) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) animateCounters()
    },
    { threshold: 0.2 },
  )
  observer.observe(statsElement)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return 'Baru diterbitkan'
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
  carouselTimer = setInterval(nextSlide, 4500)
}

function pauseCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer)
    carouselTimer = null
  }
}

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
  if (galleryPhotos.value.length > 0) startCarousel()
  setupCounterObserver()
  animateCounters()
})

onUnmounted(() => {
  pauseCarousel()
  observer?.disconnect()
})
</script>

<template>
  <div class="bg-ink text-paper">
    <!-- ── 1. Hero Section (Matches referensi.jpg White Card) ─────────────────────── -->
    <section class="relative px-3 pt-3 pb-6 sm:px-6 sm:pt-4 sm:pb-8">
      <div class="mx-auto max-w-7xl">
        <!-- Main White Card -->
        <div class="relative overflow-hidden rounded-[2.5rem] bg-[#ffffff] text-[#000000] shadow-2xl transition-all duration-300 sm:rounded-[3.5rem]">
          <!-- Background subtle grid -->
          <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:32px_32px]" />

          <!-- Starburst Flower icon top left (as in reference) -->
          <div class="absolute left-6 top-8 text-moss sm:left-12 sm:top-12">
            <svg class="h-12 w-12 text-[#155c17] transition-transform duration-700 hover:rotate-90 sm:h-16 sm:w-16" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
              <path d="M32 4v56M4 32h56M12 12l40 40M12 52L52 12M20 6l24 52M6 20l52 24M44 6L20 58M6 44l52-24" />
            </svg>
          </div>

          <!-- Hero Headline Container -->
          <div class="relative px-5 pt-10 pb-4 text-center sm:px-12 sm:pt-14 md:pt-16">
            <h1 class="mx-auto mt-4 max-w-4xl font-display text-3xl font-extrabold tracking-tight text-[#000000] sm:text-5xl md:text-6xl lg:text-[3.85rem] lg:leading-[1.14]">
              Membina Insan Cita
              <br class="hidden sm:inline" />
              Melalui Gagasan & Aksi Nyata
              <!-- 3 green curved lines (as in reference) -->
              <span class="inline-block translate-y-1 align-baseline text-moss sm:translate-y-2">
                <svg class="inline-block h-6 w-8 text-[#155c17] sm:h-10 sm:w-12" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round">
                  <path d="M6 10c6 4 14 6 20 6M6 18c6 4 14 6 20 6M6 26c6 3 14 5 20 5" />
                </svg>
              </span>
            </h1>

            <p class="mx-auto mt-4 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-muted sm:text-[10px]">
              <span class="h-1.5 w-1.5 rounded-full bg-moss" />
              {{ displayEyebrow }} <span class="text-moss">·</span> {{ settings.chapterName || 'Insan Cita' }}
            </p>

            <p class="mx-auto mt-2 max-w-xl text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:text-sm">
              {{ displayTagline || 'Yakin Usaha Sampai · Terbinanya Insan Akademis, Pencipta, dan Pengabdi' }}
            </p>
          </div>

          <!-- 3-Column Hero Content: Left Details - Center Photo - Right Badge -->
          <div class="relative mt-4 grid items-end gap-6 px-6 pb-12 sm:px-12 lg:grid-cols-[1fr_1.35fr_1fr] lg:gap-8">
            <!-- Left Column: Doodle Arrow, Paragraph, Button -->
            <div class="flex flex-col items-start lg:pb-12">
              <!-- Green hand-drawn arrow pointing down-right -->
              <div class="mb-3 text-[#155c17]">
                <svg class="h-10 w-10 text-[#155c17] sm:h-12 sm:w-12" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 14c8 16 18 28 34 32" />
                  <path d="M28 48l20-2-2-20" />
                </svg>
              </div>

              <p class="max-w-xs text-xs font-medium leading-relaxed text-muted sm:text-sm">
                {{ displayDescription || 'Dari wacana intelektual hingga advokasi kemasyarakatan, HMI Insan Cita hadir mencetak kader beriman, berilmu, dan beramal demi terwujudnya masyarakat adil makmur.' }}
              </p>

              <RouterLink
                to="/tentang"
                class="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-[11px] font-bold text-ink shadow-sm transition-all hover:border-ink hover:bg-ink hover:text-white"
              >
                Kenal HMI Lebih Dekat
              </RouterLink>
            </div>

            <!-- Center Column: Realistic Portrait with Curved Oval Backdrop & Pill Button -->
            <div class="relative mx-auto flex w-full max-w-md flex-col items-center">
              <div class="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-paper-deep to-lime/10 shadow-inner">
                <!-- Decorative spiral/doodle behind person -->
                <div class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <svg class="h-28 w-12 text-[#155c17]/50" viewBox="0 0 40 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M20 10c-15 10-15 20 0 30s15 20 0 30-15 20 0 30" />
                  </svg>
                </div>

                <!-- Hero Cutout Image -->
                <img
                  :src="heroImage"
                  :alt="displayTitle"
                  class="relative z-10 h-full w-full object-cover object-top transition duration-700 hover:scale-[1.02]"
                />

                <!-- Floating Dual Action Pill Button at bottom of photo (HMI Actions) -->
                <div class="absolute inset-x-0 bottom-4 z-20 flex justify-center px-2">
                  <div class="flex items-center gap-1.5 rounded-full bg-[#000000]/95 p-1.5 shadow-2xl backdrop-blur-md">
                    <RouterLink
                      to="/daftar"
                      class="rounded-full bg-[#155c17] px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-sm transition-all hover:bg-[#1c7420]"
                    >
                      Daftar LK 1
                    </RouterLink>
                    <RouterLink
                      to="/agenda"
                      class="rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/80 transition-colors hover:text-white"
                    >
                      Lihat Agenda
                    </RouterLink>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: 5 Stars + Years Experience -->
            <div class="flex flex-col items-start lg:items-end lg:pb-12 lg:text-right">
              <!-- 5 Green Stars -->
              <div class="flex items-center gap-1 text-[#155c17]">
                <svg v-for="star in 5" :key="star" class="h-4 w-4 fill-[#155c17]" viewBox="0 0 24 24">
                  <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5z" />
                </svg>
              </div>

              <p class="mt-3 font-display text-4xl font-extrabold tracking-tight text-[#000000] sm:text-5xl">
                {{ yearsActive || 77 }}+ Tahun
              </p>
              <p class="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Kiprah & Pengabdian
              </p>
              <p class="mt-4 max-w-xs text-xs font-medium leading-relaxed text-muted">
                Mencetak kader intelektual, akademisi, dan pemimpin bangsa di seluruh penjuru Indonesia sejak 1947.
              </p>
            </div>
          </div>
        </div>

        <!-- ── Stats Bar Directly Under White Card (Matches referensi.jpg 4 Columns) ──── -->
        <div
          id="stats-section"
          class="mt-4 grid grid-cols-2 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#000000] text-white shadow-xl sm:grid-cols-4 sm:rounded-[2.25rem]"
        >
          <!-- Col 1: 2000+ Kader Aktif -->
          <div class="border-b border-r border-white/10 p-5 sm:border-b-0 sm:p-7">
            <p class="font-display text-3xl font-extrabold tracking-tight text-lime-soft sm:text-4xl md:text-5xl">
              {{ counters.kader || '2000' }}<span class="text-2xl text-lime-soft/70 sm:text-3xl">+</span>
            </p>
            <p class="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
              Kader Aktif
            </p>
          </div>

          <!-- Col 2: 10+ Komisariat -->
          <div class="border-b border-white/10 p-5 sm:border-b-0 sm:border-r sm:p-7">
            <p class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
              {{ counters.komisariat || '10' }}<span class="text-2xl text-white/65 sm:text-3xl">+</span>
            </p>
            <p class="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
              Komisariat & Rayon
            </p>
          </div>

          <!-- Col 3: 800+ Kajian & Pelatihan -->
          <div class="border-r border-white/10 p-5 sm:p-7">
            <p class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
              {{ counters.alumni || '800' }}<span class="text-2xl text-white/65 sm:text-3xl">+</span>
            </p>
            <p class="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
              Kajian & Pelatihan
            </p>
          </div>

          <!-- Col 4: 77+ Tahun Pengabdian -->
          <div class="p-5 sm:p-7">
            <p class="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
              77<span class="text-2xl text-lime-soft/70 sm:text-3xl">+</span>
            </p>
            <p class="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
              Tahun Pengabdian
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 2. About ────────────────────────────────────────────── -->
    <section id="tentang" class="section-pad relative overflow-hidden bg-ink text-paper">
      <div class="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-moss/20 blur-[130px]" />
      <div class="container-wide relative z-10">
        <div class="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
          <div v-reveal class="relative">
            <div class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-forest shadow-2xl">
              <img
                :src="home.about.imageUrl || '/images/cta_student.jpg'"
                :alt="home.about.title || displayTitle"
                class="aspect-[4/5] w-full object-cover transition duration-700 hover:scale-[1.03]"
              />
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/50 to-transparent p-6 pt-20">
                <span class="text-[9px] font-black uppercase tracking-[0.18em] text-lime-soft">{{ home.about.badge || 'Sejak 1947' }}</span>
              </div>
            </div>
            <div class="absolute -bottom-4 -right-3 flex h-24 w-24 items-center justify-center rounded-full border border-lime-soft/30 bg-ink text-center sm:-right-5 sm:h-28 sm:w-28">
              <StarMark :size="42" class="text-lime-soft" />
            </div>
          </div>

          <div v-reveal="{ delay: 100 }">
            <SectionHeading
              :eyebrow="home.about.sectionLabel || 'Tentang Kami'"
              :title="home.about.title || 'HMI Komisariat'"
              :accent="home.about.highlight"
              theme="dark"
            />

            <div class="mt-7 space-y-4">
              <p
                v-for="(paragraph, index) in home.about.paragraphs"
                :key="index"
                class="max-w-xl text-sm font-medium leading-relaxed text-white/55 sm:text-base"
              >
                {{ paragraph }}
              </p>
            </div>

            <div class="mt-8 flex flex-wrap items-center gap-3">
              <RouterLink to="/tentang" class="btn btn-lime">
                Selengkapnya
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </RouterLink>
              <RouterLink to="/tentang#sejarah" class="btn btn-outline-light">
                Sejarah HMI
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 3. Vision / Mission ─────────────────────────────────── -->
    <section class="section-pad bg-paper text-ink">
      <div class="container-wide">
        <div class="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Arah gerakan"
            title="Visi &"
            accent="misi."
            description="Landasan berpikir dan langkah kerja HMI Insan Cita."
          />
          <div class="flex gap-2">
            <button
              type="button"
              class="chip"
              :class="activeTab === 'vision' ? 'chip-active' : ''"
              @click="activeTab = 'vision'"
            >
              Visi
            </button>
            <button
              type="button"
              class="chip"
              :class="activeTab === 'mission' ? 'chip-active' : ''"
              @click="activeTab = 'mission'"
            >
              Misi
            </button>
          </div>
        </div>

        <div class="mt-10">
          <Transition name="tab" mode="out-in">
            <div v-if="activeTab === 'vision'" key="vision" class="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div class="card-ink relative overflow-hidden p-7 sm:p-10">
                <div class="absolute inset-0 bg-grid-dark opacity-50" />
                <span class="relative block font-display text-6xl leading-none text-lime-soft/40">“</span>
                <blockquote class="relative mt-2 font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                  {{ home.vision.quote || 'Visi HMI Insan Cita.' }}
                </blockquote>
                <p v-if="home.vision.description" class="relative mt-7 max-w-xl text-sm font-medium leading-relaxed text-white/65">
                  {{ home.vision.description }}
                </p>
                <StarMark :size="34" class="relative mt-8 text-lime-soft" />
              </div>

              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div v-if="visionPhotos.length" class="grid grid-cols-2 gap-3">
                  <div
                    v-for="(photo, index) in visionPhotos.slice(0, 4)"
                    :key="photo + index"
                    class="relative overflow-hidden rounded-[1.3rem] border border-line"
                    :class="index === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'"
                  >
                    <img
                      :src="photo"
                      :alt="`Dokumentasi HMI ${index + 1}`"
                      class="h-full w-full object-cover grayscale transition duration-500 hover:scale-105 hover:grayscale-0"
                    />
                  </div>
                </div>
                <div v-else class="flex min-h-[clamp(10rem,24svh,13rem)] flex-col justify-between rounded-[1.3rem] border border-line bg-white p-6">
                  <span class="eyebrow">Prinsip</span>
                  <p class="font-display text-xl font-semibold leading-tight tracking-tight text-ink">
                    Beriman, berilmu, dan beramal untuk kemaslahatan umat.
                  </p>
                </div>
              </div>
            </div>

            <div v-else key="mission" class="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
              <div class="flex flex-col justify-between rounded-[1.75rem] bg-lime p-7 text-white sm:p-9">
                <div>
                  <StarMark :size="36" class="text-white" />
                  <h3 class="display-md mt-8 text-3xl">Langkah<br />perjuangan.</h3>
                </div>
                <p v-if="home.mission.intro" class="mt-8 text-sm font-semibold leading-relaxed text-white/85">
                  {{ home.mission.intro }}
                </p>
              </div>

              <div>
                <div v-if="missionPillars.length" class="border-t border-line">
                  <div v-for="(pillar, index) in missionPillars" :key="pillar.title" class="border-b border-line">
                    <button
                      type="button"
                      class="flex w-full items-start gap-4 py-5 text-left"
                      @click="activePillar = activePillar === index ? -1 : index"
                    >
                      <span class="mt-1 font-display text-xs font-bold text-moss">{{ String(index + 1).padStart(2, '0') }}</span>
                      <span class="flex-1">
                        <span class="block font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">{{ pillar.title }}</span>
                        <span
                          class="grid transition-all duration-300"
                          :class="activePillar === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
                        >
                          <span class="overflow-hidden">
                            <span class="mt-2 block max-w-2xl text-sm font-medium leading-relaxed text-muted">{{ pillar.description }}</span>
                          </span>
                        </span>
                      </span>
                      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors" :class="activePillar === index ? 'bg-lime border-lime text-white' : ''">
                        <svg class="h-3.5 w-3.5 transition-transform" :class="activePillar === index ? 'rotate-45' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
                <p v-else class="text-sm font-medium leading-relaxed text-muted">
                  Butir-butir misi belum tersedia.
                </p>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </section>

    <!-- ── 4. Activities ───────────────────────────────────────── -->
    <section class="section-pad bg-paper-deep text-ink">
      <div class="container-wide">
        <div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Agenda"
            title="Yang sedang"
            accent="bergerak."
            description="Ruang tumbuh kader melalui pelatihan, kajian, dan pengabdian."
          />
          <RouterLink to="/agenda" class="link-arrow shrink-0 text-ink">
            Lihat semua agenda
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>
        </div>

        <div v-if="activities.length" class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="(activity, index) in activities"
            :key="activity.title + index"
            v-reveal="{ delay: index * 70 }"
            class="group flex flex-col overflow-hidden rounded-[1.6rem] border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-ink/30 hover:shadow-soft"
          >
            <div class="relative h-48 overflow-hidden bg-forest">
              <img
                v-if="activity.image"
                :src="activity.image"
                :alt="activity.title"
                class="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
              />
              <div v-else class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-forest to-ink">
                <div class="absolute inset-0 bg-grid-dark opacity-60" />
                <StarMark :size="48" class="relative text-lime-soft/75" />
              </div>
              <span class="absolute left-3 top-3 rounded-full bg-lime px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white">
                {{ activity.category }}
              </span>
            </div>
            <div class="flex flex-1 flex-col p-5">
              <h3 class="font-display text-lg font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-moss">
                {{ activity.title }}
              </h3>
              <p class="mt-2 line-clamp-2 flex-1 text-xs font-medium leading-relaxed text-muted">{{ activity.description }}</p>
              <RouterLink :to="activity.to || '/agenda'" class="mt-5 flex items-center justify-between border-t border-line pt-4 text-[9px] font-black uppercase tracking-[0.14em] text-ink/55 transition-colors hover:text-ink">
                Lihat kegiatan
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-paper transition-colors group-hover:bg-lime group-hover:text-white">
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </RouterLink>
            </div>
          </article>
        </div>

        <EmptyState
          v-else
          class="mt-10"
          title="Belum ada agenda"
          description="Program dan kegiatan yang telah dijadwalkan akan tampil di sini."
        >
          <RouterLink to="/agenda" class="btn btn-ink mt-2">Buka halaman agenda</RouterLink>
        </EmptyState>
      </div>
    </section>

    <!-- ── 5. Committees ───────────────────────────────────────── -->
    <section v-if="committees.length" class="relative overflow-hidden bg-lime py-12 text-white sm:py-16">
      <div class="pointer-events-none absolute inset-0 bg-grid-light opacity-30" />
      <div class="container-wide relative z-10">
        <div class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span class="eyebrow eyebrow-light">Struktur fungsional</span>
            <h2 class="display-md mt-4">Bidang & departemen<span class="text-white/60">.</span></h2>
          </div>
          <p class="max-w-xs text-xs font-bold leading-relaxed text-white/90">
            Unit kerja yang menopang gerakan kaderisasi dan pengabdian komisariat.
          </p>
        </div>

        <div class="mt-8 flex flex-wrap gap-2.5">
          <div
            v-for="(committee, index) in committees"
            :key="committee.name"
            v-reveal="{ delay: index * 45 }"
            class="group flex items-center gap-3 rounded-full border border-white/25 bg-transparent px-3 py-2 transition-colors hover:border-white hover:bg-ink hover:text-lime-soft"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full text-[9px] font-black text-white"
              :style="{ backgroundColor: committee.color || '#155c17' }"
            >
              {{ committee.abbreviation }}
            </span>
            <span class="text-[10px] font-black uppercase tracking-[0.1em]">{{ committee.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 6. Gallery ──────────────────────────────────────────── -->
    <section class="section-pad overflow-hidden bg-ink text-paper">
      <div class="container-wide">
        <div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Dokumentasi"
            title="Rekam jejak"
            accent="perkaderan."
            description="Momen, proses, dan manusia di balik gerakan HMI Insan Cita."
            theme="dark"
          />
          <RouterLink to="/galeri" class="link-arrow shrink-0 text-lime-soft">
            Buka galeri
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>
        </div>

        <div v-if="galleryPhotos.length" class="mt-10">
          <div
            class="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink-soft"
            @mouseenter="pauseCarousel"
            @mouseleave="startCarousel"
          >
            <div class="relative aspect-[4/3] sm:aspect-[16/8]">
              <TransitionGroup name="photo">
                <img
                  v-for="(photo, index) in galleryPhotos"
                  v-show="carouselIndex === index"
                  :key="photo + index"
                  :src="photo"
                  :alt="`Dokumentasi HMI ${index + 1}`"
                  class="absolute inset-0 h-full w-full object-cover"
                />
              </TransitionGroup>
              <div class="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />

              <div class="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 sm:inset-x-6 sm:bottom-6">
                <div>
                  <p class="text-[8px] font-black uppercase tracking-[0.2em] text-lime-soft">Galeri kegiatan</p>
                  <p class="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    HMI Komisariat Insan Cita
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="hidden font-display text-sm font-bold text-white/60 sm:block">
                    {{ String(carouselIndex + 1).padStart(2, '0') }} / {{ String(galleryPhotos.length).padStart(2, '0') }}
                  </span>
                  <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-lime hover:bg-lime hover:text-white"
                    aria-label="Foto sebelumnya"
                    @click="prevSlide"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-lime hover:bg-lime hover:text-white"
                    aria-label="Foto berikutnya"
                    @click="nextSlide"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
            <button
              v-for="(photo, index) in galleryPhotos.slice(0, 6)"
              :key="photo + index"
              type="button"
              class="relative aspect-[4/3] overflow-hidden rounded-xl border transition-all"
              :class="carouselIndex === index ? 'border-lime opacity-100' : 'border-white/10 opacity-45 hover:opacity-80'"
              :aria-label="`Lihat foto ${index + 1}`"
              @click="carouselIndex = index"
            >
              <img :src="photo" alt="" class="h-full w-full object-cover" />
            </button>
          </div>
        </div>

        <EmptyState
          v-else
          theme="dark"
          title="Dokumentasi belum tersedia"
          description="Arsip foto dan video kegiatan akan dipublikasikan setelah diunggah."
        >
          <RouterLink to="/galeri" class="btn btn-outline-light mt-2">Buka halaman galeri</RouterLink>
        </EmptyState>
      </div>
    </section>

    <!-- ── 7. News ─────────────────────────────────────────────── -->
    <section class="section-pad bg-paper text-ink">
      <div class="container-wide">
        <div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Berita"
            title="Catatan dari"
            accent="Insan Cita."
            description="Berita, opini, dan pengumuman terbaru dari komisariat."
          />
          <RouterLink to="/berita" class="link-arrow shrink-0 text-ink">
            Semua berita
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>
        </div>

        <div v-if="featuredArticle" class="mt-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <RouterLink
            :to="`/berita/${featuredArticle.slug}`"
            class="group relative flex min-h-[clamp(20rem,50svh,30rem)] flex-col justify-end overflow-hidden rounded-[1.75rem] border border-line bg-forest p-6 text-white sm:p-8"
          >
            <img
              v-if="featuredArticle.coverImage"
              :src="featuredArticle.coverImage"
              :alt="featuredArticle.title"
              class="absolute inset-0 h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
            />
            <div v-else class="absolute inset-0 bg-gradient-to-br from-forest via-moss to-ink">
              <div class="absolute inset-0 bg-grid-dark opacity-60" />
              <StarMark :size="90" class="absolute right-8 top-8 text-lime-soft/60" />
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
            <div class="relative">
              <div class="flex items-center gap-2">
                <span class="rounded-full bg-lime px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white">{{ featuredArticle.category }}</span>
                <span class="text-[9px] font-bold uppercase tracking-[0.12em] text-white/55">{{ formatDate(featuredArticle.publishedAt) }}</span>
              </div>
              <h3 class="mt-4 max-w-2xl font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {{ featuredArticle.title }}
              </h3>
              <p class="mt-3 line-clamp-2 max-w-xl text-sm font-medium leading-relaxed text-white/60">{{ featuredArticle.excerpt }}</p>
              <span class="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-lime-soft">
                Baca selengkapnya
                <svg class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </div>
          </RouterLink>

          <div class="flex flex-col gap-4">
            <RouterLink
              v-for="article in remainingArticles"
              :key="article.id"
              :to="`/berita/${article.slug}`"
              class="group flex flex-1 gap-4 overflow-hidden rounded-[1.4rem] border border-line bg-white p-3 transition duration-300 hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-soft sm:p-4"
            >
              <div class="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1rem] bg-forest sm:h-28 sm:w-32">
                <img
                  v-if="article.coverImage"
                  :src="article.coverImage"
                  :alt="article.title"
                  class="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest to-ink">
                  <StarMark :size="24" class="text-lime-soft/70" />
                </div>
              </div>
              <div class="flex min-w-0 flex-1 flex-col justify-center">
                <div class="flex items-center gap-2">
                  <span class="text-[8px] font-black uppercase tracking-[0.14em] text-moss">{{ article.category }}</span>
                  <span class="h-0.5 w-0.5 rounded-full bg-muted" />
                  <span class="text-[8px] font-bold uppercase tracking-[0.08em] text-muted">{{ formatDate(article.publishedAt) }}</span>
                </div>
                <h3 class="mt-2 line-clamp-2 font-display text-base font-semibold leading-snug tracking-tight text-ink group-hover:text-moss">
                  {{ article.title }}
                </h3>
                <p class="mt-1.5 line-clamp-1 text-[11px] font-medium text-muted">{{ article.excerpt }}</p>
              </div>
            </RouterLink>

            <RouterLink to="/berita" class="flex items-center justify-between rounded-[1.4rem] border border-dashed border-ink/20 p-5 transition-colors hover:border-ink hover:bg-white">
              <span class="text-[9px] font-black uppercase tracking-[0.16em] text-ink/55">Lihat arsip berita</span>
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-lime-soft">
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </RouterLink>
          </div>
        </div>

        <EmptyState
          v-else
          class="mt-10"
          title="Belum ada berita terbaru"
          description="Berita dan kabar kegiatan yang sudah dipublikasikan akan tampil di sini."
        >
          <RouterLink to="/berita" class="btn btn-ink mt-2">Buka halaman berita</RouterLink>
        </EmptyState>
      </div>
    </section>

    <!-- ── 8. Closing CTA ──────────────────────────────────────── -->
    <section class="relative overflow-hidden bg-ink py-[clamp(3rem,8svh,6rem)] text-paper">
      <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-50" />
      <div class="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/20 blur-[130px]" />
      <div class="container-wide relative z-10 text-center">
        <StarMark :size="42" class="mx-auto animate-spin-slow text-lime-soft" />
        <h2 class="display-lg mx-auto mt-8 max-w-4xl text-white">
          Siap menjadi bagian
          <span class="text-lime-soft">dari gerakan?</span>
        </h2>
        <p class="mx-auto mt-5 max-w-xl text-sm font-medium leading-relaxed text-white/60">
          Temukan ruang tumbuh, jaringan, dan pengalaman kepemimpinan bersama HMI Komisariat Insan Cita.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <RouterLink to="/daftar" class="btn btn-lime">
            Daftar LK 1
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>
          <RouterLink to="/kontak" class="btn btn-outline-light">Tanya dulu</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tab-enter-active,
.tab-leave-active {
  transition: opacity 220ms ease, transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.tab-enter-from,
.tab-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.photo-enter-active,
.photo-leave-active {
  transition: opacity 600ms ease;
}
.photo-enter-from,
.photo-leave-to {
  opacity: 0;
}
</style>
