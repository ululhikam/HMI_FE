<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useSiteStore } from '@/stores/site'

const route = useRoute()
const router = useRouter()
const siteStore = useSiteStore()
const isMenuOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const openDropdown = ref<string | null>(null)
const isScrolled = ref(false)
const mobileOpenSection = ref<string | null>(null)

interface NavSubItem {
  label: string
  to: string
  hash?: string
}

interface NavItem {
  label: string
  to: string
  exact?: boolean
  children?: NavSubItem[]
}

const navItems: NavItem[] = [
  {
    label: 'Tentang',
    to: '/tentang',
    children: [
      { label: 'Sejarah HMI', to: '/tentang', hash: 'sejarah' },
      { label: 'NDP HMI', to: '/tentang', hash: 'ndp' },
      { label: 'Struktur Pengurus', to: '/tentang', hash: 'pengurus' },
    ]
  },
  { label: 'Berita', to: '/berita' },
  { label: 'Agenda', to: '/agenda' },
  { label: 'Galeri', to: '/galeri' },
  { label: 'Kontak', to: '/kontak' },
]

// CTA item (visually distinct in navbar)
const ctaItem = { label: 'Daftar LK 1', to: '/daftar' }

// Check if a route is active
function isActive(to: string, exact = false) {
  if (exact) return route.path === to
  return route.path.startsWith(to)
}


function handleScroll() {
  isScrolled.value = window.scrollY > 30
}

function closeAll() {
  isMenuOpen.value = false
  openDropdown.value = null
  searchOpen.value = false
}

function submitSearch() {
  const query = searchQuery.value.trim()
  closeAll()
  void router.push({ name: 'news', query: query ? { q: query } : {} })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeAll()
}

watch(route, () => {
  isMenuOpen.value = false
  openDropdown.value = null
  searchOpen.value = false
  mobileOpenSection.value = null
})

// Close mobile menu on body click (outside)
function handleBodyClick(e: MouseEvent) {
  const header = document.querySelector('header')
  if (header && !header.contains(e.target as Node)) {
    isMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('click', handleBodyClick)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleBodyClick)
})
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
    :class="isScrolled
      ? 'bg-[#0e0e0e]/96 backdrop-blur-xl shadow-[0_2px_30px_rgba(0,0,0,0.5)] border-b border-white/5'
      : 'bg-[#111212]/90 backdrop-blur-sm'"
  >
    <!-- Green accent bar -->
    <div class="h-[3px] w-full bg-gradient-to-r from-[#006837] via-[#009246] to-[#00A651]" />

    <div class="max-w-[1200px] mx-auto px-4 sm:px-6">
      <div class="flex items-center h-16 gap-6">

        <!-- ───── Logo ───── -->
        <RouterLink
          to="/"
          class="flex items-center gap-3 flex-shrink-0 group select-none cursor-pointer"
          aria-label="HMI Komisariat Insan Cita - Beranda"
          title="Beranda"
        >
          <div class="h-10 w-10 flex items-center justify-center flex-shrink-0">
            <img
              v-if="siteStore.settings.logoUrl"
              :src="siteStore.settings.logoUrl"
              :alt="`Logo ${siteStore.settings.organizationName || 'HMI'}`"
              class="h-full w-full object-contain rounded-full ring-1 ring-white/15 drop-shadow-md group-hover:scale-105 transition-all duration-300"
            />
            <span v-else class="w-full h-full rounded-full bg-[#009246]/20 border border-white/10 flex items-center justify-center text-[10px] font-black text-white">
              HMI
            </span>
          </div>
          <div
            v-if="siteStore.settings.organizationShortName || siteStore.settings.chapterName"
            class="hidden sm:flex flex-col leading-none gap-0.5"
          >
            <span class="text-white font-black text-[15px] tracking-wide group-hover:text-[#009246] transition-colors duration-300">{{ siteStore.settings.organizationShortName }}</span>
            <span class="text-[#009246] text-[8px] font-black tracking-[0.22em] uppercase">{{ siteStore.settings.chapterName }}</span>
          </div>
        </RouterLink>

        <!-- ───── Desktop Nav ───── -->
        <nav class="hidden lg:flex items-center gap-0.5 flex-1">
          <template v-for="item in navItems" :key="item.to">

            <!-- Dropdown item -->
            <div v-if="item.children"
              class="relative"
              @mouseenter="openDropdown = item.label"
              @mouseleave="openDropdown = null"
            >
              <button
                class="relative flex items-center gap-1 px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 outline-none"
                :class="isActive(item.to) ? 'text-white bg-white/5' : 'text-white/65 hover:text-white hover:bg-white/5'"
                :aria-expanded="openDropdown === item.label"
                aria-haspopup="true"
              >
                {{ item.label }}
                <svg
                  class="w-2.5 h-2.5 ml-0.5 transition-transform duration-300 opacity-70"
                  :class="openDropdown === item.label ? 'rotate-180 !opacity-100 text-[#009246]' : ''"
                  viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <!-- Active indicator -->
                <span v-if="isActive(item.to)"
                  class="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-[#009246] shadow-[0_0_8px_rgba(0,146,70,0.8)]"
                />
              </button>

              <!-- Dropdown panel -->
              <Transition name="dropdown">
                <div v-if="openDropdown === item.label"
                  role="menu"
                  class="absolute top-[calc(100%+6px)] left-0 w-52 bg-[#181818]/96 backdrop-blur-2xl border border-white/8 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] overflow-hidden py-1.5 z-50"
                >
                  <div class="px-4 pt-1.5 pb-1 text-[9px] font-black text-white/25 uppercase tracking-[0.25em] border-b border-white/5 mb-1">
                    {{ item.label }}
                  </div>
                  <a
                    v-for="child in item.children"
                    :key="child.hash"
                    :href="`${child.to}${child.hash ? '#' + child.hash : ''}`"
                    role="menuitem"
                    class="flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] font-semibold text-white/65 hover:text-white hover:bg-white/6 transition-all duration-150 group/item"
                    @click="openDropdown = null"
                  >
                    <span class="w-1 h-1 rounded-full bg-[#009246] flex-shrink-0 opacity-50 group-hover/item:opacity-100 transition-opacity" />
                    {{ child.label }}
                  </a>
                </div>
              </Transition>
            </div>

            <!-- Normal item -->
            <RouterLink v-else :to="item.to"
              class="relative px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-wider rounded-md transition-all duration-200"
              :class="isActive(item.to, item.exact) ? 'text-white bg-white/5' : 'text-white/65 hover:text-white hover:bg-white/5'"
            >
              {{ item.label }}
              <span v-if="isActive(item.to, item.exact)"
                class="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-[#009246] shadow-[0_0_8px_rgba(0,146,70,0.8)]"
              />
            </RouterLink>
          </template>
        </nav>

        <!-- ───── Right Actions ───── -->
        <div class="flex items-center gap-2.5 ml-auto lg:ml-0">

          <!-- Search button -->
          <button
            @click="searchOpen = !searchOpen; isMenuOpen = false"
            class="hidden sm:flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 border"
            :class="searchOpen ? 'bg-[#009246]/20 border-[#009246]/50 text-[#009246]' : 'bg-white/5 border-white/8 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20'"
            aria-label="Cari"
            title="Cari (Ctrl+K)"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- CTA — Daftar LK 1 -->
          <RouterLink :to="ctaItem.to"
            class="hidden md:flex items-center px-4 py-1.5 bg-[#009246] hover:bg-[#00A651] text-white text-[11.5px] font-black uppercase tracking-widest rounded-full transition-all duration-300 shadow-[0_2px_14px_rgba(0,146,70,0.35)] hover:shadow-[0_4px_20px_rgba(0,146,70,0.55)] hover:-translate-y-px active:translate-y-0"
          >
            Daftar LK 1
          </RouterLink>

          <!-- Admin link (subtle) -->
          <RouterLink to="/login"
            class="hidden lg:flex items-center px-3 py-1.5 text-[11px] font-bold text-white/40 hover:text-white/80 uppercase tracking-widest border border-white/8 hover:border-white/20 rounded-full transition-all duration-200"
          >
            Admin
          </RouterLink>

          <!-- Mobile toggle -->
          <button
            @click="isMenuOpen = !isMenuOpen; searchOpen = false"
            class="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 border"
            :class="isMenuOpen ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/8'"
            :aria-label="isMenuOpen ? 'Tutup Menu' : 'Buka Menu'"
            :aria-expanded="isMenuOpen"
          >
            <div class="relative w-4 h-3.5 flex flex-col justify-between">
              <span class="block w-full h-0.5 bg-white rounded-full transition-all duration-300 origin-center"
                :class="isMenuOpen ? 'rotate-45 translate-y-[6px]' : ''" />
              <span class="block w-3/4 h-0.5 bg-white rounded-full transition-all duration-300"
                :class="isMenuOpen ? 'opacity-0 -translate-x-2' : ''" />
              <span class="block w-full h-0.5 bg-white rounded-full transition-all duration-300 origin-center"
                :class="isMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''" />
            </div>
          </button>
        </div>
      </div>

      <!-- ───── Search Bar ───── -->
      <Transition name="search-expand">
        <div v-if="searchOpen" class="pb-3">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              id="navbar-search"
              placeholder="Cari berita, kegiatan, atau program..."
              autofocus
              class="w-full bg-white/6 border border-[#009246]/30 text-white placeholder-white/30 rounded-xl pl-11 pr-20 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#009246]/50 focus:border-[#009246]/60 transition-all"
              @keyup.enter="submitSearch"
            />
            <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <kbd class="text-[10px] font-bold text-white/30 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 tracking-wider">ESC</kbd>
              <button @click="searchOpen = false" class="text-white/40 hover:text-white transition-colors" title="Tutup">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ───── Mobile Menu ───── -->
    <Transition name="mobile-slide">
      <div v-if="isMenuOpen"
        class="lg:hidden absolute top-full left-0 right-0 bg-[#0e0e0e]/98 backdrop-blur-2xl border-t border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
        style="max-height: calc(100vh - 67px); overflow-y: auto;"
      >
        <div class="px-4 pt-4 pb-6 space-y-2">

          <!-- Mobile search -->
          <div class="relative mb-3">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari..."
              class="w-full bg-white/5 border border-white/8 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#009246]/50 transition-all"
              @keyup.enter="submitSearch"
            />
          </div>

          <!-- Nav links -->
          <template v-for="item in navItems" :key="item.to">

            <!-- Dropdown section -->
            <div v-if="item.children" class="overflow-hidden rounded-xl border border-white/8">
              <button
                @click="mobileOpenSection = mobileOpenSection === item.label ? null : item.label"
                class="w-full flex items-center justify-between px-4 py-3.5 text-sm font-bold uppercase tracking-wide transition-colors"
                :class="mobileOpenSection === item.label ? 'bg-white/8 text-white' : 'bg-white/4 text-white/70'"
              >
                {{ item.label }}
                <svg class="w-3.5 h-3.5 transition-transform duration-300 opacity-60"
                  :class="mobileOpenSection === item.label ? 'rotate-180' : ''"
                  viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <Transition name="accordion">
                <div v-if="mobileOpenSection === item.label" class="bg-white/3 border-t border-white/5">
                  <a
                    v-for="child in item.children"
                    :key="child.hash"
                    :href="`${child.to}${child.hash ? '#' + child.hash : ''}`"
                    class="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-white/65 hover:text-white hover:bg-white/5 transition-all"
                    @click="isMenuOpen = false"
                  >
                    <span class="w-1 h-1 rounded-full bg-[#009246]" />
                    {{ child.label }}
                  </a>
                </div>
              </Transition>
            </div>

            <!-- Normal link -->
            <RouterLink v-else :to="item.to"
              class="flex items-center px-4 py-3.5 text-sm font-bold uppercase tracking-wide rounded-xl border transition-all"
              :class="isActive(item.to, item.exact)
                ? 'text-[#009246] bg-[#009246]/10 border-[#009246]/25'
                : 'text-white/70 bg-white/4 border-white/8 hover:text-white hover:bg-white/8'"
              @click="isMenuOpen = false"
            >
              {{ item.label }}
            </RouterLink>
          </template>

          <!-- CTA -->
          <RouterLink :to="ctaItem.to"
            class="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#006837] to-[#009246] text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-[0_4px_20px_rgba(0,146,70,0.35)] hover:from-[#007a3d] hover:to-[#00a651] transition-all mt-2"
            @click="isMenuOpen = false"
          >
            Daftar LK 1
          </RouterLink>

          <!-- Admin -->
          <RouterLink to="/login"
            class="flex items-center justify-center py-3 text-sm font-bold text-white/40 hover:text-white/70 border border-white/8 rounded-xl transition-colors tracking-wider"
            @click="isMenuOpen = false"
          >
            Masuk Admin
          </RouterLink>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
/* Dropdown */
.dropdown-enter-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.dropdown-leave-active { transition: all 0.15s ease-in; }
.dropdown-enter-from { opacity: 0; transform: translateY(-8px) scale(0.97); }
.dropdown-leave-to   { opacity: 0; transform: translateY(-4px) scale(0.98); }

/* Search bar */
.search-expand-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.search-expand-leave-active { transition: all 0.2s ease-in; }
.search-expand-enter-from, .search-expand-leave-to { opacity: 0; max-height: 0; transform: translateY(-6px); }

/* Mobile slide */
.mobile-slide-enter-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.mobile-slide-leave-active { transition: all 0.25s ease-in; }
.mobile-slide-enter-from { opacity: 0; transform: translateY(-12px); }
.mobile-slide-leave-to   { opacity: 0; transform: translateY(-8px); }

/* Accordion */
.accordion-enter-active, .accordion-leave-active { transition: all 0.25s ease; overflow: hidden; }
.accordion-enter-from, .accordion-leave-to { max-height: 0; opacity: 0; }
.accordion-enter-to, .accordion-leave-from { max-height: 200px; opacity: 1; }

/* White opacity variants */
.bg-white\/4 { background: rgba(255,255,255,0.04); }
.bg-white\/6 { background: rgba(255,255,255,0.06); }
.bg-white\/8 { background: rgba(255,255,255,0.08); }
.hover\:bg-white\/6:hover { background: rgba(255,255,255,0.06); }
.hover\:bg-white\/8:hover { background: rgba(255,255,255,0.08); }
.border-white\/8 { border-color: rgba(255,255,255,0.08); }
</style>
