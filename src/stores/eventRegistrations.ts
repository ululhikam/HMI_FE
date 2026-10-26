import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { eventRegistrationsService, eventsService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import type {
  Event,
  EventRegistrationStatus,
  EventRegistrationWithEvent,
} from '@/types'

const PAGE_SIZE = 100

export const useEventRegistrationStore = defineStore('eventRegistrations', () => {
  const registrations = ref<EventRegistrationWithEvent[]>([])
  const events = ref<Event[]>([])
  const search = ref('')
  const eventFilter = ref('Semua')
  const statusFilter = ref<EventRegistrationStatus | 'Semua'>('Semua')
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  let loaded = false

  const eventOptions = computed(() =>
    [...events.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  )

  const scopedRegistrations = computed(() =>
    eventFilter.value === 'Semua'
      ? registrations.value
      : registrations.value.filter((registration) => registration.eventId === eventFilter.value),
  )

  const filteredRegistrations = computed(() => {
    let result = [...scopedRegistrations.value]

    if (statusFilter.value !== 'Semua') {
      result = result.filter((registration) => registration.status === statusFilter.value)
    }

    const query = search.value.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (registration) =>
          registration.name.toLowerCase().includes(query) ||
          registration.email.toLowerCase().includes(query) ||
          (registration.phone ?? '').toLowerCase().includes(query) ||
          (registration.event?.title ?? '').toLowerCase().includes(query),
      )
    }

    return result
  })

  async function fetchRegistrations(force = false) {
    if (loaded && !force) return

    isLoading.value = true
    error.value = ''
    try {
      const [eventPage, firstPage] = await Promise.all([
        eventsService.list({ perPage: 100 }),
        eventRegistrationsService.list({ page: 1, perPage: PAGE_SIZE }),
      ])

      const allRegistrations = [...firstPage.items]
      for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
        const nextPage = await eventRegistrationsService.list({
          page,
          perPage: PAGE_SIZE,
        })
        allRegistrations.push(...nextPage.items)
      }

      const allEvents = [...eventPage.items]
      for (let page = 2; page <= eventPage.meta.totalPages; page += 1) {
        const nextPage = await eventsService.list({ page, perPage: PAGE_SIZE })
        allEvents.push(...nextPage.items)
      }

      registrations.value = allRegistrations
      events.value = allEvents.filter((event) => event.category !== 'LK1')

      if (
        eventFilter.value !== 'Semua' &&
        !events.value.some((event) => event.id === eventFilter.value)
      ) {
        eventFilter.value = 'Semua'
      }

      loaded = true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat pendaftar agenda.')
    } finally {
      isLoading.value = false
    }
  }

  async function updateStatus(
    id: string,
    status: EventRegistrationStatus,
  ): Promise<boolean> {
    isSaving.value = true
    error.value = ''
    try {
      const updated = await eventRegistrationsService.updateStatus(id, status)
      const index = registrations.value.findIndex((registration) => registration.id === id)
      if (index !== -1) registrations.value[index] = updated
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memperbarui status pendaftar.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function deleteRegistration(id: string): Promise<boolean> {
    isSaving.value = true
    error.value = ''
    try {
      await eventRegistrationsService.remove(id)
      registrations.value = registrations.value.filter((registration) => registration.id !== id)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menghapus pendaftaran agenda.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    registrations,
    events,
    search,
    eventFilter,
    statusFilter,
    isLoading,
    isSaving,
    error,
    eventOptions,
    scopedRegistrations,
    filteredRegistrations,
    fetchRegistrations,
    updateStatus,
    deleteRegistration,
  }
})
