import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type { Paginated, QueryParams } from '@/api/types'
import type { GalleryCategory, GalleryItem, GalleryItemInput } from '@/types'

export interface GalleryListQuery {
  page?: number
  perPage?: number
  category?: GalleryCategory | 'Semua'
  type?: 'photo' | 'video'
  search?: string
}

function toQuery(query: GalleryListQuery): QueryParams {
  return {
    page: query.page,
    perPage: query.perPage,
    category: query.category,
    type: query.type,
    search: query.search,
  }
}

export const galleryService = {
  list(query: GalleryListQuery = {}): Promise<Paginated<GalleryItem>> {
    return http.paginated<GalleryItem>(endpoints.gallery.list, toQuery(query))
  },

  create(input: GalleryItemInput): Promise<GalleryItem> {
    return http.post<GalleryItem>(endpoints.gallery.list, input)
  },

  update(id: string, input: Partial<GalleryItemInput>): Promise<GalleryItem> {
    return http.patch<GalleryItem>(endpoints.gallery.detail(id), input)
  },

  remove(id: string): Promise<{ message: string }> {
    return http.delete<{ message: string }>(endpoints.gallery.detail(id))
  },
}
