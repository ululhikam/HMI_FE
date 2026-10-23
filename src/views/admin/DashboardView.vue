<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()
const stats = computed(() => dashboardStore.stats)

const statCards = computed(() => {
  const s = stats.value
  return [
    {
      id: 'articles',
      label: 'Berita & Opini',
      value: s ? s.totalArticles : '—',
      primaryStat: s ? `${s.publishedArticles} Publik` : '...',
      secondaryStat: s ? `${s.draftArticles} Draft` : '...',
      sub: s ? `${s.totalViews.toLocaleString()} Pembaca` : 'Memuat data...',
      icon: 'newspaper',
      gradient: 'from-[#009246] to-[#00A651]',
      to: '/admin/berita',
    },
    {
      id: 'events',
      label: 'Agenda Kegiatan',
      value: s ? s.totalEvents : '—',
      primaryStat: s ? `${s.upcomingEvents} Akan Datang` : '...',
      secondaryStat: s ? `${s.doneEvents} Selesai` : '...',
      sub: s ? `${s.ongoingEvents} Berlangsung` : 'Memuat data...',
      icon: 'calendar',
      gradient: 'from-[#006837] to-[#009246]',
      to: '/admin/agenda',
    },
    {
      id: 'gallery',
      label: 'Galeri Dokumentasi',
      value: s ? s.totalGalleryItems : '—',
      primaryStat: s ? `${s.totalPhotos} Foto` : '...',
      secondaryStat: s ? `${s.totalVideos} Video` : '...',
      sub: 'Arsip media kegiatan',
      icon: 'photo',
      gradient: 'from-[#014421] to-[#006837]',
      to: '/admin/galeri',
    },
    {
      id: 'applicants',
      label: 'Pendaftar LK 1',
      value: s ? s.totalApplicants : '—',
      primaryStat: s ? `${s.pendingApplicants} Menunggu` : '...',
      secondaryStat: s ? `${s.acceptedApplicants} Diterima` : '...',
      sub: 'Calon kader baru',
      icon: 'clipboard',
      gradient: 'from-[#111212] to-[#222424]',
      to: '/admin/pendaftar',
    },
    {
      id: 'members',
      label: 'Pengurus & BPH',
      value: s ? s.totalMembers : '—',
      primaryStat: 'Kader Aktif',
      secondaryStat: 'Struktur BPH',
      sub: 'Personalia organisasi',
      icon: 'users',
      gradient: 'from-[#005a36] to-[#008f4c]',
      to: '/admin/pengurus',
    },
    {
      id: 'interactions',
      label: 'Pembaca & Audiens',
      value: s ? s.totalViews.toLocaleString() : '—',
      primaryStat: s ? `${s.newMessages} Pesan Baru` : '...',
      secondaryStat: s ? `${s.totalNewsletters} Newsletter` : '...',
      sub: s ? `${s.totalMessages} Total Kontak` : 'Interaksi publik',
      icon: 'chart',
      gradient: 'from-[#17261e] to-[#111212]',
      to: '/admin/berita',
    },
  ]
})

const recentArticles = computed(() => stats.value?.recentArticles ?? [])
const recentEvents = computed(() => stats.value?.recentEvents ?? [])
const recentApplicants = computed(() => stats.value?.recentApplicants ?? [])

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => {
  void dashboardStore.fetchStats(true)
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header Page -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-[#111212] tracking-tight">Dashboard Ringkasan</h1>
        <p class="text-[#4D4D4D] text-sm mt-1">
          Statistik menyeluruh dari semua modul manajemen konten & operasional HMI Komisariat Insan Cita
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="dashboardStore.fetchStats(true)"
          :disabled="dashboardStore.isLoading"
          class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E6E6E6] rounded-xl text-xs font-bold text-[#111212] hover:bg-[#F7F7F5] transition-colors shadow-sm disabled:opacity-50"
        >
          <svg
            class="w-3.5 h-3.5 text-[#009246]"
            :class="{ 'animate-spin': dashboardStore.isLoading }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ dashboardStore.isLoading ? 'Memperbarui...' : 'Segarkan Data' }}</span>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="dashboardStore.error" class="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl flex items-center gap-3">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ dashboardStore.error }}</span>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         1. 6 STAT CARDS (Seluruh Modul Manajemen Konten)
    ══════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <RouterLink
        v-for="card in statCards"
        :key="card.id"
        :to="card.to"
        class="group relative rounded-2xl p-6 text-white overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[170px]"
        :class="`bg-gradient-to-br ${card.gradient}`"
      >
        <div class="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />

        <div class="flex items-start justify-between mb-3">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-white/75">{{ card.label }}</span>
            <div class="text-3xl sm:text-4xl font-black mt-1 tracking-tight">{{ card.value }}</div>
          </div>

          <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <!-- Newspaper -->
            <svg v-if="card.icon === 'newspaper'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <!-- Calendar -->
            <svg v-else-if="card.icon === 'calendar'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <!-- Photo -->
            <svg v-else-if="card.icon === 'photo'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <!-- Clipboard -->
            <svg v-else-if="card.icon === 'clipboard'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <!-- Users -->
            <svg v-else-if="card.icon === 'users'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <!-- Chart / Analytics -->
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <div class="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-md bg-white/20 font-bold">{{ card.primaryStat }}</span>
            <span class="text-white/80 font-medium">{{ card.secondaryStat }}</span>
          </div>
          <span class="text-white/60 text-[11px] truncate max-w-[110px] text-right">{{ card.sub }}</span>
        </div>
      </RouterLink>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         2. QUICK ACTIONS (Akses Langsung ke Seluruh Manajemen)
    ══════════════════════════════════════════════════════════ -->
    <div class="bg-white rounded-2xl border border-[#E6E6E6] p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-extrabold text-[#111212] uppercase tracking-wider">Aksi Cepat Manajemen Konten</h2>
        <span class="text-xs text-gray-400">Pintasan operasional admin</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <RouterLink
          to="/admin/berita"
          class="flex flex-col items-center justify-center text-center p-3.5 rounded-xl border border-gray-100 hover:border-[#009246] hover:bg-emerald-50/50 transition-all group"
        >
          <div class="w-9 h-9 rounded-lg bg-emerald-100 text-[#009246] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <span class="text-xs font-bold text-[#111212]">Tulis Berita</span>
          <span class="text-[10px] text-gray-400 mt-0.5">Artikel & opini</span>
        </RouterLink>

        <RouterLink
          to="/admin/agenda"
          class="flex flex-col items-center justify-center text-center p-3.5 rounded-xl border border-gray-100 hover:border-[#009246] hover:bg-emerald-50/50 transition-all group"
        >
          <div class="w-9 h-9 rounded-lg bg-emerald-100 text-[#009246] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span class="text-xs font-bold text-[#111212]">Buat Agenda</span>
          <span class="text-[10px] text-gray-400 mt-0.5">Jadwal kegiatan</span>
        </RouterLink>

        <RouterLink
          to="/admin/galeri"
          class="flex flex-col items-center justify-center text-center p-3.5 rounded-xl border border-gray-100 hover:border-[#009246] hover:bg-emerald-50/50 transition-all group"
        >
          <div class="w-9 h-9 rounded-lg bg-emerald-100 text-[#009246] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span class="text-xs font-bold text-[#111212]">Unggah Galeri</span>
          <span class="text-[10px] text-gray-400 mt-0.5">Foto & video</span>
        </RouterLink>

        <RouterLink
          to="/admin/pendaftar"
          class="flex flex-col items-center justify-center text-center p-3.5 rounded-xl border border-gray-100 hover:border-[#009246] hover:bg-emerald-50/50 transition-all group"
        >
          <div class="w-9 h-9 rounded-lg bg-emerald-100 text-[#009246] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <span class="text-xs font-bold text-[#111212]">Review Pendaftar</span>
          <span class="text-[10px] text-gray-400 mt-0.5">Formulir LK 1</span>
        </RouterLink>

        <RouterLink
          to="/admin/pengurus"
          class="flex flex-col items-center justify-center text-center p-3.5 rounded-xl border border-gray-100 hover:border-[#009246] hover:bg-emerald-50/50 transition-all group col-span-2 sm:col-span-1"
        >
          <div class="w-9 h-9 rounded-lg bg-emerald-100 text-[#009246] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <span class="text-xs font-bold text-[#111212]">Kelola Pengurus</span>
          <span class="text-[10px] text-gray-400 mt-0.5">Struktur BPH</span>
        </RouterLink>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         3. DATA TABLES & RECENT ACTIVITY
    ══════════════════════════════════════════════════════════ -->
    <div class="grid lg:grid-cols-12 gap-6">
      
      <!-- Left Column (8 cols): Artikel & Agenda Terbaru -->
      <div class="lg:col-span-8 space-y-6">

        <!-- Recent Articles -->
        <div class="bg-white rounded-2xl shadow-sm border border-[#E6E6E6] overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#E6E6E6]">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-[#009246]" />
              <h2 class="font-extrabold text-[#111212] text-sm">Artikel Berita Terbaru</h2>
            </div>
            <RouterLink to="/admin/berita" class="text-[#009246] text-xs font-bold hover:underline flex items-center gap-1">
              Semua Berita ({{ stats?.totalArticles ?? 0 }})
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </RouterLink>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-[#F7F7F5]">
                  <th class="text-left px-6 py-3 text-[#4D4D4D] font-bold text-xs uppercase tracking-wider">Judul</th>
                  <th class="text-left px-4 py-3 text-[#4D4D4D] font-bold text-xs uppercase tracking-wider">Kategori</th>
                  <th class="text-left px-4 py-3 text-[#4D4D4D] font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Tanggal</th>
                  <th class="text-left px-4 py-3 text-[#4D4D4D] font-bold text-xs uppercase tracking-wider hidden md:table-cell">Views</th>
                  <th class="text-left px-4 py-3 text-[#4D4D4D] font-bold text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E6E6E6]">
                <tr v-for="article in recentArticles" :key="article.id" class="hover:bg-[#F7F7F5] transition-colors">
                  <td class="px-6 py-3 font-semibold text-[#111212] max-w-[220px] truncate">{{ article.title }}</td>
                  <td class="px-4 py-3">
                    <span class="bg-[#009246]/10 text-[#009246] text-xs font-bold px-2 py-0.5 rounded-full">{{ article.category }}</span>
                  </td>
                  <td class="px-4 py-3 text-[#4D4D4D] text-xs hidden sm:table-cell">{{ formatDate(article.publishedAt) }}</td>
                  <td class="px-4 py-3 text-[#4D4D4D] text-xs hidden md:table-cell font-mono">
                    {{ article.views.toLocaleString() }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      :class="article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
                    >
                      {{ article.status === 'published' ? 'Publik' : 'Draft' }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!recentArticles.length">
                  <td colspan="5" class="px-6 py-8 text-center text-sm text-[#4D4D4D]">
                    {{ dashboardStore.isLoading ? 'Memuat artikel...' : 'Belum ada artikel yang ditambahkan.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Events -->
        <div class="bg-white rounded-2xl shadow-sm border border-[#E6E6E6] overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#E6E6E6]">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-[#006837]" />
              <h2 class="font-extrabold text-[#111212] text-sm">Agenda & Jadwal Kegiatan Terbaru</h2>
            </div>
            <RouterLink to="/admin/agenda" class="text-[#009246] text-xs font-bold hover:underline flex items-center gap-1">
              Semua Agenda ({{ stats?.totalEvents ?? 0 }})
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </RouterLink>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-[#F7F7F5]">
                  <th class="text-left px-6 py-3 text-[#4D4D4D] font-bold text-xs uppercase tracking-wider">Kegiatan</th>
                  <th class="text-left px-4 py-3 text-[#4D4D4D] font-bold text-xs uppercase tracking-wider">Kategori</th>
                  <th class="text-left px-4 py-3 text-[#4D4D4D] font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Waktu</th>
                  <th class="text-left px-4 py-3 text-[#4D4D4D] font-bold text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E6E6E6]">
                <tr v-for="event in recentEvents" :key="event.id" class="hover:bg-[#F7F7F5] transition-colors">
                  <td class="px-6 py-3 font-semibold text-[#111212] max-w-[200px] truncate">
                    <div>{{ event.title }}</div>
                    <div class="text-[11px] text-gray-400 font-normal truncate">{{ event.location }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">{{ event.category }}</span>
                  </td>
                  <td class="px-4 py-3 text-[#4D4D4D] text-xs hidden sm:table-cell">{{ formatDate(event.date) }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      :class="{
                        'bg-blue-100 text-blue-700': event.status === 'upcoming',
                        'bg-emerald-100 text-emerald-700': event.status === 'ongoing',
                        'bg-gray-100 text-gray-700': event.status === 'done',
                      }"
                    >
                      {{ event.status === 'upcoming' ? 'Mendatang' : event.status === 'ongoing' ? 'Berlangsung' : 'Selesai' }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!recentEvents.length">
                  <td colspan="4" class="px-6 py-8 text-center text-sm text-[#4D4D4D]">
                    {{ dashboardStore.isLoading ? 'Memuat agenda...' : 'Belum ada agenda kegiatan yang ditambahkan.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Right Column (4 cols): Pendaftar LK1 Terbaru & Ringkasan Metrik -->
      <div class="lg:col-span-4 space-y-6">

        <!-- Recent LK 1 Applicants -->
        <div class="bg-white rounded-2xl shadow-sm border border-[#E6E6E6] overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-[#E6E6E6]">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-[#111212]" />
              <h2 class="font-extrabold text-[#111212] text-sm">Pendaftar LK 1 Terbaru</h2>
            </div>
            <RouterLink to="/admin/pendaftar" class="text-[#009246] text-xs font-bold hover:underline flex items-center gap-1">
              Semua ({{ stats?.totalApplicants ?? 0 }})
            </RouterLink>
          </div>

          <div class="divide-y divide-gray-100">
            <div
              v-for="app in recentApplicants"
              :key="app.id"
              class="p-4 hover:bg-[#F7F7F5] transition-colors"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="text-sm font-bold text-[#111212] truncate">{{ app.fullName }}</div>
                  <div class="text-xs text-gray-500 truncate">{{ app.faculty }} • {{ app.university }}</div>
                  <div class="text-[10px] text-gray-400 mt-1 font-mono">NIM: {{ app.nim }}</div>
                </div>

                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase"
                  :class="{
                    'bg-amber-100 text-amber-700': app.status === 'pending',
                    'bg-emerald-100 text-emerald-700': app.status === 'accepted',
                    'bg-red-100 text-red-700': app.status === 'rejected',
                  }"
                >
                  {{ app.status }}
                </span>
              </div>
            </div>

            <div v-if="!recentApplicants.length" class="p-8 text-center text-sm text-[#4D4D4D]">
              {{ dashboardStore.isLoading ? 'Memuat pendaftar...' : 'Belum ada data pendaftar baru.' }}
            </div>
          </div>
        </div>

        <!-- Quick Summary Status Card -->
        <div class="bg-gradient-to-br from-[#111212] to-[#1a1a1a] text-white rounded-2xl p-6 shadow-md border border-white/5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold tracking-wide uppercase text-[#009246]">Status Sistem Konten</h3>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <p class="text-xs text-white/60 leading-relaxed">
            Portal HMI Insan Cita terhubung langsung secara real-time dengan basis data Supabase.
          </p>

          <div class="space-y-3 pt-2 text-xs">
            <div>
              <div class="flex justify-between text-white/80 mb-1">
                <span>Rasio Publikasi Artikel</span>
                <span class="font-bold">
                  {{ stats?.totalArticles ? Math.round(((stats.publishedArticles || 0) / stats.totalArticles) * 100) : 0 }}%
                </span>
              </div>
              <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  class="h-full bg-[#009246] rounded-full transition-all duration-500"
                  :style="{
                    width: `${stats?.totalArticles ? Math.round(((stats.publishedArticles || 0) / stats.totalArticles) * 100) : 0}%`
                  }"
                />
              </div>
            </div>

            <div>
              <div class="flex justify-between text-white/80 mb-1">
                <span>Pendaftar Terverifikasi</span>
                <span class="font-bold">
                  {{ stats?.totalApplicants ? Math.round(((stats.acceptedApplicants || 0) / stats.totalApplicants) * 100) : 0 }}%
                </span>
              </div>
              <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  class="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  :style="{
                    width: `${stats?.totalApplicants ? Math.round(((stats.acceptedApplicants || 0) / stats.totalApplicants) * 100) : 0}%`
                  }"
                />
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
            <span>Versi Panel: v1.0 Production</span>
            <span class="text-emerald-400 font-bold">Online</span>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>
