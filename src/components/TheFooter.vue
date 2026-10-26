<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useSiteStore } from '@/stores/site'
import StarMark from '@/components/ui/StarMark.vue'

const siteStore = useSiteStore()
const settings = computed(() => siteStore.settings)
const phoneHref = computed(() => `tel:${settings.value.phone.replace(/[^\d+]/g, '')}`)
const displayName = computed(() => settings.value.organizationName || settings.value.organizationShortName || 'HMI')
const activeSocials = computed(() => settings.value.socials.filter((social) => social.url))
const hasContact = computed(
  () =>
    Boolean(settings.value.address) ||
    Boolean(settings.value.phone) ||
    Boolean(settings.value.email) ||
    Boolean(settings.value.website),
)

const quickLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Tentang Kami', to: '/tentang' },
  { label: 'Berita', to: '/berita' },
  { label: 'Agenda', to: '/agenda' },
  { label: 'Galeri', to: '/galeri' },
  { label: 'Pendaftaran LK 1', to: '/daftar' },
  { label: 'Kontak', to: '/kontak' },
]

const programs = [
  'Latihan Kader I (LK 1)',
  'Latihan Kader II (LK 2)',
  'Senior Course (LK 3)',
  'Kajian NDP',
  'Bakti Sosial',
  'KOHATI',
]
</script>

<template>
  <footer class="relative overflow-hidden bg-lime text-white">
    <div class="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-white/15" />
    <div class="pointer-events-none absolute -bottom-28 -left-20 h-96 w-96 rounded-full border border-white/15" />

    <div class="container-wide relative z-10">
      <!-- Top call to action -->
      <div class="grid gap-8 border-b border-white/20 py-12 sm:py-16 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div>
          <span class="eyebrow eyebrow-light">Tetap terhubung</span>
          <h2 class="display-lg mt-5 max-w-3xl">
            Mari bergerak
            <span class="text-stroke-dark">bersama.</span>
          </h2>
        </div>
        <div class="flex flex-col items-start gap-5 lg:items-end">
          <p class="max-w-sm text-sm font-semibold leading-relaxed text-white/85 lg:text-right">
            Ikuti perjalanan perkaderan, agenda, dan pengabdian HMI Komisariat Insan Cita.
          </p>
          <div class="flex flex-wrap gap-2 lg:justify-end">
            <RouterLink to="/daftar" class="btn btn-ink">
              Daftar LK 1
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </RouterLink>
            <RouterLink to="/kontak" class="btn btn-outline-light">
              Hubungi Kami
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1fr] lg:py-16">
        <!-- Brand -->
        <div>
          <RouterLink to="/" class="group flex items-center gap-3" aria-label="Beranda HMI Insan Cita">
            <span class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-ink p-1.5 ring-1 ring-white/15">
              <img
                v-if="settings.logoUrl"
                :src="settings.logoUrl"
                :alt="`Logo ${displayName}`"
                class="h-full w-full object-contain"
              />
              <span v-else class="text-[10px] font-black text-lime-soft">HMI</span>
            </span>
            <span class="flex flex-col leading-none">
              <span class="font-display text-lg font-bold tracking-tight">{{ displayName }}</span>
              <span class="mt-1.5 text-[8px] font-black uppercase tracking-[0.22em] text-white/85">
                {{ settings.chapterName || 'Komisariat Insan Cita' }}
              </span>
            </span>
          </RouterLink>

          <p v-if="settings.description" class="mt-5 max-w-xs text-xs font-semibold leading-relaxed text-white/85">
            {{ settings.description }}
          </p>

          <div v-if="activeSocials.length" class="mt-6 flex flex-wrap gap-2">
            <a
              v-for="social in activeSocials"
              :key="social.platform"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-full border border-white/25 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/85 transition-colors hover:border-white hover:bg-ink hover:text-lime-soft"
            >
              {{ social.label }}
            </a>
          </div>
        </div>

        <!-- Navigasi -->
        <div>
          <h3 class="text-[9px] font-black uppercase tracking-[0.22em] text-white/85">Navigasi</h3>
          <ul class="mt-5 space-y-2.5">
            <li v-for="link in quickLinks" :key="link.to">
              <RouterLink
                :to="link.to"
                class="group inline-flex items-center gap-2 text-xs font-bold text-white/90 transition-colors hover:text-white"
              >
                <span class="h-px w-3 bg-white/35 transition-all group-hover:w-5 group-hover:bg-white" />
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Program -->
        <div>
          <h3 class="text-[9px] font-black uppercase tracking-[0.22em] text-white/85">Program</h3>
          <ul class="mt-5 space-y-2.5">
            <li v-for="program in programs" :key="program" class="flex items-start gap-2 text-xs font-bold text-white/90">
              <span class="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-white/55" />
              {{ program }}
            </li>
          </ul>
        </div>

        <!-- Kontak -->
        <div>
          <h3 class="text-[9px] font-black uppercase tracking-[0.22em] text-white/85">Kontak</h3>
          <ul v-if="hasContact" class="mt-5 space-y-4">
            <li v-if="settings.address" class="text-xs font-bold leading-relaxed text-white/90">
              <span class="mb-1 block text-[8px] font-black uppercase tracking-[0.18em] text-white/85">Alamat</span>
              <span class="whitespace-pre-line">{{ settings.address }}</span>
            </li>
            <li v-if="settings.phone" class="text-xs font-bold text-white/90">
              <span class="mb-1 block text-[8px] font-black uppercase tracking-[0.18em] text-white/85">Telepon</span>
              <a :href="phoneHref" class="transition-colors hover:text-white">{{ settings.phone }}</a>
            </li>
            <li v-if="settings.email" class="text-xs font-bold text-white/90">
              <span class="mb-1 block text-[8px] font-black uppercase tracking-[0.18em] text-white/85">Email</span>
              <a :href="`mailto:${settings.email}`" class="break-all transition-colors hover:text-white">{{ settings.email }}</a>
            </li>
            <li v-if="settings.website" class="text-xs font-bold text-white/90">
              <span class="mb-1 block text-[8px] font-black uppercase tracking-[0.18em] text-white/85">Website</span>
              <a :href="settings.website" target="_blank" rel="noopener noreferrer" class="break-all transition-colors hover:text-white">
                {{ settings.website }}
              </a>
            </li>
          </ul>
          <p v-else class="mt-5 text-xs font-semibold leading-relaxed text-white/85">
            Informasi kontak belum tersedia. Sampaikan pesan melalui halaman kontak.
          </p>
        </div>
      </div>

      <!-- Giant wordmark -->
      <div class="relative overflow-hidden border-t border-white/20 py-7">
        <div class="flex items-end justify-between gap-4">
          <span class="font-display text-[clamp(3rem,10vw,8rem)] font-bold leading-[0.75] tracking-[-0.07em] text-white">
            HMI<span class="text-white/85">.</span>
          </span>
          <StarMark :size="54" class="mb-1 hidden animate-spin-slow text-white/85 sm:block" />
        </div>
      </div>

      <div class="flex flex-col gap-3 border-t border-white/20 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-[10px] font-bold text-white/85">
          &copy; {{ new Date().getFullYear() }} {{ displayName }}. Hak cipta dilindungi.
        </p>
        <p v-if="settings.tagline" class="flex items-center gap-2 text-[10px] font-bold text-white/85">
          <span class="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          {{ settings.tagline }}
        </p>
      </div>
    </div>
  </footer>
</template>
