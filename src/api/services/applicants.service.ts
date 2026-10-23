import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type { Paginated, QueryParams } from '@/api/types'
import type {
  ApplicantStats,
  ApplicantStatus,
  LK1Applicant,
  LK1ApplicationInput,
} from '@/types'

export interface ApplicantListQuery {
  page?: number
  perPage?: number
  status?: ApplicantStatus | 'Semua'
  search?: string
}

function toQuery(query: ApplicantListQuery): QueryParams {
  return {
    page: query.page,
    perPage: query.perPage,
    status: query.status,
    search: query.search,
  }
}

export const applicantsService = {
  list(query: ApplicantListQuery = {}): Promise<Paginated<LK1Applicant>> {
    return http.paginated<LK1Applicant>(endpoints.applicants.list, toQuery(query))
  },

  getStats(): Promise<ApplicantStats> {
    return http.get<ApplicantStats>(endpoints.applicants.stats)
  },

  create(input: LK1ApplicationInput): Promise<LK1Applicant> {
    return http.post<LK1Applicant>(endpoints.applicants.list, input)
  },

  updateStatus(id: string, status: ApplicantStatus): Promise<LK1Applicant> {
    return http.patch<LK1Applicant>(endpoints.applicants.detail(id), { status })
  },
}
