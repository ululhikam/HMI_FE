<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSiteStore } from '@/stores/site'
import StarMark from '@/components/ui/StarMark.vue'

const auth = useAuthStore()
const siteStore = useSiteStore()
const route = useRoute()
const router = useRouter()
const isSidebarOpen = ref(true)
const isMobileOpen = ref(false)

const navItems = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: 'dashboard',
    paths: ['M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'],
  },
  {
    label: 'Berita',
    to: '/admin/berita',
    icon: 'newspaper',
    paths: ['M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z'],
  },
  {
    label: 'Agenda',
    to: '/admin/agenda',
    icon: 'calendar',
    paths: ['M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
  },
  {
    label: 'Galeri',
    to: '/admin/galeri',
    icon: 'photo',
    paths: ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
  },
  {
    label: 'Pendaftar LK 1',
    to: '/admin/pendaftar',
    icon: 'clipboard',
    paths: ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'],
  },
  {
    label: 'Pengurus',
    to: '/admin/pengurus',
    icon: 'users',
    paths: ['M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'],
  },
]

const currentLabel = computed(() => {
  if (route.path === '/admin/berita/baru') return 'Tulis berita'
  if (route.path.startsWith('/admin/berita/')) return 'Editor berita'
  const active = navItems.find((item) => route.path.startsWith(item.to))
  return active?.label ?? 'Dashboard'
})

const displayName = computed(() => siteStore.settings.organizationShortName || 'HMI')
const chapterName = computed(() => siteStore.settings.chapterName || 'Insan Cita')
const showLabels = computed(() => isSidebarOpen.value || isMobileOpen.value)
const userInitial = computed(() => auth.currentUser?.name?.charAt(0)?.toUpperCase() ?? 'A')
const formattedDate = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

async function handleLogout() {
  auth.logout()
  await router.push('/login')
}

watch(() => route.fullPath, () => {
  isMobileOpen.value = false
})

watch(isMobileOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

watch(isSidebarOpen, (open) => {
  localStorage.setItem('hmi-admin-sidebar', open ? 'open' : 'collapsed')
})

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') isMobileOpen.value = false
}

onMounted(() => {
  void siteStore.fetchSettings()
  const stored = localStorage.getItem('hmi-admin-sidebar')
  if (stored === 'collapsed') isSidebarOpen.value = false
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="admin-surface screen-min text-ink">
    <!-- Mobile backdrop -->
    <Transition name="fade">
      <div
        v-if="isMobileOpen"
        class="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm lg:hidden"
        @click="isMobileOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-[var(--admin-sidebar-width)] flex-col border-r border-white/10 bg-ink text-paper transition-all duration-300"
      :class="[
        isSidebarOpen ? 'lg:w-[var(--admin-sidebar-width)]' : 'lg:w-[var(--admin-sidebar-collapsed)]',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <!-- Brand -->
      <div class="flex h-[var(--admin-bar-height)] flex-shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <RouterLink to="/admin/dashboard" class="flex min-w-0 items-center gap-3" aria-label="Dashboard admin">
          <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper p-1.5 ring-1 ring-white/10">
            <img
              v-if="siteStore.settings.logoUrl"
              :src="siteStore.settings.logoUrl"
              :alt="displayName"
              class="h-full w-full object-contain"
            />
            <span v-else class="text-[9px] font-black text-ink">HMI</span>
          </span>
          <span v-if="showLabels" class="flex min-w-0 flex-col leading-none">
            <span class="truncate font-display text-sm font-bold tracking-tight text-white">{{ displayName }} Admin</span>
            <span class="mt-1 truncate text-[7px] font-black uppercase tracking-[0.2em] text-lime-soft">{{ chapterName }}</span>
          </span>
        </RouterLink>
        <button
          type="button"
          class="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Tutup menu"
          @click="isMobileOpen = false"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto px-3 py-5" aria-label="Navigasi admin">
        <div v-if="showLabels" class="mb-2 flex items-center gap-2 px-2">
          <span class="h-1 w-1 rounded-full bg-lime-soft" />
          <span class="text-[7px] font-black uppercase tracking-[0.2em] text-white/60">Ruang kerja</span>
        </div>
        <div class="space-y-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :title="!showLabels ? item.label : undefined"
            class="admin-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/60 transition-all duration-200 hover:bg-white/5 hover:text-white"
          >
            <span class="flex h-5 w-5 flex-shrink-0 items-center justify-center">
              <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path v-for="(path, index) in item.paths" :key="index" :d="path" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span v-if="showLabels" class="flex-1 truncate text-[11px] font-extrabold uppercase tracking-[0.08em]">{{ item.label }}</span>
          </RouterLink>
        </div>

        <!-- Quick create -->
        <div class="mt-6" :class="showLabels ? '' : 'lg:mt-8'">
          <RouterLink
            to="/admin/berita/baru"
            class="flex items-center justify-between gap-2 rounded-xl border border-dashed border-white/15 px-3 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-white/60 transition-all hover:border-lime-soft hover:text-lime-soft"
            :title="!showLabels ? 'Tulis berita' : undefined"
          >
            <span class="flex items-center gap-2.5">
              <svg class="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" stroke-linecap="round" />
              </svg>
              <span v-if="showLabels">Tulis berita</span>
            </span>
            <span v-if="showLabels" class="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-[8px]">+</span>
          </RouterLink>
        </div>
      </nav>

      <!-- Footer -->
      <div class="flex-shrink-0 space-y-1 border-t border-white/10 p-3">
        <RouterLink
          to="/"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/60 transition-all hover:bg-white/5 hover:text-white"
          title="Lihat situs publik"
        >
          <svg class="h-[18px] w-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span v-if="showLabels" class="text-[10px] font-extrabold uppercase tracking-[0.1em]">Lihat situs</span>
          <svg v-if="showLabels" class="ml-auto h-3 w-3 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </RouterLink>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-300/60 transition-all hover:bg-red-500/10 hover:text-red-300"
          title="Keluar"
          @click="handleLogout"
        >
          <svg class="h-[18px] w-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span v-if="showLabels" class="text-[10px] font-extrabold uppercase tracking-[0.1em]">Keluar</span>
        </button>
        <div v-if="showLabels" class="flex items-center justify-between border-t border-white/10 px-3 pt-4">
          <span class="text-[7px] font-black uppercase tracking-[0.16em] text-white/60">Yakin Usaha Sampai</span>
          <StarMark :size="12" class="text-lime-soft/60" />
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div
      class="screen-min flex flex-col transition-[margin] duration-300"
      :class="isSidebarOpen ? 'lg:ml-[var(--admin-sidebar-width)]' : 'lg:ml-[var(--admin-sidebar-collapsed)]'"
    >
      <!-- Top bar -->
      <header class="sticky top-0 z-30 flex h-[var(--admin-bar-height)] flex-shrink-0 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur-xl sm:px-6">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full text-ink/55 transition-colors hover:bg-paper hover:text-ink lg:hidden"
          aria-label="Buka menu"
          @click="isMobileOpen = true"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" />
          </svg>
        </button>
        <button
          type="button"
          class="hidden h-9 w-9 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-paper hover:text-ink lg:flex"
          :aria-label="isSidebarOpen ? 'Ciutkan sidebar' : 'Bentangkan sidebar'"
          @click="isSidebarOpen = !isSidebarOpen"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M4 12h10M4 18h16" stroke-linecap="round" />
          </svg>
        </button>

        <div class="hidden min-w-0 flex-col leading-none sm:flex">
          <span class="text-[7px] font-black uppercase tracking-[0.18em] text-muted">Admin / {{ currentLabel }}</span>
          <span class="mt-1.5 truncate font-display text-base font-bold tracking-tight text-ink">{{ currentLabel }}</span>
        </div>
        <span class="truncate font-display text-sm font-bold tracking-tight text-ink sm:hidden">{{ currentLabel }}</span>
        <div class="flex-1" />
        <span class="hidden text-[9px] font-bold uppercase tracking-[0.08em] text-muted xl:block">{{ formattedDate }}</span>
        <div class="mx-2 hidden h-6 w-px bg-line xl:block" />
        <RouterLink
          to="/"
          class="hidden h-9 items-center gap-2 rounded-full border border-line px-3.5 text-[8px] font-black uppercase tracking-[0.12em] text-ink/55 transition-colors hover:border-ink hover:text-ink sm:flex"
        >
          Lihat situs
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </RouterLink>
        <div class="flex items-center gap-2 border-l border-line pl-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-xs font-bold text-lime-soft">
            {{ userInitial }}
          </span>
          <div class="hidden min-w-0 leading-none sm:block">
            <div class="max-w-[10rem] truncate text-[11px] font-extrabold text-ink">{{ auth.currentUser?.name ?? 'Admin' }}</div>
            <div class="mt-1 text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{{ auth.currentUser?.role ?? 'admin' }}</div>
          </div>
          <button
            type="button"
            class="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink"
            title="Keluar"
            aria-label="Keluar dari panel admin"
            @click="handleLogout"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Page -->
      <main class="flex-1 px-[var(--admin-gutter)] py-[clamp(1rem,2.5svh,1.75rem)]">
        <RouterView />
      </main>

      <footer class="flex flex-col gap-2 border-t border-line px-4 py-4 text-[8px] font-bold uppercase tracking-[0.1em] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>{{ siteStore.settings.organizationName || 'HMI Komisariat Insan Cita' }}</span>
        <span class="flex items-center gap-1.5">
          Panel pengurus
          <span class="h-1 w-1 rounded-full bg-moss" />
          Yakin Usaha Sampai
        </span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.admin-nav-link.router-link-active {
  background-color: var(--color-lime);
  color: var(--color-paper);
}
</style>
