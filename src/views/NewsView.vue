<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useArticleStore } from '@/stores/articles'
import { useSiteStore } from '@/stores/site'
import { useNewsletterStore } from '@/stores/newsletter'
import type { StreamingItem } from '@/types'

const route = useRoute()
const store = useArticleStore()
const siteStore = useSiteStore()
const newsletter = useNewsletterStore()

const activeTab = ref<'terbaru' | 'populer'>('terbaru')

const sidebarEmail = ref('')
const bannerEmail = ref('')
const sidebarSubscribed = ref(false)
const bannerSubscribed = ref(false)

const streamingStatusLabel: Record<StreamingItem['status'], string> = {
  upcoming: 'Akan Datang',
  live: 'Live Sekarang',
  scheduled: 'Terjadwal',
}

const feedArticles = computed(() => {
  if (activeTab.value === 'populer') {
    return [...store.filteredArticles].sort((a, b) => b.views - a.views)
  }
  return store.filteredArticles
})

function formatDate(iso: string) {
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

function formatStreamSchedule(iso: string) {
  const date = new Date(iso)
  const day = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return `${day} • ${time} WIB`
}

function toggleBookmark(slug: string) {
  void store.toggleBookmark(slug)
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

// Sinkronkan pencarian dari navbar (?q=) ke store artikel.
watch(
  () => route.query.q,
  (query) => {
    store.searchQuery = typeof query === 'string' ? query : ''
  },
  { immediate: true },
)

onMounted(() => {
  void store.fetchPublished()
  void siteStore.fetchLiveStreams()
})
</script>

<template>
  <div class="pt-[67px] bg-[#F7F7F5] min-h-screen text-[#111212]">
    <!-- News Portal Secondary Navigation Header -->
    <header class="bg-white border-b border-[#E6E6E6] sticky top-[67px] z-30 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-14">
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-[#009246] rounded-full animate-pulse"></span>
              <span class="font-extrabold text-lg tracking-tight text-[#111212]">HMI <span class="text-[#009246]">NEWS</span></span>
            </div>
            <nav class="hidden md:flex items-center gap-5 text-xs font-semibold text-[#4D4D4D]">
              <button
                v-for="cat in store.categories"
                :key="cat"
                @click="store.selectedCategory = cat"
                class="hover:text-[#009246] transition-colors py-1 relative"
                :class="store.selectedCategory === cat ? 'text-[#009246] font-bold border-b-2 border-[#009246]' : ''"
              >
                {{ cat }}
              </button>
            </nav>
          </div>

          <!-- Search Input in Sub-Header -->
          <div class="flex items-center gap-3">
            <div class="relative w-48 sm:w-64">
              <input
                v-model="store.searchQuery"
                type="text"
                placeholder="Cari berita..."
                class="w-full pl-8 pr-3 py-1.5 bg-[#F7F7F5] border border-[#E6E6E6] rounded-lg text-xs focus:outline-none focus:border-[#009246] focus:bg-white transition-all"
              />
              <svg class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div class="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <svg class="w-4 h-4 text-[#009246]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>{{ store.bookmarkedSlugs.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

      <!-- SECTION 1: FEATURED STORY HERO -->
      <section v-if="store.heroArticle" class="grid lg:grid-cols-12 gap-8 items-stretch">
        <!-- Big Left Hero Card -->
        <div class="lg:col-span-7 flex">
          <RouterLink :to="`/berita/${store.heroArticle.slug}`" class="group relative w-full flex flex-col rounded-2xl overflow-hidden shadow-xl bg-black min-h-[420px] sm:min-h-[480px]">
            <img
              :src="store.heroArticle.coverImage"
              :alt="store.heroArticle.title"
              class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            
            <!-- Top Badges -->
            <div class="relative z-10 p-6 flex justify-between items-start">
              <span class="bg-[#009246] text-white text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded shadow-md">
                Featured Story
              </span>
              <span class="bg-black/60 backdrop-blur-md text-white/90 text-xs px-2.5 py-1 rounded-full border border-white/20">
                {{ store.heroArticle.category }}
              </span>
            </div>

            <!-- Bottom Content Overlay -->
            <div class="relative z-10 mt-auto p-6 sm:p-8 space-y-3">
              <div class="flex items-center gap-3 text-white/70 text-xs font-medium">
                <span>{{ formatDate(store.heroArticle.publishedAt) }}</span>
                <span>•</span>
                <span>{{ store.heroArticle.readTime || '5 min read' }}</span>
              </div>
              
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight group-hover:text-[#00A651] transition-colors">
                {{ store.heroArticle.title }}
              </h1>

              <p class="text-white/80 text-xs sm:text-sm line-clamp-2 leading-relaxed font-normal">
                {{ store.heroArticle.excerpt }}
              </p>

              <div class="pt-2 flex items-center justify-between border-t border-white/10 text-xs text-white/60">
                <div class="flex items-center gap-2">
                  <img :src="store.heroArticle.authorAvatar" class="w-6 h-6 rounded-full object-cover border border-white/30" />
                  <span class="font-semibold text-white/90">{{ store.heroArticle.author }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5 text-[#009246]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {{ store.heroArticle.views.toLocaleString() }}
                  </span>
                  <button @click.prevent="toggleBookmark(store.heroArticle.slug)" class="hover:text-white transition-colors">
                    <svg class="w-4 h-4" :fill="store.isBookmarked(store.heroArticle.slug) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </RouterLink>
        </div>

        <!-- Right 4 Compact Cards -->
        <div class="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div class="flex items-center justify-between border-b border-[#E6E6E6] pb-2">
            <h3 class="text-sm font-extrabold tracking-wide uppercase text-[#111212] flex items-center gap-2">
              <span class="w-2 h-2 bg-[#009246] rounded-full"></span>
              Berita Utama Lainnya
            </h3>
            <span class="text-xs text-[#4D4D4D] font-medium">Terbaru Hari Ini</span>
          </div>

          <div class="space-y-4">
            <RouterLink
              v-for="item in store.featuredSideArticles"
              :key="item.id"
              :to="`/berita/${item.slug}`"
              class="group flex gap-4 bg-white p-3.5 rounded-xl border border-[#E6E6E6] hover:border-[#009246] hover:shadow-md transition-all"
            >
              <div class="flex-1 flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-2 text-[11px] text-[#4D4D4D] font-medium mb-1">
                    <span class="text-[#009246] font-bold">{{ item.category }}</span>
                    <span>•</span>
                    <span>{{ formatDate(item.publishedAt) }}</span>
                  </div>
                  <h4 class="text-xs sm:text-sm font-bold text-[#111212] group-hover:text-[#009246] transition-colors line-clamp-2 leading-snug">
                    {{ item.title }}
                  </h4>
                </div>
                <div class="flex items-center gap-3 mt-2 text-[11px] text-[#4D4D4D]">
                  <span>{{ item.readTime || '4 min read' }}</span>
                  <span>•</span>
                  <span>{{ item.views }} views</span>
                </div>
              </div>
              <div class="w-24 h-24 sm:w-28 sm:h-20 shrink-0 rounded-lg overflow-hidden relative">
                <img :src="item.coverImage" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- SECTION 2: TOP STORIES & VIDEO GRID -->
      <section class="bg-white rounded-2xl p-6 border border-[#E6E6E6] shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#E6E6E6] pb-4">
          <div>
            <div class="inline-flex items-center gap-2 text-[#009246] font-extrabold text-xs uppercase tracking-widest mb-1">
              <span class="w-2 h-2 rounded-full bg-[#009246] animate-ping"></span>
              Top Stories & Multimedia
            </div>
            <h2 class="text-xl font-black text-[#111212]">Kabar Terpopuler & Liputan Khusus</h2>
          </div>
          <div class="flex items-center gap-2 text-xs font-semibold text-[#4D4D4D]">
            <span>Menampilkan 5 liputan unggulan</span>
          </div>
        </div>

        <!-- 5 Cards Horizontal Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <RouterLink
            v-for="item in store.topStories"
            :key="item.id"
            :to="`/berita/${item.slug}`"
            class="group bg-[#F7F7F5] rounded-xl overflow-hidden border border-[#E6E6E6] hover:border-[#009246] hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div class="relative aspect-video overflow-hidden">
                <img :src="item.coverImage" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div v-if="item.isVideo" class="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div class="w-8 h-8 rounded-full bg-white/90 text-[#009246] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg class="w-4 h-4 text-[#009246] fill-current translate-x-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <span v-if="item.videoDuration" class="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {{ item.videoDuration }}
                </span>
              </div>
              <div class="p-3">
                <h3 class="text-xs font-bold text-[#111212] group-hover:text-[#009246] transition-colors line-clamp-2 leading-snug mb-2">
                  {{ item.title }}
                </h3>
              </div>
            </div>

            <div class="p-3 pt-0 text-[11px] text-[#4D4D4D] border-t border-[#E6E6E6]/60 mt-2">
              <div class="flex items-center gap-1 font-semibold text-[#111212]">
                <span class="truncate">{{ item.author }}</span>
                <svg class="w-3.5 h-3.5 text-[#009246] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="flex items-center justify-between text-[#4D4D4D] text-[10px] mt-1">
                <span>{{ item.views.toLocaleString() }} views</span>
                <span>• {{ formatDate(item.publishedAt) }}</span>
              </div>
            </div>
          </RouterLink>
        </div>
      </section>

      <!-- SECTION 3: LATEST STORIES FEED + SIDEBAR -->
      <section class="grid lg:grid-cols-12 gap-8">
        <!-- Main Column: Latest Feed (8 cols) -->
        <div class="lg:col-span-8 space-y-6">
          <div class="flex items-center justify-between border-b border-[#E6E6E6] pb-3">
            <h2 class="text-lg font-black text-[#111212] uppercase tracking-wide flex items-center gap-2">
              <span class="w-2.5 h-2.5 bg-[#009246] rounded-full"></span>
              Latest Stories
            </h2>
            <div class="flex items-center gap-2 text-xs">
              <button
                @click="activeTab = 'terbaru'"
                class="px-3 py-1 rounded-full font-bold transition-all"
                :class="activeTab === 'terbaru' ? 'bg-[#009246] text-white' : 'bg-white text-[#4D4D4D] hover:bg-gray-100'"
              >
                Terbaru
              </button>
              <button
                @click="activeTab = 'populer'"
                class="px-3 py-1 rounded-full font-bold transition-all"
                :class="activeTab === 'populer' ? 'bg-[#009246] text-white' : 'bg-white text-[#4D4D4D] hover:bg-gray-100'"
              >
                Populer
              </button>
            </div>
          </div>

          <!-- Articles Feed List -->
          <div v-if="feedArticles.length" class="space-y-4">
            <article
              v-for="article in feedArticles"
              :key="article.id"
              class="group bg-white p-5 rounded-2xl border border-[#E6E6E6] hover:border-[#009246] hover:shadow-lg transition-all flex flex-col sm:flex-row gap-5"
            >
              <div class="flex-1 flex flex-col justify-between order-2 sm:order-1">
                <div>
                  <!-- Author Info Header -->
                  <div class="flex items-center gap-2 text-xs text-[#4D4D4D] mb-2">
                    <div class="w-6 h-6 rounded-full overflow-hidden border border-[#E6E6E6] bg-[#009246]/10">
                      <img
                        v-if="article.authorAvatar"
                        :src="article.authorAvatar"
                        :alt="article.author"
                        class="w-full h-full object-cover"
                      />
                      <span v-else class="w-full h-full flex items-center justify-center text-[9px] font-black text-[#009246]">
                        {{ initials(article.author) }}
                      </span>
                    </div>
                    <span class="font-bold text-[#111212]">{{ article.author }}</span>
                    <span>•</span>
                    <span class="bg-[#009246]/10 text-[#009246] font-semibold text-[10px] px-2 py-0.5 rounded-full">{{ article.category }}</span>
                  </div>

                  <!-- Article Title -->
                  <RouterLink :to="`/berita/${article.slug}`">
                    <h3 class="text-base sm:text-lg font-black text-[#111212] group-hover:text-[#009246] transition-colors leading-snug mb-2">
                      {{ article.title }}
                    </h3>
                  </RouterLink>

                  <!-- Excerpt -->
                  <p class="text-xs sm:text-sm text-[#4D4D4D] leading-relaxed line-clamp-2 mb-3">
                    {{ article.excerpt }}
                  </p>
                </div>

                <!-- Footer meta -->
                <div class="flex items-center justify-between text-xs text-[#4D4D4D] pt-3 border-t border-[#E6E6E6]/60">
                  <div class="flex items-center gap-3 text-[11px]">
                    <span>{{ formatDate(article.publishedAt) }}</span>
                    <span>•</span>
                    <span>{{ article.readTime || '5 min read' }}</span>
                    <span>•</span>
                    <span class="flex items-center gap-1 font-semibold">
                      <svg class="w-3.5 h-3.5 text-[#009246]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {{ article.views.toLocaleString() }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button @click="toggleBookmark(article.slug)" class="text-gray-400 hover:text-[#009246] transition-colors">
                      <svg class="w-4 h-4" :fill="store.isBookmarked(article.slug) ? '#009246' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Thumbnail image -->
              <div class="w-full sm:w-48 h-36 shrink-0 rounded-xl overflow-hidden relative order-1 sm:order-2">
                <img :src="article.coverImage" :alt="article.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </article>
          </div>

          <!-- Empty search state -->
          <div v-else class="bg-white rounded-2xl p-12 text-center border border-[#E6E6E6]">
            <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 class="text-lg font-bold text-[#111212] mb-1">Berita Tidak Ditemukan</h3>
            <p class="text-xs text-[#4D4D4D] mb-4">Tidak ada artikel yang sesuai dengan pencarian atau filter Anda.</p>
            <button @click="store.searchQuery = ''; store.selectedCategory = 'Semua'" class="px-4 py-2 bg-[#009246] text-white text-xs font-bold rounded-lg hover:bg-[#006837] transition-colors">
              Reset Filter Pencarian
            </button>
          </div>
        </div>

        <!-- Sidebar Column (4 cols) -->
        <aside class="lg:col-span-4 space-y-8">
          <!-- Widget 1: Upcoming Streaming & Agenda Live -->
          <div class="bg-white p-5 rounded-2xl border border-[#E6E6E6] shadow-sm">
            <div class="flex items-center justify-between mb-4 border-b border-[#E6E6E6] pb-3">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#111212] flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#009246] animate-pulse"></span>
                Upcoming Streaming & Agenda
              </h3>
              <span class="text-[10px] bg-[#009246]/10 text-[#009246] font-bold px-2 py-0.5 rounded">Live Schedule</span>
            </div>

            <div class="space-y-3">
              <div
                v-for="ev in siteStore.liveStreams"
                :key="ev.id"
                class="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#E6E6E6] hover:border-[#009246] transition-all"
              >
                <div class="flex items-center justify-between text-[10px] font-bold text-[#009246] mb-1">
                  <span>{{ formatStreamSchedule(ev.scheduledAt) }}</span>
                  <span class="bg-white px-2 py-0.5 rounded shadow-xs text-gray-700 border border-gray-200">{{ streamingStatusLabel[ev.status] }}</span>
                </div>
                <h4 class="text-xs font-extrabold text-[#111212] leading-snug mb-1.5">{{ ev.title }}</h4>
                <div class="flex items-center justify-between text-[11px] text-[#4D4D4D]">
                  <span class="truncate">Pembicara: {{ ev.speaker }}</span>
                  <a
                    v-if="ev.streamUrl"
                    :href="ev.streamUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-[#009246] font-bold hover:underline shrink-0 text-[10px]"
                  >
                    Tonton
                  </a>
                  <span v-else class="text-[#009246] font-bold shrink-0 text-[10px]">Terjadwal</span>
                </div>
              </div>
              <p v-if="!siteStore.liveStreams.length" class="text-[11px] text-[#4D4D4D]">Belum ada jadwal streaming.</p>
            </div>
          </div>

          <!-- Widget 2: Trending / Top Read Articles -->
          <div class="bg-white p-5 rounded-2xl border border-[#E6E6E6] shadow-sm">
            <div class="flex items-center justify-between mb-4 border-b border-[#E6E6E6] pb-3">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#111212] flex items-center gap-2">
                <span class="text-[#009246] font-black">#</span> Trending Reads
              </h3>
              <span class="text-[10px] text-[#4D4D4D]">Paling Banyak Dibaca</span>
            </div>

            <div class="space-y-4">
              <RouterLink
                v-for="(item, idx) in store.trendingArticles"
                :key="item.id"
                :to="`/berita/${item.slug}`"
                class="group flex items-start gap-3"
              >
                <span class="text-2xl font-black text-[#E6E6E6] group-hover:text-[#009246] transition-colors w-6 leading-none pt-1">
                  0{{ idx + 1 }}
                </span>
                <div class="flex-1">
                  <h4 class="text-xs font-bold text-[#111212] group-hover:text-[#009246] transition-colors leading-snug line-clamp-2">
                    {{ item.title }}
                  </h4>
                  <div class="flex items-center gap-2 text-[10px] text-[#4D4D4D] mt-1">
                    <span>{{ item.category }}</span>
                    <span>•</span>
                    <span>{{ item.views.toLocaleString() }} dibaca</span>
                  </div>
                </div>
              </RouterLink>
            </div>
          </div>

          <!-- Widget 3: Newsletter Banner CTA in Sidebar -->
          <div class="bg-gradient-to-br from-[#006837] to-[#111212] text-white p-6 rounded-2xl shadow-xl space-y-4">
            <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#009246]">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 class="text-base font-black">Langganan Wacana Insan Cita</h4>
              <p class="text-xs text-white/70 leading-relaxed mt-1">Dapatkan buletin opini kader dan rilis pers mingguan langsung ke email Anda.</p>
            </div>
            <form @submit.prevent="subscribeSidebar" class="space-y-2">
              <input
                v-model="sidebarEmail"
                type="email"
                required
                placeholder="Alamat email Anda..."
                class="w-full px-3.5 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-white/50 focus:outline-none focus:bg-white/20"
              />
              <button
                type="submit"
                :disabled="newsletter.isSubmitting"
                class="w-full py-2.5 bg-[#009246] hover:bg-[#00A651] disabled:opacity-60 text-white text-xs font-extrabold rounded-xl transition-all shadow-md"
              >
                {{ newsletter.isSubmitting ? 'Memproses...' : 'Berlangganan Gratis' }}
              </button>
              <p v-if="sidebarSubscribed" class="text-[11px] text-[#7BE0AC] font-semibold">Berhasil berlangganan. Terima kasih!</p>
              <p v-else-if="newsletter.error" class="text-[11px] text-red-300">{{ newsletter.error }}</p>
            </form>
          </div>
        </aside>
      </section>

      <!-- SECTION 4: FULL-WIDTH NEWSLETTER BANNER -->
      <section class="bg-[#111212] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
        <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-[#009246]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <span class="inline-block bg-[#009246] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            Stay Updated
          </span>
          <h2 class="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Subscribe to get latest stories & official press releases!
          </h2>
          <p class="text-white/70 text-xs sm:text-sm max-w-xl mx-auto">
            Bergabunglah dengan ribuan kader dan alumni HMI yang mendapatkan analisis kritis, opini terpilih, dan informasi kegiatan terbaru.
          </p>
          <form @submit.prevent="subscribeBanner" class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              v-model="bannerEmail"
              type="email"
              required
              placeholder="Masukkan email Anda di sini..."
              class="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#009246] focus:bg-white/20 transition-all"
            />
            <button
              type="submit"
              :disabled="newsletter.isSubmitting"
              class="px-6 py-3 bg-[#009246] hover:bg-[#00A651] disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors shrink-0 shadow-lg"
            >
              {{ newsletter.isSubmitting ? 'Memproses...' : 'Subscribe Now' }}
            </button>
          </form>
          <p v-if="bannerSubscribed" class="text-xs text-[#7BE0AC] font-semibold">Berhasil berlangganan. Sampai jumpa di buletin berikutnya!</p>
          <p v-else-if="newsletter.error" class="text-xs text-red-300">{{ newsletter.error }}</p>
        </div>
      </section>

    </div>
  </div>
</template>
