<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import StarMark from '@/components/ui/StarMark.vue'

const auth = useAuthStore()
const dashboardStore = useDashboardStore()
const stats = computed(() => dashboardStore.stats)

const statCards = computed(() => {
  const s = stats.value
  return [
    {
      id: 'articles',
      label: 'Berita',
      value: s ? s.totalArticles : '—',
      primaryStat: s ? `${s.publishedArticles} publik` : 'Memuat',
      secondaryStat: s ? `${s.draftArticles} draf` : '',
      sub: s ? `${s.totalViews.toLocaleString('id-ID')} pembaca` : 'Memuat data',
      icon: 'newspaper',
      theme: 'lime',
      to: '/admin/berita',
      paths: ['M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z'],
    },
    {
      id: 'events',
      label: 'Agenda kegiatan',
      value: s ? s.totalEvents : '—',
      primaryStat: s ? `${s.upcomingEvents} mendatang` : 'Memuat',
      secondaryStat: s ? `${s.doneEvents} selesai` : '',
      sub: s ? `${s.ongoingEvents} berlangsung` : 'Memuat data',
      icon: 'calendar',
      theme: 'dark',
      to: '/admin/agenda',
      paths: ['M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
    },
    {
      id: 'gallery',
      label: 'Galeri dokumentasi',
      value: s ? s.totalGalleryItems : '—',
      primaryStat: s ? `${s.totalPhotos} foto` : 'Memuat',
      secondaryStat: s ? `${s.totalVideos} video` : '',
      sub: 'Arsip media kegiatan',
      icon: 'photo',
      theme: 'light',
      to: '/admin/galeri',
      paths: ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
    },
    {
      id: 'applicants',
      label: 'Pendaftar LK 1',
      value: s ? s.totalApplicants : '—',
      primaryStat: s ? `${s.pendingApplicants} menunggu` : 'Memuat',
      secondaryStat: s ? `${s.acceptedApplicants} diterima` : '',
      sub: 'Calon kader baru',
      icon: 'clipboard',
      theme: 'light',
      to: '/admin/pendaftar',
      paths: ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'],
    },
    {
      id: 'members',
      label: 'Pengurus & BPH',
      value: s ? s.totalMembers : '—',
      primaryStat: 'Kader aktif',
      secondaryStat: 'Struktur BPH',
      sub: 'Personalia organisasi',
      icon: 'users',
      theme: 'light',
      to: '/admin/pengurus',
      paths: ['M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'],
    },
    {
      id: 'interactions',
      label: 'Pembaca & audiens',
      value: s ? s.totalViews.toLocaleString('id-ID') : '—',
      primaryStat: s ? `${s.newMessages} pesan baru` : 'Memuat',
      secondaryStat: s ? `${s.totalNewsletters} newsletter` : '',
      sub: s ? `${s.totalMessages} total kontak` : 'Interaksi publik',
      icon: 'chart',
      theme: 'light',
      to: '/admin/berita',
      paths: ['M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'],
    },
  ]
})

const quickActions = [
  { label: 'Tulis berita', caption: 'Publikasi terbaru', to: '/admin/berita/baru', paths: ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'] },
  { label: 'Buat agenda', caption: 'Jadwal kegiatan', to: '/admin/agenda', paths: ['M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'] },
  { label: 'Unggah galeri', caption: 'Foto & video', to: '/admin/galeri', paths: ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'] },
  { label: 'Review pendaftar', caption: 'Formulir LK 1', to: '/admin/pendaftar', paths: ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'] },
  { label: 'Kelola pengurus', caption: 'Struktur BPH', to: '/admin/pengurus', paths: ['M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'] },
]

const recentArticles = computed(() => stats.value?.recentArticles ?? [])
const recentEvents = computed(() => stats.value?.recentEvents ?? [])
const recentApplicants = computed(() => stats.value?.recentApplicants ?? [])

const publicationRate = computed(() =>
  stats.value?.totalArticles
    ? Math.round(((stats.value.publishedArticles || 0) / stats.value.totalArticles) * 100)
    : 0,
)
const acceptanceRate = computed(() =>
  stats.value?.totalApplicants
    ? Math.round(((stats.value.acceptedApplicants || 0) / stats.value.totalApplicants) * 100)
    : 0,
)

const firstName = computed(() => auth.currentUser?.name?.split(/\s+/)[0] || 'Admin')

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function applicantStatus(status: string) {
  if (status === 'accepted') return { label: 'Diterima', class: 'bg-lime/30 text-forest' }
  if (status === 'rejected') return { label: 'Ditolak', class: 'bg-red-50 text-red-600' }
  return { label: 'Menunggu', class: 'bg-amber-50 text-amber-700' }
}

function eventStatus(status: string) {
  if (status === 'ongoing') return { label: 'Berlangsung', class: 'bg-lime/30 text-forest' }
  if (status === 'done') return { label: 'Selesai', class: 'bg-paper text-muted' }
  return { label: 'Mendatang', class: 'bg-amber-50 text-amber-700' }
}

onMounted(() => {
  void dashboardStore.fetchStats(true)
})
</script>

<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <span class="eyebrow eyebrow-ink">Ringkasan hari ini</span>
        <h1 class="display-md mt-4">Ruang kendali<span class="text-moss">.</span></h1>
        <p class="mt-2 max-w-xl text-xs font-semibold leading-relaxed text-muted">
          Selamat datang, {{ firstName }}. Pantau konten, agenda, dan pendaftar HMI Komisariat Insan Cita.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          :disabled="dashboardStore.isLoading"
          class="admin-btn admin-btn-ghost"
          @click="dashboardStore.fetchStats(true)"
        >
          <svg class="h-3.5 w-3.5" :class="{ 'animate-spin': dashboardStore.isLoading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ dashboardStore.isLoading ? 'Memperbarui...' : 'Segarkan' }}
        </button>
        <RouterLink to="/admin/berita/baru" class="admin-btn admin-btn-lime">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
          </svg>
          Tulis berita
        </RouterLink>
      </div>
    </div>

    <div v-if="dashboardStore.error" class="flex items-center gap-3 rounded-[1.1rem] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
      <svg class="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" />
      </svg>
      {{ dashboardStore.error }}
    </div>

    <!-- Stats -->
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <RouterLink
        v-for="card in statCards"
        :key="card.id"
        :to="card.to"
        class="group relative flex min-h-[clamp(9rem,22svh,12rem)] flex-col justify-between overflow-hidden rounded-[1.4rem] border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft"
        :class="card.theme === 'lime'
          ? 'border-lime bg-lime text-white'
          : card.theme === 'dark'
            ? 'border-ink bg-ink text-paper'
            : 'border-line bg-white text-ink'"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p
              class="text-[8px] font-black uppercase tracking-[0.16em]"
              :class="card.theme === 'dark' ? 'text-white/60' : card.theme === 'lime' ? 'text-ink/55' : 'text-muted'"
            >
              {{ card.label }}
            </p>
            <p class="mt-3 font-display text-4xl font-bold leading-none tracking-tight">{{ card.value }}</p>
          </div>
          <span
            class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-transform group-hover:scale-110"
            :class="card.theme === 'dark' ? 'border-white/15 bg-white/5 text-lime-soft' : card.theme === 'lime' ? 'border-ink/15 bg-ink/5 text-ink' : 'border-line bg-paper text-moss'"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path v-for="(path, index) in card.paths" :key="index" :d="path" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </div>

        <div
          class="mt-5 flex items-center justify-between gap-2 border-t pt-3 text-[9px] font-bold"
          :class="card.theme === 'dark' ? 'border-white/10 text-white/60' : 'border-ink/10 text-ink/60'"
        >
          <span class="flex min-w-0 flex-wrap items-center gap-1.5">
            <span
              class="rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.06em]"
              :class="card.theme === 'dark' ? 'bg-white/10 text-lime-soft' : 'bg-ink/10 text-ink'"
            >
              {{ card.primaryStat }}
            </span>
            <span class="truncate">{{ card.secondaryStat }}</span>
          </span>
          <span class="hidden flex-shrink-0 text-right sm:block">{{ card.sub }}</span>
        </div>
      </RouterLink>
    </div>

    <!-- Quick actions -->
    <div class="admin-card p-4 sm:p-5">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <StarMark :size="14" class="text-moss" />
          <h2 class="text-[9px] font-black uppercase tracking-[0.16em] text-ink">Aksi cepat</h2>
        </div>
        <span class="hidden text-[8px] font-bold uppercase tracking-[0.1em] text-muted sm:block">Pintasan operasional</span>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <RouterLink
          v-for="action in quickActions"
          :key="action.label"
          :to="action.to"
          class="group flex items-center gap-3 rounded-[0.9rem] border border-line bg-paper/50 p-3 transition-colors hover:border-ink/30 hover:bg-white"
        >
          <span class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-moss transition-colors group-hover:bg-lime group-hover:text-white">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
              <path v-for="(path, index) in action.paths" :key="index" :d="path" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="min-w-0">
            <span class="block truncate text-[10px] font-extrabold text-ink">{{ action.label }}</span>
            <span class="mt-0.5 block truncate text-[8px] font-semibold text-muted">{{ action.caption }}</span>
          </span>
        </RouterLink>
      </div>
    </div>

    <!-- Data -->
    <div class="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
      <div class="space-y-4">
        <!-- Articles -->
        <section class="admin-card overflow-hidden">
          <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <div class="flex items-center gap-2.5">
              <span class="h-1.5 w-1.5 rounded-full bg-moss" />
              <h2 class="text-[9px] font-black uppercase tracking-[0.14em] text-ink">Berita terbaru</h2>
            </div>
            <RouterLink to="/admin/berita" class="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.1em] text-moss transition-colors hover:text-ink">
              Semua ({{ stats?.totalArticles ?? 0 }})
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Kategori</th>
                  <th class="hidden sm:table-cell">Tanggal</th>
                  <th class="hidden md:table-cell">Dibaca</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="article in recentArticles" :key="article.id">
                  <td class="max-w-[240px] truncate text-[11px] font-extrabold text-ink">{{ article.title }}</td>
                  <td>
                    <span class="rounded-full bg-paper px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] text-moss">{{ article.category }}</span>
                  </td>
                  <td class="hidden text-[10px] text-muted sm:table-cell">{{ formatDate(article.publishedAt) }}</td>
                  <td class="hidden font-mono text-[10px] text-muted md:table-cell">{{ article.views.toLocaleString('id-ID') }}</td>
                  <td>
                    <span
                      class="rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em]"
                      :class="article.status === 'published' ? 'bg-lime/30 text-forest' : 'bg-amber-50 text-amber-700'"
                    >
                      {{ article.status === 'published' ? 'Publik' : 'Draf' }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!recentArticles.length">
                  <td colspan="5" class="py-10 text-center text-[11px] font-semibold text-muted">
                    {{ dashboardStore.isLoading ? 'Memuat berita...' : 'Belum ada berita.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Events -->
        <section class="admin-card overflow-hidden">
          <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <div class="flex items-center gap-2.5">
              <span class="h-1.5 w-1.5 rounded-full bg-moss" />
              <h2 class="text-[9px] font-black uppercase tracking-[0.14em] text-ink">Agenda terbaru</h2>
            </div>
            <RouterLink to="/admin/agenda" class="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.1em] text-moss transition-colors hover:text-ink">
              Semua ({{ stats?.totalEvents ?? 0 }})
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Kegiatan</th>
                  <th>Kategori</th>
                  <th class="hidden sm:table-cell">Waktu</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="event in recentEvents" :key="event.id">
                  <td class="max-w-[220px]">
                    <div class="truncate text-[11px] font-extrabold text-ink">{{ event.title }}</div>
                    <div class="mt-0.5 truncate text-[9px] font-medium text-muted">{{ event.location }}</div>
                  </td>
                  <td>
                    <span class="rounded-full bg-paper px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] text-moss">{{ event.category }}</span>
                  </td>
                  <td class="hidden text-[10px] text-muted sm:table-cell">{{ formatDate(event.date) }}</td>
                  <td>
                    <span class="rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em]" :class="eventStatus(event.status).class">
                      {{ eventStatus(event.status).label }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!recentEvents.length">
                  <td colspan="4" class="py-10 text-center text-[11px] font-semibold text-muted">
                    {{ dashboardStore.isLoading ? 'Memuat agenda...' : 'Belum ada agenda.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div class="space-y-4">
        <!-- Applicants -->
        <section class="admin-card overflow-hidden">
          <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
            <div class="flex items-center gap-2.5">
              <span class="h-1.5 w-1.5 rounded-full bg-moss" />
              <h2 class="text-[9px] font-black uppercase tracking-[0.14em] text-ink">Pendaftar terbaru</h2>
            </div>
            <RouterLink to="/admin/pendaftar" class="text-[8px] font-black uppercase tracking-[0.1em] text-moss transition-colors hover:text-ink">
              Semua
            </RouterLink>
          </div>
          <div class="divide-y divide-line">
            <div v-for="applicant in recentApplicants" :key="applicant.id" class="p-4 transition-colors hover:bg-paper/50">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-[11px] font-extrabold text-ink">{{ applicant.fullName }}</p>
                  <p class="mt-1 truncate text-[9px] font-semibold text-muted">{{ applicant.faculty }} · {{ applicant.university }}</p>
                  <p class="mt-1 font-mono text-[8px] text-muted">NIM {{ applicant.nim }}</p>
                </div>
                <span class="flex-shrink-0 rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-[0.06em]" :class="applicantStatus(applicant.status).class">
                  {{ applicantStatus(applicant.status).label }}
                </span>
              </div>
            </div>
            <div v-if="!recentApplicants.length" class="px-4 py-10 text-center text-[11px] font-semibold text-muted">
              {{ dashboardStore.isLoading ? 'Memuat pendaftar...' : 'Belum ada pendaftar baru.' }}
            </div>
          </div>
        </section>

        <!-- Summary dark card -->
        <section class="admin-card-dark relative overflow-hidden p-5">
          <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-40" />
          <div class="relative">
            <div class="flex items-center justify-between">
              <h2 class="text-[9px] font-black uppercase tracking-[0.16em] text-lime-soft">Ringkasan konten</h2>
              <StarMark :size="20" class="text-lime-soft" />
            </div>
            <p class="mt-3 text-[11px] font-medium leading-relaxed text-white/60">
              Rasio publikasi dan penerimaan kader dari data yang tersimpan saat ini.
            </p>

            <div class="mt-5 space-y-4">
              <div>
                <div class="flex items-center justify-between text-[9px] font-bold text-white/60">
                  <span>Publikasi berita</span>
                  <span class="font-display text-xs font-bold text-lime-soft">{{ publicationRate }}%</span>
                </div>
                <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div class="h-full rounded-full bg-lime transition-all duration-700" :style="{ width: `${publicationRate}%` }" />
                </div>
                <p class="mt-1 text-[8px] font-semibold text-white/60">{{ stats?.publishedArticles ?? 0 }} dari {{ stats?.totalArticles ?? 0 }} berita</p>
              </div>

              <div>
                <div class="flex items-center justify-between text-[9px] font-bold text-white/60">
                  <span>Penerimaan pendaftar</span>
                  <span class="font-display text-xs font-bold text-lime-soft">{{ acceptanceRate }}%</span>
                </div>
                <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div class="h-full rounded-full bg-lime transition-all duration-700" :style="{ width: `${acceptanceRate}%` }" />
                </div>
                <p class="mt-1 text-[8px] font-semibold text-white/60">{{ stats?.acceptedApplicants ?? 0 }} dari {{ stats?.totalApplicants ?? 0 }} pendaftar</p>
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <span class="text-[8px] font-black uppercase tracking-[0.14em] text-white/60">Yakin Usaha Sampai</span>
              <RouterLink to="/" class="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.1em] text-lime-soft transition-opacity hover:opacity-75">
                Lihat situs
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </RouterLink>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
