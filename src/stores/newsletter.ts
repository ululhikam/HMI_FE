import { defineStore } from 'pinia'
import { ref } from 'vue'
import { newsletterService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import type { NewsletterSubscription } from '@/types'

export const useNewsletterStore = defineStore('newsletter', () => {
  const isSubmitting = ref(false)
  const error = ref('')
  const lastSubscription = ref<NewsletterSubscription | null>(null)

  /** Berlangganan buletin. Mengembalikan `true` bila email tercatat. */
  async function subscribe(email: string, source?: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase()
    if (!normalized) {
      error.value = 'Alamat email wajib diisi.'
      return false
    }

    isSubmitting.value = true
    error.value = ''
    try {
      lastSubscription.value = await newsletterService.subscribe({ email: normalized, source })
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal berlangganan. Silakan coba lagi.')
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    error,
    lastSubscription,
    subscribe,
  }
})
