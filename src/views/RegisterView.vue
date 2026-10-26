<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useApplicantStore } from '@/stores/applicants'
import StarMark from '@/components/ui/StarMark.vue'

const applicantStore = useApplicantStore()

const step = ref(1)
const totalSteps = 3
const submitted = ref(false)

const form = reactive({
  fullName: '',
  nim: '',
  faculty: '',
  major: '',
  university: '',
  phone: '',
  email: '',
  address: '',
  motivation: '',
  agree: false,
})

const errors = reactive<Record<string, string>>({})

function validate(fields: string[]) {
  let valid = true
  fields.forEach((field) => {
    errors[field] = ''
    if (!form[field as keyof typeof form]) {
      errors[field] = 'Wajib diisi'
      valid = false
    }
  })
  return valid
}

function nextStep() {
  if (step.value === 1) {
    if (!validate(['fullName', 'nim', 'faculty', 'major', 'university'])) return
  } else if (step.value === 2) {
    if (!validate(['phone', 'email', 'address'])) return
  }
  if (step.value < totalSteps) step.value++
}

function previousStep() {
  if (step.value > 1) step.value--
}

async function submit() {
  errors.motivation = ''
  errors.agree = ''
  if (!form.motivation.trim()) {
    errors.motivation = 'Wajib diisi'
    return
  }
  if (!form.agree) {
    errors.agree = 'Harap setujui persyaratan'
    return
  }

  const applicant = await applicantStore.submitApplication({
    fullName: form.fullName,
    nim: form.nim,
    faculty: form.faculty,
    major: form.major,
    university: form.university,
    phone: form.phone,
    email: form.email,
    address: form.address,
    motivation: form.motivation,
  })
  if (applicant) submitted.value = true
}

const steps = [
  { no: 1, label: 'Data diri' },
  { no: 2, label: 'Kontak' },
  { no: 3, label: 'Motivasi' },
]

const stepTitle = computed(() => {
  if (step.value === 1) return 'Data diri'
  if (step.value === 2) return 'Informasi kontak'
  return 'Motivasi & konfirmasi'
})
</script>

<template>
  <div class="bg-paper text-ink">
    <!-- Hero -->
    <section class="hero-compact relative overflow-hidden bg-ink text-paper">
      <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
      <div class="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-moss/25 blur-[130px]" />
      <div class="container-wide relative z-10">
        <div class="flex items-center justify-between">
          <span class="eyebrow eyebrow-lime">Pendaftaran LK 1</span>
          <StarMark :size="26" class="animate-spin-slow text-lime-soft" />
        </div>
        <div class="hero-gap grid gap-[clamp(1.5rem,4vw,2.5rem)] lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 class="hero-title max-w-4xl text-balance text-white">
              Mulai jalan
              <span class="text-lime-soft">kaderisasi.</span>
            </h1>
            <p class="hero-copy-gap max-w-xl text-sm font-medium leading-relaxed text-white/55 sm:text-base">
              Latihan Kader I (Basic Training) adalah gerbang awal perjalanan kaderisasi HMI. Isi formulir dengan data yang benar.
            </p>
          </div>
          <div class="flex flex-wrap gap-2 lg:justify-end">
            <span class="rounded-full border border-white/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/55">3 tahap</span>
            <span class="rounded-full border border-white/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/55">Data terverifikasi</span>
            <span class="rounded-full bg-lime px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">Tanpa biaya formulir</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section-pad">
      <div class="container-wide">
        <!-- Success -->
        <div v-if="submitted" class="mx-auto max-w-2xl">
          <div class="relative overflow-hidden rounded-[2rem] border border-line bg-white p-7 text-center sm:p-10">
            <div class="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-lime/25 blur-3xl" />
            <span class="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime text-white">
              <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="eyebrow relative mt-6">Pendaftaran diterima</span>
            <h2 class="display-md relative mt-4">Selamat, {{ form.fullName }}.</h2>
            <p class="relative mx-auto mt-4 max-w-md text-sm font-medium leading-relaxed text-muted">
              Data pendaftaran Anda telah kami terima. Panitia akan menghubungi Anda melalui email
              <strong class="text-ink">{{ form.email }}</strong> atau WhatsApp.
            </p>

            <div class="relative mt-7 rounded-[1.2rem] border border-line bg-paper p-4 text-left text-xs">
              <div class="flex justify-between gap-3 border-b border-line pb-2">
                <span class="font-semibold text-muted">Nama</span>
                <span class="font-bold text-ink">{{ form.fullName }}</span>
              </div>
              <div class="flex justify-between gap-3 border-b border-line py-2">
                <span class="font-semibold text-muted">NIM</span>
                <span class="font-bold text-ink">{{ form.nim }}</span>
              </div>
              <div class="flex justify-between gap-3 pt-2">
                <span class="font-semibold text-muted">Fakultas</span>
                <span class="font-bold text-ink">{{ form.faculty }}</span>
              </div>
            </div>

            <p class="relative mt-6 font-display text-lg font-semibold tracking-tight text-moss">Yakin Usaha Sampai!</p>
            <div class="relative mt-6 flex flex-wrap justify-center gap-2">
              <RouterLink to="/" class="btn btn-ink">Kembali ke beranda</RouterLink>
              <RouterLink to="/agenda" class="btn btn-outline-dark">Lihat agenda</RouterLink>
            </div>
          </div>
        </div>

        <!-- Form -->
        <div v-else class="grid gap-5 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <!-- Side info -->
          <aside class="space-y-4 lg:sticky lg:top-[calc(var(--nav-offset)+clamp(1rem,2svh,2rem))]">
            <div class="relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-paper sm:p-8">
              <div class="absolute inset-0 bg-grid-dark opacity-60" />
              <div class="relative">
                <span class="eyebrow eyebrow-lime">Proses pendaftaran</span>
                <h2 class="display-md mt-5 text-white">Tiga langkah,<br /><span class="text-lime-soft">satu langkah awal.</span></h2>
                <div class="mt-8 space-y-1">
                  <div
                    v-for="item in steps"
                    :key="item.no"
                    class="flex items-center gap-3 border-t border-white/10 py-3"
                  >
                    <span
                      class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-black"
                      :class="step > item.no ? 'bg-lime text-white' : step === item.no ? 'border border-lime-soft text-lime-soft' : 'border border-white/15 text-white/60'"
                    >
                      <svg v-if="step > item.no" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <span v-else>{{ String(item.no).padStart(2, '0') }}</span>
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-[0.1em]" :class="step >= item.no ? 'text-white' : 'text-white/60'">{{ item.label }}</span>
                  </div>
                </div>
                <StarMark :size="34" class="mt-8 text-lime-soft" />
              </div>
            </div>

            <div class="rounded-[1.3rem] border border-line bg-white p-5">
              <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">Catatan</p>
              <p class="mt-2 text-xs font-semibold leading-relaxed text-ink/65">
                Pastikan nomor WhatsApp dan email aktif. Seluruh data digunakan hanya untuk proses seleksi LK 1.
              </p>
            </div>
          </aside>

          <!-- Form card -->
          <div class="overflow-hidden rounded-[2rem] border border-line bg-white">
            <!-- Step indicator -->
            <div class="border-b border-line p-5 sm:p-7">
              <div class="flex items-center gap-2">
                <template v-for="(item, index) in steps" :key="item.no">
                  <div class="flex items-center gap-2">
                    <span
                      class="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-black transition-colors"
                      :class="step >= item.no ? 'bg-lime text-white' : 'bg-paper text-muted'"
                    >
                      <svg v-if="step > item.no" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <span v-else>{{ item.no }}</span>
                    </span>
                    <span class="hidden text-[9px] font-black uppercase tracking-[0.1em] sm:block" :class="step >= item.no ? 'text-ink' : 'text-muted'">{{ item.label }}</span>
                  </div>
                  <span v-if="index < steps.length - 1" class="h-px flex-1 bg-line">
                    <span class="block h-px bg-lime transition-all duration-500" :style="{ width: step > item.no ? '100%' : '0%' }" />
                  </span>
                </template>
                <span class="ml-auto text-[9px] font-bold uppercase tracking-[0.1em] text-muted">{{ step }} / {{ totalSteps }}</span>
              </div>
            </div>

            <div class="p-5 sm:p-7">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <span class="eyebrow eyebrow-ink">Tahap {{ String(step).padStart(2, '0') }}</span>
                  <h2 class="display-md mt-4 text-3xl sm:text-4xl">{{ stepTitle }}<span class="text-moss">.</span></h2>
                </div>
                <span class="hidden h-10 w-10 items-center justify-center rounded-full bg-paper text-moss sm:flex">
                  <StarMark :size="18" />
                </span>
              </div>

              <div class="mt-7">
                <!-- Step 1 -->
                <div v-if="step === 1" class="space-y-4">
                  <p class="text-sm font-medium leading-relaxed text-muted">Isi data diri Anda dengan lengkap dan benar.</p>
                  <div>
                    <label class="field-label" for="reg-name">Nama lengkap <span class="text-red-600">*</span></label>
                    <input id="reg-name" v-model="form.fullName" type="text" placeholder="Nama lengkap" class="field" :class="errors.fullName ? 'border-red-400' : ''" />
                    <p v-if="errors.fullName" class="mt-1 text-[10px] font-semibold text-red-600">{{ errors.fullName }}</p>
                  </div>
                  <div>
                    <label class="field-label" for="reg-nim">NIM <span class="text-red-600">*</span></label>
                    <input id="reg-nim" v-model="form.nim" type="text" placeholder="Nomor induk mahasiswa" class="field" :class="errors.nim ? 'border-red-400' : ''" />
                    <p v-if="errors.nim" class="mt-1 text-[10px] font-semibold text-red-600">{{ errors.nim }}</p>
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label class="field-label" for="reg-faculty">Fakultas <span class="text-red-600">*</span></label>
                      <input id="reg-faculty" v-model="form.faculty" type="text" placeholder="Fakultas" class="field" :class="errors.faculty ? 'border-red-400' : ''" />
                      <p v-if="errors.faculty" class="mt-1 text-[10px] font-semibold text-red-600">{{ errors.faculty }}</p>
                    </div>
                    <div>
                      <label class="field-label" for="reg-major">Jurusan <span class="text-red-600">*</span></label>
                      <input id="reg-major" v-model="form.major" type="text" placeholder="Jurusan / program studi" class="field" :class="errors.major ? 'border-red-400' : ''" />
                      <p v-if="errors.major" class="mt-1 text-[10px] font-semibold text-red-600">{{ errors.major }}</p>
                    </div>
                  </div>
                  <div>
                    <label class="field-label" for="reg-university">Universitas <span class="text-red-600">*</span></label>
                    <input id="reg-university" v-model="form.university" type="text" placeholder="Nama universitas" class="field" :class="errors.university ? 'border-red-400' : ''" />
                    <p v-if="errors.university" class="mt-1 text-[10px] font-semibold text-red-600">{{ errors.university }}</p>
                  </div>
                </div>

                <!-- Step 2 -->
                <div v-if="step === 2" class="space-y-4">
                  <p class="text-sm font-medium leading-relaxed text-muted">Kami akan menghubungi Anda melalui data berikut.</p>
                  <div>
                    <label class="field-label" for="reg-phone">No. WhatsApp <span class="text-red-600">*</span></label>
                    <input id="reg-phone" v-model="form.phone" type="tel" placeholder="08xxxxxxxxxx" class="field" :class="errors.phone ? 'border-red-400' : ''" />
                    <p v-if="errors.phone" class="mt-1 text-[10px] font-semibold text-red-600">{{ errors.phone }}</p>
                  </div>
                  <div>
                    <label class="field-label" for="reg-email">Email <span class="text-red-600">*</span></label>
                    <input id="reg-email" v-model="form.email" type="email" placeholder="nama@email.com" class="field" :class="errors.email ? 'border-red-400' : ''" />
                    <p v-if="errors.email" class="mt-1 text-[10px] font-semibold text-red-600">{{ errors.email }}</p>
                  </div>
                  <div>
                    <label class="field-label" for="reg-address">Alamat <span class="text-red-600">*</span></label>
                    <textarea id="reg-address" v-model="form.address" rows="3" placeholder="Alamat tempat tinggal" class="field resize-none" :class="errors.address ? 'border-red-400' : ''" />
                    <p v-if="errors.address" class="mt-1 text-[10px] font-semibold text-red-600">{{ errors.address }}</p>
                  </div>
                </div>

                <!-- Step 3 -->
                <div v-if="step === 3" class="space-y-4">
                  <p class="text-sm font-medium leading-relaxed text-muted">Ceritakan alasan Anda ingin bergabung dengan HMI.</p>
                  <div>
                    <label class="field-label" for="reg-motivation">Motivasi bergabung <span class="text-red-600">*</span></label>
                    <textarea id="reg-motivation" v-model="form.motivation" rows="5" placeholder="Saya ingin bergabung dengan HMI karena..." class="field resize-none" :class="errors.motivation ? 'border-red-400' : ''" />
                    <p v-if="errors.motivation" class="mt-1 text-[10px] font-semibold text-red-600">{{ errors.motivation }}</p>
                  </div>

                  <div class="rounded-[1rem] border border-line bg-paper p-3.5">
                    <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">Ringkasan data</p>
                    <div class="mt-2 grid gap-1.5 text-[10px] sm:grid-cols-2">
                      <p><span class="font-semibold text-muted">Nama:</span> <span class="font-bold">{{ form.fullName }}</span></p>
                      <p><span class="font-semibold text-muted">NIM:</span> <span class="font-bold">{{ form.nim }}</span></p>
                      <p><span class="font-semibold text-muted">Email:</span> <span class="font-bold">{{ form.email }}</span></p>
                      <p><span class="font-semibold text-muted">WhatsApp:</span> <span class="font-bold">{{ form.phone }}</span></p>
                    </div>
                  </div>

                  <div>
                    <label class="group flex cursor-pointer items-start gap-3">
                      <span class="relative mt-0.5">
                        <input v-model="form.agree" type="checkbox" class="sr-only" />
                        <span class="flex h-5 w-5 items-center justify-center rounded border-2 transition-colors" :class="form.agree ? 'border-ink bg-ink text-lime-soft' : 'border-line text-transparent group-hover:border-ink/40'">
                          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </span>
                      </span>
                      <span class="text-xs font-medium leading-relaxed text-muted">
                        Saya menyatakan bahwa data yang saya isi adalah benar dan saya bersedia mengikuti seluruh rangkaian kegiatan LK 1 dengan penuh tanggung jawab.
                      </span>
                    </label>
                    <p v-if="errors.agree" class="mt-1 text-[10px] font-semibold text-red-600">{{ errors.agree }}</p>
                  </div>
                </div>
              </div>

              <div class="mt-8 flex items-center justify-between border-t border-line pt-5">
                <button v-if="step > 1" type="button" class="btn btn-outline-dark" @click="previousStep">Sebelumnya</button>
                <span v-else />
                <button
                  v-if="step < totalSteps"
                  type="button"
                  class="btn btn-ink"
                  @click="nextStep"
                >
                  Lanjut
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
                <button v-else type="button" :disabled="applicantStore.isSaving" class="btn btn-lime disabled:opacity-60" @click="submit">
                  {{ applicantStore.isSaving ? 'Mengirim...' : 'Kirim pendaftaran' }}
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
              <p v-if="applicantStore.error" class="mt-3 text-center text-[10px] font-semibold text-red-600">{{ applicantStore.error }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
