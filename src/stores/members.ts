import { defineStore } from 'pinia'
import { ref } from 'vue'
import { membersService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import type { Member, MemberInput } from '@/types'

export const useMemberStore = defineStore('members', () => {
  const members = ref<Member[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  let loaded = false

  async function fetchMembers(force = false) {
    if (loaded && !force) return
    isLoading.value = true
    error.value = ''
    try {
      const page = await membersService.list({ perPage: 100 })
      members.value = page.items
      loaded = true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat data pengurus.')
    } finally {
      isLoading.value = false
    }
  }

  async function createMember(input: MemberInput): Promise<Member | null> {
    isSaving.value = true
    error.value = ''
    try {
      const member = await membersService.create(input)
      members.value.push(member)
      return member
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menambah pengurus.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function updateMember(id: string, input: Partial<MemberInput>): Promise<Member | null> {
    isSaving.value = true
    error.value = ''
    try {
      const updated = await membersService.update(id, input)
      const index = members.value.findIndex((member) => member.id === id)
      if (index !== -1) members.value[index] = updated
      return updated
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memperbarui pengurus.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function deleteMember(id: string): Promise<boolean> {
    isSaving.value = true
    error.value = ''
    try {
      await membersService.remove(id)
      members.value = members.value.filter((member) => member.id !== id)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menghapus pengurus.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    members,
    isLoading,
    isSaving,
    error,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
  }
})
