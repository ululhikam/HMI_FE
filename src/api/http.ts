import { API_BASE_URL, API_TIMEOUT_MS } from './config'
import { ApiError } from './errors'
import { tokenStorage } from './token'
import { getVisitorId } from './visitor'
import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  HttpMethod,
  Paginated,
  QueryParams,
  RequestOptions,
} from './types'
import type { AuthSession } from '@/types'

function buildQuery(query?: QueryParams): string {
  if (!query) return ''
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    params.set(key, String(value))
  })
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: ApiErrorEnvelope | null = null
  try {
    payload = (await response.json()) as ApiErrorEnvelope
  } catch {
    // respons bukan JSON
  }

  if (payload?.error) {
    return new ApiError(response.status, payload.error.code, payload.error.message, payload.error.details)
  }

  return new ApiError(
    response.status,
    `HTTP_${response.status}`,
    response.statusText || 'Permintaan ke server gagal.',
  )
}

const AUTH_PATHS = new Set(['/auth/login', '/auth/refresh'])
let refreshPromise: Promise<string | null> | null = null

async function requestNewAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!response.ok) return null

    const envelope = (await response.json()) as ApiEnvelope<AuthSession>
    if (!envelope.data?.accessToken) return null

    tokenStorage.setTokens(envelope.data.accessToken, envelope.data.refreshToken)
    tokenStorage.setStoredUser(envelope.data.user)
    return envelope.data.accessToken
  } catch {
    return null
  }
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/**
 * Inti seluruh komunikasi data frontend.
 * Semua request melewati envelope kontrak di `apicontract.yaml`.
 */
export async function apiRequestEnvelope<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Visitor-Id': getVisitorId(),
    ...options.headers,
  }

  let body: BodyInit | undefined
  if (options.body !== undefined) {
    if (isFormData(options.body)) {
      body = options.body
    } else {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }
  }

  const url = `${API_BASE_URL}${path}${buildQuery(options.query)}`
  const canRefresh = !AUTH_PATHS.has(path)

  const send = (token: string | null) => {
    const requestHeaders = { ...headers }
    if (token) requestHeaders.Authorization = `Bearer ${token}`
    return fetch(url, {
      method,
      headers: requestHeaders,
      body,
      signal: controller.signal,
    })
  }

  try {
    let response = await send(tokenStorage.getAccessToken())

    if (response.status === 401 && canRefresh) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        response = await send(newToken)
      }
    }

    if (response.status === 204) {
      return { success: true, data: undefined as T }
    }

    if (!response.ok) {
      const error = await parseError(response)
      if (error.status === 401 && canRefresh) {
        tokenStorage.clearSession()
        window.dispatchEvent(new CustomEvent('hmi:unauthorized'))
      }
      throw error
    }

    return (await response.json()) as ApiEnvelope<T>
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, 'TIMEOUT', 'Server tidak merespons. Silakan coba lagi.')
    }
    throw new ApiError(0, 'NETWORK_ERROR', 'Tidak dapat terhubung ke server. Periksa koneksi Anda.')
  } finally {
    window.clearTimeout(timeout)
  }
}

/** Request yang langsung mengembalikan `data` dari envelope. */
export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const envelope = await apiRequestEnvelope<T>(method, path, options)
  return envelope.data
}

/** Request dengan metadata pagination. */
export async function apiRequestPaginated<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<Paginated<T>> {
  const envelope = await apiRequestEnvelope<T[]>(method, path, options)
  return {
    items: envelope.data,
    meta: envelope.meta ?? {
      page: 1,
      perPage: envelope.data.length,
      total: envelope.data.length,
      totalPages: 1,
    },
  }
}

export const http = {
  get: <T>(path: string, query?: QueryParams) => apiRequest<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown, query?: QueryParams) =>
    apiRequest<T>('POST', path, { body, query }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>('PATCH', path, { body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>('PUT', path, { body }),
  delete: <T>(path: string) => apiRequest<T>('DELETE', path),
  paginated: <T>(path: string, query?: QueryParams) =>
    apiRequestPaginated<T>('GET', path, { query }),
}
