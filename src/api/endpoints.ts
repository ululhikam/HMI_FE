/**
 * Endpoint API — satu-satunya sumber path di frontend.
 * Semua path harus konsisten dengan `apicontract.yaml` di root repo.
 */
const slug = (value: string) => encodeURIComponent(value)
const id = (value: string) => encodeURIComponent(value)

export const endpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
  },
  articles: {
    list: '/articles',
    detail: (articleSlug: string) => `/articles/${slug(articleSlug)}`,
    byId: (articleId: string) => `/articles/id/${id(articleId)}`,
    views: (articleSlug: string) => `/articles/${slug(articleSlug)}/views`,
    like: (articleSlug: string) => `/articles/${slug(articleSlug)}/like`,
    bookmark: (articleSlug: string) => `/articles/${slug(articleSlug)}/bookmark`,
    comments: (articleSlug: string) => `/articles/${slug(articleSlug)}/comments`,
  },
  comments: {
    delete: (commentId: string) => `/comments/${id(commentId)}`,
  },
  events: {
    list: '/events',
    summary: '/events/summary',
    featured: '/events/featured',
    pastHighlights: '/events/past-highlights',
    detail: (eventId: string) => `/events/${id(eventId)}`,
    registrations: (eventId: string) => `/events/${id(eventId)}/registrations`,
    speakers: '/speakers',
    testimonials: '/testimonials',
  },
  eventRegistrations: {
    list: '/event-registrations',
    detail: (registrationId: string) => `/event-registrations/${id(registrationId)}`,
  },
  gallery: {
    list: '/gallery',
    detail: (itemId: string) => `/gallery/${id(itemId)}`,
  },
  members: {
    list: '/members',
    detail: (memberId: string) => `/members/${id(memberId)}`,
  },
  applicants: {
    list: '/lk1-applications',
    stats: '/lk1-applications/stats',
    detail: (applicantId: string) => `/lk1-applications/${id(applicantId)}`,
  },
  contactMessages: {
    create: '/contact-messages',
    list: '/contact-messages',
  },
  newsletter: {
    subscribe: '/newsletter/subscriptions',
  },
  site: {
    settings: '/site/settings',
    stats: '/site/stats',
    home: '/site/home',
    about: '/site/about',
    liveStreams: '/site/live-streams',
  },
  admin: {
    dashboard: '/admin/dashboard',
  },
  media: {
    upload: '/upload',
  },
} as const
