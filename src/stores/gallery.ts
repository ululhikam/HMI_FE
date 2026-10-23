import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { galleryService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import type { GalleryCategory, GalleryItem, GalleryItemInput } from '@/types'

const categories: Array<'Semua' | GalleryCategory> = [
  'Semua',
  'LK1',
  'LK2',
  'Training',
  'Baksos',
  'Kajian',
  'Rapat',
  'Lainnya',
]

export const useGalleryStore = defineStore('gallery', () => {
  const items = ref<GalleryItem[]>([])
  const activeCategory = ref<'Semua' | GalleryCategory>('Semua')
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  let loaded = false

  const filteredItems = computed(() =>
    activeCategory.value === 'Semua'
      ? items.value
      : items.value.filter((item) => item.category === activeCategory.value),
  )

  async function fetchItems(force = false) {
    if (loaded && !force) return
    isLoading.value = true
    error.value = ''
    try {
      const page = await galleryService.list({ perPage: 100 })
      items.value = page.items
      loaded = true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat galeri.')
    } finally {
      isLoading.value = false
    }
  }

  async function createItem(input: GalleryItemInput): Promise<GalleryItem | null> {
    isSaving.value = true
    error.value = ''
    try {
      const item = await galleryService.create(input)
      items.value.unshift(item)
      return item
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menambah item galeri.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function updateItem(id: string, input: Partial<GalleryItemInput>): Promise<GalleryItem | null> {
    isSaving.value = true
    error.value = ''
    try {
      const updated = await galleryService.update(id, input)
      const index = items.value.findIndex((item) => item.id === id)
      if (index !== -1) items.value[index] = updated
      return updated
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memperbarui item galeri.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function deleteItem(id: string): Promise<boolean> {
    isSaving.value = true
    error.value = ''
    try {
      await galleryService.remove(id)
      items.value = items.value.filter((item) => item.id !== id)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menghapus item galeri.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    items,
    activeCategory,
    categories,
    isLoading,
    isSaving,
    error,
    filteredItems,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
  }
})
