<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useApplicantStore } from '@/stores/applicants'

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
  fields.forEach((f) => {
    errors[f] = ''
    if (!form[f as keyof typeof form]) {
      errors[f] = 'Wajib diisi'
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
  step.value++
}

async function submit() {
  errors.motivation = ''
  errors.agree = ''
  if (!form.motivation.trim()) { errors.motivation = 'Wajib diisi'; return }
  if (!form.agree) { errors.agree = 'Harap setujui persyaratan'; return }

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
  { no: 1, label: 'Data Diri', icon: '01' },
  { no: 2, label: 'Kontak', icon: '02' },
  { no: 3, label: 'Motivasi', icon: '03' },
]
</script>

<template>
  <div class="pt-[67px] bg-[#F7F7F5] min-h-screen">
    <!-- Hero -->
    <section class="bg-[#111212] relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-[#009246]/20 to-[#111212]" />
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div class="inline-flex items-center gap-2 text-[#009246] text-xs font-bold uppercase tracking-widest mb-4">
          <span class="w-8 h-0.5 bg-[#009246] rounded-full" />
          Open Recruitment
        </div>
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white mb-3">Pendaftaran LK 1</h1>
        <p class="text-white/50 max-w-lg mx-auto">Latihan Kader I (Basic Training) adalah gerbang awal perjalanan kaderisasi HMI Anda.</p>
      </div>
    </section>

    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-12">

      <!-- Success State -->
      <div v-if="submitted" class="bg-white rounded-3xl shadow-xl p-10 text-center animate-fadeInUp">
        <div class="w-20 h-20 bg-[#009246]/10 rounded-full flex items-center justify-center mx-auto mb-5">
          
        </div>
        <h2 class="text-2xl font-extrabold text-[#111212] mb-3">Pendaftaran Berhasil!</h2>
        <p class="text-[#4D4D4D] mb-2">Terima kasih, <strong>{{ form.fullName }}</strong>!</p>
        <p class="text-[#4D4D4D] text-sm leading-relaxed mb-6">
          Data pendaftaran Anda telah kami terima. Panitia akan menghubungi Anda melalui email <strong>{{ form.email }}</strong> atau WhatsApp dalam 3×24 jam.
        </p>
        <div class="bg-[#F7F7F5] rounded-2xl p-4 text-left text-sm space-y-2 mb-6">
          <div class="flex justify-between"><span class="text-[#4D4D4D]">Nama</span><span class="font-bold text-[#111212]">{{ form.fullName }}</span></div>
          <div class="flex justify-between"><span class="text-[#4D4D4D]">NIM</span><span class="font-bold text-[#111212]">{{ form.nim }}</span></div>
          <div class="flex justify-between"><span class="text-[#4D4D4D]">Fakultas</span><span class="font-bold text-[#111212]">{{ form.faculty }}</span></div>
        </div>
        <p class="text-[#009246] font-extrabold text-sm tracking-widest uppercase">Yakin Usaha Sampai!</p>
      </div>

      <!-- Form -->
      <div v-else>
        <!-- Step Indicator -->
        <div class="flex items-center justify-between mb-8">
          <template v-for="(s, i) in steps" :key="s.no">
            <div class="flex flex-col items-center gap-1.5">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm transition-all duration-300"
                :class="step >= s.no
                  ? 'bg-[#009246] text-white shadow-lg shadow-[#009246]/30'
                  : 'bg-[#E6E6E6] text-[#4D4D4D]'"
              >
                <svg v-if="step > s.no" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span v-else class="text-xs">{{ s.icon }}</span>
              </div>
              <span class="text-xs font-semibold" :class="step >= s.no ? 'text-[#009246]' : 'text-[#C9C9C9]'">{{ s.label }}</span>
            </div>
            <div v-if="i < steps.length - 1" class="flex-1 h-0.5 mx-3 rounded-full transition-all duration-500" :class="step > s.no ? 'bg-[#009246]' : 'bg-[#E6E6E6]'" />
          </template>
        </div>

        <div class="bg-white rounded-3xl shadow-xl p-8">
          <!-- Step 1: Data Diri -->
          <div v-if="step === 1">
            <h2 class="text-xl font-extrabold text-[#111212] mb-1">Data Diri</h2>
            <p class="text-[#4D4D4D] text-sm mb-6">Isi data diri Anda dengan lengkap dan benar.</p>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Nama Lengkap <span class="text-red-500">*</span></label>
                <input v-model="form.fullName" type="text" placeholder="Muhammad Rizky..." class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all" :class="errors.fullName ? 'border-red-400' : 'border-[#E6E6E6]'" />
                <p v-if="errors.fullName" class="text-red-500 text-xs mt-1">{{ errors.fullName }}</p>
              </div>
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">NIM <span class="text-red-500">*</span></label>
                <input v-model="form.nim" type="text" placeholder="2021001234" class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all" :class="errors.nim ? 'border-red-400' : 'border-[#E6E6E6]'" />
                <p v-if="errors.nim" class="text-red-500 text-xs mt-1">{{ errors.nim }}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-bold text-[#111212] mb-1.5 block">Fakultas <span class="text-red-500">*</span></label>
                  <input v-model="form.faculty" type="text" placeholder="Hukum" class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all" :class="errors.faculty ? 'border-red-400' : 'border-[#E6E6E6]'" />
                  <p v-if="errors.faculty" class="text-red-500 text-xs mt-1">{{ errors.faculty }}</p>
                </div>
                <div>
                  <label class="text-sm font-bold text-[#111212] mb-1.5 block">Jurusan <span class="text-red-500">*</span></label>
                  <input v-model="form.major" type="text" placeholder="Ilmu Hukum" class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all" :class="errors.major ? 'border-red-400' : 'border-[#E6E6E6]'" />
                  <p v-if="errors.major" class="text-red-500 text-xs mt-1">{{ errors.major }}</p>
                </div>
              </div>
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Universitas <span class="text-red-500">*</span></label>
                <input v-model="form.university" type="text" placeholder="Universitas Indonesia" class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all" :class="errors.university ? 'border-red-400' : 'border-[#E6E6E6]'" />
                <p v-if="errors.university" class="text-red-500 text-xs mt-1">{{ errors.university }}</p>
              </div>
            </div>
          </div>

          <!-- Step 2: Kontak -->
          <div v-if="step === 2">
            <h2 class="text-xl font-extrabold text-[#111212] mb-1">Informasi Kontak</h2>
            <p class="text-[#4D4D4D] text-sm mb-6">Kami akan menghubungi Anda melalui data berikut.</p>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">No. WhatsApp <span class="text-red-500">*</span></label>
                <input v-model="form.phone" type="tel" placeholder="08123456789" class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all" :class="errors.phone ? 'border-red-400' : 'border-[#E6E6E6]'" />
                <p v-if="errors.phone" class="text-red-500 text-xs mt-1">{{ errors.phone }}</p>
              </div>
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Email <span class="text-red-500">*</span></label>
                <input v-model="form.email" type="email" placeholder="nama@email.com" class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all" :class="errors.email ? 'border-red-400' : 'border-[#E6E6E6]'" />
                <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
              </div>
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Alamat <span class="text-red-500">*</span></label>
                <textarea v-model="form.address" rows="3" placeholder="Jl. Contoh No. 1, Kota..." class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all resize-none" :class="errors.address ? 'border-red-400' : 'border-[#E6E6E6]'" />
                <p v-if="errors.address" class="text-red-500 text-xs mt-1">{{ errors.address }}</p>
              </div>
            </div>
          </div>

          <!-- Step 3: Motivasi -->
          <div v-if="step === 3">
            <h2 class="text-xl font-extrabold text-[#111212] mb-1">Motivasi & Konfirmasi</h2>
            <p class="text-[#4D4D4D] text-sm mb-6">Ceritakan mengapa Anda ingin bergabung dengan HMI.</p>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Motivasi Bergabung <span class="text-red-500">*</span></label>
                <textarea v-model="form.motivation" rows="5" placeholder="Saya ingin bergabung dengan HMI karena..." class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all resize-none" :class="errors.motivation ? 'border-red-400' : 'border-[#E6E6E6]'" />
                <p v-if="errors.motivation" class="text-red-500 text-xs mt-1">{{ errors.motivation }}</p>
              </div>
              <div>
                <label class="flex items-start gap-3 cursor-pointer group">
                  <div class="relative mt-0.5">
                    <input v-model="form.agree" type="checkbox" class="sr-only" />
                    <div class="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center" :class="form.agree ? 'bg-[#009246] border-[#009246]' : 'border-[#C9C9C9] group-hover:border-[#009246]'">
                      
                    </div>
                  </div>
                  <span class="text-sm text-[#4D4D4D] leading-relaxed">
                    Saya menyatakan bahwa data yang saya isi adalah benar dan saya bersedia mengikuti seluruh rangkaian kegiatan LK 1 dengan penuh tanggung jawab.
                  </span>
                </label>
                <p v-if="errors.agree" class="text-red-500 text-xs mt-1">{{ errors.agree }}</p>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex items-center justify-between mt-8 pt-6 border-t border-[#E6E6E6]">
            <button
              v-if="step > 1"
              @click="step--"
              class="px-5 py-2.5 border border-[#E6E6E6] text-[#4D4D4D] font-bold text-sm rounded-xl hover:border-[#009246] hover:text-[#009246] transition-all"
            >
              Sebelumnya
            </button>
            <div v-else />
            <button
              v-if="step < totalSteps"
              @click="nextStep"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-[#009246] hover:bg-[#006837] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#009246]/20"
            >
              Lanjut 
            </button>
            <button
              v-else
              @click="submit"
              :disabled="applicantStore.isSaving"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-[#009246] hover:bg-[#006837] disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#009246]/20"
            >
              {{ applicantStore.isSaving ? 'Mengirim...' : 'Kirim Pendaftaran' }}
            </button>
          </div>
          <p v-if="applicantStore.error" class="mt-4 text-xs text-red-500 text-center">{{ applicantStore.error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
