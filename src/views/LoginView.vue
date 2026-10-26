<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSiteStore } from '@/stores/site'
import StarMark from '@/components/ui/StarMark.vue'

const auth = useAuthStore()
const siteStore = useSiteStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const showPass = ref(false)
const error = computed(() => auth.error)
const displayName = computed(() => siteStore.settings.organizationShortName || 'HMI')
const chapterName = computed(() => siteStore.settings.chapterName || 'Insan Cita')

async function handleLogin() {
  if (!form.email || !form.password) return
  const ok = await auth.login(form.email, form.password)
  if (ok) {
    const redirect = (route.query.redirect as string) || '/admin/dashboard'
    await router.push(redirect)
  }
}

onMounted(() => {
  void siteStore.fetchSettings()
})
</script>

<template>
  <div class="screen-min bg-paper lg:grid lg:grid-cols-[1.05fr_0.95fr]">
    <!-- Brand panel -->
    <section class="relative hidden overflow-hidden bg-ink p-10 text-paper lg:flex lg:flex-col lg:justify-between xl:p-14">
      <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
      <div class="pointer-events-none absolute -left-24 bottom-10 h-80 w-80 rounded-full bg-moss/25 blur-[120px]" />

      <div class="relative z-10 flex items-center justify-between">
        <RouterLink to="/" class="group flex items-center gap-3" aria-label="Kembali ke beranda">
          <span class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-paper p-1.5 ring-1 ring-white/10">
            <img v-if="siteStore.settings.logoUrl" :src="siteStore.settings.logoUrl" :alt="displayName" class="h-full w-full object-contain" />
            <span v-else class="text-[9px] font-black text-ink">HMI</span>
          </span>
          <span class="flex flex-col leading-none">
            <span class="font-display text-base font-bold tracking-tight text-white">{{ displayName }}</span>
            <span class="mt-1 text-[8px] font-black uppercase tracking-[0.22em] text-lime-soft">{{ chapterName }}</span>
          </span>
        </RouterLink>
        <span class="rounded-full border border-white/15 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-white/60">Panel admin</span>
      </div>

      <div class="relative z-10">
        <StarMark :size="54" class="animate-spin-slow text-lime-soft" />
        <h1 class="display-xl mt-8 max-w-xl text-white">
          Ruang kerja
          <span class="text-lime-soft">pengurus.</span>
        </h1>
        <p class="mt-6 max-w-md text-sm font-medium leading-relaxed text-white/60">
          Kelola berita, agenda, galeri, pendaftar, dan data pengurus HMI Komisariat Insan Cita dalam satu tempat.
        </p>
        <div class="mt-10 grid max-w-md grid-cols-3 gap-2">
          <div class="rounded-[1rem] border border-white/10 bg-white/5 p-3">
            <p class="text-[8px] font-black uppercase tracking-[0.12em] text-lime-soft">Berita</p>
            <p class="mt-1 text-[10px] font-semibold text-white/65">Kelola konten</p>
          </div>
          <div class="rounded-[1rem] border border-white/10 bg-white/5 p-3">
            <p class="text-[8px] font-black uppercase tracking-[0.12em] text-lime-soft">Agenda</p>
            <p class="mt-1 text-[10px] font-semibold text-white/65">Atur kegiatan</p>
          </div>
          <div class="rounded-[1rem] border border-white/10 bg-white/5 p-3">
            <p class="text-[8px] font-black uppercase tracking-[0.12em] text-lime-soft">Kader</p>
            <p class="mt-1 text-[10px] font-semibold text-white/65">Data pendaftar</p>
          </div>
        </div>
      </div>

      <div class="relative z-10 flex items-center justify-between border-t border-white/10 pt-5">
        <span class="text-[9px] font-black uppercase tracking-[0.16em] text-white/60">Yakin Usaha Sampai</span>
        <RouterLink to="/" class="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-white/60 transition-colors hover:text-lime-soft">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Beranda
        </RouterLink>
      </div>
    </section>

    <!-- Form panel -->
    <section class="screen-min relative flex items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
      <div class="pointer-events-none absolute inset-0 bg-grid-light opacity-40" />
      <div class="relative w-full max-w-md">
        <!-- Mobile brand -->
        <div class="mb-8 flex items-center justify-between lg:hidden">
          <RouterLink to="/" class="flex items-center gap-2.5">
            <span class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-ink p-1.5">
              <img v-if="siteStore.settings.logoUrl" :src="siteStore.settings.logoUrl" :alt="displayName" class="h-full w-full object-contain" />
              <span v-else class="text-[9px] font-black text-lime-soft">HMI</span>
            </span>
            <span class="flex flex-col leading-none">
              <span class="font-display text-base font-bold tracking-tight text-ink">{{ displayName }}</span>
              <span class="mt-1 text-[8px] font-black uppercase tracking-[0.18em] text-moss">{{ chapterName }}</span>
            </span>
          </RouterLink>
          <RouterLink to="/" class="text-[9px] font-black uppercase tracking-[0.12em] text-muted">Beranda</RouterLink>
        </div>

        <div class="rounded-[1.75rem] border border-line bg-white p-6 shadow-soft sm:p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <span class="eyebrow eyebrow-ink">Area pengurus</span>
              <h2 class="display-md mt-4">Masuk<span class="text-moss">.</span></h2>
              <p class="mt-3 text-sm font-medium leading-relaxed text-muted">Gunakan akun pengurus yang terdaftar.</p>
            </div>
            <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-paper text-moss">
              <StarMark :size="18" />
            </span>
          </div>

          <form class="mt-7 space-y-4" @submit.prevent="handleLogin">
            <div>
              <label class="field-label" for="login-email">Email</label>
              <input
                id="login-email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                placeholder="admin@hmi-insancita.org"
                class="field"
                required
              />
            </div>
            <div>
              <label class="field-label" for="login-password">Kata sandi</label>
              <div class="relative">
                <input
                  id="login-password"
                  v-model="form.password"
                  :type="showPass ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Masukkan kata sandi"
                  class="field pr-12"
                  required
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
                  :aria-label="showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                  @click="showPass = !showPass"
                >
                  <svg v-if="showPass" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5.4 0 9 5 9 7a12.5 12.5 0 01-2.1 3.2M6.2 6.2C4.1 7.6 3 9.6 3 12c0 2 3.6 7 9 7 1.5 0 2.9-.4 4.1-1.1" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M3 12c0-2 3.6-7 9-7s9 5 9 7-3.6 7-9 7-9-5-9-7z" stroke-linecap="round" stroke-linejoin="round" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </button>
              </div>
            </div>

            <p v-if="error" class="rounded-[0.9rem] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-red-700">{{ error }}</p>

            <button type="submit" :disabled="auth.isLoading" class="btn btn-ink w-full disabled:opacity-60">
              {{ auth.isLoading ? 'Memeriksa akun...' : 'Masuk ke panel' }}
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </form>

          <div class="mt-6 flex items-center gap-2 border-t border-line pt-4 text-[9px] font-semibold leading-relaxed text-muted">
            <svg class="h-3.5 w-3.5 flex-shrink-0 text-moss" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 018 0v3" stroke-linecap="round" />
            </svg>
            Akses terbatas untuk pengurus. Hubungi administrator bila akun belum aktif.
          </div>
        </div>

        <p class="mt-5 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
          &copy; {{ new Date().getFullYear() }} {{ siteStore.settings.organizationName || 'HMI Komisariat Insan Cita' }}
        </p>
      </div>
    </section>
  </div>
</template>
