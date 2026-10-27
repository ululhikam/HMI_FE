import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { adminUsersService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import { tokenStorage } from '@/api/token'
import { useAuthStore } from '@/stores/auth'
import type {
  AdminRole,
  AdminUser,
  AdminUserCreateInput,
  AdminUserUpdateInput,
} from '@/types'

const PAGE_SIZE = 100

export const useAdminUserStore = defineStore('adminUsers', () => {
  const users = ref<AdminUser[]>([])
  const search = ref('')
  const roleFilter = ref<AdminRole | 'Semua'>('Semua')
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  let loaded = false

  const filteredUsers = computed(() => {
    const query = search.value.trim().toLowerCase()

    return users.value.filter((user) => {
      const matchesRole = roleFilter.value === 'Semua' || user.role === roleFilter.value
      const matchesQuery =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      return matchesRole && matchesQuery
    })
  })

  const summary = computed(() => ({
    total: users.value.length,
    superadmin: users.value.filter((user) => user.role === 'superadmin').length,
    admin: users.value.filter((user) => user.role === 'admin').length,
    inactive: users.value.filter((user) => !user.isActive).length,
  }))

  const hasFilters = computed(
    () => Boolean(search.value.trim()) || roleFilter.value !== 'Semua',
  )

  function syncCurrentUser(updated: AdminUser) {
    const auth = useAuthStore()
    if (auth.currentUser?.id !== updated.id) return

    auth.currentUser = {
      ...auth.currentUser,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    }
    tokenStorage.setStoredUser(auth.currentUser)
  }

  async function fetchUsers(force = false) {
    if (loaded && !force) return

    isLoading.value = true
    error.value = ''
    try {
      const firstPage = await adminUsersService.list({ page: 1, perPage: PAGE_SIZE })
      const allUsers = [...firstPage.items]

      for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
        const nextPage = await adminUsersService.list({ page, perPage: PAGE_SIZE })
        allUsers.push(...nextPage.items)
      }

      users.value = allUsers
      loaded = true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat daftar admin.')
    } finally {
      isLoading.value = false
    }
  }

  async function createAdmin(input: AdminUserCreateInput): Promise<AdminUser | null> {
    isSaving.value = true
    error.value = ''
    try {
      const created = await adminUsersService.create(input)
      users.value.push(created)
      return created
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menambahkan admin.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function updateAdmin(
    id: string,
    input: AdminUserUpdateInput,
  ): Promise<AdminUser | null> {
    isSaving.value = true
    error.value = ''
    try {
      const updated = await adminUsersService.update(id, input)
      const index = users.value.findIndex((user) => user.id === id)
      if (index !== -1) users.value[index] = updated
      syncCurrentUser(updated)
      return updated
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memperbarui data admin.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function deleteAdmin(id: string): Promise<boolean> {
    isSaving.value = true
    error.value = ''
    try {
      await adminUsersService.remove(id)
      users.value = users.value.filter((user) => user.id !== id)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menghapus admin.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function resetPassword(id: string, password: string): Promise<boolean> {
    isSaving.value = true
    error.value = ''
    try {
      await adminUsersService.resetPassword(id, password)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal mengubah password admin.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  function resetFilters() {
    search.value = ''
    roleFilter.value = 'Semua'
  }

  return {
    users,
    search,
    roleFilter,
    isLoading,
    isSaving,
    error,
    filteredUsers,
    summary,
    hasFilters,
    fetchUsers,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    resetPassword,
    resetFilters,
  }
})
