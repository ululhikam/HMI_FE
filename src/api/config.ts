/**
 * Konfigurasi transport API.
 *
 * Frontend selalu berkomunikasi langsung dengan backend melalui HTTP.
 * Nilai `VITE_API_BASE_URL` harus sama dengan `servers[0].url` pada
 * `apicontract.yaml` (default: http://localhost:3001).
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001').replace(
  /\/+$/,
  '',
)

export const API_TIMEOUT_MS = 20_000
