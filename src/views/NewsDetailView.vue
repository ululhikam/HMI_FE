<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useArticleStore } from '@/stores/articles'
import { useCommentStore } from '@/stores/comments'
import type { Article } from '@/types'

const route = useRoute()
const store = useArticleStore()
const commentStore = useCommentStore()

const article = ref<Article | null>(null)
const isLoading = ref(true)

const isLiked = ref(false)
const likesCount = computed(() => article.value?.likes ?? 0)
const showShareToast = ref(false)

const newCommentText = ref('')
const newCommentAuthor = ref('')

const slug = computed(() => String(route.params.slug ?? ''))

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatCommentDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initials(name?: string) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

async function loadArticle() {
  const requestedSlug = slug.value
  isLoading.value = true
  article.value = null
  isLiked.value = false

  const found = await store.fetchArticleBySlug(requestedSlug)
  // Abaikan respons lama bila pengguna sudah pindah artikel.
  if (slug.value !== requestedSlug) return

  if (!found) {
    isLoading.value = false
    return
  }

  article.value = found
  isLoading.value = false
  void store.recordView(requestedSlug)
  void commentStore.fetchForArticle(requestedSlug, true)
}

async function toggleLike() {
  if (!article.value) return
  const result = isLiked.value
    ? await store.unlike(article.value.slug)
    : await store.like(article.value.slug)
  if (result) isLiked.value = result.liked
}

function toggleBookmark() {
  if (article.value) void store.toggleBookmark(article.value.slug)
}

async function handleAddComment() {
  if (!newCommentText.value.trim() || !newCommentAuthor.value.trim()) return
  const created = await commentStore.add(slug.value, {
    author: newCommentAuthor.value.trim(),
    text: newCommentText.value.trim(),
  })
  if (created) {
    newCommentText.value = ''
    newCommentAuthor.value = ''
  }
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
  showShareToast.value = true
  setTimeout(() => {
    showShareToast.value = false
  }, 2500)
}

watch(slug, loadArticle, { immediate: true })

const relatedArticles = computed(() =>
  store.articles
    .filter((a) => a.status === 'published' && a.id !== article.value?.id)
    .slice(0, 3),
)
</script>

<template>
  <div class="pt-[67px] bg-[#F7F7F5] min-h-screen text-[#111212]">
    <!-- Toast Notification -->
    <div
      v-if="showShareToast"
      class="fixed bottom-6 right-6 z-50 bg-[#111212] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-[#009246] animate-bounce"
    >
      <svg class="w-4 h-4 text-[#009246]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
      <span>Tautan berita berhasil disalin ke clipboard!</span>
    </div>

    <div v-if="article">
      <!-- Top Breadcrumbs Bar -->
      <div class="bg-white border-b border-[#E6E6E6]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav class="flex items-center gap-2 text-xs text-[#4D4D4D] font-medium overflow-x-auto whitespace-nowrap">
            <RouterLink to="/" class="hover:text-[#009246] transition-colors">Beranda</RouterLink>
            <span>/</span>
            <RouterLink to="/berita" class="hover:text-[#009246] transition-colors">Berita</RouterLink>
            <span>/</span>
            <span class="text-[#009246] font-semibold">{{ article.category }}</span>
            <span>/</span>
            <span class="text-[#111212] font-semibold truncate max-w-xs">{{ article.title }}</span>
          </nav>
        </div>
      </div>

      <!-- Main Article Container -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid lg:grid-cols-12 gap-10">
          
          <!-- Left Main Content Column (8 cols) -->
          <main class="lg:col-span-8 bg-white p-6 sm:p-10 rounded-3xl border border-[#E6E6E6] shadow-sm">
            <!-- Article Header Meta -->
            <div class="space-y-4 border-b border-[#E6E6E6] pb-6 mb-8">
              <div class="flex items-center gap-3">
                <span class="bg-[#009246] text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  {{ article.category }}
                </span>
                <span class="text-xs text-[#4D4D4D] font-medium flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-[#009246]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ article.readTime || '5 min read' }}
                </span>
              </div>

              <!-- Main Title -->
              <h1 class="text-2xl sm:text-4xl lg:text-5xl font-black text-[#111212] leading-tight tracking-tight">
                {{ article.title }}
              </h1>

              <!-- Subtitle Excerpt -->
              <p class="text-base sm:text-lg text-[#4D4D4D] leading-relaxed font-normal">
                {{ article.excerpt }}
              </p>

              <!-- Author & Publishing Meta Bar -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-full overflow-hidden border-2 border-[#009246] bg-[#009246]/10">
                    <img
                      v-if="article.authorAvatar"
                      :src="article.authorAvatar"
                      :alt="article.author"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="w-full h-full flex items-center justify-center text-sm font-black text-[#009246]">
                      {{ initials(article.author) }}
                    </span>
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5 font-bold text-sm text-[#111212]">
                      <span>{{ article.author }}</span>
                      <svg class="w-3.5 h-3.5 text-[#009246] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p class="text-xs text-[#4D4D4D]">{{ article.authorRole }} • {{ formatDate(article.publishedAt) }}</p>
                  </div>
                </div>

                <!-- Action Share Buttons -->
                <div class="flex items-center gap-2">
                  <button
                    @click="toggleLike"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all"
                    :class="isLiked ? 'bg-[#009246]/10 text-[#009246] border-[#009246]' : 'bg-[#F7F7F5] text-[#4D4D4D] border-[#E6E6E6] hover:bg-gray-100'"
                  >
                    <svg class="w-4 h-4" :fill="isLiked ? '#009246' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{{ likesCount }}</span>
                  </button>

                  <button
                    @click="toggleBookmark"
                    class="p-2 rounded-xl border text-xs transition-all"
                    :class="store.isBookmarked(article.slug) ? 'bg-[#009246]/10 text-[#009246] border-[#009246]' : 'bg-[#F7F7F5] text-[#4D4D4D] border-[#E6E6E6] hover:bg-gray-100'"
                  >
                    <svg class="w-4 h-4" :fill="store.isBookmarked(article.slug) ? '#009246' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>

                  <button @click="copyLink" class="p-2 rounded-xl bg-[#F7F7F5] border border-[#E6E6E6] hover:bg-gray-100 text-[#4D4D4D] text-xs font-bold flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-[#009246]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Bagikan</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Cover Image & Caption -->
            <div class="space-y-2 mb-8">
              <div class="relative rounded-2xl overflow-hidden shadow-lg aspect-video">
                <img :src="article.coverImage" :alt="article.title" class="w-full h-full object-cover" />
              </div>
              <p class="text-[11px] text-[#4D4D4D] italic text-center">Dokumentasi Rilis Berita HMI Insan Cita • Foto oleh Tim Redaksi Multimedia</p>
            </div>

            <!-- Main Article Body -->
            <div
              class="prose prose-lg max-w-none text-[#231F20] leading-relaxed prose-headings:font-black prose-headings:text-[#111212] prose-a:text-[#009246] prose-blockquote:border-[#009246] prose-blockquote:bg-[#009246]/5 prose-blockquote:rounded-r-2xl prose-blockquote:py-3 prose-blockquote:px-5"
              v-html="article.content"
            />

            <!-- Tags Section -->
            <div class="pt-8 mt-10 border-t border-[#E6E6E6] flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold text-[#111212]">Tag Terkait:</span>
                <span
                  v-for="tag in article.tags"
                  :key="tag"
                  class="text-xs text-[#009246] bg-[#009246]/10 px-3 py-1 rounded-full font-semibold border border-[#009246]/20"
                >
                  #{{ tag }}
                </span>
              </div>

              <div class="flex items-center gap-2 text-xs font-medium text-[#4D4D4D]">
                <span>Views: {{ article.views.toLocaleString() }} dibaca</span>
              </div>
            </div>

            <!-- Author Info Box -->
            <div class="bg-[#F7F7F5] p-6 rounded-2xl border border-[#E6E6E6] mt-8 flex items-start gap-4">
              <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-[#009246] shrink-0 bg-[#009246]/10">
                <img
                  v-if="article.authorAvatar"
                  :src="article.authorAvatar"
                  :alt="article.author"
                  class="w-full h-full object-cover"
                />
                <span v-else class="w-full h-full flex items-center justify-center text-lg font-black text-[#009246]">
                  {{ initials(article.author) }}
                </span>
              </div>
              <div class="space-y-1">
                <h4 class="text-sm font-extrabold text-[#111212]">Penulis: {{ article.author }}</h4>
                <p class="text-xs text-[#009246] font-semibold">{{ article.authorRole }}</p>
              </div>
            </div>

            <!-- Comments / Discussion Section -->
            <section class="mt-12 pt-8 border-t border-[#E6E6E6]">
              <h3 class="text-xl font-black text-[#111212] mb-6 flex items-center gap-2">
                <svg class="w-5 h-5 text-[#009246]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Discussions & Comments</span>
                <span class="text-xs bg-[#009246]/10 text-[#009246] px-2.5 py-0.5 rounded-full font-bold">{{ commentStore.comments.length }}</span>
              </h3>

              <!-- Submit Comment Form -->
              <form @submit.prevent="handleAddComment" class="bg-[#F7F7F5] p-5 rounded-2xl border border-[#E6E6E6] space-y-3 mb-8">
                <h4 class="text-xs font-bold text-[#111212]">Tuliskan Gagasan atau Tanggapan Anda:</h4>
                <input
                  v-model="newCommentAuthor"
                  type="text"
                  placeholder="Nama Lengkap Anda..."
                  class="w-full px-3.5 py-2 bg-white border border-[#E6E6E6] rounded-xl text-xs focus:outline-none focus:border-[#009246]"
                  required
                />
                <textarea
                  v-model="newCommentText"
                  rows="3"
                  placeholder="Tuliskan pandangan atau komentar Anda terkait artikel ini..."
                  class="w-full px-3.5 py-2.5 bg-white border border-[#E6E6E6] rounded-xl text-xs focus:outline-none focus:border-[#009246]"
                  required
                ></textarea>
                <button
                  type="submit"
                  :disabled="commentStore.isSubmitting"
                  class="px-5 py-2.5 bg-[#009246] hover:bg-[#006837] disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-colors shadow-md"
                >
                  {{ commentStore.isSubmitting ? 'Mengirim...' : 'Kirim Komentar' }}
                </button>
                <p v-if="commentStore.error" class="text-xs text-red-500">{{ commentStore.error }}</p>
              </form>

              <!-- Existing Comments List -->
              <div v-if="commentStore.isLoading" class="text-xs text-[#4D4D4D]">Memuat komentar...</div>
              <div v-else-if="commentStore.comments.length" class="space-y-4">
                <div
                  v-for="c in commentStore.comments"
                  :key="c.id"
                  class="p-4 bg-white rounded-2xl border border-[#E6E6E6] space-y-2"
                >
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full overflow-hidden bg-[#009246]/10">
                        <img
                          v-if="c.avatar"
                          :src="c.avatar"
                          :alt="c.author"
                          class="w-full h-full object-cover"
                        />
                        <span v-else class="w-full h-full flex items-center justify-center text-[9px] font-black text-[#009246]">
                          {{ initials(c.author) }}
                        </span>
                      </div>
                      <span class="font-bold text-[#111212]">{{ c.author }}</span>
                    </div>
                    <span class="text-[10px] text-[#4D4D4D]">{{ formatCommentDate(c.createdAt) }}</span>
                  </div>
                  <p class="text-xs text-[#4D4D4D] leading-relaxed pl-9">
                    {{ c.text }}
                  </p>
                </div>
              </div>
              <p v-else class="text-xs text-[#4D4D4D]">Belum ada komentar. Jadilah yang pertama berdiskusi.</p>
            </section>
          </main>

          <!-- Right Sidebar Column (4 cols) -->
          <aside class="lg:col-span-4 space-y-8">
            <!-- Sidebar Widget: Related Popular News -->
            <div class="bg-white p-5 rounded-3xl border border-[#E6E6E6] shadow-sm">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#111212] mb-4 border-b border-[#E6E6E6] pb-3 flex items-center gap-2">
                <span class="w-2.5 h-2.5 bg-[#009246] rounded-full"></span>
                Berita Terpopuler
              </h3>

              <div class="space-y-4">
                <RouterLink
                  v-for="item in store.trendingArticles.slice(0, 4)"
                  :key="item.id"
                  :to="`/berita/${item.slug}`"
                  class="group flex gap-3 items-center"
                >
                  <div class="w-20 h-16 shrink-0 rounded-xl overflow-hidden relative">
                    <img :src="item.coverImage" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div class="flex-1">
                    <h4 class="text-xs font-bold text-[#111212] group-hover:text-[#009246] transition-colors line-clamp-2 leading-snug">
                      {{ item.title }}
                    </h4>
                    <p class="text-[10px] text-[#4D4D4D] mt-1">{{ formatDate(item.publishedAt) }}</p>
                  </div>
                </RouterLink>
              </div>
            </div>

            <!-- Back to News List Button CTA -->
            <div class="bg-white p-6 rounded-3xl border border-[#E6E6E6] shadow-sm text-center space-y-3">
              <div class="w-10 h-10 rounded-full bg-[#009246]/10 text-[#009246] flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h4 class="text-sm font-extrabold text-[#111212]">Jelajahi Berita Lainnya</h4>
              <p class="text-xs text-[#4D4D4D]">Temukan laporan berita, pers rilis, dan ruang wacana terkini dari HMI Insan Cita.</p>
              <RouterLink to="/berita" class="inline-block w-full py-2.5 bg-[#009246] hover:bg-[#006837] text-white text-xs font-bold rounded-xl transition-colors">
                Lihat Seluruh Berita
              </RouterLink>
            </div>
          </aside>

        </div>

        <!-- Related Articles Bottom Grid -->
        <section v-if="relatedArticles.length" class="mt-16 pt-10 border-t border-[#E6E6E6]">
          <h3 class="text-2xl font-black text-[#111212] mb-6">Artikel & Berita Terkait</h3>
          <div class="grid sm:grid-cols-3 gap-6">
            <RouterLink
              v-for="rel in relatedArticles"
              :key="rel.id"
              :to="`/berita/${rel.slug}`"
              class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#E6E6E6]"
            >
              <div class="relative aspect-video overflow-hidden">
                <img :src="rel.coverImage" :alt="rel.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span class="absolute top-3 left-3 bg-[#009246] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {{ rel.category }}
                </span>
              </div>
              <div class="p-5">
                <p class="text-xs text-[#4D4D4D] mb-1.5">{{ formatDate(rel.publishedAt) }}</p>
                <h4 class="text-sm font-extrabold text-[#111212] group-hover:text-[#009246] transition-colors leading-snug line-clamp-2">
                  {{ rel.title }}
                </h4>
              </div>
            </RouterLink>
          </div>
        </section>

      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="min-h-[60vh] flex items-center justify-center p-4">
      <div class="text-center">
        <div class="w-10 h-10 border-4 border-[#009246]/20 border-t-[#009246] rounded-full animate-spin mx-auto mb-4" />
        <p class="text-sm text-[#4D4D4D] font-semibold">Memuat artikel...</p>
      </div>
    </div>

    <!-- 404 Article State -->
    <div v-else class="min-h-screen flex items-center justify-center p-4">
      <div class="text-center bg-white p-10 rounded-3xl border border-[#E6E6E6] shadow-xl max-w-md">
        <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 class="text-2xl font-black text-[#111212] mb-2">Artikel Tidak Ditemukan</h2>
        <p class="text-xs text-[#4D4D4D] mb-6">Artikel atau berita yang Anda cari mungkin telah dipindahkan atau dihapus.</p>
        <RouterLink to="/berita" class="inline-block px-6 py-3 bg-[#009246] text-white font-bold text-xs rounded-xl hover:bg-[#006837] transition-colors">
          Kembali ke Portal Berita
        </RouterLink>
      </div>
    </div>
  </div>
</template>
