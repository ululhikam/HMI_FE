import { defineStore } from 'pinia'
import { ref } from 'vue'
import { commentsService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import type { Comment, CommentInput } from '@/types'

export const useCommentStore = defineStore('comments', () => {
  const comments = ref<Comment[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref('')

  let loadedSlug = ''

  async function fetchForArticle(slug: string, force = false) {
    if (loadedSlug === slug && !force) return
    isLoading.value = true
    error.value = ''
    try {
      const page = await commentsService.list(slug, 1, 100)
      comments.value = page.items
      loadedSlug = slug
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat komentar.')
    } finally {
      isLoading.value = false
    }
  }

  async function add(slug: string, input: CommentInput): Promise<Comment | null> {
    isSubmitting.value = true
    error.value = ''
    try {
      const comment = await commentsService.create(slug, input)
      comments.value.unshift(comment)
      return comment
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal mengirim komentar.')
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    comments,
    isLoading,
    isSubmitting,
    error,
    fetchForArticle,
    add,
  }
})
