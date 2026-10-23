import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type { Paginated, QueryParams } from '@/api/types'
import type { ContactMessage, ContactMessageInput } from '@/types'

export interface ContactMessageListQuery {
  page?: number
  perPage?: number
  status?: ContactMessage['status']
}

function toQuery(query: ContactMessageListQuery): QueryParams {
  return {
    page: query.page,
    perPage: query.perPage,
    status: query.status,
  }
}

export const contactService = {
  create(input: ContactMessageInput): Promise<ContactMessage> {
    return http.post<ContactMessage>(endpoints.contactMessages.create, input)
  },

  list(query: ContactMessageListQuery = {}): Promise<Paginated<ContactMessage>> {
    return http.paginated<ContactMessage>(endpoints.contactMessages.list, toQuery(query))
  },
}
