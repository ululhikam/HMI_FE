<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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

const newsletterEmail = ref('')
const newsletterSubscribed = ref(false)

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
  <div class="bg-paper text-ink">
    <!-- Hero -->
    <section class="hero-compact relative overflow-hidden bg-ink text-paper">
      <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
      <div class="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-moss/25 blur-[130px]" />

      <div class="container-wide relative z-10">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <span class="eyebrow eyebrow-lime">Agenda unggulan</span>
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
              <RouterLink
                v-if="featuredEvent"
                :to="`/agenda/${featuredEvent.id}`"
                class="btn btn-lime"
              >
                Lihat detail agenda
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </RouterLink>
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
              <p
                v-if="event.speaker || event.speakerRole"
                class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[9px] font-semibold text-muted"
              >
                <span class="font-black uppercase tracking-[0.1em] text-moss">Pemateri</span>
                <span v-if="event.speaker" class="text-ink">{{ event.speaker }}</span>
                <span v-if="event.speaker && event.speakerRole" class="text-muted/60">·</span>
                <span v-if="event.speakerRole">{{ event.speakerRole }}</span>
              </p>
              <p class="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-muted">
                <svg class="h-3 w-3 text-moss" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 21s7-5.1 7-11a7 7 0 10-14 0c0 5.9 7 11 7 11z" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {{ event.location || 'Lokasi belum ditentukan' }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <RouterLink
                :to="`/agenda/${event.id}`"
                class="admin-btn admin-btn-ghost flex-1 md:flex-none"
              >
                Detail agenda
              </RouterLink>
              <RouterLink
                v-if="event.status !== 'done'"
                :to="{ name: 'agenda-detail', params: { id: event.id }, query: { daftar: '1' } }"
                class="btn btn-ink min-h-[clamp(2.45rem,4.8svh,2.8rem)] flex-1 px-4 text-[9px] md:flex-none"
              >
                Daftar agenda
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </RouterLink>
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

  </div>
</template>
