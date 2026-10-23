<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useSiteStore } from '@/stores/site'
import { useContactStore } from '@/stores/contact'

const siteStore = useSiteStore()
const contact = useContactStore()

const settings = computed(() => siteStore.settings)
const activeSocials = computed(() => settings.value.socials.filter((social) => social.url))
const submitted = ref(false)
const form = reactive({ name: '', email: '', subject: '', message: '' })

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

async function submitContact() {
  if (!form.name || !form.email || !form.message) return
  const sent = await contact.submitMessage({
    name: form.name,
    email: form.email,
    subject: form.subject || 'Pesan dari halaman kontak',
    message: form.message,
  })
  if (sent) submitted.value = true
}

onMounted(() => {
  void siteStore.fetchSettings()
})
</script>

<template>
  <div class="pt-[67px] bg-[#F7F7F5] min-h-screen">
    <!-- Hero -->
    <section class="bg-[#111212] relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-[#009246]/15 to-[#111212]" />
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div class="inline-flex items-center gap-2 text-[#009246] text-xs font-bold uppercase tracking-widest mb-4">
          <span class="w-8 h-0.5 bg-[#009246] rounded-full" />
          Hubungi Kami
        </div>
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white mb-3">Kontak & Lokasi</h1>
        <p class="text-white/50 max-w-lg mx-auto">Ada pertanyaan? Kami siap membantu Anda.</p>
      </div>
    </section>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid lg:grid-cols-2 gap-12">

        <!-- Contact Info -->
        <div class="space-y-8">
          <div>
            <h2 class="text-2xl font-extrabold text-[#111212] mb-6">Informasi Kontak</h2>
            <div class="space-y-5">
              <div v-if="settings.address" class="flex items-start gap-4 group">
                <div class="w-12 h-12 bg-[#009246]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#009246] transition-colors">
                  
                </div>
                <div>
                  <div class="font-bold text-[#111212] text-sm mb-1">Alamat Sekretariat</div>
                  <p class="text-[#4D4D4D] text-sm leading-relaxed">{{ settings.address }}</p>
                </div>
              </div>
              <div v-if="settings.phone" class="flex items-start gap-4 group">
                <div class="w-12 h-12 bg-[#009246]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#009246] transition-colors">
                  
                </div>
                <div>
                  <div class="font-bold text-[#111212] text-sm mb-1">Telepon / WhatsApp</div>
                  <a :href="phoneHref(settings.phone)" class="text-[#4D4D4D] text-sm hover:text-[#009246] transition-colors">{{ settings.phone }}</a>
                </div>
              </div>
              <div v-if="settings.email" class="flex items-start gap-4 group">
                <div class="w-12 h-12 bg-[#009246]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#009246] transition-colors">
                  
                </div>
                <div>
                  <div class="font-bold text-[#111212] text-sm mb-1">Email</div>
                  <a :href="`mailto:${settings.email}`" class="text-[#4D4D4D] text-sm hover:text-[#009246] transition-colors">{{ settings.email }}</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Social Media -->
          <div v-if="activeSocials.length">
            <h3 class="text-[#111212] font-bold text-sm mb-4">Media Sosial Resmi</h3>
            <div class="flex flex-wrap gap-3">
              <a
                v-for="social in activeSocials"
                :key="social.platform"
                :href="social.url"
                :aria-label="social.label"
                target="_blank"
                rel="noopener noreferrer"
                class="h-11 min-w-11 px-3 bg-white border border-[#E6E6E6] hover:border-[#009246] hover:bg-[#009246] rounded-xl flex items-center justify-center text-[#4D4D4D] hover:text-white transition-all duration-200 shadow-sm text-xs font-bold"
              >
                {{ social.label }}
              </a>
            </div>
          </div>

          <!-- Lokasi Sekretariat -->
          <div class="rounded-2xl overflow-hidden shadow-lg border border-[#E6E6E6] min-h-52 bg-gradient-to-br from-[#009246] to-[#111212] flex items-center justify-center p-6 text-white">
            <div class="text-center space-y-1">
              <svg class="w-8 h-8 mx-auto text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p class="text-sm font-semibold">Lokasi Sekretariat</p>
              <p class="text-xs text-white/70">{{ settings.address || 'Alamat belum tersedia' }}</p>
              <p class="text-xs text-white/50">{{ settings.organizationName }}</p>
            </div>
          </div>
        </div>

        <!-- Contact Form -->
        <div class="bg-white rounded-3xl shadow-xl p-8">
          <div v-if="submitted" class="h-full flex flex-col items-center justify-center text-center py-12">
            <div class="w-20 h-20 bg-[#009246]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              
            </div>
            <h2 class="text-2xl font-extrabold text-[#111212] mb-3">Pesan Terkirim!</h2>
            <p class="text-[#4D4D4D] text-sm">Terima kasih, <strong>{{ form.name }}</strong>! Kami akan segera merespons pesan Anda dalam 1×24 jam.</p>
          </div>
          <div v-else>
            <h2 class="text-xl font-extrabold text-[#111212] mb-1">Kirim Pesan</h2>
            <p class="text-[#4D4D4D] text-sm mb-6">Kami senang mendengar dari Anda.</p>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Nama Lengkap</label>
                <input v-model="form.name" type="text" placeholder="Nama Anda..." class="w-full px-4 py-3 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all" />
              </div>
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Email</label>
                <input v-model="form.email" type="email" placeholder="email@contoh.com" class="w-full px-4 py-3 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all" />
              </div>
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Subjek</label>
                <input v-model="form.subject" type="text" placeholder="Pertanyaan tentang..." class="w-full px-4 py-3 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all" />
              </div>
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Pesan</label>
                <textarea v-model="form.message" rows="5" placeholder="Tulis pesan Anda di sini..." class="w-full px-4 py-3 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all resize-none" />
              </div>
              <button
                @click="submitContact"
                :disabled="contact.isSubmitting"
                class="w-full flex items-center justify-center gap-2 py-3 bg-[#009246] hover:bg-[#006837] disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#009246]/20 text-sm"
              >
                {{ contact.isSubmitting ? 'Mengirim...' : 'Kirim Pesan' }}
              </button>
              <p v-if="contact.error" class="text-xs text-red-500 text-center">{{ contact.error }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
