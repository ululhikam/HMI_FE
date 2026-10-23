<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useEventStore } from '@/stores/events'
import { useArticleStore } from '@/stores/articles'
import { useSiteStore } from '@/stores/site'
import { useNewsletterStore } from '@/stores/newsletter'
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

const summaryStats = computed(() => {
  const summary = store.summary
  return [
    { label: 'Pemateri', value: summary ? `${summary.speakers}+` : '—' },
    { label: 'Peserta', value: summary ? `${summary.participants}+` : '—' },
    { label: 'Sesi Kaji', value: summary ? `${summary.sessions}+` : '—' },
    { label: 'Alumni', value: summary ? `${summary.alumni}+` : '—' },
  ]
})

// Countdown state
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

// Agenda Filter Tab
const activeCategoryTab = ref('Semua')

const filteredAgendaList = computed(() => {
  let list = store.filteredEvents
  if (activeCategoryTab.value !== 'Semua') {
    list = list.filter((event) => event.category === activeCategoryTab.value)
  }
  return list
})

// Modal & Form State
const selectedModalEvent = ref<Event | null>(null)
const isRegisteredSuccess = ref(false)
const showToast = ref(false)
const toastMsg = ref('')

const regName = ref('')
const regEmail = ref('')
const regPhone = ref('')

// Newsletter state
const newsletterEmail = ref('')
const newsletterSubscribed = ref(false)

function openModal(ev: Event) {
  selectedModalEvent.value = ev
  isRegisteredSuccess.value = false
}

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
  toastMsg.value = 'Pendaftaran Anda telah berhasil dicatat!'
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
  const d = new Date(iso)
  return {
    dayNum: d.getDate(),
    monthStr: d.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase(),
    fullDate: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    timeStr: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
  }
}

function formatEventRange(event: Event | null) {
  if (!event) return 'Jadwal akan diumumkan'
  const start = formatDateBadge(event.date).fullDate
  if (!event.endDate || event.endDate === event.date) return start
  return `${start} – ${formatDateBadge(event.endDate).fullDate}`
}

onMounted(() => {
  void store.fetchAll()
  void articleStore.fetchPublished()
  void siteStore.fetchSettings()
  updateCountdown()
  timerInterval = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
  <div class="pt-[67px] bg-[#FFFFFF] text-[#111212] min-h-screen font-sans relative overflow-x-hidden">
    
    <!-- Toast Notification -->
    <div
      v-if="showToast"
      class="fixed bottom-6 right-6 z-50 bg-[#111212] text-white text-xs font-bold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-[#009246] animate-bounce"
    >
      <svg class="w-4 h-4 text-[#009246]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
      <span>{{ toastMsg }}</span>
    </div>

    <!-- Top Fluid Green Background Accents -->
    <div class="absolute top-16 -left-20 w-[450px] h-[350px] bg-[#009246]/10 rounded-full blur-[100px] pointer-events-none -z-0"></div>
    <div class="absolute top-20 right-0 w-[500px] h-[400px] bg-[#006837]/10 rounded-full blur-[120px] pointer-events-none -z-0"></div>

    <!-- SECTION 1: HERO SECTION -->
    <section class="relative z-10 pt-10 pb-16 border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Top Branding Row -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <span class="w-3 h-3 bg-[#009246] rounded-full animate-pulse"></span>
            <span class="text-2xl font-black text-[#111212] tracking-tight uppercase">AGENDA <span class="text-[#009246]">HMI</span></span>
            <span class="text-[10px] bg-[#009246]/10 text-[#009246] font-bold px-2.5 py-0.5 rounded-full uppercase border border-[#009246]/20">Insan Cita</span>
          </div>
          <RouterLink to="/daftar" class="px-5 py-2.5 bg-[#009246] hover:bg-[#006837] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md">
            GET TICKETS / DAFTAR
          </RouterLink>
        </div>

        <div class="grid lg:grid-cols-12 gap-10 items-center">
          
          <!-- Left Hero Content -->
          <div class="lg:col-span-7 space-y-6 text-center sm:text-left">
            
            <!-- Countdown Digits (Green theme) -->
            <div
              v-if="featuredEvent"
              class="flex items-center justify-center sm:justify-start gap-4 sm:gap-6"
            >
              <div class="text-center">
                <span class="text-3xl sm:text-4xl font-black text-[#009246] block font-mono leading-none">{{ String(countdown.days).padStart(2, '0') }}</span>
                <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1 block">DAYS</span>
              </div>
              <span class="text-2xl font-bold text-slate-300 -mt-3">:</span>
              <div class="text-center">
                <span class="text-3xl sm:text-4xl font-black text-[#009246] block font-mono leading-none">{{ String(countdown.hours).padStart(2, '0') }}</span>
                <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1 block">HOURS</span>
              </div>
              <span class="text-2xl font-bold text-slate-300 -mt-3">:</span>
              <div class="text-center">
                <span class="text-3xl sm:text-4xl font-black text-[#009246] block font-mono leading-none">{{ String(countdown.minutes).padStart(2, '0') }}</span>
                <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1 block">MINS</span>
              </div>
              <span class="text-2xl font-bold text-slate-300 -mt-3">:</span>
              <div class="text-center">
                <span class="text-3xl sm:text-4xl font-black text-[#009246] block font-mono leading-none">{{ String(countdown.seconds).padStart(2, '0') }}</span>
                <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1 block">SECS</span>
              </div>
            </div>

            <!-- Title & Headlines -->
            <div class="space-y-2">
              <span class="text-xs font-black uppercase tracking-widest text-[#009246]">
                {{ featuredEvent?.category ?? 'Agenda' }} HMI INSAN CITA
              </span>
              <h1 class="text-3xl sm:text-5xl font-black text-[#111212] leading-tight tracking-tight">
                {{ featuredEvent?.title ?? 'Belum ada agenda unggulan' }}
              </h1>
              <p
                v-if="featuredEvent"
                class="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700"
              >
                {{ featuredEvent.status === 'upcoming' ? 'Pendaftaran dibuka' : featuredEvent.status }}
              </p>
            </div>

            <p class="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
              {{
                featuredEvent?.description ||
                'Agenda unggulan belum tersedia. Silakan lihat daftar agenda di bawah.'
              }}
            </p>

            <!-- CTA Button -->
            <div class="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <RouterLink
                v-if="featuredEvent && featuredEvent.status !== 'done'"
                to="/daftar"
                class="px-8 py-3.5 bg-[#009246] hover:bg-[#006837] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#009246]/20 transition-all hover:scale-105"
              >
                REGISTER NOW / DAFTAR
              </RouterLink>
              <a href="#agenda-list-section" class="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-2">
                <span>Lihat Daftar Agenda</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>

          </div>

          <!-- Right Hero Image -->
          <div class="lg:col-span-5 relative flex justify-center">
            <div class="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-br from-[#009246] via-[#006837] to-[#111212]">
              <img
                v-if="featuredEventImage"
                :src="featuredEventImage"
                :alt="featuredEvent?.title ?? 'Agenda HMI'"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex flex-col items-center justify-center text-white gap-4 p-8 text-center"
              >
                <img
                  v-if="siteStore.settings.logoUrl"
                  :src="siteStore.settings.logoUrl"
                  alt="Logo HMI"
                  class="w-20 h-20 object-contain rounded-full bg-white/10 p-2"
                />
                <p class="text-sm font-bold">Agenda unggulan belum tersedia</p>
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-[#111212]/90 via-transparent to-transparent"></div>

              <div
                v-if="featuredEvent?.speaker"
                class="absolute bottom-6 left-6 right-6 text-white space-y-1"
              >
                <span class="bg-[#009246] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded">
                  KEYNOTE SPEAKER
                </span>
                <h3 class="text-base font-black">{{ featuredEvent.speaker }}</h3>
                <p class="text-xs text-slate-300">{{ featuredEvent.speakerRole }}</p>
              </div>
            </div>
          </div>

        </div>

        <!-- HERO BOTTOM INFO STRIP BAR -->
        <div class="mt-12 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xl grid sm:grid-cols-3 gap-6">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-[#009246]/10 text-[#009246] flex items-center justify-center font-bold shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4" />
              </svg>
            </div>
            <div class="text-xs">
              <span class="text-slate-400 font-bold uppercase block text-[10px]">EVENT ORGANIZER</span>
              <span class="font-extrabold text-slate-800 text-sm">{{ siteStore.settings.organizationName }}</span>
            </div>
          </div>

          <div class="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
            <div class="w-10 h-10 rounded-xl bg-[#009246]/10 text-[#009246] flex items-center justify-center font-bold shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="text-xs">
              <span class="text-slate-400 font-bold uppercase block text-[10px]">EVENT DATE & TIME</span>
              <span class="font-extrabold text-slate-800 text-sm">{{ formatEventRange(featuredEvent) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
            <div class="w-10 h-10 rounded-xl bg-[#009246]/10 text-[#009246] flex items-center justify-center font-bold shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div class="text-xs">
              <span class="text-slate-400 font-bold uppercase block text-[10px]">EVENT LOCATION</span>
              <span class="font-extrabold text-slate-800 text-sm">{{ eventLocation }}</span>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- SECTION 2: ABOUT THE EVENT & 4 STAT COUNTERS -->
    <section class="py-16 bg-[#F8FAFC]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-12 gap-10 items-center">
          
          <!-- Left About Text & 4 Stats -->
          <div class="lg:col-span-7 space-y-6">
            <div class="space-y-2">
              <span class="text-xs font-black uppercase tracking-widest text-[#009246]">TENTANG PERKADERAN HMI</span>
              <h2 class="text-2xl sm:text-4xl font-black text-[#111212] leading-tight">
                {{ featuredEvent?.title ?? 'TENTANG AGENDA' }}
              </h2>
            </div>

            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {{
                featuredEvent?.description ||
                'Deskripsi agenda belum tersedia. Silakan lihat daftar agenda untuk informasi kegiatan terbaru.'
              }}
            </p>

            <!-- 4 Stat Counters Row -->
            <div class="grid grid-cols-4 gap-4 pt-4 border-t border-slate-200">
              <div v-for="stat in summaryStats" :key="stat.label" class="text-center sm:text-left">
                <span class="text-2xl sm:text-3xl font-black text-[#009246] block border-b-2 border-[#009246] pb-1 inline-block">{{ stat.value }}</span>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-1">{{ stat.label }}</span>
              </div>
            </div>
          </div>

          <!-- Right Event Image -->
          <div class="lg:col-span-5">
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white group bg-[#111212]">
              <img
                v-if="featuredEventImage"
                :src="featuredEventImage"
                :alt="featuredEvent?.title ?? 'Agenda HMI'"
                class="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div
                v-else
                class="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-[#009246] to-[#111212] text-white text-sm font-bold"
              >
                Gambar agenda belum tersedia
              </div>
              <div
                v-if="featuredEvent"
                class="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-[#111212]"
              >
                {{ featuredEvent.category }}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- SECTION 3: MEET EVENT SPEAKER -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div class="text-center max-w-xl mx-auto space-y-2">
          <span class="text-xs font-black uppercase tracking-widest text-[#009246]">Narasumber & Instruktur</span>
          <h2 class="text-2xl sm:text-4xl font-black text-[#111212]">MEET EVENT SPEAKER</h2>
          <div class="flex justify-center gap-1.5 pt-1">
            <span class="w-2 h-2 rounded-full bg-[#009246]"></span>
            <span class="w-2 h-2 rounded-full bg-[#006837]"></span>
            <span class="w-2 h-2 rounded-full bg-[#111212]"></span>
          </div>
        </div>

        <p v-if="store.speakers.length === 0" class="text-center text-sm text-slate-500 py-6">
          Belum ada data narasumber.
        </p>
        <div v-else class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="sp in store.speakers"
            :key="sp.id"
            class="group bg-[#F8FAFC] rounded-3xl overflow-hidden border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300 text-center space-y-4"
          >
            <div class="relative w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-[#009246] shadow-md bg-[#009246]/10">
              <img
                v-if="sp.avatar"
                :src="sp.avatar"
                :alt="sp.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span v-else class="w-full h-full flex items-center justify-center text-2xl font-black text-[#009246]">
                {{ initials(sp.name) }}
              </span>
            </div>
            <div class="space-y-1">
              <h3 class="text-base font-black text-[#111212] group-hover:text-[#009246] transition-colors leading-snug">
                {{ sp.name }}
              </h3>
              <p class="text-xs font-bold text-[#009246]">{{ sp.role }}</p>
              <p class="text-[11px] text-slate-500">{{ sp.institution }}</p>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- SECTION 4: DAFTAR AGENDA LENGKAP / OUR EVENTS SCHEDULE -->
    <section id="agenda-list-section" class="py-16 bg-[#F8FAFC] border-t border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <span class="text-xs font-black uppercase tracking-widest text-[#009246]">Jadwal Lengkap Program Kerja</span>
            <h2 class="text-2xl sm:text-3xl font-black text-[#111212]">DAFTAR AGENDA & KEGIATAN HMI</h2>
          </div>

          <!-- Category Tabs Filter -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              v-for="cat in store.categories"
              :key="cat"
              @click="activeCategoryTab = cat"
              class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border"
              :class="activeCategoryTab === cat
                ? 'bg-[#009246] text-white border-[#009246] shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-[#009246] hover:text-[#009246]'"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Agenda Items List Cards -->
        <p v-if="filteredAgendaList.length === 0" class="text-center text-sm text-slate-500 py-10">
          Belum ada agenda pada kategori ini.
        </p>
        <div v-else class="space-y-4">
          <div
            v-for="ev in filteredAgendaList"
            :key="ev.id"
            class="group bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 hover:border-[#009246] hover:shadow-xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <!-- Date Box -->
            <div class="bg-[#111212] text-white p-3 sm:p-4 rounded-2xl text-center shrink-0 w-full md:w-24 border border-slate-800">
              <span class="text-2xl font-black block text-[#009246] leading-none">{{ formatDateBadge(ev.date).dayNum }}</span>
              <span class="text-[10px] font-extrabold uppercase tracking-wider block mt-1 text-slate-300">{{ formatDateBadge(ev.date).monthStr }}</span>
            </div>

            <!-- Middle Info -->
            <div class="flex-1 space-y-2">
              <div class="flex flex-wrap items-center gap-3 text-xs text-[#009246] font-extrabold">
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ formatDateBadge(ev.date).fullDate }}
                </span>
                <span>•</span>
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ formatDateBadge(ev.date).timeStr }}
                </span>
                <span class="bg-[#009246]/10 text-[#009246] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {{ ev.category }}
                </span>
              </div>

              <h3 class="text-base sm:text-lg font-black text-[#111212] group-hover:text-[#009246] transition-colors leading-snug">
                {{ ev.title }}
              </h3>

              <p class="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {{ ev.description }}
              </p>

              <div class="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <svg class="w-3.5 h-3.5 text-[#009246]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{{ ev.location }}</span>
              </div>
            </div>

            <!-- Right Actions -->
            <div class="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
              <button
                @click="openModal(ev)"
                class="px-5 py-2.5 bg-slate-100 hover:bg-[#009246] hover:text-white text-slate-800 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>Detail Agenda</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <RouterLink
                v-if="ev.registrationUrl && ev.status !== 'done'"
                to="/daftar"
                class="px-5 py-2.5 bg-[#009246] hover:bg-[#006837] text-white text-xs font-black uppercase rounded-xl transition-all shrink-0"
              >
                Daftar
              </RouterLink>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- SECTION 5: FROM OUR BLOG / NEWS UPDATES -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div class="text-center max-w-xl mx-auto space-y-2">
          <span class="text-xs font-black uppercase tracking-widest text-[#009246]">Kabar & Opini Terbaru</span>
          <h2 class="text-2xl sm:text-4xl font-black text-[#111212]">FROM OUR BLOG</h2>
        </div>

        <p
          v-if="articleStore.latestArticles.length === 0"
          class="text-center text-sm text-slate-500 py-6"
        >
          Belum ada berita terbaru.
        </p>
        <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="art in articleStore.latestArticles.slice(0, 3)"
            :key="art.id"
            class="group bg-[#F8FAFC] rounded-3xl overflow-hidden border border-slate-200 p-5 space-y-4 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div class="space-y-4">
              <div class="aspect-video rounded-2xl overflow-hidden relative bg-slate-100">
                <img
                  v-if="art.coverImage"
                  :src="art.coverImage"
                  :alt="art.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span
                  v-else
                  class="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400"
                >
                  Gambar belum tersedia
                </span>
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold text-[#009246] uppercase">{{ art.category }}</span>
                <h3 class="text-sm font-black text-[#111212] group-hover:text-[#009246] transition-colors leading-snug line-clamp-2">
                  {{ art.title }}
                </h3>
                <p class="text-xs text-slate-500 line-clamp-2">{{ art.excerpt }}</p>
              </div>
            </div>
            <RouterLink :to="`/berita/${art.slug}`" class="inline-block px-4 py-2 bg-[#009246] text-white text-xs font-extrabold uppercase rounded-xl hover:bg-[#006837] transition-colors text-center">
              READ MORE
            </RouterLink>
          </div>
        </div>

      </div>
    </section>

    <!-- SECTION 6: OUR EVENT FEEDBACK / TESTIMONIALS -->
    <section class="py-16 bg-[#F8FAFC]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div class="text-center max-w-xl mx-auto space-y-2">
          <span class="text-xs font-black uppercase tracking-widest text-[#009246]">Testimoni Kader & Alumni</span>
          <h2 class="text-2xl sm:text-4xl font-black text-[#111212]">OUR EVENT FEEDBACK</h2>
        </div>

        <!-- 4 Testimonial Cards (Green / Dark theme) -->
        <p v-if="store.testimonials.length === 0" class="text-center text-sm text-slate-500 py-6">
          Belum ada testimoni.
        </p>
        <div v-else class="grid sm:grid-cols-2 gap-6">
          <div
            v-for="t in store.testimonials"
            :key="t.id"
            class="bg-white p-6 rounded-3xl border border-slate-200 hover:border-[#009246] shadow-sm space-y-4 transition-all"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-[#009246] bg-[#009246]/10">
                  <img
                    v-if="t.avatar"
                    :src="t.avatar"
                    :alt="t.name"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="w-full h-full flex items-center justify-center text-xs font-black text-[#009246]">
                    {{ initials(t.name) }}
                  </span>
                </div>
                <div>
                  <h4 class="text-sm font-black text-[#111212]">{{ t.name }}</h4>
                  <span class="text-[10px] text-slate-500 font-semibold">{{ t.role }}</span>
                </div>
              </div>
              <svg class="w-6 h-6 text-[#009246]/30 fill-current" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed italic">
              "{{ t.quote }}"
            </p>
          </div>
        </div>

      </div>
    </section>

    <!-- SECTION 7: MAP LOCATION & NEWSLETTER SIGNUP -->
    <section class="relative">
      <!-- Location Banner -->
      <div class="relative h-64 bg-gradient-to-br from-[#009246] via-[#006837] to-[#111212] overflow-hidden">
        <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 24px 24px;"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111212] text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 font-bold text-xs border border-[#009246] max-w-[90%]">
          <svg class="w-4 h-4 text-[#009246]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span>{{ eventLocation }}</span>
        </div>
      </div>

      <!-- Green / Dark Newsletter Banner -->
      <div class="bg-[#111212] text-white py-12 px-4 sm:px-6 text-center space-y-4 border-t border-slate-800">
        <div class="max-w-xl mx-auto space-y-2">
          <h3 class="text-xl sm:text-2xl font-black uppercase tracking-wider">SIGN UP FOR OUR NEWSLETTER</h3>
          <p class="text-xs text-slate-400">Dapatkan pemberitahuan jadwal kegiatan HMI langsung ke email Anda.</p>
        </div>
        <form @submit.prevent="subscribeAgenda" class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            v-model="newsletterEmail"
            type="email"
            required
            placeholder="ENTER YOUR EMAIL..."
            class="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#009246]"
          />
          <button
            type="submit"
            :disabled="newsletter.isSubmitting"
            class="px-6 py-3 bg-[#009246] hover:bg-[#006837] disabled:opacity-60 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md"
          >
            {{ newsletter.isSubmitting ? 'MEMPROSES...' : 'SUBSCRIBE NOW' }}
          </button>
        </form>
        <p v-if="newsletterSubscribed" class="text-xs text-[#7BE0AC] font-semibold">Berhasil berlangganan. Terima kasih!</p>
        <p v-else-if="newsletter.error" class="text-xs text-red-300">{{ newsletter.error }}</p>
      </div>
    </section>

    <!-- Modal Event Detail -->
    <div
      v-if="selectedModalEvent"
      class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white text-[#111212] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 relative p-6 animate-in fade-in zoom-in duration-200">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <span class="bg-[#009246] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
            {{ selectedModalEvent.category }}
          </span>
          <button @click="closeModal" class="text-slate-400 hover:text-black font-bold p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h3 class="text-lg font-black leading-snug">
          {{ selectedModalEvent.title }}
        </h3>

        <p class="text-xs text-slate-600 leading-relaxed">
          {{ selectedModalEvent.description }}
        </p>

        <div class="bg-slate-100 p-4 rounded-2xl space-y-2 text-xs font-semibold">
          <p>Tanggal: {{ formatDateBadge(selectedModalEvent.date).fullDate }}</p>
          <p>Jam: {{ formatDateBadge(selectedModalEvent.date).timeStr }}</p>
          <p>Lokasi: {{ selectedModalEvent.location }}</p>
        </div>

        <!-- Registration Inside Modal -->
        <div v-if="selectedModalEvent.status !== 'done'" class="space-y-3 pt-2">
          <div v-if="isRegisteredSuccess" class="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl text-xs font-bold text-center">
            Pendaftaran Anda telah berhasil dicatat!
          </div>

          <form v-else @submit.prevent="handleRegisterSubmit" class="space-y-2">
            <input
              v-model="regName"
              type="text"
              placeholder="Nama Lengkap..."
              class="w-full px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#009246]"
              required
            />
            <input
              v-model="regEmail"
              type="email"
              placeholder="Alamat Email..."
              class="w-full px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#009246]"
              required
            />
            <input
              v-model="regPhone"
              type="tel"
              placeholder="No. WhatsApp (opsional)..."
              class="w-full px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#009246]"
            />
            <button
              type="submit"
              :disabled="store.isRegistering"
              class="w-full py-2.5 bg-[#009246] hover:bg-[#006837] disabled:opacity-60 text-white text-xs font-black uppercase rounded-xl"
            >
              {{ store.isRegistering ? 'Memproses...' : 'Konfirmasi Pendaftaran Agenda' }}
            </button>
            <p v-if="store.error" class="text-xs text-red-500">{{ store.error }}</p>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
