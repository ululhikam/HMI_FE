export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

export interface ApiEnvelope<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiErrorPayload {
  code: string
  message: string
  details?: unknown
}

export interface ApiErrorEnvelope {
  success: false
  error: ApiErrorPayload
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export type QueryValue = string | number | boolean | null | undefined

export type QueryParams = Record<string, QueryValue>

export interface RequestOptions {
  query?: QueryParams
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}
