export function normalizeWhatsAppNumber(phone?: string | null) {
  let digits = (phone ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('620')) digits = `62${digits.slice(3)}`
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export function isValidWhatsAppNumber(phone?: string | null) {
  return /^62\d{8,13}$/.test(normalizeWhatsAppNumber(phone))
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string) {
  const number = normalizeWhatsAppNumber(phone)
  if (!/^62\d{8,13}$/.test(number) || !message.trim()) return ''
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
