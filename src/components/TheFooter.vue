<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useSiteStore } from '@/stores/site'

const siteStore = useSiteStore()
const settings = computed(() => siteStore.settings)
const phoneHref = computed(() => `tel:${settings.value.phone.replace(/[^\d+]/g, '')}`)
const displayName = computed(() => settings.value.organizationName || settings.value.organizationShortName)
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
  { label: 'Berita & Artikel', to: '/berita' },
  { label: 'Galeri Kegiatan', to: '/galeri' },
  { label: 'Pendaftaran LK 1', to: '/daftar' },
  { label: 'Kontak', to: '/kontak' },
]

const programs = [
  'Latihan Kader I (LK 1)',
  'Latihan Kader II (LK 2)',
  'Senior Course (LK III)',
  'Kajian NDP',
  'Bakti Sosial',
  'KOHATI',
]
</script>

<template>
  <footer class="bg-[#111212] text-white">
    <div class="h-[3px] bg-gradient-to-r from-[#006837] via-[#009246] to-[#00A651]" />

    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-14">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        <!-- Brand -->
        <div class="lg:col-span-1">
          <RouterLink to="/" class="flex items-center gap-3 mb-5 group">
            <div class="h-12 w-12 flex items-center justify-center flex-shrink-0">
              <img
                v-if="settings.logoUrl"
                :src="settings.logoUrl"
                :alt="`Logo ${displayName || 'HMI'}`"
                class="h-full w-full object-contain rounded-full ring-1 ring-white/15 drop-shadow-md group-hover:scale-105 transition-all duration-300"
              />
              <span v-else class="w-full h-full rounded-full bg-[#009246]/20 border border-white/10 flex items-center justify-center text-[10px] font-black text-white">
                HMI
              </span>
            </div>
            <div v-if="settings.organizationShortName || settings.chapterName">
              <div class="text-white font-black text-base">{{ settings.organizationShortName }}</div>
              <div class="text-[#009246] text-[9px] font-black tracking-[0.2em] uppercase">{{ settings.chapterName }}</div>
            </div>
          </RouterLink>
          <p v-if="settings.description" class="text-white/40 text-xs leading-relaxed mb-5">
            {{ settings.description }}
          </p>

          <!-- Social links -->
          <div v-if="activeSocials.length" class="flex flex-wrap gap-2">
            <a
              v-for="social in activeSocials"
              :key="social.platform"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="px-2.5 py-1 border border-white/10 hover:border-[#009246] text-white/40 hover:text-[#009246] text-[10px] font-bold uppercase tracking-wider rounded transition-all"
            >
              {{ social.label }}
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-white font-black text-xs uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
            <span class="w-4 h-0.5 bg-[#009246]" />
            Navigasi
          </h4>
          <ul class="space-y-2.5">
            <li v-for="link in quickLinks" :key="link.to">
              <RouterLink :to="link.to"
                class="text-white/40 hover:text-[#009246] text-xs font-semibold uppercase tracking-wide transition-colors duration-200 flex items-center gap-2 group"
              >
                <span class="w-3 h-px bg-white/20 group-hover:bg-[#009246] group-hover:w-4 transition-all duration-200" />
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Programs -->
        <div>
          <h4 class="text-white font-black text-xs uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
            <span class="w-4 h-0.5 bg-[#009246]" />
            Program Kaderisasi
          </h4>
          <ul class="space-y-2.5">
            <li v-for="prog in programs" :key="prog" class="flex items-center gap-2 text-white/40 text-xs font-semibold">
              <span class="w-1 h-1 rounded-full bg-[#009246] flex-shrink-0" />
              {{ prog }}
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-white font-black text-xs uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
            <span class="w-4 h-0.5 bg-[#009246]" />
            Kontak
          </h4>
          <ul v-if="hasContact" class="space-y-4 text-xs text-white/40 font-semibold">
            <li v-if="settings.address">
              <div class="text-[#009246] text-[10px] uppercase tracking-widest font-black mb-0.5">Alamat</div>
              <span class="whitespace-pre-line">{{ settings.address }}</span>
            </li>
            <li v-if="settings.phone">
              <div class="text-[#009246] text-[10px] uppercase tracking-widest font-black mb-0.5">Telepon</div>
              <a :href="phoneHref" class="hover:text-[#009246] transition-colors">{{ settings.phone }}</a>
            </li>
            <li v-if="settings.email">
              <div class="text-[#009246] text-[10px] uppercase tracking-widest font-black mb-0.5">Email</div>
              <a :href="`mailto:${settings.email}`" class="hover:text-[#009246] transition-colors">{{ settings.email }}</a>
            </li>
            <li v-if="settings.website">
              <div class="text-[#009246] text-[10px] uppercase tracking-widest font-black mb-0.5">Website</div>
              <a :href="settings.website" target="_blank" rel="noopener noreferrer" class="hover:text-[#009246] transition-colors">
                {{ settings.website }}
              </a>
            </li>
          </ul>
          <p v-else class="text-xs text-white/30 font-semibold">Informasi kontak belum tersedia.</p>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-white/8">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-white/25 text-[11px] font-semibold">
          &copy; {{ new Date().getFullYear() }} {{ displayName || 'HMI' }}. All rights reserved.
        </p>
        <div v-if="settings.tagline" class="flex items-center gap-2 text-white/25 text-[11px] font-semibold">
          <span class="w-1.5 h-1.5 rounded-full bg-[#009246] animate-pulse" />
          {{ settings.tagline }}
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.border-white\/8 { border-color: rgba(255,255,255,0.08); }
</style>
