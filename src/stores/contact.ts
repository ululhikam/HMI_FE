import { defineStore } from 'pinia'
import { ref } from 'vue'
import { contactService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import type { ContactMessage, ContactMessageInput } from '@/types'

export const useContactStore = defineStore('contact', () => {
  const isSubmitting = ref(false)
  const error = ref('')
  const lastMessage = ref<ContactMessage | null>(null)

  /** Kirim pesan dari halaman kontak. Mengembalikan `true` bila terkirim. */
  async function submitMessage(input: ContactMessageInput): Promise<boolean> {
    isSubmitting.value = true
    error.value = ''
    try {
      lastMessage.value = await contactService.create(input)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Pesan gagal dikirim. Silakan coba lagi.')
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    error,
    lastMessage,
    submitMessage,
  }
})
