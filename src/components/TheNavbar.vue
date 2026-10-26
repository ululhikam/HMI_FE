<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useSiteStore } from '@/stores/site'

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

const route = useRoute()
const router = useRouter()
const siteStore = useSiteStore()

const isMenuOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const openDropdown = ref<string | null>(null)
const isScrolled = ref(false)
const mobileOpenSection = ref<string | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

const navItems: NavItem[] = [
  {
    label: 'Tentang',
    to: '/tentang',
    children: [
      { label: 'Sejarah HMI', to: '/tentang', hash: 'sejarah' },
      { label: 'Nilai Dasar Perjuangan', to: '/tentang', hash: 'ndp' },
      { label: 'Struktur Pengurus', to: '/tentang', hash: 'pengurus' },
    ],
  },
  { label: 'Berita', to: '/berita' },
  { label: 'Agenda', to: '/agenda' },
  { label: 'Galeri', to: '/galeri' },
  { label: 'Kontak', to: '/kontak' },
]

const quickSearches = ['LK 1', 'Kaderisasi', 'Bakti Sosial', 'Kajian NDP']
const ctaItem = { label: 'Daftar LK 1', to: '/daftar' }

const displayName = computed(() => siteStore.settings.organizationShortName || 'HMI')
const chapterName = computed(() => siteStore.settings.chapterName || 'Insan Cita')
const logoUrl = computed(() => siteStore.settings.logoUrl)

function isActive(to: string, exact = false) {
  if (exact) return route.path === to
  return route.path === to || route.path.startsWith(`${to}/`)
}

function closeAll() {
  isMenuOpen.value = false
  openDropdown.value = null
  searchOpen.value = false
  mobileOpenSection.value = null
}

function handleScroll() {
  isScrolled.value = window.scrollY > 24
}

async function openSearch() {
  isMenuOpen.value = false
  searchOpen.value = true
  await nextTick()
  searchInput.value?.focus()
}

function submitSearch(query = searchQuery.value) {
  const value = query.trim()
  closeAll()
  void router.push({ name: 'news', query: value ? { q: value } : {} })
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    if (searchOpen.value) closeAll()
    else void openSearch()
    return
  }

  if (event.key === 'Escape') closeAll()
}

function handleBodyClick(event: MouseEvent) {
  const header = document.querySelector('header[data-site-header]')
  if (header && !header.contains(event.target as Node)) {
    isMenuOpen.value = false
    openDropdown.value = null
  }
}

watch(route, closeAll)

watch([isMenuOpen, searchOpen], ([menu, search]) => {
  document.body.style.overflow = menu || search ? 'hidden' : ''
})

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
  document.body.style.overflow = ''
})
</script>

<template>
  <header
    data-site-header
    class="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300"
    :class="isScrolled || isMenuOpen || searchOpen
      ? 'border-white/20 bg-black'
      : 'border-white/10 bg-black/95'"
  >
    <div class="container-wide">
      <div class="grid h-[var(--navbar-height)] grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <!-- Brand -->
        <RouterLink
          to="/"
          class="group flex flex-shrink-0 items-center justify-self-start gap-2.5"
          aria-label="HMI Insan Cita — Beranda"
          @click="closeAll"
        >
          <span class="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-[#155c17]/40 transition-transform duration-300 group-hover:rotate-6">
            <img
              v-if="logoUrl"
              :src="logoUrl"
              :alt="`Logo ${displayName}`"
              class="h-full w-full object-contain"
            />
            <span v-else class="text-[10px] font-black text-ink">HMI</span>
          </span>
          <span class="flex flex-col justify-center leading-none">
            <span class="max-w-[7rem] truncate font-display text-[13px] font-extrabold tracking-tight text-white sm:max-w-[10rem] sm:text-[15px]">{{ displayName }}</span>
            <span class="mt-1 max-w-[7rem] truncate text-[8px] font-extrabold uppercase tracking-[0.16em] text-lime-soft sm:max-w-[10rem]">{{ chapterName }}</span>
          </span>
        </RouterLink>

        <!-- Desktop navigation -->
        <nav class="hidden items-center justify-center gap-1 lg:flex" aria-label="Navigasi utama">
          <template v-for="item in navItems" :key="item.to">
            <div
              v-if="item.children"
              class="relative"
              @mouseenter="openDropdown = item.label"
              @mouseleave="openDropdown = null"
            >
              <button
                type="button"
                class="relative flex items-center gap-1.5 px-3 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.12em] transition-colors"
                :class="isActive(item.to) ? 'text-white' : 'text-white/55 hover:text-white'"
                :aria-expanded="openDropdown === item.label"
                aria-haspopup="true"
                @click="openDropdown = openDropdown === item.label ? null : item.label"
              >
                <span v-if="isActive(item.to)" class="h-1 w-1 rounded-full bg-lime-soft" />
                {{ item.label }}
                <svg
                  class="h-2.5 w-2.5 transition-transform duration-300"
                  :class="openDropdown === item.label ? 'rotate-180 text-lime-soft' : 'text-white/60'"
                  viewBox="0 0 10 6"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              <Transition name="drop">
                <div
                  v-if="openDropdown === item.label"
                  class="absolute left-0 top-[calc(100%+14px)] w-64 overflow-hidden rounded-2xl border border-line bg-paper p-2 text-ink shadow-2xl"
                  role="menu"
                >
                  <div class="flex items-center justify-between px-3 pb-2 pt-1.5">
                    <span class="text-[8px] font-black uppercase tracking-[0.22em] text-muted">{{ item.label }}</span>
                    <span class="h-1.5 w-1.5 rounded-full bg-moss" />
                  </div>
                  <RouterLink
                    v-for="child in item.children"
                    :key="child.hash"
                    :to="{ path: child.to, hash: child.hash }"
                    class="group flex items-center justify-between rounded-xl px-3 py-2.5 text-[11px] font-bold text-ink/65 transition-colors hover:bg-ink hover:text-lime-soft"
                    role="menuitem"
                    @click="openDropdown = null"
                  >
                    {{ child.label }}
                    <svg class="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </RouterLink>
                </div>
              </Transition>
            </div>

            <RouterLink
              v-else
              :to="item.to"
              class="relative flex items-center gap-1.5 px-3 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.12em] transition-colors"
              :class="isActive(item.to, item.exact) ? 'text-white' : 'text-white/55 hover:text-white'"
            >
              <span v-if="isActive(item.to, item.exact)" class="h-1 w-1 rounded-full bg-lime-soft" />
              {{ item.label }}
            </RouterLink>
          </template>
        </nav>

        <!-- Actions -->
        <div class="flex items-center justify-self-end gap-1.5 sm:gap-2">
          <button
            type="button"
            class="hidden h-9 w-9 items-center justify-center rounded-md text-white/55 transition-colors hover:bg-white/5 hover:text-lime-soft sm:flex"
            aria-label="Buka pencarian"
            title="Cari (Ctrl+K)"
            @click="openSearch"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6" />
              <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>

          <RouterLink
            :to="ctaItem.to"
            class="hidden items-center gap-1.5 rounded-md bg-lime px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:bg-lime-bright md:flex"
            @click="closeAll"
          >
            Daftar LK 1
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>

          <RouterLink
            to="/login"
            class="hidden h-9 items-center px-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white/60 transition-colors hover:text-white lg:flex"
            @click="closeAll"
          >
            Admin
          </RouterLink>

          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-md text-white transition-colors hover:bg-white/5 hover:text-lime-soft lg:hidden"
            :aria-label="isMenuOpen ? 'Tutup menu' : 'Buka menu'"
            :aria-expanded="isMenuOpen"
            @click="isMenuOpen = !isMenuOpen; searchOpen = false"
          >
            <span class="relative flex h-3.5 w-4 flex-col justify-between">
              <span class="block h-[1.5px] w-full rounded-full bg-current transition-all duration-300" :class="isMenuOpen ? 'translate-y-[6px] rotate-45' : ''" />
              <span class="block h-[1.5px] w-3/4 rounded-full bg-current transition-all duration-300" :class="isMenuOpen ? 'translate-x-1 opacity-0' : ''" />
              <span class="block h-[1.5px] w-full rounded-full bg-current transition-all duration-300" :class="isMenuOpen ? '-translate-y-[6px] -rotate-45' : ''" />
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Search overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="searchOpen"
          class="fixed inset-0 z-[60] bg-ink/97 text-paper backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Pencarian situs"
          @click.stop
          @click.self="searchOpen = false"
        >
        <div class="container-wide screen-min flex flex-col justify-center pt-[calc(var(--nav-offset)+clamp(1rem,3svh,2rem))] pb-[clamp(2rem,6svh,4rem)]">
          <div class="flex items-center justify-between">
            <span class="eyebrow eyebrow-lime">Pencarian</span>
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-lime-soft hover:text-lime-soft"
              aria-label="Tutup pencarian"
              @click="searchOpen = false"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <form class="mt-8 border-b border-white/15 pb-5" @submit.prevent="submitSearch()">
            <div class="flex items-center gap-4">
              <span class="hidden h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-lime text-white sm:flex">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="10.5" cy="10.5" r="7" />
                  <path d="M16 16l5 5" stroke-linecap="round" />
                </svg>
              </span>
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="search"
                placeholder="Cari berita, agenda, atau kegiatan..."
                class="min-w-0 flex-1 bg-transparent font-display text-2xl font-semibold tracking-tight text-white placeholder:text-white/60 focus:outline-none sm:text-5xl"
                aria-label="Kata kunci pencarian"
              />
              <button type="submit" class="btn btn-lime hidden sm:inline-flex">
                Cari
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </form>

          <div class="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap items-center gap-2">
              <span class="mr-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/60">Coba</span>
              <button
                v-for="term in quickSearches"
                :key="term"
                type="button"
                class="chip chip-dark"
                @click="searchQuery = term; submitSearch(term)"
              >
                {{ term }}
              </button>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
              ESC untuk menutup · Ctrl K untuk membuka
            </span>
          </div>
        </div>
      </div>
      </Transition>
    </Teleport>

    <!-- Mobile menu -->
    <Teleport to="body">
      <Transition name="menu">
        <div
          v-if="isMenuOpen"
          class="fixed inset-0 z-[60] overflow-y-auto bg-ink text-paper lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi seluler"
          @click.stop
          @click.self="isMenuOpen = false"
        >
        <div class="container-wide pb-12 pt-[calc(var(--nav-offset)+clamp(1.25rem,4svh,2.5rem))]">
          <div class="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <span class="eyebrow eyebrow-lime">Menu</span>
            <div class="flex items-center gap-3">
              <span class="hidden text-[9px] font-black uppercase tracking-[0.2em] text-white/60 sm:inline">{{ chapterName }}</span>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-lime-soft hover:text-lime-soft"
                aria-label="Tutup menu"
                @click="isMenuOpen = false"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <nav class="mt-7 flex flex-col" aria-label="Navigasi seluler">
            <div v-for="(item, index) in navItems" :key="item.to" class="border-b border-white/10">
              <div v-if="item.children">
                <button
                  type="button"
                  class="flex w-full items-center justify-between py-5 text-left"
                  :aria-expanded="mobileOpenSection === item.label"
                  @click="mobileOpenSection = mobileOpenSection === item.label ? null : item.label"
                >
                  <span class="flex items-baseline gap-4">
                    <span class="text-[9px] font-black text-lime-soft/60">{{ String(index + 1).padStart(2, '0') }}</span>
                    <span class="font-display text-[2rem] font-semibold tracking-tight">{{ item.label }}</span>
                  </span>
                  <svg class="h-4 w-4 text-lime-soft transition-transform" :class="mobileOpenSection === item.label ? 'rotate-45' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M12 5v14M5 12h14" stroke-linecap="round" />
                  </svg>
                </button>
                <div v-if="mobileOpenSection === item.label" class="pb-4 pl-9">
                  <RouterLink
                    v-for="child in item.children"
                    :key="child.hash"
                    :to="{ path: child.to, hash: child.hash }"
                    class="flex items-center justify-between border-t border-white/10 py-3 text-sm font-semibold text-white/55"
                    @click="closeAll"
                  >
                    {{ child.label }}
                    <span class="text-lime-soft">↗</span>
                  </RouterLink>
                </div>
              </div>
              <RouterLink
                v-else
                :to="item.to"
                class="flex items-baseline gap-4 py-5"
                @click="closeAll"
              >
                <span class="text-[9px] font-black text-lime-soft/60">{{ String(index + 1).padStart(2, '0') }}</span>
                <span
                  class="font-display text-[2rem] font-semibold tracking-tight transition-colors"
                  :class="isActive(item.to) ? 'text-lime-soft' : 'text-white'"
                >
                  {{ item.label }}
                </span>
              </RouterLink>
            </div>
          </nav>

          <div class="mt-8 grid gap-3 sm:grid-cols-2">
            <RouterLink :to="ctaItem.to" class="btn btn-lime w-full" @click="closeAll">
              Daftar LK 1
            </RouterLink>
            <RouterLink to="/login" class="btn btn-outline-light w-full" @click="closeAll">
              Masuk Admin
            </RouterLink>
          </div>

          <div class="mt-10 flex items-center justify-between border-t border-white/10 pt-5">
            <button type="button" class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60" @click="openSearch">
              <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6" />
                <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
              Cari di situs
            </button>
            <span class="text-[9px] font-black uppercase tracking-[0.18em] text-white/60">Yakin Usaha Sampai</span>
          </div>
        </div>
      </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
.drop-enter-active,
.drop-leave-active {
  transition: opacity 180ms ease, transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 260ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity 280ms ease, transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-18px);
}
</style>
