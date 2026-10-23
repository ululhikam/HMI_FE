import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type { NewsletterSubscription } from '@/types'

export interface NewsletterSubscribeInput {
  email: string
  source?: string
}

export const newsletterService = {
  subscribe(input: NewsletterSubscribeInput): Promise<NewsletterSubscription> {
    return http.post<NewsletterSubscription>(endpoints.newsletter.subscribe, input)
  },
}
