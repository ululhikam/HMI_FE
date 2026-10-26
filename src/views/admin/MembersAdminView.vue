<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useMemberStore } from '@/stores/members'
import type { Member, MemberInput } from '@/types'
import ImageUploadField from '@/components/common/ImageUploadField.vue'

const store = useMemberStore()

const search = ref('')
const departmentFilter = ref('Semua')
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingMember = ref<Member | null>(null)
const deleteTarget = ref<Member | null>(null)
const formError = ref('')
const toastMessage = ref('')
const showToast = ref(false)

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
  const values = new Set(store.members.map((member) => member.department).filter(Boolean))
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

const summary = computed(() => [
  { label: 'Total pengurus', value: store.members.length },
  { label: 'Bidang', value: new Set(store.members.map((member) => member.department).filter(Boolean)).size },
  { label: 'Dengan kontak', value: store.members.filter((member) => member.email || member.instagram).length },
  { label: 'Dengan foto', value: store.members.filter((member) => member.photo).length },
])

const hasFilters = computed(
  () => Boolean(search.value) || departmentFilter.value !== 'Semua',
)

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function instagramHandle(value: string) {
  return value.replace(/^@/, '').trim()
}

function triggerToast(message: string) {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3200)
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
    const wasEditing = Boolean(editingMember.value)
    closeModal()
    triggerToast(wasEditing ? 'Data pengurus berhasil diperbarui.' : 'Pengurus berhasil ditambahkan.')
  } else {
    formError.value = store.error || 'Gagal menyimpan data pengurus.'
  }
}

function confirmDelete(member: Member) {
  deleteTarget.value = member
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  const ok = await store.deleteMember(deleteTarget.value.id)
  showDeleteConfirm.value = false
  if (ok) {
    triggerToast('Data pengurus berhasil dihapus.')
  } else {
    triggerToast('Gagal menghapus data pengurus.')
  }
}

function closeModal() {
  if (store.isSaving) return
  showModal.value = false
  editingMember.value = null
  formError.value = ''
}

function resetFilters() {
  search.value = ''
  departmentFilter.value = 'Semua'
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (showDeleteConfirm.value) {
    showDeleteConfirm.value = false
    return
  }
  closeModal()
}

watch([showModal, showDeleteConfirm], ([modal, deleting]) => {
  document.body.style.overflow = modal || deleting ? 'hidden' : ''
})

onMounted(() => {
  void store.fetchMembers(true)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="space-y-5">
    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="showToast"
        class="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold text-white shadow-2xl"
      >
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-white">
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <span class="eyebrow eyebrow-ink">Struktur organisasi</span>
        <h1 class="display-md mt-4">Pengurus & BPH<span class="text-moss">.</span></h1>
        <p class="mt-2 max-w-xl text-xs font-semibold leading-relaxed text-muted">
          Kelola data pengurus, jabatan, bidang, dan kontak yang tampil di halaman tentang.
        </p>
      </div>
      <button type="button" class="admin-btn admin-btn-lime self-start sm:self-auto" @click="openCreate">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        Tambah pengurus
      </button>
    </div>

    <p v-if="store.error && !showModal" class="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
      {{ store.error }}
    </p>

    <!-- Summary -->
    <div class="admin-card grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
      <div v-for="(item, index) in summary" :key="item.label" class="p-4 sm:p-5" :class="index >= 2 ? 'border-t border-line sm:border-t-0' : ''">
        <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">{{ item.label }}</p>
        <p class="mt-2 font-display text-2xl font-bold leading-none tracking-tight text-ink">{{ item.value }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="admin-card p-3 sm:p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="relative flex-1 lg:max-w-sm">
          <svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" stroke-linecap="round" />
          </svg>
          <input v-model="search" type="search" placeholder="Cari nama, jabatan, atau bidang..." class="admin-input pl-9" />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select v-model="departmentFilter" class="admin-input w-auto text-[10px] font-bold">
            <option v-for="department in departments" :key="department" :value="department">
              {{ department === 'Semua' ? 'Semua bidang' : department }}
            </option>
          </select>
          <span class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{{ filtered.length }} orang</span>
          <button v-if="hasFilters" type="button" class="text-[8px] font-black uppercase tracking-[0.08em] text-moss transition-colors hover:text-ink" @click="resetFilters">
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div v-if="store.isLoading" class="admin-card p-14 text-center">
      <span class="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-line border-t-moss" />
      <p class="mt-3 text-[10px] font-semibold text-muted">Memuat data pengurus...</p>
    </div>

    <div v-else-if="filtered.length === 0" class="admin-card border-dashed p-14 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper text-moss">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <p class="mt-4 text-xs font-bold text-ink">{{ hasFilters ? 'Tidak ada pengurus yang cocok.' : 'Belum ada data pengurus.' }}</p>
      <p class="mx-auto mt-1.5 max-w-sm text-[10px] font-semibold leading-relaxed text-muted">
        {{ hasFilters ? 'Ubah kata kunci atau filter bidang untuk menemukan pengurus lain.' : 'Tambahkan data pengurus pertama untuk ditampilkan di halaman tentang.' }}
      </p>
      <button v-if="hasFilters" type="button" class="admin-btn admin-btn-ghost mt-4" @click="resetFilters">Reset filter</button>
      <button v-else type="button" class="admin-btn admin-btn-lime mt-4" @click="openCreate">Tambah pengurus</button>
    </div>

    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="member in filtered"
        :key="member.id"
        class="group flex flex-col overflow-hidden rounded-[1.35rem] border border-line bg-white transition duration-300 hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-soft"
      >
        <div class="h-1 w-full bg-lime" />
        <div class="flex flex-1 flex-col p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <span class="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-lime bg-paper font-display text-base font-bold text-moss">
                <img v-if="member.photo" :src="member.photo" :alt="member.name" class="h-full w-full object-cover" />
                <span v-else>{{ initials(member.name) }}</span>
              </span>
              <div class="min-w-0 pt-0.5">
                <h2 class="truncate font-display text-base font-bold tracking-tight text-ink">{{ member.name }}</h2>
                <p class="mt-1 truncate text-[10px] font-bold text-moss">{{ member.position }}</p>
              </div>
            </div>
            <button
              type="button"
              class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted opacity-0 transition-all hover:bg-paper hover:text-ink group-hover:opacity-100"
              title="Edit pengurus"
              @click="openEdit(member)"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-1.5">
            <span class="rounded-full bg-paper px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.05em] text-moss">{{ member.department }}</span>
            <span class="rounded-full border border-line px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.05em] text-muted">{{ member.period }}</span>
          </div>

          <div class="mt-4 flex-1 space-y-1.5 border-t border-line pt-3">
            <a
              v-if="member.email"
              :href="`mailto:${member.email}`"
              class="flex items-center gap-2 truncate text-[10px] font-semibold text-muted transition-colors hover:text-moss"
            >
              <svg class="h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="truncate">{{ member.email }}</span>
            </a>
            <a
              v-if="member.instagram"
              :href="`https://instagram.com/${instagramHandle(member.instagram)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-[10px] font-semibold text-muted transition-colors hover:text-moss"
            >
              <svg class="h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <path d="M17.5 6.5h.01" stroke-linecap="round" />
              </svg>
              @{{ instagramHandle(member.instagram) }}
            </a>
            <p v-if="!member.email && !member.instagram" class="text-[10px] font-semibold text-muted/60">Belum ada kontak</p>
          </div>

          <div class="mt-4 flex items-center gap-1.5 border-t border-line pt-3">
            <button type="button" class="admin-btn admin-btn-ghost flex-1" @click="openEdit(member)">
              Edit data
            </button>
            <button
              type="button"
              :disabled="store.isSaving"
              class="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
              title="Hapus pengurus"
              @click="confirmDelete(member)"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Form modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showModal"
          class="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          @click.self="closeModal"
        >
          <div class="modal-viewport flex w-full max-w-lg flex-col overflow-hidden rounded-[1.6rem] border border-line bg-paper shadow-2xl">
            <div class="flex flex-shrink-0 items-center justify-between gap-4 border-b border-line bg-white px-5 py-4">
              <div>
                <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">{{ editingMember ? 'Perbarui data' : 'Pengurus baru' }}</p>
                <h2 class="mt-1 font-display text-xl font-bold tracking-tight text-ink">{{ editingMember ? 'Edit pengurus' : 'Tambah pengurus' }}</h2>
              </div>
              <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink" aria-label="Tutup" @click="closeModal">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="saveMember">
              <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                <p v-if="formError" class="rounded-[0.9rem] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-600">{{ formError }}</p>

                <div>
                  <label class="admin-label" for="member-name">Nama lengkap <span class="text-red-500">*</span></label>
                  <input id="member-name" v-model="form.name" type="text" placeholder="Nama lengkap pengurus" class="admin-input" required />
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="admin-label" for="member-position">Jabatan <span class="text-red-500">*</span></label>
                    <input id="member-position" v-model="form.position" type="text" placeholder="Ketua, Sekretaris, dll." class="admin-input" required />
                  </div>
                  <div>
                    <label class="admin-label" for="member-department">Bidang <span class="text-red-500">*</span></label>
                    <input id="member-department" v-model="form.department" type="text" placeholder="BPH / Bidang / KOHATI" class="admin-input" required />
                  </div>
                </div>

                <div>
                  <ImageUploadField
                    v-model="form.photo"
                    label="Foto pengurus"
                    hint="Gunakan foto potret dengan latar yang jelas."
                    aspect-ratio="square"
                  />
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="admin-label" for="member-period">Periode <span class="text-red-500">*</span></label>
                    <input id="member-period" v-model="form.period" type="text" placeholder="2024-2026" class="admin-input" required />
                  </div>
                  <div>
                    <label class="admin-label" for="member-instagram">Instagram</label>
                    <input id="member-instagram" v-model="form.instagram" type="text" placeholder="tanpa @ (opsional)" class="admin-input" />
                  </div>
                </div>

                <div>
                  <label class="admin-label" for="member-email">Email</label>
                  <input id="member-email" v-model="form.email" type="email" placeholder="nama@email.com (opsional)" class="admin-input" />
                </div>
              </div>

              <div class="flex flex-shrink-0 items-center justify-end gap-2 border-t border-line bg-white px-5 py-4">
                <button type="button" class="admin-btn admin-btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" :disabled="store.isSaving" class="admin-btn admin-btn-lime disabled:opacity-60">
                  <span v-if="store.isSaving" class="h-3 w-3 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                  {{ store.isSaving ? 'Menyimpan...' : 'Simpan pengurus' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDeleteConfirm"
          class="fixed inset-0 z-[95] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          @click.self="showDeleteConfirm = false"
        >
          <div class="w-full max-w-sm rounded-[1.5rem] border border-line bg-paper p-6 text-center shadow-2xl">
            <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" />
              </svg>
            </span>
            <h3 class="mt-4 font-display text-xl font-bold tracking-tight text-ink">Hapus pengurus?</h3>
            <p class="mt-2 text-[11px] font-medium leading-relaxed text-muted">
              Data <strong class="text-ink">"{{ deleteTarget?.name }}"</strong> akan dihapus permanen dari struktur organisasi.
            </p>
            <div class="mt-6 flex justify-center gap-2">
              <button type="button" class="admin-btn admin-btn-ghost" @click="showDeleteConfirm = false">Batal</button>
              <button type="button" :disabled="store.isSaving" class="admin-btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-60" @click="handleDelete">
                {{ store.isSaving ? 'Menghapus...' : 'Ya, hapus' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(14px) scale(0.985);
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 200ms ease, transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
