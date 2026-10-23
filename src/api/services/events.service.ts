import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type { QueryParams } from '@/api/types'
import type { Paginated } from '@/api/types'
import type {
  Event,
  EventRegistration,
  EventRegistrationInput,
  EventStatus,
  EventSummary,
  PastEventPhoto,
  Speaker,
  Testimonial,
} from '@/types'

export interface EventListQuery {
  page?: number
  perPage?: number
  category?: string
  status?: EventStatus | 'Semua'
  search?: string
  upcoming?: boolean
}

function toQuery(query: EventListQuery): QueryParams {
  return {
    page: query.page,
    perPage: query.perPage,
    category: query.category,
    status: query.status,
    search: query.search,
    upcoming: query.upcoming,
  }
}

export const eventsService = {
  list(query: EventListQuery = {}): Promise<Paginated<Event>> {
    return http.paginated<Event>(endpoints.events.list, toQuery(query))
  },

  getById(id: string): Promise<Event> {
    return http.get<Event>(endpoints.events.detail(id))
  },

  getFeatured(): Promise<Event> {
    return http.get<Event>(endpoints.events.featured)
  },

  getSummary(): Promise<EventSummary> {
    return http.get<EventSummary>(endpoints.events.summary)
  },

  listSpeakers(): Promise<Speaker[]> {
    return http.get<Speaker[]>(endpoints.events.speakers)
  },

  listTestimonials(): Promise<Testimonial[]> {
    return http.get<Testimonial[]>(endpoints.events.testimonials)
  },

  listPastHighlights(): Promise<PastEventPhoto[]> {
    return http.get<PastEventPhoto[]>(endpoints.events.pastHighlights)
  },

  register(eventId: string, input: EventRegistrationInput): Promise<EventRegistration> {
    return http.post<EventRegistration>(endpoints.events.registrations(eventId), input)
  },

  create(input: Partial<Event>): Promise<Event> {
    return http.post<Event>(endpoints.events.list, input)
  },

  update(id: string, input: Partial<Event>): Promise<Event> {
    return http.patch<Event>(endpoints.events.detail(id), input)
  },

  remove(id: string): Promise<{ message: string }> {
    return http.delete<{ message: string }>(endpoints.events.detail(id))
  },
}

