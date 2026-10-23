const VISITOR_KEY = 'hmi_visitor_id'

/**
 * ID anonim per perangkat untuk likes/bookmark.
 * Tidak terkait akun dan tidak dikirim ke pihak ketiga.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server'

  let id = window.localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}
