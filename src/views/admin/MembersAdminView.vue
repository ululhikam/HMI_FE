<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useMemberStore } from '@/stores/members'
import type { Member, MemberInput } from '@/types'

const store = useMemberStore()

const search = ref('')
const departmentFilter = ref('Semua')
const showModal = ref(false)
const editingMember = ref<Member | null>(null)
const formError = ref('')

function emptyForm() {
  return {
    name: '',
    position: '',
    department: '',
    photo: '',
    period: '',
    email: '',
    instagram: '',
  }
}

const form = reactive(emptyForm())

const departments = computed(() => {
  const values = new Set(store.members.map((member) => member.department))
  return ['Semua', ...Array.from(values).sort()]
})

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return store.members.filter((member) => {
    const matchesDepartment =
      departmentFilter.value === 'Semua' || member.department === departmentFilter.value
    const matchesQuery =
      !query ||
      member.name.toLowerCase().includes(query) ||
      member.position.toLowerCase().includes(query) ||
      member.department.toLowerCase().includes(query)
    return matchesDepartment && matchesQuery
  })
})

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function openCreate() {
  editingMember.value = null
  Object.assign(form, emptyForm())
  formError.value = ''
  showModal.value = true
}

function openEdit(member: Member) {
  editingMember.value = member
  Object.assign(form, {
    name: member.name,
    position: member.position,
    department: member.department,
    photo: member.photo,
    period: member.period,
    email: member.email ?? '',
    instagram: member.instagram ?? '',
  })
  formError.value = ''
  showModal.value = true
}

async function saveMember() {
  formError.value = ''
  if (!form.name.trim() || !form.position.trim() || !form.department.trim() || !form.period.trim()) {
    formError.value = 'Nama, jabatan, bidang, dan periode wajib diisi.'
    return
  }

  const input: MemberInput = {
    name: form.name.trim(),
    position: form.position.trim(),
    department: form.department.trim(),
    photo: form.photo.trim(),
    period: form.period.trim(),
    email: form.email.trim() || undefined,
    instagram: form.instagram.trim() || undefined,
  }

  const result = editingMember.value
    ? await store.updateMember(editingMember.value.id, input)
    : await store.createMember(input)

  if (result) {
    closeModal()
  } else {
    formError.value = store.error
  }
}

async function deleteMember(member: Member) {
  if (confirm(`Hapus pengurus "${member.name}"?`)) {
    await store.deleteMember(member.id)
  }
}

function closeModal() {
  showModal.value = false
  editingMember.value = null
  formError.value = ''
}

onMounted(() => {
  void store.fetchMembers(true)
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-extrabold text-[#111212]">Manajemen Pengurus</h1>
        <p class="text-[#4D4D4D] text-sm mt-0.5">Kelola {{ store.members.length }} data pengurus BPH HMI Insan Cita.</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#009246] hover:bg-[#006837] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#009246]/20"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Pengurus
      </button>
    </div>

    <p v-if="store.error && !showModal" class="mb-4 text-sm text-red-500">{{ store.error }}</p>

    <!-- Search & filter -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <div class="relative max-w-sm flex-1 min-w-[220px]">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#C9C9C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Cari nama, jabatan, atau bidang..."
          class="w-full pl-10 pr-8 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246] transition-all"
        />
        <button v-if="search" @click="search = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#C9C9C9] hover:text-[#4D4D4D]" title="Hapus pencarian">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <select
        v-model="departmentFilter"
        class="px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm bg-white focus:outline-none focus:border-[#009246]"
      >
        <option v-for="department in departments" :key="department" :value="department">
          {{ department === 'Semua' ? 'Semua Bidang' : department }}
        </option>
      </select>
    </div>

    <!-- Cards -->
    <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <article
        v-for="member in filtered"
        :key="member.id"
        class="bg-white rounded-2xl border border-[#E6E6E6] p-5 shadow-sm hover:shadow-md hover:border-[#009246]/40 transition-all"
      >
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-2xl overflow-hidden bg-[#009246]/10 shrink-0 flex items-center justify-center">
            <img
              v-if="member.photo"
              :src="member.photo"
              :alt="member.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-lg font-extrabold text-[#009246]">{{ initials(member.name) }}</span>
          </div>

          <div class="min-w-0 flex-1">
            <h2 class="font-extrabold text-[#111212] leading-tight truncate">{{ member.name }}</h2>
            <p class="text-sm text-[#4D4D4D] mt-0.5">{{ member.position }}</p>
            <div class="flex flex-wrap items-center gap-1.5 mt-2">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#009246]/10 text-[#009246]">
                {{ member.department }}
              </span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F7F7F5] text-[#4D4D4D]">
                {{ member.period }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-4 space-y-1 text-xs text-[#4D4D4D] min-h-[2rem]">
          <p v-if="member.email" class="truncate">{{ member.email }}</p>
          <p v-if="member.instagram" class="truncate">@{{ member.instagram.replace(/^@/, '') }}</p>
          <p v-if="!member.email && !member.instagram" class="text-[#C9C9C9]">Belum ada kontak</p>
        </div>

        <div class="flex items-center gap-2 mt-4 pt-4 border-t border-[#E6E6E6]">
          <button
            @click="openEdit(member)"
            class="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-[#4D4D4D] hover:bg-[#009246]/10 hover:text-[#009246] transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            @click="deleteMember(member)"
            :disabled="store.isSaving"
            class="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-[#4D4D4D] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus
          </button>
        </div>
      </article>

      <div
        v-if="filtered.length === 0"
        class="sm:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-dashed border-[#E6E6E6] p-12 text-center"
      >
        <p class="text-sm text-[#4D4D4D]">
          {{ store.isLoading ? 'Memuat data pengurus...' : 'Tidak ada pengurus ditemukan.' }}
        </p>
      </div>
    </div>

    <!-- Modal -->
    <Transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" @click.self="closeModal">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-extrabold text-[#111212]">{{ editingMember ? 'Edit Pengurus' : 'Tambah Pengurus' }}</h2>
            <button @click="closeModal" class="w-9 h-9 rounded-lg flex items-center justify-center text-[#4D4D4D] hover:bg-[#E6E6E6] transition-colors" title="Tutup">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-bold text-[#111212] mb-1.5 block">Nama <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Jabatan <span class="text-red-500">*</span></label>
                <input v-model="form.position" type="text" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
              </div>
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Bidang</label>
                <input v-model="form.department" type="text" placeholder="BPH / Bidang / KOHATI" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
              </div>
            </div>

            <div>
              <label class="text-sm font-bold text-[#111212] mb-1.5 block">URL Foto</label>
              <input v-model="form.photo" type="url" placeholder="https://..." class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Periode</label>
                <input v-model="form.period" type="text" placeholder="2024-2026" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
              </div>
              <div>
                <label class="text-sm font-bold text-[#111212] mb-1.5 block">Instagram</label>
                <input v-model="form.instagram" type="text" placeholder="tanpa @ (opsional)" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
              </div>
            </div>

            <div>
              <label class="text-sm font-bold text-[#111212] mb-1.5 block">Email</label>
              <input v-model="form.email" type="email" placeholder="nama@email.com (opsional)" class="w-full px-4 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>

            <p v-if="formError" class="text-sm text-red-500">{{ formError }}</p>

            <div class="flex gap-3 pt-2">
              <button @click="closeModal" class="flex-1 py-2.5 border border-[#E6E6E6] text-[#4D4D4D] font-bold rounded-xl text-sm hover:border-[#009246] hover:text-[#009246] transition-colors">Batal</button>
              <button @click="saveMember" :disabled="store.isSaving" class="flex-1 py-2.5 bg-[#009246] disabled:opacity-60 text-white font-bold rounded-xl text-sm hover:bg-[#006837] transition-colors">
                {{ store.isSaving ? 'Menyimpan...' : 'Simpan Pengurus' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
