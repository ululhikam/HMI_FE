<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useAdminUserStore } from '@/stores/adminUsers'
import { useAuthStore } from '@/stores/auth'
import type {
  AdminRole,
  AdminUser,
  AdminUserCreateInput,
  AdminUserUpdateInput,
} from '@/types'

const store = useAdminUserStore()
const auth = useAuthStore()

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const showStatusConfirm = ref(false)
const showPasswordModal = ref(false)
const editingAdmin = ref<AdminUser | null>(null)
const deleteTarget = ref<AdminUser | null>(null)
const statusTarget = ref<AdminUser | null>(null)
const passwordTarget = ref<AdminUser | null>(null)
const formError = ref('')
const passwordError = ref('')
const toastMessage = ref('')
const toastTone = ref<'success' | 'error'>('success')
const showToast = ref(false)

function emptyForm() {
  return {
    name: '',
    email: '',
    role: 'admin' as AdminRole,
    password: '',
    isActive: true,
  }
}

const form = reactive(emptyForm())
const passwordForm = reactive({ password: '', confirm: '' })

const currentUserId = computed(() => auth.currentUser?.id)
const isEditingSelf = computed(() => editingAdmin.value?.id === currentUserId.value)

const summaryItems = computed(() => [
  { label: 'Total admin', value: store.summary.total },
  { label: 'Superadmin', value: store.summary.superadmin },
  { label: 'Admin', value: store.summary.admin },
  { label: 'Nonaktif', value: store.summary.inactive },
])

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDateTime(value?: string | null) {
  if (!value) return 'Belum pernah'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

function roleLabel(role: AdminRole) {
  return role === 'superadmin' ? 'Superadmin' : 'Admin'
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function triggerToast(message: string, tone: 'success' | 'error' = 'success') {
  toastMessage.value = message
  toastTone.value = tone
  showToast.value = true
  window.setTimeout(() => {
    showToast.value = false
  }, 3200)
}

function openCreate() {
  editingAdmin.value = null
  Object.assign(form, emptyForm())
  formError.value = ''
  showModal.value = true
}

function openEdit(admin: AdminUser) {
  editingAdmin.value = admin
  Object.assign(form, {
    name: admin.name,
    email: admin.email,
    role: admin.role,
    password: '',
    isActive: admin.isActive,
  })
  formError.value = ''
  showModal.value = true
}

async function saveAdmin() {
  formError.value = ''
  const name = form.name.trim()
  const email = form.email.trim().toLowerCase()

  if (!name) {
    formError.value = 'Nama admin wajib diisi.'
    return
  }

  if (!editingAdmin.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    formError.value = 'Email admin tidak valid.'
    return
  }

  if (!editingAdmin.value && form.password.length < 8) {
    formError.value = 'Password minimal 8 karakter.'
    return
  }

  if (editingAdmin.value && form.password && form.password.length < 8) {
    formError.value = 'Password baru minimal 8 karakter.'
    return
  }

  if (!editingAdmin.value) {
    const input: AdminUserCreateInput = {
      name,
      email,
      role: form.role,
      password: form.password,
    }
    const created = await store.createAdmin(input)
    if (created) {
      closeModal()
      triggerToast('Admin baru berhasil ditambahkan.')
    } else {
      formError.value = store.error || 'Gagal menambahkan admin.'
    }
    return
  }

  const input: AdminUserUpdateInput = {
    name,
    role: form.role,
    isActive: form.isActive,
  }
  if (form.password) input.password = form.password

  const updated = await store.updateAdmin(editingAdmin.value.id, input)
  if (updated) {
    closeModal()
    triggerToast('Data admin berhasil diperbarui.')
  } else {
    formError.value = store.error || 'Gagal memperbarui data admin.'
  }
}

function openPasswordModal(admin: AdminUser) {
  passwordTarget.value = admin
  passwordForm.password = ''
  passwordForm.confirm = ''
  passwordError.value = ''
  showPasswordModal.value = true
}

async function savePassword() {
  passwordError.value = ''

  if (!passwordTarget.value) return
  if (passwordForm.password.length < 8) {
    passwordError.value = 'Password minimal 8 karakter.'
    return
  }
  if (passwordForm.password !== passwordForm.confirm) {
    passwordError.value = 'Konfirmasi password tidak cocok.'
    return
  }

  const ok = await store.resetPassword(passwordTarget.value.id, passwordForm.password)
  if (ok) {
    showPasswordModal.value = false
    triggerToast('Password admin berhasil diperbarui.')
  } else {
    passwordError.value = store.error || 'Gagal mengubah password admin.'
  }
}

function confirmStatus(admin: AdminUser) {
  statusTarget.value = admin
  showStatusConfirm.value = true
}

async function handleStatusChange() {
  if (!statusTarget.value) return
  const target = statusTarget.value
  const nextActive = !target.isActive

  const updated = await store.updateAdmin(target.id, { isActive: nextActive })
  showStatusConfirm.value = false

  if (updated) {
    triggerToast(nextActive ? 'Admin berhasil diaktifkan.' : 'Admin berhasil dinonaktifkan.')
  } else {
    triggerToast(store.error || 'Gagal mengubah status admin.', 'error')
  }
}

function confirmDelete(admin: AdminUser) {
  deleteTarget.value = admin
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  const ok = await store.deleteAdmin(deleteTarget.value.id)
  showDeleteConfirm.value = false

  if (ok) {
    triggerToast('Admin berhasil dihapus permanen.')
  } else {
    triggerToast(store.error || 'Gagal menghapus admin.', 'error')
  }
}

function closeModal() {
  if (store.isSaving) return
  showModal.value = false
  editingAdmin.value = null
  formError.value = ''
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (showDeleteConfirm.value) {
    showDeleteConfirm.value = false
    return
  }
  if (showStatusConfirm.value) {
    showStatusConfirm.value = false
    return
  }
  if (showPasswordModal.value) {
    showPasswordModal.value = false
    return
  }
  closeModal()
}

watch(
  [showModal, showDeleteConfirm, showStatusConfirm, showPasswordModal],
  ([modal, deleting, changingStatus, resettingPassword]) => {
    document.body.style.overflow =
      modal || deleting || changingStatus || resettingPassword ? 'hidden' : ''
  },
)

onMounted(() => {
  void store.fetchUsers(true)
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
        <span
          class="flex h-5 w-5 items-center justify-center rounded-full"
          :class="toastTone === 'success' ? 'bg-lime text-white' : 'bg-red-500 text-white'"
        >
          <svg
            v-if="toastTone === 'success'"
            class="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M12 8v5m0 3h.01" stroke-linecap="round" />
          </svg>
        </span>
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <span class="eyebrow eyebrow-ink">Akses &amp; keamanan</span>
        <h1 class="display-md mt-4">Kelola Admin<span class="text-moss">.</span></h1>
        <p class="mt-2 max-w-xl text-xs font-semibold leading-relaxed text-muted">
          Atur profil, role, dan status akses admin. Kredensial login tetap dikelola oleh Supabase Auth.
        </p>
      </div>
      <button type="button" class="admin-btn admin-btn-lime self-start sm:self-auto" @click="openCreate">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        Tambah admin
      </button>
    </div>

    <p
      v-if="store.error && !showModal && !showPasswordModal"
      class="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600"
    >
      {{ store.error }}
    </p>

    <!-- Summary -->
    <div class="admin-card grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
      <div
        v-for="(item, index) in summaryItems"
        :key="item.label"
        class="p-4 sm:p-5"
        :class="index >= 2 ? 'border-t border-line sm:border-t-0' : ''"
      >
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
          <input v-model="store.search" type="search" placeholder="Cari nama atau email admin..." class="admin-input pl-9" />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select v-model="store.roleFilter" class="admin-input w-auto text-[10px] font-bold">
            <option value="Semua">Semua role</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
          </select>
          <span class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{{ store.filteredUsers.length }} akun</span>
          <button
            v-if="store.hasFilters"
            type="button"
            class="text-[8px] font-black uppercase tracking-[0.08em] text-moss transition-colors hover:text-ink"
            @click="store.resetFilters()"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card overflow-hidden">
      <div v-if="store.isLoading" class="p-14 text-center">
        <span class="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-line border-t-moss" />
        <p class="mt-3 text-[10px] font-semibold text-muted">Memuat daftar admin...</p>
      </div>

      <div v-else-if="store.filteredUsers.length === 0" class="p-14 text-center">
        <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper text-moss">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <p class="mt-4 text-xs font-bold text-ink">
          {{ store.hasFilters ? 'Tidak ada admin yang cocok.' : 'Belum ada akun admin.' }}
        </p>
        <p class="mx-auto mt-1.5 max-w-sm text-[10px] font-semibold leading-relaxed text-muted">
          {{ store.hasFilters ? 'Ubah kata kunci atau filter role untuk menemukan admin lain.' : 'Tambahkan akun admin pertama untuk mengelola panel.' }}
        </p>
        <button v-if="store.hasFilters" type="button" class="admin-btn admin-btn-ghost mt-4" @click="store.resetFilters()">Reset filter</button>
        <button v-else type="button" class="admin-btn admin-btn-lime mt-4" @click="openCreate">Tambah admin</button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Role</th>
              <th>Status</th>
              <th class="hidden lg:table-cell">Login terakhir</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="admin in store.filteredUsers" :key="admin.id">
              <td class="max-w-[280px]">
                <div class="flex items-center gap-2.5">
                  <span class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-paper text-[8px] font-black text-moss">
                    {{ initials(admin.name) }}
                  </span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="truncate text-[11px] font-extrabold text-ink">{{ admin.name }}</span>
                      <span
                        v-if="admin.id === currentUserId"
                        class="flex-shrink-0 rounded-full bg-lime/15 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.06em] text-moss"
                      >
                        Anda
                      </span>
                    </div>
                    <p class="mt-0.5 truncate text-[9px] font-semibold text-muted">{{ admin.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em]"
                  :class="admin.role === 'superadmin' ? 'bg-ink text-lime-soft' : 'bg-paper text-moss'"
                >
                  {{ roleLabel(admin.role) }}
                </span>
              </td>
              <td>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em]"
                  :class="admin.isActive ? 'bg-lime/15 text-moss' : 'bg-red-50 text-red-500'"
                >
                  <span class="h-1 w-1 rounded-full bg-current" />
                  {{ admin.isActive ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td class="hidden text-[10px] font-semibold text-muted lg:table-cell">
                {{ formatDateTime(admin.lastLoginAt) }}
              </td>
              <td>
                <div class="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
                    title="Edit admin"
                    aria-label="Edit admin"
                    @click="openEdit(admin)"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
                    title="Reset password"
                    aria-label="Reset password admin"
                    @click="openPasswordModal(admin)"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M15 7a4 4 0 11-4 4m0 0l-2 2m2-2l2 2m4-6l3-3m0 0l2 2m-2-2l-2-2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button
                    v-if="admin.id !== currentUserId"
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
                    :title="admin.isActive ? 'Nonaktifkan admin' : 'Aktifkan admin'"
                    :aria-label="admin.isActive ? 'Nonaktifkan admin' : 'Aktifkan admin'"
                    @click="confirmStatus(admin)"
                  >
                    <svg v-if="admin.isActive" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M18.364 5.636a9 9 0 11-12.728 0M12 3v9" stroke-linecap="round" />
                    </svg>
                    <svg v-else class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M5.636 18.364a9 9 0 1112.728 0M12 21v-9" stroke-linecap="round" />
                    </svg>
                  </button>
                  <button
                    v-if="admin.id !== currentUserId"
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Hapus admin"
                    aria-label="Hapus admin"
                    @click="confirmDelete(admin)"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
                <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">
                  {{ editingAdmin ? 'Perbarui akses' : 'Akun admin baru' }}
                </p>
                <h2 class="mt-1 font-display text-xl font-bold tracking-tight text-ink">
                  {{ editingAdmin ? 'Edit admin' : 'Tambah admin' }}
                </h2>
              </div>
              <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink" aria-label="Tutup" @click="closeModal">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="saveAdmin">
              <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                <p v-if="formError" class="rounded-[0.9rem] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-600">{{ formError }}</p>

                <div>
                  <label class="admin-label" for="admin-name">Nama lengkap <span class="text-red-500">*</span></label>
                  <input id="admin-name" v-model="form.name" type="text" placeholder="Nama admin" class="admin-input" required />
                </div>

                <div>
                  <label class="admin-label" for="admin-email">Email <span class="text-red-500">*</span></label>
                  <input
                    id="admin-email"
                    v-model="form.email"
                    type="email"
                    placeholder="nama@email.com"
                    class="admin-input disabled:bg-paper disabled:text-muted"
                    :disabled="Boolean(editingAdmin)"
                    required
                  />
                  <p v-if="editingAdmin" class="mt-1.5 text-[9px] font-semibold text-muted">
                    Email login tidak dapat diubah dari panel.
                  </p>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="admin-label" for="admin-role">Role <span class="text-red-500">*</span></label>
                    <select id="admin-role" v-model="form.role" class="admin-input" :disabled="isEditingSelf">
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>
                  <div v-if="editingAdmin">
                    <label class="admin-label">Status akses</label>
                    <label class="flex min-h-[2.75rem] items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5">
                      <input v-model="form.isActive" type="checkbox" class="h-4 w-4 accent-lime" :disabled="isEditingSelf" />
                      <span class="text-[10px] font-bold text-ink">{{ form.isActive ? 'Aktif' : 'Nonaktif' }}</span>
                    </label>
                  </div>
                  <div v-else class="flex items-end">
                    <p class="pb-2 text-[9px] font-semibold leading-relaxed text-muted">
                      Role superadmin dapat mengelola akun admin lain.
                    </p>
                  </div>
                </div>

                <p v-if="isEditingSelf" class="rounded-[0.9rem] border border-line bg-white px-3 py-2.5 text-[9px] font-semibold leading-relaxed text-muted">
                  Ini akun Anda. Role dan status aktif akun sendiri tidak dapat diturunkan atau dinonaktifkan.
                </p>

                <div>
                  <label class="admin-label" for="admin-password">
                    {{ editingAdmin ? 'Password baru' : 'Password' }}
                    <span v-if="!editingAdmin" class="text-red-500">*</span>
                  </label>
                  <input
                    id="admin-password"
                    v-model="form.password"
                    type="password"
                    :placeholder="editingAdmin ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'"
                    class="admin-input"
                    autocomplete="new-password"
                    :required="!editingAdmin"
                  />
                  <p class="mt-1.5 text-[9px] font-semibold text-muted">
                    {{ editingAdmin ? 'Isi hanya jika ingin mengganti password akun ini.' : 'Password minimal 8 karakter.' }}
                  </p>
                </div>
              </div>

              <div class="flex flex-shrink-0 items-center justify-end gap-2 border-t border-line bg-white px-5 py-4">
                <button type="button" class="admin-btn admin-btn-ghost" @click="closeModal">Batal</button>
                <button type="submit" :disabled="store.isSaving" class="admin-btn admin-btn-lime disabled:opacity-60">
                  <span v-if="store.isSaving" class="h-3 w-3 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                  {{ store.isSaving ? 'Menyimpan...' : editingAdmin ? 'Simpan perubahan' : 'Tambah admin' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Reset password modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showPasswordModal"
          class="fixed inset-0 z-[92] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          @click.self="showPasswordModal = false"
        >
          <div class="w-full max-w-sm rounded-[1.5rem] border border-line bg-paper p-6 shadow-2xl">
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-lime/15 text-moss">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <path d="M15 7a4 4 0 11-4 4m0 0l-2 2m2-2l2 2m4-6l3-3m0 0l2 2m-2-2l-2-2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <h3 class="mt-4 font-display text-xl font-bold tracking-tight text-ink">Reset password</h3>
            <p class="mt-1.5 text-[11px] font-medium leading-relaxed text-muted">
              Buat password baru untuk <strong class="text-ink">{{ passwordTarget?.name }}</strong>. Password lama tidak dapat dilihat.
            </p>

            <form class="mt-4 space-y-3" @submit.prevent="savePassword">
              <p v-if="passwordError" class="rounded-[0.9rem] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-600">{{ passwordError }}</p>
              <div>
                <label class="admin-label" for="reset-password">Password baru</label>
                <input id="reset-password" v-model="passwordForm.password" type="password" class="admin-input" placeholder="Minimal 8 karakter" autocomplete="new-password" required />
              </div>
              <div>
                <label class="admin-label" for="reset-password-confirm">Ulangi password</label>
                <input id="reset-password-confirm" v-model="passwordForm.confirm" type="password" class="admin-input" placeholder="Ketik ulang password" autocomplete="new-password" required />
              </div>
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" class="admin-btn admin-btn-ghost" @click="showPasswordModal = false">Batal</button>
                <button type="submit" :disabled="store.isSaving" class="admin-btn admin-btn-lime disabled:opacity-60">
                  {{ store.isSaving ? 'Menyimpan...' : 'Simpan password' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Status modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showStatusConfirm"
          class="fixed inset-0 z-[94] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          @click.self="showStatusConfirm = false"
        >
          <div class="w-full max-w-sm rounded-[1.5rem] border border-line bg-paper p-6 text-center shadow-2xl">
            <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime/15 text-moss">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <path d="M12 3v9m6.364-6.364a9 9 0 11-12.728 0" stroke-linecap="round" />
              </svg>
            </span>
            <h3 class="mt-4 font-display text-xl font-bold tracking-tight text-ink">
              {{ statusTarget?.isActive ? 'Nonaktifkan admin?' : 'Aktifkan admin?' }}
            </h3>
            <p class="mt-2 text-[11px] font-medium leading-relaxed text-muted">
              <template v-if="statusTarget?.isActive">
                Akun <strong class="text-ink">"{{ statusTarget?.name }}"</strong> tidak akan bisa login sampai diaktifkan kembali.
              </template>
              <template v-else>
                Akun <strong class="text-ink">"{{ statusTarget?.name }}"</strong> akan bisa login kembali ke panel admin.
              </template>
            </p>
            <div class="mt-6 flex justify-center gap-2">
              <button type="button" class="admin-btn admin-btn-ghost" @click="showStatusConfirm = false">Batal</button>
              <button type="button" :disabled="store.isSaving" class="admin-btn admin-btn-lime disabled:opacity-60" @click="handleStatusChange">
                {{ store.isSaving ? 'Memproses...' : statusTarget?.isActive ? 'Ya, nonaktifkan' : 'Ya, aktifkan' }}
              </button>
            </div>
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
            <h3 class="mt-4 font-display text-xl font-bold tracking-tight text-ink">Hapus admin?</h3>
            <p class="mt-2 text-[11px] font-medium leading-relaxed text-muted">
              Akun <strong class="text-ink">"{{ deleteTarget?.name }}"</strong> akan dihapus permanen dari Supabase Auth dan tidak dapat dipulihkan.
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
