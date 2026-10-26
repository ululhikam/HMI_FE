<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/articles'
import { useSiteStore } from '@/stores/site'
import { useNewsletterStore } from '@/stores/newsletter'
import EmptyState from '@/components/ui/EmptyState.vue'
import StarMark from '@/components/ui/StarMark.vue'
import type { StreamingItem } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useArticleStore()
const siteStore = useSiteStore()
const newsletter = useNewsletterStore()

const sortMode = ref<'terbaru' | 'populer'>('terbaru')
const savedOnly = ref(false)
const visibleCount = ref(6)
const sidebarEmail = ref('')
const bannerEmail = ref('')
const sidebarSubscribed = ref(false)
const bannerSubscribed = ref(false)

const streamingStatusLabel: Record<StreamingItem['status'], string> = {
  upcoming: 'Akan datang',
  live: 'Live sekarang',
  scheduled: 'Terjadwal',
}

const publishedCount = computed(() => store.publishedArticles.length)
const categoryCount = computed(() => store.categories.length - 1)
const hasActiveFilters = computed(
  () => Boolean(store.searchQuery.trim()) || store.selectedCategory !== 'Semua' || savedOnly.value,
)

const filteredFeed = computed(() => {
  let result = [...store.filteredArticles]
  if (savedOnly.value) {
    result = result.filter((article) => store.bookmarkedSlugs.includes(article.slug))
  }
  if (sortMode.value === 'populer') {
    return result.sort((a, b) => b.views - a.views)
  }
  return result.sort(
    (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime(),
  )
})

const visibleFeedArticles = computed(() => filteredFeed.value.slice(0, visibleCount.value))
const remainingCount = computed(() => Math.max(0, filteredFeed.value.length - visibleCount.value))
const hasMore = computed(() => remainingCount.value > 0)
const feedHeading = computed(() => {
  if (savedOnly.value) return 'Berita disimpan'
  if (store.searchQuery.trim()) return `“${store.searchQuery.trim()}”`
  if (store.selectedCategory !== 'Semua') return store.selectedCategory
  if (sortMode.value === 'populer') return 'Paling dibaca'
  return 'Terbaru'
})

watch([() => store.searchQuery, () => store.selectedCategory, sortMode, savedOnly], () => {
  visibleCount.value = 6
})

const spotlightStories = computed(() => {
  if (store.topStories.length) return store.topStories
  return store.trendingArticles.filter((article) => article.id !== store.heroArticle?.id).slice(0, 5)
})

function formatDate(iso: string | null | undefined) {
  if (!iso) return 'Baru diterbitkan'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(name?: string) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatViews(views: number) {
  return views.toLocaleString('id-ID')
}

function formatStreamSchedule(iso: string) {
  const date = new Date(iso)
  const day = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return `${day} • ${time} WIB`
}

function toggleBookmark(slug: string) {
  void store.toggleBookmark(slug)
}

function clearSearch() {
  store.searchQuery = ''
  if (route.query.q) {
    const query = { ...route.query }
    delete query.q
    void router.replace({ query })
  }
}

function setCategory(category: string) {
  store.selectedCategory = category
  const query = { ...route.query }
  if (category === 'Semua') delete query.category
  else query.category = category
  void router.replace({ query })
}

function resetFilters() {
  store.searchQuery = ''
  store.selectedCategory = 'Semua'
  savedOnly.value = false
  sortMode.value = 'terbaru'
  if (route.query.q || route.query.category) {
    const query = { ...route.query }
    delete query.q
    delete query.category
    void router.replace({ query })
  }
}

function loadMore() {
  visibleCount.value += 6
}

async function subscribeSidebar() {
  sidebarSubscribed.value = false
  if (await newsletter.subscribe(sidebarEmail.value, 'news-page')) {
    sidebarSubscribed.value = true
    sidebarEmail.value = ''
  }
}

async function subscribeBanner() {
  bannerSubscribed.value = false
  if (await newsletter.subscribe(bannerEmail.value, 'news-page')) {
    bannerSubscribed.value = true
    bannerEmail.value = ''
  }
}

// Sinkronkan pencarian dan rubrik dari URL agar tautan tag/kategori tetap bekerja.
watch(
  () => route.query.q,
  (query) => {
    store.searchQuery = typeof query === 'string' ? query : ''
  },
  { immediate: true },
)

watch(
  () => route.query.category,
  (query) => {
    const category = typeof query === 'string' ? query : 'Semua'
    store.selectedCategory = store.categories.includes(category as (typeof store.categories)[number])
      ? category
      : 'Semua'
  },
  { immediate: true },
)

onMounted(() => {
  void store.fetchPublished()
  void siteStore.fetchLiveStreams()
})
</script>

<template>
  <div class="bg-paper text-ink">
    <!-- Hero -->
    <section class="hero-compact relative overflow-hidden bg-ink text-paper">
      <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
      <div class="pointer-events-none absolute -right-32 top-0 h-[420px] w-[420px] rounded-full bg-moss/25 blur-[130px]" />
      <div class="container-wide relative z-10">
        <div class="flex items-center justify-between">
          <span class="eyebrow eyebrow-lime">HMI Newsroom</span>
          <StarMark :size="26" class="animate-spin-slow text-lime-soft" />
        </div>

        <div class="hero-gap grid gap-[clamp(1.5rem,4vw,2.5rem)] lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 class="hero-title max-w-4xl text-balance text-white">
              Kabar dari
              <span class="text-lime-soft">Insan Cita.</span>
            </h1>
            <p class="hero-copy-gap max-w-xl text-sm font-medium leading-relaxed text-white/55 sm:text-base">
              Berita, opini, rilis pers, dan catatan kegiatan dari HMI Komisariat Insan Cita.
            </p>
            <div class="mt-5 flex flex-wrap gap-2">
              <a href="#arsip" class="btn btn-lime">
                Telusuri arsip
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M12 5v14M5 12h14" stroke-linecap="round" />
                </svg>
              </a>
              <RouterLink to="/agenda" class="btn btn-outline-light">Lihat agenda</RouterLink>
            </div>
          </div>

          <div class="hidden grid-cols-3 gap-2 sm:grid lg:ml-auto lg:w-full lg:max-w-sm">
            <div class="rounded-[1.2rem] border border-white/10 bg-white/5 p-3 sm:p-4">
              <p class="font-display text-2xl font-bold leading-none text-lime-soft sm:text-3xl">{{ publishedCount }}</p>
              <p class="mt-2 text-[8px] font-black uppercase tracking-[0.14em] text-white/60">Berita</p>
            </div>
            <div class="rounded-[1.2rem] border border-white/10 bg-white/5 p-3 sm:p-4">
              <p class="font-display text-2xl font-bold leading-none text-white sm:text-3xl">{{ categoryCount }}</p>
              <p class="mt-2 text-[8px] font-black uppercase tracking-[0.14em] text-white/60">Rubrik</p>
            </div>
            <div class="rounded-[1.2rem] border border-white/10 bg-white/5 p-3 sm:p-4">
              <p class="font-display text-2xl font-bold leading-none text-white sm:text-3xl">{{ store.bookmarkedSlugs.length }}</p>
              <p class="mt-2 text-[8px] font-black uppercase tracking-[0.14em] text-white/60">Disimpan</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pencarian, rubrik, dan urutan -->
    <div id="arsip" class="sticky top-[var(--nav-offset)] z-30 scroll-mt-40 border-b border-line bg-paper/95 backdrop-blur-xl">
      <div class="container-wide py-2.5 sm:py-3">
        <div class="flex items-center gap-2">
          <label class="flex min-w-0 flex-1 items-center gap-2.5 rounded-full border border-line bg-white px-3.5 py-1.5 transition-colors focus-within:border-ink/40 sm:px-4">
            <svg class="h-4 w-4 flex-shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="10.5" cy="10.5" r="7" />
              <path d="M16 16l5 5" stroke-linecap="round" />
            </svg>
            <span class="sr-only">Cari berita</span>
            <input
              v-model="store.searchQuery"
              type="search"
              placeholder="Cari berita atau topik..."
              class="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold text-ink placeholder:text-muted focus:outline-none"
            />
            <button
              v-if="store.searchQuery"
              type="button"
              class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink"
              aria-label="Bersihkan pencarian"
              @click="clearSearch"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
              </svg>
            </button>
          </label>

          <div class="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              class="flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[8px] font-black uppercase tracking-[0.08em] transition-colors sm:px-3 sm:text-[9px]"
              :class="savedOnly ? 'border-lime bg-lime text-white' : 'border-line bg-white text-muted hover:border-ink hover:text-ink'"
              :aria-pressed="savedOnly"
              title="Tampilkan berita yang disimpan"
              @click="savedOnly = !savedOnly"
            >
              <svg class="h-3.5 w-3.5" :fill="savedOnly ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="hidden sm:inline">Disimpan</span>
              <span>{{ store.bookmarkedSlugs.length }}</span>
            </button>
            <span class="hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted sm:inline">Urutkan</span>
            <div class="flex rounded-full border border-line bg-white p-0.5">
              <button
                type="button"
                class="rounded-full px-2.5 py-2 text-[8px] font-black uppercase tracking-[0.08em] transition-colors sm:px-3 sm:text-[9px] sm:tracking-[0.1em]"
                :class="sortMode === 'terbaru' ? 'bg-ink text-lime-soft' : 'text-muted hover:text-ink'"
                @click="sortMode = 'terbaru'"
              >
                Terbaru
              </button>
              <button
                type="button"
                class="rounded-full px-2.5 py-2 text-[8px] font-black uppercase tracking-[0.08em] transition-colors sm:px-3 sm:text-[9px] sm:tracking-[0.1em]"
                :class="sortMode === 'populer' ? 'bg-ink text-lime-soft' : 'text-muted hover:text-ink'"
                @click="sortMode = 'populer'"
              >
                Populer
              </button>
            </div>
          </div>
        </div>

        <div class="mt-2 flex items-center justify-between gap-3">
          <div class="hide-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5">
            <span class="mr-1 hidden flex-shrink-0 text-[8px] font-black uppercase tracking-[0.16em] text-muted sm:block">Rubrik</span>
            <button
              v-for="category in store.categories"
              :key="category"
              type="button"
              class="chip flex-shrink-0"
              :class="store.selectedCategory === category ? 'chip-active' : ''"
              @click="setCategory(category)"
            >
              {{ category }}
            </button>
          </div>
          <div class="flex flex-shrink-0 items-center gap-2 text-[9px] font-bold uppercase tracking-[0.1em] text-muted" aria-live="polite">
            <span>{{ filteredFeed.length }} berita</span>
            <button v-if="hasActiveFilters" type="button" class="font-black text-moss transition-colors hover:text-ink" @click="resetFilters">
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container-wide py-[clamp(2.25rem,6svh,4rem)]">
      <!-- Featured -->
      <section v-if="store.heroArticle && !hasActiveFilters" class="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <RouterLink
          :to="`/berita/${store.heroArticle.slug}`"
          class="group relative flex min-h-[clamp(22rem,52svh,34rem)] flex-col justify-end overflow-hidden rounded-[2rem] border border-line bg-forest p-6 text-white sm:p-9"
        >
          <img
            v-if="store.heroArticle.coverImage"
            :src="store.heroArticle.coverImage"
            :alt="store.heroArticle.title"
            class="absolute inset-0 h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
          />
          <div v-else class="absolute inset-0 bg-gradient-to-br from-forest via-moss to-ink">
            <div class="absolute inset-0 bg-grid-dark opacity-60" />
            <StarMark :size="110" class="absolute right-8 top-8 text-lime-soft/30" />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent" />

          <div class="relative z-10">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-lime px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white">Sorotan</span>
              <span class="rounded-full border border-white/20 px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/65">{{ store.heroArticle.category }}</span>
            </div>
            <h2 class="mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {{ store.heroArticle.title }}
            </h2>
            <p class="mt-4 line-clamp-2 max-w-2xl text-sm font-medium leading-relaxed text-white/60">{{ store.heroArticle.excerpt }}</p>

            <div class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4">
              <div class="flex items-center gap-3">
                <span class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-[10px] font-black text-lime-soft">
                  <img v-if="store.heroArticle.authorAvatar" :src="store.heroArticle.authorAvatar" :alt="store.heroArticle.author" class="h-full w-full object-cover" />
                  <span v-else>{{ initials(store.heroArticle.author) }}</span>
                </span>
                <div>
                  <p class="text-[10px] font-extrabold text-white/85">{{ store.heroArticle.author }}</p>
                  <p class="mt-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white/60">{{ formatDate(store.heroArticle.publishedAt) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.1em] text-white/65">
                <span>{{ formatViews(store.heroArticle.views) }} dibaca</span>
                <button type="button" class="text-white/65 transition-colors hover:text-lime-soft" @click.prevent.stop="toggleBookmark(store.heroArticle.slug)" aria-label="Simpan berita">
                  <svg class="h-4 w-4" :fill="store.isBookmarked(store.heroArticle.slug) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </RouterLink>

        <!-- Side stories -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between px-1 pb-1">
            <h2 class="text-[9px] font-black uppercase tracking-[0.16em] text-muted">Berita utama lainnya</h2>
            <span class="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">Terbaru</span>
          </div>
          <RouterLink
            v-for="(item, index) in store.featuredSideArticles.slice(0, 4)"
            :key="item.id"
            :to="`/berita/${item.slug}`"
            v-reveal="{ delay: index * 60 }"
            class="group flex flex-1 gap-4 rounded-[1.35rem] border border-line bg-white p-3 transition duration-300 hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-soft"
          >
            <div class="flex min-w-0 flex-1 flex-col justify-between py-1">
              <div>
                <div class="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.12em]">
                  <span class="text-moss">{{ item.category }}</span>
                  <span class="h-0.5 w-0.5 rounded-full bg-muted" />
                  <span class="font-bold text-muted">{{ formatDate(item.publishedAt) }}</span>
                </div>
                <h3 class="mt-2 line-clamp-2 font-display text-base font-semibold leading-snug tracking-tight text-ink group-hover:text-moss">{{ item.title }}</h3>
              </div>
              <p class="mt-2 text-[9px] font-bold uppercase tracking-[0.08em] text-muted">{{ formatViews(item.views) }} dibaca</p>
            </div>
            <div class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-[1rem] bg-forest sm:h-28 sm:w-28">
              <img v-if="item.coverImage" :src="item.coverImage" :alt="item.title" class="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" />
              <span v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest to-ink">
                <StarMark :size="22" class="text-lime-soft/70" />
              </span>
            </div>
          </RouterLink>

          <div v-if="!store.featuredSideArticles.length" class="flex flex-1 items-center justify-center rounded-[1.35rem] border border-dashed border-line p-8 text-center text-xs font-semibold text-muted">
            Belum ada berita utama lainnya.
          </div>
        </div>
      </section>

      <!-- Spotlight strip -->
      <section v-if="spotlightStories.length && !hasActiveFilters" class="mt-12">
        <div class="flex items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <span class="eyebrow">Pilihan editor</span>
            <h2 class="display-md mt-4">Berita pilihan<span class="text-moss">.</span></h2>
          </div>
          <span class="hidden text-[9px] font-bold uppercase tracking-[0.14em] text-muted sm:block">Isu & liputan</span>
        </div>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RouterLink
            v-for="(item, index) in spotlightStories.slice(0, 4)"
            :key="item.id"
            :to="`/berita/${item.slug}`"
            v-reveal="{ delay: index * 55 }"
            class="group flex flex-col overflow-hidden rounded-[1.35rem] border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-ink/30 hover:shadow-soft"
          >
            <div class="relative aspect-[16/10] overflow-hidden bg-forest">
              <img v-if="item.coverImage" :src="item.coverImage" :alt="item.title" class="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
              <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest to-ink">
                <StarMark :size="34" class="text-lime-soft/70" />
              </div>
              <span class="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-ink backdrop-blur">{{ item.category }}</span>
            </div>
            <div class="flex flex-1 flex-col p-4">
              <h3 class="line-clamp-2 font-display text-sm font-semibold leading-snug tracking-tight text-ink group-hover:text-moss">{{ item.title }}</h3>
              <div class="mt-auto flex items-center justify-between pt-4 text-[8px] font-bold uppercase tracking-[0.1em] text-muted">
                <span>{{ formatDate(item.publishedAt) }}</span>
                <span>{{ formatViews(item.views) }} ×</span>
              </div>
            </div>
          </RouterLink>
        </div>
      </section>

      <!-- Feed + sidebar -->
      <section class="mt-10 grid gap-10 sm:mt-14" :class="hasActiveFilters ? '' : 'lg:grid-cols-[1fr_340px]'">
        <div>
          <div class="flex flex-col justify-between gap-4 border-b border-line pb-4 sm:flex-row sm:items-end">
            <div>
              <span class="eyebrow">{{ hasActiveFilters ? 'Hasil filter' : 'Arsip berita' }}</span>
              <h2 class="display-md mt-4">
                {{ feedHeading }}<span class="text-moss">.</span>
              </h2>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
              <span>{{ filteredFeed.length }} berita</span>
              <span class="h-0.5 w-0.5 rounded-full bg-muted" />
              <span>{{ sortMode === 'populer' ? 'Paling dibaca' : 'Terbaru' }}</span>
            </div>
          </div>

          <div v-if="store.isLoading && !store.publishedArticles.length" class="mt-5 flex min-h-[clamp(12rem,30svh,20rem)] items-center justify-center rounded-[1.4rem] border border-dashed border-line bg-white/60">
            <div class="text-center">
              <span class="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-line border-t-moss" />
              <p class="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Memuat berita...</p>
            </div>
          </div>

          <div v-else-if="visibleFeedArticles.length" class="mt-5 space-y-3">
            <article
              v-for="(article, index) in visibleFeedArticles"
              :key="article.id"
              v-reveal="{ delay: index * 35 }"
              class="group flex flex-col gap-4 rounded-[1.4rem] border border-line bg-white p-4 transition duration-300 hover:border-ink/30 hover:shadow-soft sm:flex-row sm:p-5"
            >
              <div class="order-2 flex flex-1 flex-col justify-between sm:order-1">
                <div>
                  <div class="flex flex-wrap items-center gap-2 text-[8px] font-black uppercase tracking-[0.1em] text-muted">
                    <span class="rounded-full bg-paper px-2 py-1 text-moss">{{ article.category }}</span>
                    <span>{{ formatDate(article.publishedAt) }}</span>
                    <span v-if="article.readTime">· {{ article.readTime }}</span>
                  </div>
                  <RouterLink :to="`/berita/${article.slug}`">
                    <h3 class="mt-3 font-display text-lg font-semibold leading-snug tracking-tight text-ink group-hover:text-moss sm:text-xl">{{ article.title }}</h3>
                  </RouterLink>
                  <p class="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-muted">{{ article.excerpt }}</p>
                </div>
                <div class="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-paper text-[8px] font-black text-moss">
                      <img v-if="article.authorAvatar" :src="article.authorAvatar" :alt="article.author" class="h-full w-full object-cover" />
                      <span v-else>{{ initials(article.author) }}</span>
                    </span>
                    <span class="text-[9px] font-bold text-ink/60">{{ article.author }}</span>
                    <span class="text-[9px] font-semibold text-muted">· {{ formatViews(article.views) }} dibaca</span>
                  </div>
                  <button type="button" class="text-muted transition-colors hover:text-moss" :aria-label="store.isBookmarked(article.slug) ? 'Hapus simpanan' : 'Simpan berita'" @click="toggleBookmark(article.slug)">
                    <svg class="h-4 w-4" :fill="store.isBookmarked(article.slug) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <RouterLink :to="`/berita/${article.slug}`" class="order-1 h-40 w-full flex-shrink-0 overflow-hidden rounded-[1rem] bg-forest sm:order-2 sm:h-36 sm:w-48">
                <img v-if="article.coverImage" :src="article.coverImage" :alt="article.title" class="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" />
                <span v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest to-ink">
                  <StarMark :size="28" class="text-lime-soft/70" />
                </span>
              </RouterLink>
            </article>

            <div v-if="hasMore" class="flex flex-col items-center gap-2 pt-3">
              <button type="button" class="btn btn-outline-dark" @click="loadMore">
                Muat {{ Math.min(6, remainingCount) }} berita lagi
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M12 5v14M5 12h14" stroke-linecap="round" />
                </svg>
              </button>
              <span class="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
                {{ visibleFeedArticles.length }} dari {{ filteredFeed.length }} berita
              </span>
            </div>
            <p v-else class="pt-3 text-center text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
              Semua berita sudah tampil
            </p>
          </div>

          <EmptyState
            v-else
            class="mt-5"
            :title="savedOnly ? 'Belum ada berita disimpan' : 'Berita tidak ditemukan'"
            :description="savedOnly ? 'Simpan berita dari kartu atau halaman detail untuk membacanya kembali di sini.' : 'Tidak ada berita yang sesuai dengan pencarian atau rubrik yang dipilih.'"
          >
            <button type="button" class="btn btn-ink mt-2" @click="resetFilters">{{ savedOnly ? 'Tampilkan semua berita' : 'Reset pencarian' }}</button>
          </EmptyState>
        </div>

        <!-- Sidebar -->
        <aside v-if="!hasActiveFilters" class="space-y-4">
          <div class="rounded-[1.4rem] border border-line bg-white p-5">
            <div class="flex items-center justify-between border-b border-line pb-3">
              <h3 class="text-[9px] font-black uppercase tracking-[0.14em] text-ink">Jadwal streaming</h3>
              <span class="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-moss">
                <span class="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
                Live
              </span>
            </div>
            <div class="mt-4 space-y-2.5">
              <div v-for="event in siteStore.liveStreams" :key="event.id" class="rounded-[1rem] border border-line bg-paper p-3.5 transition-colors hover:border-ink/25">
                <div class="flex items-center justify-between gap-2 text-[8px] font-black uppercase tracking-[0.08em]">
                  <span class="text-moss">{{ formatStreamSchedule(event.scheduledAt) }}</span>
                  <span class="rounded-full bg-white px-2 py-0.5 text-ink/55">{{ streamingStatusLabel[event.status] }}</span>
                </div>
                <h4 class="mt-2 text-xs font-extrabold leading-snug text-ink">{{ event.title }}</h4>
                <div class="mt-2 flex items-center justify-between gap-2 text-[9px] font-semibold text-muted">
                  <span class="truncate">{{ event.speaker }}</span>
                  <a v-if="event.streamUrl" :href="event.streamUrl" target="_blank" rel="noopener noreferrer" class="flex-shrink-0 font-extrabold uppercase tracking-[0.1em] text-moss hover:underline">Tonton</a>
                  <span v-else class="flex-shrink-0 font-extrabold uppercase tracking-[0.1em] text-moss">Terjadwal</span>
                </div>
              </div>
              <p v-if="!siteStore.liveStreams.length" class="text-[11px] font-semibold leading-relaxed text-muted">Belum ada jadwal streaming.</p>
            </div>
          </div>

          <div class="rounded-[1.4rem] border border-line bg-white p-5">
            <div class="flex items-center justify-between border-b border-line pb-3">
              <h3 class="text-[9px] font-black uppercase tracking-[0.14em] text-ink">Paling dibaca</h3>
              <span class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">Top 5</span>
            </div>
            <div class="mt-4 space-y-4">
              <RouterLink v-for="(item, index) in store.trendingArticles" :key="item.id" :to="`/berita/${item.slug}`" class="group flex items-start gap-3">
                <span class="w-6 flex-shrink-0 font-display text-2xl font-bold leading-none text-paper-deep transition-colors group-hover:text-moss">0{{ index + 1 }}</span>
                <div>
                  <h4 class="line-clamp-2 text-xs font-bold leading-snug text-ink transition-colors group-hover:text-moss">{{ item.title }}</h4>
                  <p class="mt-1 text-[9px] font-semibold text-muted">{{ item.category }} · {{ formatViews(item.views) }} dibaca</p>
                </div>
              </RouterLink>
            </div>
          </div>

          <div class="relative overflow-hidden rounded-[1.4rem] bg-ink p-5 text-paper">
            <div class="absolute inset-0 bg-grid-dark opacity-50" />
            <div class="relative">
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-white">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <h4 class="mt-4 font-display text-lg font-semibold tracking-tight text-white">Buletin Insan Cita</h4>
              <p class="mt-2 text-[11px] font-medium leading-relaxed text-white/60">Opini kader dan rilis pers mingguan langsung ke email Anda.</p>
              <form class="mt-4 space-y-2" @submit.prevent="subscribeSidebar">
                <input v-model="sidebarEmail" type="email" required placeholder="Alamat email..." class="field field-dark text-xs" />
                <button type="submit" :disabled="newsletter.isSubmitting" class="btn btn-lime w-full min-h-[clamp(2.4rem,4.8svh,2.8rem)] text-[10px] disabled:opacity-60">
                  {{ newsletter.isSubmitting ? 'Memproses...' : 'Berlangganan' }}
                </button>
                <p v-if="sidebarSubscribed" class="text-[10px] font-semibold text-lime-soft">Berhasil berlangganan. Terima kasih!</p>
                <p v-else-if="newsletter.error" class="text-[10px] font-semibold text-red-300">{{ newsletter.error }}</p>
              </form>
            </div>
          </div>
        </aside>
      </section>

      <!-- Full-width newsletter -->
      <section class="relative mt-16 overflow-hidden rounded-[2rem] bg-lime p-7 text-white sm:p-12">
        <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-20" />
        <StarMark :size="180" class="pointer-events-none absolute -right-10 -top-10 text-white/10" />
        <div class="relative grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <span class="eyebrow eyebrow-light">Tetap terinformasi</span>
            <h2 class="display-md mt-4 max-w-xl">Jangan lewatkan kabar terbaru<span class="text-white/60">.</span></h2>
            <p class="mt-3 max-w-lg text-sm font-semibold leading-relaxed text-white/70">
              Bergabunglah dengan kader dan alumni HMI yang menerima analisis, opini, dan informasi kegiatan terbaru.
            </p>
          </div>
          <form class="flex flex-col gap-2 sm:flex-row lg:justify-end" @submit.prevent="subscribeBanner">
            <input v-model="bannerEmail" type="email" required placeholder="Masukkan email Anda" class="field flex-1 border-white/30 bg-white" />
            <button type="submit" :disabled="newsletter.isSubmitting" class="btn btn-ink flex-shrink-0 disabled:opacity-60">
              {{ newsletter.isSubmitting ? 'Memproses...' : 'Berlangganan' }}
            </button>
            <p v-if="bannerSubscribed" class="text-[10px] font-semibold text-white sm:hidden">Berhasil berlangganan. Terima kasih!</p>
            <p v-else-if="newsletter.error" class="text-[10px] font-semibold text-red-100 sm:hidden">{{ newsletter.error }}</p>
          </form>
        </div>
        <p v-if="bannerSubscribed" class="relative mt-3 hidden text-[10px] font-semibold text-white sm:block">Berhasil berlangganan. Sampai jumpa di buletin berikutnya!</p>
        <p v-else-if="newsletter.error" class="relative mt-3 hidden text-[10px] font-semibold text-red-100 sm:block">{{ newsletter.error }}</p>
      </section>
    </div>
  </div>
</template>
