import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type {
  AboutPageContent,
  HomePageContent,
  OrgStats,
  SiteSettings,
  StreamingItem,
} from '@/types'

export const siteService = {
  getSettings(): Promise<SiteSettings> {
    return http.get<SiteSettings>(endpoints.site.settings)
  },

  getStats(): Promise<OrgStats> {
    return http.get<OrgStats>(endpoints.site.stats)
  },

  getHome(): Promise<HomePageContent> {
    return http.get<HomePageContent>(endpoints.site.home)
  },

  getAbout(): Promise<AboutPageContent> {
    return http.get<AboutPageContent>(endpoints.site.about)
  },

  getLiveStreams(): Promise<StreamingItem[]> {
    return http.get<StreamingItem[]>(endpoints.site.liveStreams)
  },
}
