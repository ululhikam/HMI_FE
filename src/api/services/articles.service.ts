import { endpoints } from '@/api/endpoints'
import { http } from '@/api/http'
import type { Paginated, QueryParams } from '@/api/types'
import type {
  Article,
  ArticleInput,
  ArticleStatus,
  Comment,
  CommentInput,
} from '@/types'

export interface ArticleListQuery {
  page?: number
  perPage?: number
  category?: string
  tag?: string
  search?: string
  status?: ArticleStatus | 'all'
  sort?: 'latest' | 'popular'
  featured?: boolean
}

function toQuery(query: ArticleListQuery): QueryParams {
  return {
    page: query.page,
    perPage: query.perPage,
    category: query.category,
    tag: query.tag,
    search: query.search,
    status: query.status,
    sort: query.sort,
    featured: query.featured,
  }
}

export const articlesService = {
  list(query: ArticleListQuery = {}): Promise<Paginated<Article>> {
    return http.paginated<Article>(endpoints.articles.list, toQuery(query))
  },

  getBySlug(slug: string): Promise<Article> {
    return http.get<Article>(endpoints.articles.detail(slug))
  },

  create(input: ArticleInput): Promise<Article> {
    return http.post<Article>(endpoints.articles.list, input)
  },

  update(id: string, input: Partial<ArticleInput>): Promise<Article> {
    return http.patch<Article>(endpoints.articles.byId(id), input)
  },

  remove(id: string): Promise<{ message: string }> {
    return http.delete<{ message: string }>(endpoints.articles.byId(id))
  },

  recordView(slug: string): Promise<{ views: number }> {
    return http.post<{ views: number }>(endpoints.articles.views(slug))
  },

  like(slug: string): Promise<{ likes: number; liked: boolean }> {
    return http.post<{ likes: number; liked: boolean }>(endpoints.articles.like(slug))
  },

  unlike(slug: string): Promise<{ likes: number; liked: boolean }> {
    return http.delete<{ likes: number; liked: boolean }>(endpoints.articles.like(slug))
  },

  bookmark(slug: string): Promise<{ bookmarked: boolean }> {
    return http.post<{ bookmarked: boolean }>(endpoints.articles.bookmark(slug))
  },

  unbookmark(slug: string): Promise<{ bookmarked: boolean }> {
    return http.delete<{ bookmarked: boolean }>(endpoints.articles.bookmark(slug))
  },
}

export const commentsService = {
  list(slug: string, page = 1, perPage = 50): Promise<Paginated<Comment>> {
    return http.paginated<Comment>(endpoints.articles.comments(slug), { page, perPage })
  },

  create(slug: string, input: CommentInput): Promise<Comment> {
    return http.post<Comment>(endpoints.articles.comments(slug), input)
  },

  remove(id: string): Promise<{ message: string }> {
    return http.delete<{ message: string }>(endpoints.comments.delete(id))
  },
}
