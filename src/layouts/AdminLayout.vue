<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const isSidebarOpen = ref(true)

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Berita & Artikel', to: '/admin/berita', icon: 'newspaper' },
  { label: 'Agenda & Kegiatan', to: '/admin/agenda', icon: 'calendar' },
  { label: 'Galeri', to: '/admin/galeri', icon: 'photo' },
  { label: 'Pendaftar LK 1', to: '/admin/pendaftar', icon: 'clipboard' },
  { label: 'Pengurus', to: '/admin/pengurus', icon: 'users' },
]

async function handleLogout() {
  auth.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#F7F7F5] flex">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex flex-col bg-[#111212] transition-all duration-300"
      :class="isSidebarOpen ? 'w-64' : 'w-[72px]'"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 h-[72px] px-4 border-b border-white/10">
        <div class="h-10 w-10 flex items-center justify-center flex-shrink-0">
          <img
            src="/logo-komisariat.jpg"
            alt="Logo HMI Komisariat Insan Cita"
            class="h-full w-full object-contain rounded-full ring-1 ring-white/15 drop-shadow"
          />
        </div>
        <Transition name="fade-label">
          <div v-if="isSidebarOpen">
            <div class="text-white font-extrabold text-sm">Admin Panel</div>
            <div class="text-[#009246] text-[9.5px] font-bold tracking-wider uppercase">HMI Kom. Insan Cita</div>
          </div>
        </Transition>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 group"
          active-class="!text-white !bg-[#009246]/20 !border !border-[#009246]/30"
        >
          <div class="w-5 h-5 flex items-center justify-center flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <!-- Dashboard -->
            <svg v-if="item.icon === 'dashboard'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <!-- Berita & Artikel -->
            <svg v-else-if="item.icon === 'newspaper'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <!-- Agenda & Kegiatan -->
            <svg v-else-if="item.icon === 'calendar'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <!-- Galeri -->
            <svg v-else-if="item.icon === 'photo'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <!-- Pendaftar LK 1 -->
            <svg v-else-if="item.icon === 'clipboard'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <!-- Pengurus -->
            <svg v-else-if="item.icon === 'users'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <Transition name="fade-label">
            <span v-if="isSidebarOpen" class="text-sm font-semibold truncate">{{ item.label }}</span>
          </Transition>
        </RouterLink>
      </nav>

      <!-- Bottom -->
      <div class="border-t border-white/10 p-3 space-y-2">
        <RouterLink to="/" class="flex items-center gap-3 px-3 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm font-semibold">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <Transition name="fade-label"><span v-if="isSidebarOpen">Lihat Website</span></Transition>
        </RouterLink>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-semibold"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <Transition name="fade-label"><span v-if="isSidebarOpen">Keluar</span></Transition>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-h-screen" :class="isSidebarOpen ? 'ml-64' : 'ml-[72px]'" style="transition: margin 0.3s">

      <!-- Top bar -->
      <header class="sticky top-0 z-30 h-[72px] bg-white border-b border-[#E6E6E6] flex items-center gap-4 px-6 shadow-sm">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-[#4D4D4D] hover:bg-[#E6E6E6] transition-colors"
          title="Toggle Sidebar"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div class="flex-1" />
        <button class="w-9 h-9 rounded-lg flex items-center justify-center text-[#4D4D4D] hover:bg-[#E6E6E6] relative" title="Notifikasi">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-[#009246] rounded-full border-2 border-white" />
        </button>
        <div class="flex items-center gap-3 pl-3 border-l border-[#E6E6E6]">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#009246] to-[#006837] flex items-center justify-center text-white font-bold text-sm">
            {{ auth.currentUser?.name?.charAt(0) ?? 'A' }}
          </div>
          <div class="hidden sm:block">
            <div class="text-[#111212] font-semibold text-sm">{{ auth.currentUser?.name ?? 'Admin' }}</div>
            <div class="text-[#4D4D4D] text-xs capitalize">{{ auth.currentUser?.role ?? 'admin' }}</div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-label-enter-active, .fade-label-leave-active {
  transition: opacity 0.2s, transform 0.2s;
  overflow: hidden;
}
.fade-label-enter-from, .fade-label-leave-to {
  opacity: 0;
}
</style>
