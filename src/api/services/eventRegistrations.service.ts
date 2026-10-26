import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type { Paginated, QueryParams } from '@/api/types'
import type {
  EventRegistrationStatus,
  EventRegistrationWithEvent,
} from '@/types'

export interface EventRegistrationListQuery {
  page?: number
  perPage?: number
  eventId?: string
  status?: EventRegistrationStatus | 'Semua'
  search?: string
}

function toQuery(query: EventRegistrationListQuery): QueryParams {
  return {
    page: query.page,
    perPage: query.perPage,
    eventId: query.eventId,
    status: query.status,
    search: query.search,
  }
}

export const eventRegistrationsService = {
  list(query: EventRegistrationListQuery = {}): Promise<Paginated<EventRegistrationWithEvent>> {
    return http.paginated<EventRegistrationWithEvent>(
      endpoints.eventRegistrations.list,
      toQuery(query),
    )
  },

  getById(id: string): Promise<EventRegistrationWithEvent> {
    return http.get<EventRegistrationWithEvent>(endpoints.eventRegistrations.detail(id))
  },

  updateStatus(
    id: string,
    status: EventRegistrationStatus,
  ): Promise<EventRegistrationWithEvent> {
    return http.patch<EventRegistrationWithEvent>(
      endpoints.eventRegistrations.detail(id),
      { status },
    )
  },

  remove(id: string): Promise<{ message: string }> {
    return http.delete<{ message: string }>(endpoints.eventRegistrations.detail(id))
  },
}
