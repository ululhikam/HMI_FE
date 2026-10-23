import { defineStore } from 'pinia'
import { ref } from 'vue'
import { siteService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import type {
  AboutPageContent,
  HomePageContent,
  OrgStats,
  SiteSettings,
  StreamingItem,
} from '@/types'

const emptySettings: SiteSettings = {
  organizationName: '',
  organizationShortName: '',
  chapterName: '',
  tagline: '',
  description: '',
  logoUrl: '/logo-komisariat.jpg',
  secondaryLogoUrl: '/logo-hmi.jpg',
  address: '',
  phone: '',
  email: '',
  website: '',
  socials: [],
}

const emptyHome: HomePageContent = {
  hero: {
    backgroundImage: '',
    eyebrow: '',
    title: '',
    tagline: '',
    description: '',
  },
  about: {
    imageUrl: '',
    badge: '',
    sectionLabel: '',
    title: '',
    highlight: '',
    paragraphs: [],
  },
  vision: { quote: '', description: '', photos: [] },
  mission: { intro: '', pillars: [] },
  activities: [],
  committees: [],
  galleryPreview: [],
}

const emptyAbout: AboutPageContent = {
  hero: { badge: '', title: '', highlight: '', description: '' },
  history: {
    heading: '',
    paragraphs: [],
    quote: '',
    imageUrl: '',
    sinceBadge: '',
  },
  timeline: [],
  ndp: {
    title: '',
    description: '',
    points: [],
    quote: '',
    quoteAuthor: '',
  },
}

export const useSiteStore = defineStore('site', () => {
  const settings = ref<SiteSettings>({ ...emptySettings })
  const stats = ref<OrgStats | null>(null)
  const home = ref<HomePageContent>(emptyHome)
  const about = ref<AboutPageContent>(emptyAbout)
  const liveStreams = ref<StreamingItem[]>([])
  const isLoading = ref(false)
  const error = ref('')

  let settingsLoaded = false
  let homeLoaded = false
  let aboutLoaded = false
  let streamsLoaded = false

  async function fetchSettings(force = false) {
    if (settingsLoaded && !force) return
    try {
      settings.value = await siteService.getSettings()
      settingsLoaded = true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat pengaturan situs.')
    }
  }

  async function fetchStats(force = false) {
    if (stats.value && !force) return
    try {
      stats.value = await siteService.getStats()
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat statistik organisasi.')
    }
  }

  async function fetchHome(force = false) {
    if (homeLoaded && !force) return
    isLoading.value = true
    error.value = ''
    try {
      home.value = await siteService.getHome()
      homeLoaded = true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat konten beranda.')
    } finally {
      isLoading.value = false
    }
    void fetchStats()
  }

  async function fetchAbout(force = false) {
    if (aboutLoaded && !force) return
    isLoading.value = true
    error.value = ''
    try {
      about.value = await siteService.getAbout()
      aboutLoaded = true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat konten tentang HMI.')
    } finally {
      isLoading.value = false
    }
    void fetchStats()
  }

  async function fetchLiveStreams(force = false) {
    if (streamsLoaded && !force) return
    try {
      liveStreams.value = await siteService.getLiveStreams()
      streamsLoaded = true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat jadwal streaming.')
    }
  }

  return {
    settings,
    stats,
    home,
    about,
    liveStreams,
    isLoading,
    error,
    fetchSettings,
    fetchStats,
    fetchHome,
    fetchAbout,
    fetchLiveStreams,
  }
})
