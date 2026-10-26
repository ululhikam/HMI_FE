<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StarMark from '@/components/ui/StarMark.vue'
</script>

<template>
  <div class="screen-min relative flex items-center justify-center overflow-hidden bg-ink px-4 py-16 text-paper">
    <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
    <div class="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/20 blur-[130px]" />

    <div class="relative z-10 w-full max-w-2xl text-center">
      <StarMark :size="48" class="mx-auto animate-spin-slow text-lime-soft" />
      <p class="mt-10 font-display text-[clamp(7rem,22vw,15rem)] font-bold leading-[0.7] tracking-[-0.08em] text-lime-soft">
        404
      </p>
      <h1 class="mt-8 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Halaman tidak ditemukan<span class="text-lime-soft">.</span></h1>
      <p class="mx-auto mt-4 max-w-sm text-sm font-medium leading-relaxed text-white/60">
        Halaman yang Anda cari mungkin sudah dipindahkan atau tidak pernah ada.
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <RouterLink to="/" class="btn btn-lime">
          Kembali ke beranda
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </RouterLink>
        <RouterLink to="/berita" class="btn btn-outline-light">Lihat berita</RouterLink>
      </div>
    </div>
  </div>
</template>
