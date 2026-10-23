<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-[#111212] flex items-center justify-center px-4 relative overflow-hidden">
    <div class="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#009246]/10 rounded-full blur-3xl" />
    <div class="relative text-center">
      <div class="text-[180px] font-extrabold text-transparent bg-clip-text leading-none mb-2" style="background-image: linear-gradient(135deg, #009246, #00A651, #B7E1CD);">
        404
      </div>
      <h1 class="text-2xl font-extrabold text-white mb-3">Halaman Tidak Ditemukan</h1>
      <p class="text-white/50 mb-8 max-w-sm mx-auto">Halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 px-6 py-3 bg-[#009246] hover:bg-[#006837] text-white font-bold rounded-full transition-all shadow-xl shadow-[#009246]/30"
      >
         Kembali ke Beranda
      </RouterLink>
    </div>
  </div>
</template>
