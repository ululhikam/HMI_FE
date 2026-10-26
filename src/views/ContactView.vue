<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useSiteStore } from '@/stores/site'
import { useContactStore } from '@/stores/contact'
import PageHero from '@/components/ui/PageHero.vue'
import StarMark from '@/components/ui/StarMark.vue'

const siteStore = useSiteStore()
const contact = useContactStore()

const settings = computed(() => siteStore.settings)
const activeSocials = computed(() => settings.value.socials.filter((social) => social.url))
const submitted = ref(false)
const form = reactive({ name: '', email: '', subject: '', message: '' })

const contactItems = computed(() =>
  [
    { key: 'address', label: 'Alamat sekretariat', value: settings.value.address, href: '' },
    { key: 'phone', label: 'Telepon / WhatsApp', value: settings.value.phone, href: settings.value.phone ? `tel:${settings.value.phone.replace(/[^+\d]/g, '')}` : '' },
    { key: 'email', label: 'Email', value: settings.value.email, href: settings.value.email ? `mailto:${settings.value.email}` : '' },
    { key: 'website', label: 'Website', value: settings.value.website, href: settings.value.website },
  ].filter((item) => Boolean(item.value)),
)

function resetForm() {
  submitted.value = false
  form.name = ''
  form.email = ''
  form.subject = ''
  form.message = ''
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
  <div class="bg-paper text-ink">
    <PageHero
      eyebrow="Kontak"
      title="Mari"
      accent="terhubung."
      description="Ada pertanyaan, ide kolaborasi, atau ingin mengenal HMI Insan Cita lebih dekat? Sampaikan pesan Anda."
      meta="Sekretariat HMI Insan Cita"
    />

    <section class="section-pad">
      <div class="container-wide">
        <div class="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <!-- Info -->
          <div class="space-y-4">
            <div class="relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-paper sm:p-8">
              <div class="absolute inset-0 bg-grid-dark opacity-60" />
              <div class="relative">
                <span class="eyebrow eyebrow-lime">Sekretariat</span>
                <h2 class="display-md mt-5 text-white">Datang,<br />bicara,<br /><span class="text-lime-soft">bertumbuh.</span></h2>
                <p class="mt-5 max-w-sm text-sm font-medium leading-relaxed text-white/60">
                  Pintu komisariat terbuka untuk mahasiswa yang ingin mengenal gerakan dan proses perkaderan HMI.
                </p>
                <StarMark :size="42" class="mt-8 text-lime-soft" />
              </div>
            </div>

            <div v-if="contactItems.length" class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              <div
                v-for="item in contactItems"
                :key="item.key"
                class="group flex items-start gap-3 rounded-[1.2rem] border border-line bg-white p-4 transition-colors hover:border-ink/30"
              >
                <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-paper text-moss">
                  <svg v-if="item.key === 'address'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M12 21s7-5.1 7-11a7 7 0 10-14 0c0 5.9 7 11 7 11z" stroke-linecap="round" stroke-linejoin="round" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  <svg v-else-if="item.key === 'phone'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M5 4h4l2 5-2.5 1.5a15 15 0 006 6L16 14l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <svg v-else-if="item.key === 'email'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18" stroke-linecap="round" />
                  </svg>
                </span>
                <div class="min-w-0">
                  <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">{{ item.label }}</p>
                  <a
                    v-if="item.href"
                    :href="item.href"
                    :target="item.key === 'website' ? '_blank' : undefined"
                    :rel="item.key === 'website' ? 'noopener noreferrer' : undefined"
                    class="mt-1 block break-words text-xs font-bold leading-relaxed text-ink/75 transition-colors hover:text-moss"
                  >
                    {{ item.value }}
                  </a>
                  <p v-else class="mt-1 whitespace-pre-line text-xs font-bold leading-relaxed text-ink/75">{{ item.value }}</p>
                </div>
              </div>
            </div>
            <p v-else class="rounded-[1.2rem] border border-dashed border-line p-4 text-xs font-semibold leading-relaxed text-muted">
              Informasi kontak belum tersedia. Silakan kirim pesan melalui formulir.
            </p>

            <div v-if="activeSocials.length" class="rounded-[1.2rem] border border-line bg-white p-4">
              <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Media sosial resmi</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <a
                  v-for="social in activeSocials"
                  :key="social.platform"
                  :href="social.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rounded-full border border-line px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-ink/55 transition-colors hover:border-ink hover:bg-ink hover:text-lime-soft"
                >
                  {{ social.label }}
                </a>
              </div>
            </div>
          </div>

          <!-- Form -->
          <div class="relative overflow-hidden rounded-[2rem] border border-line bg-white p-6 sm:p-9">
            <div class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lime/20 blur-3xl" />

            <div v-if="submitted" class="success-panel relative flex flex-col items-center justify-center text-center">
              <span class="flex h-16 w-16 items-center justify-center rounded-full bg-lime text-white">
                <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="eyebrow mt-6">Pesan terkirim</span>
              <h2 class="display-md mt-4">Terima kasih, {{ form.name }}.</h2>
              <p class="mt-4 max-w-md text-sm font-medium leading-relaxed text-muted">
                Pesan Anda sudah kami terima. Kami akan merespons melalui email yang Anda cantumkan.
              </p>
              <button type="button" class="btn btn-ink mt-7" @click="resetForm">Kirim pesan lain</button>
            </div>

            <div v-else class="relative">
              <span class="eyebrow eyebrow-ink">Formulir pesan</span>
              <h2 class="display-md mt-4">Tulis pesan<span class="text-moss">.</span></h2>
              <p class="mt-3 text-sm font-medium leading-relaxed text-muted">
                Lengkapi data di bawah. Tanda <span class="text-red-600">*</span> wajib diisi.
              </p>

              <form class="mt-7 space-y-4" @submit.prevent="submitContact">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="field-label" for="contact-name">Nama lengkap <span class="text-red-600">*</span></label>
                    <input id="contact-name" v-model="form.name" type="text" placeholder="Nama Anda" class="field" required />
                  </div>
                  <div>
                    <label class="field-label" for="contact-email">Email <span class="text-red-600">*</span></label>
                    <input id="contact-email" v-model="form.email" type="email" placeholder="nama@email.com" class="field" required />
                  </div>
                </div>
                <div>
                  <label class="field-label" for="contact-subject">Subjek</label>
                  <input id="contact-subject" v-model="form.subject" type="text" placeholder="Topik pesan (opsional)" class="field" />
                </div>
                <div>
                  <label class="field-label" for="contact-message">Pesan <span class="text-red-600">*</span></label>
                  <textarea id="contact-message" v-model="form.message" rows="6" placeholder="Tulis pesan Anda di sini..." class="field resize-none" required />
                </div>

                <div class="flex flex-col items-start justify-between gap-3 border-t border-line pt-4 sm:flex-row sm:items-center">
                  <p class="max-w-xs text-[10px] font-semibold leading-relaxed text-muted">
                    Data Anda hanya digunakan untuk menindaklanjuti pesan ini.
                  </p>
                  <button type="submit" :disabled="contact.isSubmitting" class="btn btn-ink w-full sm:w-auto disabled:opacity-60">
                    {{ contact.isSubmitting ? 'Mengirim...' : 'Kirim pesan' }}
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
                <p v-if="contact.error" class="text-center text-xs font-semibold text-red-600">{{ contact.error }}</p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
