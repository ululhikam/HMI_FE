<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useEventStore } from '@/stores/events'
import { useSiteStore } from '@/stores/site'
import StarMark from '@/components/ui/StarMark.vue'
import type { Event } from '@/types'

const route = useRoute()
const store = useEventStore()
const siteStore = useSiteStore()

const event = ref<Event | null>(null)
const isRegistered = ref(false)
const formError = ref('')

const regName = ref('')
const regEmail = ref('')
const regPhone = ref('')

const eventId = computed(() => String(route.params.id ?? ''))
const speakerName = computed(() => event.value?.speaker?.trim() || '')
const speakerRole = computed(() => event.value?.speakerRole?.trim() || '')
const hasSpeaker = computed(() => Boolean(speakerName.value || speakerRole.value))
const externalRegistrationUrl = computed(() => event.value?.registrationUrl?.trim() || '')
const organizer = computed(
  () => siteStore.settings.organizationName || 'HMI Komisariat Insan Cita',
)
const isDone = computed(() => event.value?.status === 'done')
const isFull = computed(
  () => typeof event.value?.seatsLeft === 'number' && event.value.seatsLeft <= 0,
)
const seatsLabel = computed(() => {
  const item = event.value
  if (!item) return 'Pendaftaran terbuka'
  if (typeof item.seatsLeft === 'number' && typeof item.totalSeats === 'number') {
    return `${item.seatsLeft} dari ${item.totalSeats} kursi tersisa`
  }
  if (typeof item.seatsLeft === 'number') return `${item.seatsLeft} kursi tersisa`
  if (typeof item.totalSeats === 'number') return `${item.totalSeats} kursi`
  return 'Pendaftaran terbuka'
})

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

function formatDate(iso?: string) {
  if (!iso) return 'Jadwal akan diumumkan'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Jadwal akan diumumkan'
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateRange(item: Event | null) {
  if (!item) return 'Jadwal akan diumumkan'
  const start = formatDate(item.date)
  if (!item.endDate || item.endDate === item.date) return start
  const end = formatDate(item.endDate)
  return end === start ? start : `${start} – ${end}`
}

function formatTime(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
}

function scrollToRegistration() {
  document.getElementById('daftar')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function loadEvent() {
  event.value = null
  isRegistered.value = false
  formError.value = ''
  regName.value = ''
  regEmail.value = ''
  regPhone.value = ''

  const found = await store.fetchEventById(eventId.value)
  event.value = found
  document.title = found
    ? `${found.title} | Agenda HMI Insan Cita`
    : 'Agenda Tidak Ditemukan | HMI Insan Cita'

  if (found) {
    await nextTick()
    if (route.query.daftar === '1') {
      document.getElementById('daftar')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}

async function handleRegisterSubmit() {
  if (!event.value || isDone.value || isFull.value) return

  formError.value = ''
  if (!regName.value.trim() || !regEmail.value.trim()) {
    formError.value = 'Nama lengkap dan alamat email wajib diisi.'
    return
  }

  const registration = await store.registerForEvent(event.value.id, {
    name: regName.value.trim(),
    email: regEmail.value.trim(),
    phone: regPhone.value.trim() || undefined,
  })

  if (!registration) {
    formError.value = store.error || 'Pendaftaran agenda gagal. Silakan coba lagi.'
    return
  }

  isRegistered.value = true
  regName.value = ''
  regEmail.value = ''
  regPhone.value = ''
}

watch(eventId, loadEvent, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <!-- Loading -->
    <section
      v-if="store.isLoading"
      class="relative flex min-h-[60svh] items-center justify-center overflow-hidden bg-ink text-paper"
    >
      <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
      <div class="relative z-10 text-center">
        <StarMark :size="56" class="mx-auto animate-spin-slow text-lime-soft" />
        <p class="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
          Memuat detail agenda
        </p>
      </div>
    </section>

    <!-- Tidak ditemukan -->
    <section
      v-else-if="!event"
      class="relative flex min-h-[60svh] items-center overflow-hidden bg-ink text-paper"
    >
      <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
      <div
        class="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-moss/25 blur-[130px]"
      />
      <div class="container-wide relative z-10 py-16 text-center sm:py-24">
        <span class="eyebrow eyebrow-lime">Agenda</span>
        <h1 class="display-md mt-5 text-white">
          Agenda tidak ditemukan<span class="text-lime-soft">.</span>
        </h1>
        <p class="mx-auto mt-4 max-w-lg text-sm font-medium leading-relaxed text-white/60">
          {{ store.error || 'Agenda yang Anda cari mungkin sudah dihapus atau tautannya tidak lagi berlaku.' }}
        </p>
        <RouterLink to="/agenda" class="btn btn-lime mt-8">
          Kembali ke daftar agenda
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </RouterLink>
      </div>
    </section>

    <template v-else>
      <!-- Hero detail -->
      <section class="relative overflow-hidden bg-ink text-paper">
        <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
        <div
          class="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-moss/25 blur-[130px]"
        />

        <div class="container-wide relative z-10 py-[clamp(2rem,5vw,4rem)]">
          <RouterLink
            to="/agenda"
            class="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-lime-soft"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Kembali ke daftar agenda
          </RouterLink>

          <div class="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full border border-white/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/55"
                >
                  {{ event.category }}
                </span>
                <span
                  class="rounded-full bg-lime/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-lime-soft"
                >
                  {{ statusLabel(event.status) }}
                </span>
                <span
                  v-if="event.isOnline"
                  class="rounded-full border border-white/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/55"
                >
                  Daring
                </span>
              </div>

              <h1 class="display-md mt-5 max-w-3xl text-balance text-white">
                {{ event.title }}
              </h1>

              <p class="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/60 sm:text-base">
                {{ event.description }}
              </p>

              <div
                class="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/60"
              >
                <span class="flex items-center gap-2">
                  <span class="h-1.5 w-1.5 rounded-full bg-lime-soft" />
                  {{ formatDateRange(event) }}
                </span>
                <span class="flex items-center gap-2">
                  <svg class="h-3.5 w-3.5 text-lime-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M12 21s7-5.1 7-11a7 7 0 10-14 0c0 5.9 7 11 7 11z" stroke-linecap="round" stroke-linejoin="round" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {{ event.location || 'Lokasi belum ditentukan' }}
                </span>
              </div>

              <div class="mt-7 flex flex-wrap gap-2.5">
                <button
                  v-if="!isDone"
                  type="button"
                  class="btn btn-lime"
                  @click="scrollToRegistration"
                >
                  Daftar agenda
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
                <RouterLink to="/agenda" class="btn btn-outline-light">Semua agenda</RouterLink>
              </div>
            </div>

            <div class="relative">
              <div class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-forest">
                <img
                  v-if="event.coverImage || event.speakerAvatar"
                  :src="event.coverImage || event.speakerAvatar"
                  :alt="event.title"
                  class="h-[clamp(15rem,38svh,27rem)] w-full object-cover grayscale transition duration-700 hover:scale-[1.02] hover:grayscale-0"
                />
                <div
                  v-else
                  class="relative flex h-[clamp(15rem,38svh,27rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-forest to-ink"
                >
                  <div class="absolute inset-0 bg-grid-dark opacity-60" />
                  <StarMark :size="84" class="relative animate-spin-slow text-lime-soft" />
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
                <div class="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                  <div v-if="hasSpeaker">
                    <p class="text-[8px] font-black uppercase tracking-[0.18em] text-lime-soft">
                      Pemateri
                    </p>
                    <p class="mt-1 font-display text-xl font-semibold tracking-tight text-white">
                      {{ speakerName || 'Narasumber agenda' }}
                    </p>
                    <p v-if="speakerRole" class="text-[10px] font-semibold text-white/60">
                      {{ speakerRole }}
                    </p>
                  </div>
                  <span
                    v-else
                    class="text-[9px] font-black uppercase tracking-[0.16em] text-white/65"
                  >
                    HMI Insan Cita
                  </span>
                  <span
                    class="rounded-full bg-lime px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-white"
                  >
                    {{ event.category }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Detail + pendaftaran -->
      <section class="section-pad bg-paper">
        <div class="container-wide grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div class="space-y-5">
            <!-- Kartu pemateri -->
            <article
              v-if="hasSpeaker"
              class="relative overflow-hidden rounded-[1.75rem] border border-line bg-white p-5 sm:p-7"
            >
              <div
                class="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lime/20 blur-3xl"
              />
              <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <div
                  class="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] bg-ink text-lime-soft"
                >
                  <img
                    v-if="event.speakerAvatar"
                    :src="event.speakerAvatar"
                    :alt="speakerName || 'Pemateri agenda'"
                    class="h-full w-full object-cover"
                  />
                  <span v-else class="font-display text-2xl font-bold">{{ initials(speakerName) }}</span>
                </div>
                <div class="min-w-0">
                  <span class="eyebrow">Pemateri agenda</span>
                  <h2 class="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight text-ink">
                    {{ speakerName || 'Narasumber agenda' }}
                  </h2>
                  <p v-if="speakerRole" class="mt-1 text-sm font-bold text-moss">
                    {{ speakerRole }}
                  </p>
                  <p class="mt-3 text-xs font-medium leading-relaxed text-muted">
                    Pemateri pada agenda {{ event.title }}.
                  </p>
                </div>
              </div>
            </article>

            <!-- Tentang agenda -->
            <article class="rounded-[1.75rem] border border-line bg-white p-5 sm:p-7">
              <span class="eyebrow">Tentang agenda</span>
              <h2 class="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                Informasi kegiatan<span class="text-moss">.</span>
              </h2>
              <p class="mt-4 whitespace-pre-line text-sm font-medium leading-relaxed text-muted sm:text-base">
                {{ event.description }}
              </p>
            </article>

            <!-- Rundown -->
            <article
              v-if="event.rundown?.length"
              class="rounded-[1.75rem] border border-line bg-white p-5 sm:p-7"
            >
              <span class="eyebrow">Susunan acara</span>
              <h2 class="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                Rundown agenda<span class="text-moss">.</span>
              </h2>
              <ol class="mt-5 space-y-3">
                <li
                  v-for="(item, index) in event.rundown"
                  :key="`${item.time}-${index}`"
                  class="flex gap-4 rounded-[1rem] bg-paper px-4 py-3"
                >
                  <span class="w-16 flex-shrink-0 text-[10px] font-black uppercase tracking-[0.08em] text-moss">
                    {{ item.time }}
                  </span>
                  <span class="text-xs font-semibold leading-relaxed text-ink/75">
                    {{ item.activity }}
                  </span>
                </li>
              </ol>
            </article>
          </div>

          <aside class="space-y-4 lg:sticky lg:top-[calc(var(--nav-offset)+1.25rem)]">
            <!-- Ringkasan -->
            <div class="rounded-[1.75rem] border border-line bg-white p-5 sm:p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <span class="eyebrow">Ringkasan</span>
                  <h2 class="mt-2 font-display text-xl font-semibold tracking-tight text-ink">
                    Detail kegiatan
                  </h2>
                </div>
                <StarMark :size="28" class="text-moss/30" />
              </div>

              <dl class="mt-5 space-y-4">
                <div class="flex gap-3">
                  <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-paper text-moss">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M8 3v4M16 3v4M3 10h18" stroke-linecap="round" />
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <dt class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Tanggal</dt>
                    <dd class="mt-1 text-xs font-bold leading-relaxed text-ink">{{ formatDateRange(event) }}</dd>
                    <dd v-if="formatTime(event.date)" class="mt-0.5 text-[10px] font-semibold text-muted">
                      {{ formatTime(event.date) }}
                    </dd>
                  </div>
                </div>

                <div class="flex gap-3">
                  <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-paper text-moss">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M12 21s7-5.1 7-11a7 7 0 10-14 0c0 5.9 7 11 7 11z" stroke-linecap="round" stroke-linejoin="round" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <dt class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Lokasi</dt>
                    <dd class="mt-1 text-xs font-bold leading-relaxed text-ink">{{ event.location || 'Lokasi belum ditentukan' }}</dd>
                  </div>
                </div>

                <div class="flex gap-3">
                  <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-paper text-moss">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <dt class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Penyelenggara</dt>
                    <dd class="mt-1 text-xs font-bold leading-relaxed text-ink">{{ organizer }}</dd>
                  </div>
                </div>

                <div class="flex gap-3">
                  <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-paper text-moss">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <dt class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Kuota</dt>
                    <dd class="mt-1 text-xs font-bold leading-relaxed text-ink">{{ seatsLabel }}</dd>
                  </div>
                </div>
              </dl>

              <a
                v-if="event.meetingUrl"
                :href="event.meetingUrl"
                rel="noopener noreferrer"
                class="btn btn-ink mt-5 w-full"
              >
                Buka tautan meeting
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
            </div>

            <!-- Pendaftaran -->
            <div
              id="daftar"
              class="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-lime/20 bg-ink p-5 text-paper sm:p-6"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <span class="eyebrow eyebrow-lime">Pendaftaran</span>
                  <h2 class="mt-3 font-display text-2xl font-semibold tracking-tight text-white">
                    Daftar agenda ini<span class="text-lime-soft">.</span>
                  </h2>
                </div>
                <StarMark :size="32" class="text-lime-soft/70" />
              </div>

              <p class="mt-3 text-xs font-medium leading-relaxed text-white/55">
                Pendaftaran agenda ini terpisah dari pendaftaran LK 1. Isi data Anda, lalu panitia akan
                menghubungi melalui kontak yang diberikan.
              </p>

              <div
                v-if="isDone"
                class="mt-5 rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-center text-xs font-semibold text-white/70"
              >
                Kegiatan ini telah selesai.
              </div>

              <div
                v-else-if="isRegistered"
                class="mt-5 rounded-[1.2rem] border border-lime/30 bg-lime/15 p-4 text-center text-xs font-bold text-lime-soft"
              >
                Pendaftaran agenda berhasil dicatat. Panitia akan menghubungi Anda melalui kontak yang
                diberikan.
              </div>

              <template v-else-if="externalRegistrationUrl">
                <p class="mt-5 text-xs font-medium leading-relaxed text-white/55">
                  Pendaftaran agenda ini dikelola melalui formulir resmi panitia. Tombol di bawah akan
                  membuka formulir tersebut di tab yang sama.
                </p>
                <a
                  :href="externalRegistrationUrl"
                  rel="noopener noreferrer"
                  class="btn btn-lime mt-4 w-full"
                >
                  Buka formulir agenda
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </a>
              </template>

              <div
                v-else-if="isFull"
                class="mt-5 rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-center text-xs font-semibold text-white/70"
              >
                Kuota pendaftaran agenda ini sudah penuh.
              </div>

              <form v-else class="mt-5 space-y-2.5" @submit.prevent="handleRegisterSubmit">
                <input
                  v-model="regName"
                  type="text"
                  placeholder="Nama lengkap"
                  class="field"
                  autocomplete="name"
                  required
                />
                <input
                  v-model="regEmail"
                  type="email"
                  placeholder="Alamat email"
                  class="field"
                  autocomplete="email"
                  required
                />
                <input
                  v-model="regPhone"
                  type="tel"
                  placeholder="Nomor WhatsApp (opsional)"
                  class="field"
                  autocomplete="tel"
                />
                <button
                  type="submit"
                  :disabled="store.isRegistering"
                  class="btn btn-lime w-full disabled:opacity-60"
                >
                  {{ store.isRegistering ? 'Memproses...' : 'Konfirmasi pendaftaran agenda' }}
                </button>
                <p v-if="formError || store.error" class="text-[10px] font-semibold text-red-300">
                  {{ formError || store.error }}
                </p>
              </form>

              <p class="mt-4 rounded-[0.9rem] bg-white/5 px-3 py-2.5 text-[9px] font-semibold leading-relaxed text-white/50">
                Ingin mengikuti LK 1?
                <RouterLink to="/daftar" class="font-black text-lime-soft hover:text-white">
                  Buka Pendaftaran LK 1 →
                </RouterLink>
              </p>
            </div>
          </aside>
        </div>
      </section>

      <!-- Kembali ke daftar -->
      <section class="border-t border-line bg-paper-deep py-10 sm:py-12">
        <div class="container-wide flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span class="eyebrow">Agenda lainnya</span>
            <h2 class="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
              Lihat kegiatan lain dari HMI Insan Cita<span class="text-moss">.</span>
            </h2>
          </div>
          <RouterLink to="/agenda" class="btn btn-ink flex-shrink-0">
            Kembali ke daftar agenda
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>
        </div>
      </section>
    </template>
  </div>
</template>
