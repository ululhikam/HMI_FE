import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { articlesService } from '@/api/services'
import { getErrorMessage } from '@/api/errors'
import type { Article, ArticleCategory, ArticleInput } from '@/types'

export const useArticleStore = defineStore('articles', () => {
  const articles = ref<Article[]>([])
  const selectedCategory = ref<string>('Semua')
  const searchQuery = ref('')
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')
  const bookmarkedSlugs = ref<string[]>([])

  let publishedLoaded = false
  let allLoaded = false

  const categories: Array<'Semua' | ArticleCategory> = [
    'Semua',
    'Kegiatan',
    'Opini',
    'Press Release',
    'Pengumuman',
  ]

  const publishedArticles = computed(() => articles.value.filter((article) => article.status === 'published'))

  const filteredArticles = computed(() => {
    let result = publishedArticles.value
    if (selectedCategory.value !== 'Semua') {
      result = result.filter((article) => article.category === selectedCategory.value)
    }
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.excerpt.toLowerCase().includes(query) ||
          article.author.toLowerCase().includes(query) ||
          article.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }
    return result
  })

  // Hero Main Article (Top Story)
  const heroArticle = computed(
    () => publishedArticles.value[0] ?? null,
  )


  // 4 Featured side stories
  const featuredSideArticles = computed(() =>
    publishedArticles.value.filter((article) => article.id !== heroArticle.value?.id).slice(0, 4),
  )

  // Top Stories / Video Cards
  const topStories = computed(() =>
    publishedArticles.value.filter((article) => article.isVideo || article.views > 2500).slice(0, 5),
  )

  // Trending / Most Read
  const trendingArticles = computed(() =>
    [...publishedArticles.value].sort((a, b) => b.views - a.views).slice(0, 5),
  )

  const latestArticles = computed(() =>
    [...publishedArticles.value]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 6),
  )

  function getBySlug(slug: string): Article | null {
    return articles.value.find((article) => article.slug === slug) ?? null
  }

  /** Muat artikel publik (dipakai halaman beranda, berita, agenda). */
  async function fetchPublished(force = false) {
    if (publishedLoaded && !force) return
    isLoading.value = true
    error.value = ''
    try {
      const page = await articlesService.list({ status: 'published', perPage: 100, sort: 'latest' })
      articles.value = page.items
      publishedLoaded = true
      allLoaded = false
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat berita.')
    } finally {
      isLoading.value = false
    }
  }

  /** Muat seluruh artikel termasuk draft (khusus admin). */
  async function fetchAll(force = false) {
    if (allLoaded && !force) return
    isLoading.value = true
    error.value = ''
    try {
      const page = await articlesService.list({ status: 'all', perPage: 100, sort: 'latest' })
      articles.value = page.items
      allLoaded = true
      publishedLoaded = false
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat artikel.')
    } finally {
      isLoading.value = false
    }
  }

  /** Ambil detail artikel berdasarkan slug dan simpan ke cache store. */
  async function fetchArticleBySlug(slug: string): Promise<Article | null> {
    const cached = getBySlug(slug)
    if (cached) return cached

    isLoading.value = true
    error.value = ''
    try {
      const article = await articlesService.getBySlug(slug)
      if (!articles.value.some((item) => item.id === article.id)) articles.value.push(article)
      return article
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat artikel.')
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function recordView(slug: string) {
    try {
      const result = await articlesService.recordView(slug)
      const article = getBySlug(slug)
      if (article) article.views = result.views
    } catch {
      // View counter bersifat non-kritis; kegagalan tidak mengganggu halaman.
    }
  }

  async function like(slug: string): Promise<{ likes: number; liked: boolean } | null> {
    try {
      const result = await articlesService.like(slug)
      const article = getBySlug(slug)
      if (article) article.likes = result.likes
      return result
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menyukai artikel.')
      return null
    }
  }

  async function unlike(slug: string): Promise<{ likes: number; liked: boolean } | null> {
    try {
      const result = await articlesService.unlike(slug)
      const article = getBySlug(slug)
      if (article) article.likes = result.likes
      return result
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal membatalkan suka.')
      return null
    }
  }

  function isBookmarked(slug: string): boolean {
    return bookmarkedSlugs.value.includes(slug)
  }

  /** Toggle bookmark artikel; status disimpan di store untuk sesi berjalan. */
  async function toggleBookmark(slug: string): Promise<boolean> {
    const currentlyBookmarked = isBookmarked(slug)
    try {
      if (currentlyBookmarked) {
        await articlesService.unbookmark(slug)
        bookmarkedSlugs.value = bookmarkedSlugs.value.filter((item) => item !== slug)
        return false
      }
      await articlesService.bookmark(slug)
      if (!bookmarkedSlugs.value.includes(slug)) bookmarkedSlugs.value.push(slug)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memperbarui bookmark.')
      return currentlyBookmarked
    }
  }

  async function createArticle(input: ArticleInput): Promise<Article | null> {
    isSaving.value = true
    error.value = ''
    try {
      const article = await articlesService.create(input)
      articles.value.unshift(article)
      allLoaded = true
      return article
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menyimpan artikel.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function updateArticle(id: string, input: Partial<ArticleInput>): Promise<Article | null> {
    isSaving.value = true
    error.value = ''
    try {
      const updated = await articlesService.update(id, input)
      const index = articles.value.findIndex((article) => article.id === id)
      if (index !== -1) articles.value[index] = updated
      return updated
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memperbarui artikel.')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function deleteArticle(id: string): Promise<boolean> {
    isSaving.value = true
    error.value = ''
    try {
      await articlesService.remove(id)
      articles.value = articles.value.filter((article) => article.id !== id)
      return true
    } catch (err) {
      error.value = getErrorMessage(err, 'Gagal menghapus artikel.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  function resetFilters() {
    selectedCategory.value = 'Semua'
    searchQuery.value = ''
  }

  return {
    articles,
    selectedCategory,
    searchQuery,
    isLoading,
    isSaving,
    error,
    bookmarkedSlugs,
    categories,
    filteredArticles,
    heroArticle,
    featuredSideArticles,
    topStories,
    trendingArticles,
    latestArticles,
    getBySlug,
    fetchPublished,
    fetchAll,
    fetchArticleBySlug,
    recordView,
    like,
    unlike,
    isBookmarked,
    toggleBookmark,
    createArticle,
    updateArticle,
    deleteArticle,
    resetFilters,
  }
})
