import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { eventsService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import type {
  Event,
  EventRegistration,
  EventRegistrationInput,
  EventSummary,
  PastEventPhoto,
  Speaker,
  Testimonial,
} from '@/types'

export const useEventStore = defineStore('events', () => {
  const events = ref<Event[]>([])
  const speakers = ref<Speaker[]>([])
  const pastGallery = ref<PastEventPhoto[]>([])
  const testimonials = ref<Testimonial[]>([])
  const summary = ref<EventSummary | null>(null)

  const selectedCategory = ref<string>('Semua')
  const selectedStatus = ref<string>('Semua')
  const searchQuery = ref('')

  const isLoading = ref(false)
  const isRegistering = ref(false)
  const error = ref('')

  const categories = ['Semua', 'LK1', 'LK2', 'Training', 'Baksos', 'Kajian', 'Rapat']
  const statuses = [
    { label: 'Semua Agenda', value: 'Semua' },
    { label: 'Akan Datang', value: 'upcoming' },
    { label: 'Sedang Berlangsung', value: 'ongoing' },
    { label: 'Selesai', value: 'done' },
  ]

  const filteredEvents = computed(() => {
    let result = [...events.value]
    if (selectedCategory.value !== 'Semua') {
      result = result.filter((event) => event.category === selectedCategory.value)
    }
    if (selectedStatus.value !== 'Semua') {
      result = result.filter((event) => event.status === selectedStatus.value)
    }
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query),
      )
    }
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  const upcomingEvents = computed(() =>
    events.value.filter((event) => event.status === 'upcoming' || event.status === 'ongoing'),
  )

  const featuredEvent = computed(() => events.value.find((event) => event.status === 'upcoming') ?? events.value[0] ?? null)

  const isSaving = ref(false)

  let loaded = false

  /** Muat seluruh data agenda + narasumber + testimoni dalam satu alur. */
  async function fetchAll(force = false) {
    if (loaded && !force) return
    isLoading.value = true
    error.value = ''
    try {
      const [eventPage, speakerList, testimonialList, summaryData, pastHighlights] = await Promise.all([
        eventsService.list({ perPage: 100 }),
        eventsService.listSpeakers(),
        eventsService.listTestimonials(),
        eventsService.getSummary(),
        eventsService.listPastHighlights(),
      ])
      events.value = eventPage.items
      speakers.value = speakerList
      testimonials.value = testimonialList
      summary.value = summaryData
      pastGallery.value = pastHighlights
      loaded = true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat agenda.')
    } finally {
      isLoading.value = false
    }
  }

  async function registerForEvent(
    eventId: string,
    input: EventRegistrationInput,
  ): Promise<EventRegistration | null> {
    isRegistering.value = true
    error.value = ''
    try {
      const registration = await eventsService.register(eventId, input)
      const event = events.value.find((item) => item.id === eventId)
      if (event && typeof event.seatsLeft === 'number' && event.seatsLeft > 0) event.seatsLeft -= 1
      return registration
    } catch (err) {
      error.value = getErrorMessage(err, 'Pendaftaran agenda gagal.')
      return null
    } finally {
      isRegistering.value = false
    }
  }

  async function createEvent(input: Partial<Event>): Promise<boolean> {
    isSaving.value = true
    error.value = ''
    try {
      const created = await eventsService.create(input)
      events.value.unshift(created)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menambahkan agenda.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function updateEvent(id: string, input: Partial<Event>): Promise<boolean> {
    isSaving.value = true
    error.value = ''
    try {
      const updated = await eventsService.update(id, input)
      const index = events.value.findIndex((e) => e.id === id)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...updated }
      }
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memperbarui agenda.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function deleteEvent(id: string): Promise<boolean> {
    isSaving.value = true
    error.value = ''
    try {
      await eventsService.remove(id)
      events.value = events.value.filter((e) => e.id !== id)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menghapus agenda.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    events,
    speakers,
    pastGallery,
    testimonials,
    summary,
    selectedCategory,
    selectedStatus,
    searchQuery,
    isLoading,
    isRegistering,
    isSaving,
    error,
    categories,
    statuses,
    filteredEvents,
    upcomingEvents,
    featuredEvent,
    fetchAll,
    registerForEvent,
    createEvent,
    updateEvent,
    deleteEvent,
  }
})

