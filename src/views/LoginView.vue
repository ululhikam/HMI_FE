<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const showPass = ref(false)
const error = computed(() => auth.error)

async function handleLogin() {
  const ok = await auth.login(form.email, form.password)
  if (ok) {
    const redirect = (route.query.redirect as string) || '/admin/dashboard'
    await router.push(redirect)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#111212] flex items-center justify-center px-4 relative overflow-hidden">
    <!-- Background glows -->
    <div class="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#009246]/10 rounded-full blur-3xl" />
    <div class="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#009246]/5 rounded-full blur-3xl" />

    <div class="relative w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="h-24 w-24 mx-auto mb-4 flex items-center justify-center">
          <img
            src="/logo-komisariat.jpg"
            alt="Logo HMI Komisariat Insan Cita"
            class="h-full w-full object-contain rounded-full ring-2 ring-white/20 shadow-2xl"
          />
        </div>
        <h1 class="text-2xl font-extrabold text-white">Admin Panel</h1>
        <p class="text-white/40 text-sm mt-1">HMI Komisariat Insan Cita</p>
      </div>

      <!-- Card -->
      <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h2 class="text-white font-bold text-lg mb-6">Masuk ke Dashboard</h2>

        <div v-if="error" class="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
          
          <p class="text-red-400 text-sm">{{ error }}</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-white/70 text-sm font-semibold mb-1.5 block">Email</label>
            <div class="relative">
              
              <input
                v-model="form.email"
                type="email"
                placeholder="nama@email.com"
                class="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all"
                @keyup.enter="handleLogin"
              />
            </div>
          </div>
          <div>
            <label class="text-white/70 text-sm font-semibold mb-1.5 block">Password</label>
            <div class="relative">
              
              <input
                v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full pl-11 pr-12 py-3 bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all"
                @keyup.enter="handleLogin"
              />
              <button @click="showPass = !showPass" class="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                
                
              </button>
            </div>
          </div>

          <button
            @click="handleLogin"
            :disabled="auth.isLoading"
            class="w-full py-3 bg-[#009246] hover:bg-[#006837] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#009246]/30 flex items-center justify-center gap-2"
          >
            <svg v-if="auth.isLoading" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ auth.isLoading ? 'Memverifikasi...' : 'Masuk' }}
          </button>
        </div>

        <div class="mt-6 pt-5 border-t border-white/10 text-center">
          <RouterLink to="/" class="inline-flex items-center gap-1.5 text-[#009246] hover:text-[#00A651] text-sm font-semibold transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali ke Website</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
