import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type { Paginated, QueryParams } from '@/api/types'
import type { Member, MemberInput } from '@/types'

export interface MemberListQuery {
  page?: number
  perPage?: number
  department?: string
  period?: string
  search?: string
}

function toQuery(query: MemberListQuery): QueryParams {
  return {
    page: query.page,
    perPage: query.perPage,
    department: query.department,
    period: query.period,
    search: query.search,
  }
}

export const membersService = {
  list(query: MemberListQuery = {}): Promise<Paginated<Member>> {
    return http.paginated<Member>(endpoints.members.list, toQuery(query))
  },

  create(input: MemberInput): Promise<Member> {
    return http.post<Member>(endpoints.members.list, input)
  },

  update(id: string, input: Partial<MemberInput>): Promise<Member> {
    return http.patch<Member>(endpoints.members.detail(id), input)
  },

  remove(id: string): Promise<{ message: string }> {
    return http.delete<{ message: string }>(endpoints.members.detail(id))
  },
}
