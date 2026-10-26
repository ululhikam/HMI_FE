<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useEventStore } from '@/stores/events'
import { useArticleStore } from '@/stores/articles'
import { useSiteStore } from '@/stores/site'
import { useNewsletterStore } from '@/stores/newsletter'
import EmptyState from '@/components/ui/EmptyState.vue'
import StarMark from '@/components/ui/StarMark.vue'
import type { Event } from '@/types'

const store = useEventStore()
const articleStore = useArticleStore()
const siteStore = useSiteStore()
const newsletter = useNewsletterStore()

const featuredEvent = computed(() => store.featuredEvent)
const eventLocation = computed(
  () => featuredEvent.value?.location || siteStore.settings.address || 'Lokasi belum ditentukan',
)
const featuredEventImage = computed(
  () => featuredEvent.value?.coverImage || featuredEvent.value?.speakerAvatar || '',
)

function initials(name?: string) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function statusLabel(status: Event['status']) {
  if (status === 'upcoming') return 'Akan datang'
  if (status === 'ongoing') return 'Berlangsung'
  return 'Selesai'
}

const summaryStats = computed(() => {
  const summary = store.summary
  return [
    { label: 'Pemateri', value: summary ? `${summary.speakers}+` : '—' },
    { label: 'Peserta', value: summary ? `${summary.participants}+` : '—' },
    { label: 'Sesi kaji', value: summary ? `${summary.sessions}+` : '—' },
    { label: 'Alumni', value: summary ? `${summary.alumni}+` : '—' },
  ]
})

const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
let timerInterval: ReturnType<typeof setInterval> | null = null

function updateCountdown() {
  if (!featuredEvent.value) {
    countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }

  const targetDate = new Date(featuredEvent.value.date).getTime()
  const diff = Math.max(0, targetDate - Date.now())

  countdown.value = {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  }
}

const countdownItems = computed(() => [
  { value: countdown.value.days, label: 'Hari' },
  { value: countdown.value.hours, label: 'Jam' },
  { value: countdown.value.minutes, label: 'Menit' },
  { value: countdown.value.seconds, label: 'Detik' },
])

const activeCategoryTab = ref('Semua')

const filteredAgendaList = computed(() => {
  let list = store.filteredEvents
  if (activeCategoryTab.value !== 'Semua') {
    list = list.filter((event) => event.category === activeCategoryTab.value)
  }
  return list
})

const selectedModalEvent = ref<Event | null>(null)
const isRegisteredSuccess = ref(false)
const showToast = ref(false)
const toastMsg = ref('')

const regName = ref('')
const regEmail = ref('')
const regPhone = ref('')

const newsletterEmail = ref('')
const newsletterSubscribed = ref(false)

function openModal(event: Event) {
  selectedModalEvent.value = event
  isRegisteredSuccess.value = false
  regName.value = ''
  regEmail.value = ''
  regPhone.value = ''
}

const externalRegistrationUrl = computed(() => {
  const url = selectedModalEvent.value?.registrationUrl?.trim()
  return url || ''
})

function closeModal() {
  selectedModalEvent.value = null
}

async function handleRegisterSubmit() {
  if (!selectedModalEvent.value || !regName.value || !regEmail.value) return
  const registration = await store.registerForEvent(selectedModalEvent.value.id, {
    name: regName.value,
    email: regEmail.value,
    phone: regPhone.value || undefined,
  })
  if (!registration) return

  isRegisteredSuccess.value = true
  toastMsg.value = 'Pendaftaran agenda berhasil dicatat.'
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3500)
  regName.value = ''
  regEmail.value = ''
  regPhone.value = ''
}

async function subscribeAgenda() {
  newsletterSubscribed.value = false
  if (await newsletter.subscribe(newsletterEmail.value, 'agenda-page')) {
    newsletterSubscribed.value = true
    newsletterEmail.value = ''
  }
}

function formatDateBadge(iso: string) {
  const date = new Date(iso)
  return {
    dayNum: date.getDate(),
    monthStr: date.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase(),
    fullDate: date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    timeStr: `${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
  }
}

function formatEventRange(event: Event | null) {
  if (!event) return 'Jadwal akan diumumkan'
  const start = formatDateBadge(event.date).fullDate
  if (!event.endDate || event.endDate === event.date) return start
  return `${start} – ${formatDateBadge(event.endDate).fullDate}`
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeModal()
}

watch(selectedModalEvent, (event) => {
  document.body.style.overflow = event ? 'hidden' : ''
})

onMounted(() => {
  void store.fetchAll()
  void articleStore.fetchPublished()
  void siteStore.fetchSettings()
  updateCountdown()
  timerInterval = setInterval(updateCountdown, 1000)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="bg-paper text-ink">
    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="showToast"
        class="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-bold text-white shadow-2xl"
      >
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-white">
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        {{ toastMsg }}
      </div>
    </Transition>

    <!-- Hero -->
    <section class="hero-compact relative overflow-hidden bg-ink text-paper">
      <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
      <div class="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-moss/25 blur-[130px]" />

      <div class="container-wide relative z-10">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <span class="eyebrow eyebrow-lime">Agenda HMI</span>
          <RouterLink to="/daftar" class="btn btn-lime inline-flex">
            Daftar LK 1
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>
        </div>

        <div class="hero-gap grid gap-[clamp(1.5rem,4vw,2.5rem)] md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full border border-white/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/55">
                {{ featuredEvent?.category || 'Agenda' }}
              </span>
              <span v-if="featuredEvent" class="rounded-full bg-lime/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-lime-soft">
                {{ statusLabel(featuredEvent.status) }}
              </span>
            </div>

            <h1 class="hero-title mt-5 max-w-4xl text-balance text-white">
              {{ featuredEvent?.title || 'Ruang bertemu,' }}
              <span v-if="!featuredEvent" class="text-lime-soft">ruang bertumbuh.</span>
            </h1>

            <p class="hero-copy-gap line-clamp-3 max-w-xl text-sm font-medium leading-relaxed text-white/55 sm:line-clamp-none sm:text-base">
              {{ featuredEvent?.description || 'Agenda unggulan belum tersedia. Lihat daftar kegiatan di bawah untuk informasi terbaru.' }}
            </p>

            <div class="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/60 sm:mt-7">
              <span class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 rounded-full bg-lime-soft" />
                {{ formatEventRange(featuredEvent) }}
              </span>
              <span class="flex items-center gap-2">
                <svg class="h-3.5 w-3.5 text-lime-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 21s7-5.1 7-11a7 7 0 10-14 0c0 5.9 7 11 7 11z" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {{ eventLocation }}
              </span>
            </div>

            <div class="mt-5 flex flex-wrap gap-2.5 sm:mt-8">
              <button
                v-if="featuredEvent"
                type="button"
                class="btn btn-lime"
                @click="openModal(featuredEvent)"
              >
                Detail & daftar agenda
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <a href="#agenda-list-section" class="btn btn-outline-light">Lihat semua agenda</a>
            </div>
          </div>

          <!-- Featured visual -->
          <div class="relative">
            <div class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-forest">
              <img
                v-if="featuredEventImage"
                :src="featuredEventImage"
                :alt="featuredEvent?.title || 'Agenda HMI'"
                class="h-[clamp(10rem,26svh,22rem)] w-full object-cover grayscale transition duration-700 hover:scale-[1.02] hover:grayscale-0"
              />
              <div v-else class="relative flex h-[clamp(10rem,26svh,22rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-forest to-ink">
                <div class="absolute inset-0 bg-grid-dark opacity-60" />
                <StarMark :size="72" class="relative animate-spin-slow text-lime-soft" />
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              <div class="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
                <div v-if="featuredEvent?.speaker">
                  <p class="text-[8px] font-black uppercase tracking-[0.18em] text-lime-soft">Pemateri</p>
                  <p class="mt-1 font-display text-lg font-semibold tracking-tight text-white">{{ featuredEvent.speaker }}</p>
                  <p class="text-[10px] font-semibold text-white/60">{{ featuredEvent.speakerRole }}</p>
                </div>
                <div v-else class="text-[9px] font-black uppercase tracking-[0.16em] text-white/65">HMI Insan Cita</div>
                <span class="rounded-full bg-lime px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-white">
                  {{ featuredEvent?.category || 'Agenda' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Countdown -->
        <div class="mt-[clamp(1.25rem,3svh,2.25rem)] grid overflow-hidden rounded-[1.5rem] border border-lime/20 bg-lime text-white sm:grid-cols-[1fr_auto] sm:items-center">
          <div class="px-5 py-4 sm:px-6">
            <p class="text-[8px] font-black uppercase tracking-[0.18em] text-white/85">
              {{ featuredEvent ? 'Menuju agenda berikutnya' : 'Agenda berikutnya' }}
            </p>
            <p class="mt-1 text-xs font-bold text-white/90">{{ featuredEvent?.title || 'Belum ada agenda unggulan' }}</p>
          </div>
          <div class="grid grid-cols-4 border-t border-white/20 sm:border-l sm:border-t-0">
            <div v-for="item in countdownItems" :key="item.label" class="border-r border-white/20 px-4 py-3 text-center last:border-r-0 sm:px-6">
              <p class="font-display text-xl font-bold leading-none sm:text-2xl">{{ String(item.value).padStart(2, '0') }}</p>
              <p class="mt-1 text-[7px] font-black uppercase tracking-[0.12em] text-white/85">{{ item.label }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Event info strip -->
    <section class="bg-paper">
      <div class="container-wide">
        <div class="grid overflow-hidden rounded-b-[1.5rem] border-x border-b border-line bg-white sm:grid-cols-3">
          <div class="flex items-center gap-3 border-b border-line p-4 sm:border-b-0 sm:border-r sm:p-5">
            <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-paper text-moss">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <div>
              <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Penyelenggara</p>
              <p class="mt-1 text-xs font-bold text-ink">{{ siteStore.settings.organizationName || 'HMI Insan Cita' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 border-b border-line p-4 sm:border-b-0 sm:border-r sm:p-5">
            <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-paper text-moss">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M8 3v4M16 3v4M3 10h18" stroke-linecap="round" />
              </svg>
            </span>
            <div>
              <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Tanggal</p>
              <p class="mt-1 text-xs font-bold text-ink">{{ formatEventRange(featuredEvent) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-4 sm:p-5">
            <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-paper text-moss">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M12 21s7-5.1 7-11a7 7 0 10-14 0c0 5.9 7 11 7 11z" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>
            <div>
              <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Lokasi</p>
              <p class="mt-1 text-xs font-bold text-ink">{{ eventLocation }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About event + stats -->
    <section class="section-pad bg-paper-deep">
      <div class="container-wide">
        <div class="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div v-reveal>
            <span class="eyebrow">Tentang kegiatan</span>
            <h2 class="display-md mt-5">{{ featuredEvent?.title || 'Agenda HMI Insan Cita' }}</h2>
            <p class="mt-5 max-w-xl text-sm font-medium leading-relaxed text-muted sm:text-base">
              {{ featuredEvent?.description || 'Deskripsi agenda belum tersedia. Silakan lihat daftar agenda untuk informasi kegiatan terbaru.' }}
            </p>
            <div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div v-for="stat in summaryStats" :key="stat.label" class="rounded-[1.2rem] border border-line bg-white p-4">
                <p class="font-display text-2xl font-bold leading-none text-moss">{{ stat.value }}</p>
                <p class="mt-2 text-[8px] font-black uppercase tracking-[0.14em] text-muted">{{ stat.label }}</p>
              </div>
            </div>
          </div>

          <div v-reveal="{ delay: 100 }" class="relative overflow-hidden rounded-[2rem] border border-line bg-ink p-7 text-paper sm:p-9">
            <div class="absolute inset-0 bg-grid-dark opacity-60" />
            <div class="relative">
              <StarMark :size="40" class="text-lime-soft" />
              <p class="mt-8 font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                “Yakin Usaha Sampai”
              </p>
              <p class="mt-4 max-w-sm text-sm font-medium leading-relaxed text-white/60">
                Setiap agenda adalah ruang belajar, berjejaring, dan mengasah kepemimpinan kader.
              </p>
              <div class="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                <span class="text-[8px] font-black uppercase tracking-[0.16em] text-white/60">HMI Komisariat Insan Cita</span>
                <span class="h-2 w-2 rounded-full bg-lime-soft" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Speakers -->
    <section class="section-pad bg-paper">
      <div class="container-wide">
        <div class="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
          <div>
            <span class="eyebrow">Narasumber</span>
            <h2 class="display-md mt-4">Yang membagikan<span class="text-moss">.</span></h2>
          </div>
          <span class="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">{{ store.speakers.length }} pemateri</span>
        </div>

        <div v-if="store.speakers.length" class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(speaker, index) in store.speakers"
            :key="speaker.id"
            v-reveal="{ delay: index * 60 }"
            class="group rounded-[1.5rem] border border-line bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-ink/30 hover:shadow-soft"
          >
            <div class="relative aspect-[4/4.4] overflow-hidden rounded-[1.2rem] bg-paper-deep">
              <img
                v-if="speaker.avatar"
                :src="speaker.avatar"
                :alt="speaker.name"
                class="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
              />
              <span v-else class="flex h-full w-full items-center justify-center font-display text-4xl font-bold text-moss/40">
                {{ initials(speaker.name) }}
              </span>
              <span class="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-ink backdrop-blur">
                Pemateri
              </span>
            </div>
            <div class="p-2 pt-4">
              <h3 class="font-display text-base font-semibold leading-snug tracking-tight text-ink">{{ speaker.name }}</h3>
              <p class="mt-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-moss">{{ speaker.role }}</p>
              <p class="mt-1 text-[10px] font-semibold text-muted">{{ speaker.institution }}</p>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          class="mt-8"
          title="Narasumber belum tersedia"
          description="Data pemateri akan tampil setelah dilengkapi pada agenda."
        />
      </div>
    </section>

    <!-- Agenda list -->
    <section id="agenda-list-section" class="section-pad bg-paper-deep">
      <div class="container-wide">
        <div class="flex flex-col justify-between gap-6 border-b border-line pb-6 md:flex-row md:items-end">
          <div>
            <span class="eyebrow">Jadwal lengkap</span>
            <h2 class="display-md mt-4">Agenda<span class="text-moss">.</span></h2>
          </div>
          <div class="hide-scrollbar flex gap-2 overflow-x-auto">
            <button
              v-for="category in store.categories"
              :key="category"
              type="button"
              class="chip flex-shrink-0"
              :class="activeCategoryTab === category ? 'chip-active' : ''"
              @click="activeCategoryTab = category"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <div v-if="filteredAgendaList.length" class="mt-6 space-y-3">
          <article
            v-for="(event, index) in filteredAgendaList"
            :key="event.id"
            v-reveal="{ delay: index * 40 }"
            class="group grid gap-4 rounded-[1.5rem] border border-line bg-white p-4 transition duration-300 hover:border-ink/30 hover:shadow-soft md:grid-cols-[86px_1fr_auto] md:items-center md:p-5"
          >
            <div class="flex w-full items-center justify-between rounded-[1.1rem] bg-ink px-4 py-3 text-white md:w-[86px] md:flex-col md:justify-center md:px-2 md:py-4">
              <span class="font-display text-3xl font-bold leading-none text-lime-soft md:text-4xl">{{ formatDateBadge(event.date).dayNum }}</span>
              <span class="text-[9px] font-black uppercase tracking-[0.14em] text-white/65 md:mt-1">{{ formatDateBadge(event.date).monthStr }}</span>
            </div>

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 text-[8px] font-black uppercase tracking-[0.1em]">
                <span class="rounded-full bg-paper px-2.5 py-1 text-moss">{{ event.category }}</span>
                <span class="text-muted">{{ formatDateBadge(event.date).timeStr }}</span>
                <span class="h-0.5 w-0.5 rounded-full bg-muted" />
                <span class="text-muted">{{ statusLabel(event.status) }}</span>
              </div>
              <h3 class="mt-2 font-display text-lg font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-moss">{{ event.title }}</h3>
              <p class="mt-1.5 line-clamp-2 text-xs font-medium leading-relaxed text-muted">{{ event.description }}</p>
              <p class="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-muted">
                <svg class="h-3 w-3 text-moss" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 21s7-5.1 7-11a7 7 0 10-14 0c0 5.9 7 11 7 11z" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {{ event.location || 'Lokasi belum ditentukan' }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button type="button" class="admin-btn admin-btn-ghost flex-1 md:flex-none" @click="openModal(event)">
                Detail
              </button>
              <a
                v-if="event.registrationUrl && event.status !== 'done'"
                :href="event.registrationUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-ink min-h-[clamp(2.45rem,4.8svh,2.8rem)] flex-1 px-4 text-[9px] md:flex-none"
              >
                Daftar agenda
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
              <button
                v-else-if="event.status !== 'done'"
                type="button"
                class="btn btn-ink min-h-[clamp(2.45rem,4.8svh,2.8rem)] flex-1 px-4 text-[9px] md:flex-none"
                @click="openModal(event)"
              >
                Daftar agenda
              </button>
            </div>
          </article>
        </div>
        <EmptyState
          v-else
          class="mt-6"
          title="Belum ada agenda"
          description="Belum ada agenda pada kategori ini. Silakan pilih kategori lain."
        >
          <button type="button" class="btn btn-ink mt-2" @click="activeCategoryTab = 'Semua'">Tampilkan semua</button>
        </EmptyState>
      </div>
    </section>

    <!-- News -->
    <section class="section-pad bg-paper">
      <div class="container-wide">
        <div class="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
          <div>
            <span class="eyebrow">Berita</span>
            <h2 class="display-md mt-4">Catatan terbaru<span class="text-moss">.</span></h2>
          </div>
          <RouterLink to="/berita" class="link-arrow text-ink">
            Semua berita
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>
        </div>

        <div v-if="articleStore.latestArticles.length" class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <RouterLink
            v-for="(article, index) in articleStore.latestArticles.slice(0, 3)"
            :key="article.id"
            :to="`/berita/${article.slug}`"
            v-reveal="{ delay: index * 60 }"
            class="group flex flex-col overflow-hidden rounded-[1.4rem] border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-ink/30 hover:shadow-soft"
          >
            <div class="relative aspect-[16/10] overflow-hidden bg-forest">
              <img v-if="article.coverImage" :src="article.coverImage" :alt="article.title" class="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
              <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest to-ink">
                <StarMark :size="36" class="text-lime-soft/70" />
              </div>
              <span class="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-ink backdrop-blur">{{ article.category }}</span>
            </div>
            <div class="flex flex-1 flex-col p-5">
              <h3 class="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-ink group-hover:text-moss">{{ article.title }}</h3>
              <p class="mt-2 line-clamp-2 flex-1 text-xs font-medium leading-relaxed text-muted">{{ article.excerpt }}</p>
              <span class="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-moss">
                Baca
                <svg class="h-3 w-3 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </div>
          </RouterLink>
        </div>
        <p v-else class="mt-8 text-sm font-semibold text-muted">Belum ada berita terbaru.</p>
      </div>
    </section>

    <!-- Testimonials -->
    <section v-if="store.testimonials.length" class="section-pad relative overflow-hidden bg-ink text-paper">
      <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
      <div class="container-wide relative z-10">
        <div class="max-w-2xl">
          <span class="eyebrow eyebrow-lime">Suara kader</span>
          <h2 class="display-md mt-5 text-white">Yang mereka bawa<span class="text-lime-soft">.</span></h2>
        </div>
        <div class="mt-8 grid gap-3 sm:grid-cols-2">
          <blockquote
            v-for="testimonial in store.testimonials"
            :key="testimonial.id"
            class="flex flex-col justify-between rounded-[1.5rem] border border-white/10 bg-white/5 p-6"
          >
            <p class="font-display text-lg font-semibold leading-snug tracking-tight text-white/85">“{{ testimonial.quote }}”</p>
            <footer class="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
              <span class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-lime/15 text-[9px] font-black text-lime-soft">
                <img v-if="testimonial.avatar" :src="testimonial.avatar" :alt="testimonial.name" class="h-full w-full object-cover" />
                <span v-else>{{ initials(testimonial.name) }}</span>
              </span>
              <div>
                <p class="text-[10px] font-extrabold text-white">{{ testimonial.name }}</p>
                <p class="mt-0.5 text-[9px] font-semibold text-white/60">{{ testimonial.role }}</p>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>
    </section>

    <!-- Newsletter -->
    <section class="relative overflow-hidden bg-lime py-14 text-white sm:py-20">
      <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-20" />
      <StarMark :size="200" class="pointer-events-none absolute -bottom-16 -right-8 text-white/10" />
      <div class="container-wide relative z-10 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div>
          <span class="eyebrow eyebrow-light">Pengingat agenda</span>
          <h2 class="display-md mt-4 max-w-xl">Jangan lewatkan kegiatan berikutnya<span class="text-white/60">.</span></h2>
          <p class="mt-3 max-w-lg text-sm font-semibold leading-relaxed text-white/70">
            Dapatkan pemberitahuan jadwal kegiatan HMI langsung ke email Anda.
          </p>
        </div>
        <form class="flex flex-col gap-2" @submit.prevent="subscribeAgenda">
          <div class="flex flex-col gap-2 sm:flex-row">
            <input v-model="newsletterEmail" type="email" required placeholder="Alamat email Anda" class="field flex-1 border-white/30 bg-white" />
            <button type="submit" :disabled="newsletter.isSubmitting" class="btn btn-ink flex-shrink-0 disabled:opacity-60">
              {{ newsletter.isSubmitting ? 'Memproses...' : 'Berlangganan' }}
            </button>
          </div>
          <p v-if="newsletterSubscribed" class="text-[10px] font-semibold text-white">Berhasil berlangganan. Terima kasih!</p>
          <p v-else-if="newsletter.error" class="text-[10px] font-semibold text-white">{{ newsletter.error }}</p>
        </form>
      </div>
    </section>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="selectedModalEvent"
          class="fixed inset-0 z-[80] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          @click.self="closeModal"
        >
          <div class="modal-viewport w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-line bg-paper p-5 text-ink shadow-2xl sm:p-7">
            <div class="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <span class="rounded-full bg-ink px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-lime-soft">{{ selectedModalEvent.category }}</span>
                <h3 class="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight">{{ selectedModalEvent.title }}</h3>
              </div>
              <button type="button" class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink" aria-label="Tutup detail agenda" @click="closeModal">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <p class="mt-4 text-sm font-medium leading-relaxed text-muted">{{ selectedModalEvent.description }}</p>

            <div class="mt-5 grid gap-2 rounded-[1.2rem] border border-line bg-white p-4 text-xs font-semibold text-ink/70 sm:grid-cols-2">
              <p><span class="block text-[8px] font-black uppercase tracking-[0.12em] text-muted">Tanggal</span>{{ formatDateBadge(selectedModalEvent.date).fullDate }}</p>
              <p><span class="block text-[8px] font-black uppercase tracking-[0.12em] text-muted">Waktu</span>{{ formatDateBadge(selectedModalEvent.date).timeStr }}</p>
              <p class="sm:col-span-2"><span class="block text-[8px] font-black uppercase tracking-[0.12em] text-muted">Lokasi</span>{{ selectedModalEvent.location || 'Lokasi belum ditentukan' }}</p>
            </div>

            <div v-if="selectedModalEvent.status !== 'done'" class="mt-5 space-y-3">
              <div v-if="isRegisteredSuccess" class="rounded-[1.2rem] border border-moss/20 bg-lime/20 p-4 text-center text-xs font-bold text-forest">
                Pendaftaran agenda berhasil dicatat. Panitia akan menghubungi Anda melalui kontak yang diberikan.
              </div>
              <template v-else-if="externalRegistrationUrl">
                <div class="rounded-[1.2rem] border border-line bg-white p-4">
                  <p class="text-[9px] font-black uppercase tracking-[0.14em] text-muted">Pendaftaran agenda</p>
                  <p class="mt-2 text-[11px] font-semibold leading-relaxed text-ink/65">
                    Pendaftaran agenda ini dikelola melalui formulir resmi panitia. Tombol di bawah akan membuka formulir tersebut di tab baru.
                  </p>
                  <a :href="externalRegistrationUrl" target="_blank" rel="noopener noreferrer" class="btn btn-ink mt-3 w-full">
                    Buka formulir agenda
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                      <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </a>
                </div>
              </template>
              <form v-else class="space-y-2.5" @submit.prevent="handleRegisterSubmit">
                <p class="text-[9px] font-black uppercase tracking-[0.14em] text-muted">Daftar agenda ini</p>
                <input v-model="regName" type="text" placeholder="Nama lengkap" class="field" required />
                <input v-model="regEmail" type="email" placeholder="Alamat email" class="field" required />
                <input v-model="regPhone" type="tel" placeholder="Nomor WhatsApp (opsional)" class="field" />
                <button type="submit" :disabled="store.isRegistering" class="btn btn-ink w-full disabled:opacity-60">
                  {{ store.isRegistering ? 'Memproses...' : 'Konfirmasi pendaftaran agenda' }}
                </button>
                <p v-if="store.error" class="text-[10px] font-semibold text-red-700">{{ store.error }}</p>
              </form>
              <p class="rounded-[0.9rem] bg-paper px-3 py-2.5 text-[9px] font-semibold leading-relaxed text-muted">
                Ini pendaftaran untuk agenda di atas, bukan pendaftaran LK 1.
                <RouterLink to="/daftar" class="font-black text-moss hover:text-ink" @click="closeModal">Buka Pendaftaran LK 1 →</RouterLink>
              </p>
            </div>
            <div v-else class="mt-5 rounded-[1.2rem] border border-line bg-white p-4 text-center text-xs font-semibold text-muted">
              Kegiatan ini telah selesai.
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(16px) scale(0.98);
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 200ms ease, transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
