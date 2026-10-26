<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useArticleStore } from '@/stores/articles'
import { useCommentStore } from '@/stores/comments'
import StarMark from '@/components/ui/StarMark.vue'
import type { Article } from '@/types'

const route = useRoute()
const store = useArticleStore()
const commentStore = useCommentStore()

const article = ref<Article | null>(null)
const isLoading = ref(true)

const isLiked = ref(false)
const isLiking = ref(false)
const isBookmarking = ref(false)
const likesCount = computed(() => article.value?.likes ?? 0)
const showShareToast = ref(false)
const toastMessage = ref('')
const readingProgress = ref(0)

const newCommentText = ref('')
const newCommentAuthor = ref('')

const slug = computed(() => String(route.params.slug ?? ''))
const shareUrl = computed(() => `${window.location.origin}/berita/${slug.value}`)

function formatDate(iso: string | null | undefined, status?: Article['status']) {
  if (!iso) return status === 'draft' ? 'Belum dipublikasikan' : 'Baru diterbitkan'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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
  window.scrollTo({ top: 0, behavior: 'smooth' })
  isLiked.value = store.isLiked(requestedSlug)
  void store.recordView(requestedSlug)
  void commentStore.fetchForArticle(requestedSlug, true)
}

function showToast(message: string) {
  toastMessage.value = message
  showShareToast.value = true
  setTimeout(() => {
    showShareToast.value = false
  }, 2500)
}

async function toggleLike() {
  if (!article.value || isLiking.value) return
  isLiking.value = true
  const result = isLiked.value
    ? await store.unlike(article.value.slug)
    : await store.like(article.value.slug)
  if (result) {
    isLiked.value = result.liked
    article.value.likes = result.likes
  } else if (store.error) {
    showToast(store.error)
  }
  isLiking.value = false
}

async function toggleBookmark() {
  if (!article.value || isBookmarking.value) return
  isBookmarking.value = true
  const saved = await store.toggleBookmark(article.value.slug)
  if (store.error) {
    showToast(store.error)
  } else {
    showToast(saved ? 'Berita disimpan di perangkat ini.' : 'Berita dihapus dari simpanan.')
  }
  isBookmarking.value = false
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

async function copyLink() {
  let copied = false
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl.value)
      copied = true
    }
  } catch {
    copied = false
  }

  if (!copied) {
    try {
      const input = document.createElement('textarea')
      input.value = shareUrl.value
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      copied = document.execCommand('copy')
      document.body.removeChild(input)
    } catch {
      copied = false
    }
  }

  showToast(
    copied
      ? 'Tautan berita berhasil disalin.'
      : 'Tautan tidak dapat disalin otomatis. Salin dari bilah alamat browser.',
  )
}

function updateReadingProgress() {
  const scrollTop = window.scrollY
  const height = document.documentElement.scrollHeight - window.innerHeight
  readingProgress.value = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0
}

watch(slug, loadArticle, { immediate: true })

onMounted(() => {
  // Muat feed publik agar sidebar populer dan berita terkait tetap tersedia saat halaman dibuka langsung.
  void store.fetchPublished()
  window.addEventListener('scroll', updateReadingProgress, { passive: true })
  updateReadingProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateReadingProgress)
})

const relatedArticles = computed(() => {
  const current = article.value
  return store.publishedArticles
    .filter((item) => item.id !== current?.id)
    .sort((a, b) => {
      const sameCategoryA = current && a.category === current.category ? 1 : 0
      const sameCategoryB = current && b.category === current.category ? 1 : 0
      if (sameCategoryA !== sameCategoryB) return sameCategoryB - sameCategoryA
      return new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
    })
    .slice(0, 3)
})

const shareLinks = computed(() => {
  const url = encodeURIComponent(shareUrl.value)
  const title = encodeURIComponent(article.value?.title ?? '')
  return [
    { label: 'WhatsApp', href: `https://wa.me/?text=${title}%20${url}` },
    { label: 'Telegram', href: `https://t.me/share/url?url=${url}&text=${title}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${url}&text=${title}` },
  ]
})
</script>

<template>
  <div class="screen-min bg-paper text-ink">
    <!-- Reading progress -->
    <div
      v-if="article"
      class="fixed left-0 top-0 z-[60] h-[3px] bg-lime transition-[width] duration-150"
      :style="{ width: `${readingProgress}%` }"
      aria-hidden="true"
    />

    <!-- Share toast -->
    <Transition name="toast">
      <div
        v-if="showShareToast"
        class="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-bold text-white shadow-2xl"
      >
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-white">
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        {{ toastMessage || 'Tautan berita berhasil disalin.' }}
      </div>
    </Transition>

    <template v-if="article">
      <!-- Article hero -->
      <section class="relative overflow-hidden bg-ink pb-[clamp(5rem,10svh,8rem)] pt-[clamp(0.75rem,1.5svh,1.25rem)] text-paper">
        <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
        <div class="pointer-events-none absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-moss/20 blur-[130px]" />

        <div class="container-wide relative z-10">
          <nav class="hide-scrollbar flex items-center gap-2 overflow-x-auto py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/60" aria-label="Breadcrumb">
            <RouterLink to="/" class="flex-shrink-0 transition-colors hover:text-lime-soft">Beranda</RouterLink>
            <span class="text-white/20">/</span>
            <RouterLink to="/berita" class="flex-shrink-0 transition-colors hover:text-lime-soft">Berita</RouterLink>
            <span class="text-white/20">/</span>
            <RouterLink
              :to="{ name: 'news', query: { category: article.category } }"
              class="flex-shrink-0 text-lime-soft transition-colors hover:text-white"
            >
              {{ article.category }}
            </RouterLink>
            <span class="text-white/20">/</span>
            <span class="max-w-[26rem] truncate text-white/60">{{ article.title }}</span>
          </nav>

          <div class="mt-[clamp(1.5rem,3.5svh,2.5rem)] max-w-5xl">
            <div class="flex flex-wrap items-center gap-2">
              <RouterLink
                :to="{ name: 'news', query: { category: article.category } }"
                class="rounded-full bg-lime px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-lime-bright"
              >
                {{ article.category }}
              </RouterLink>
              <span v-if="article.readTime" class="rounded-full border border-white/15 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-white/65">{{ article.readTime }}</span>
              <span class="rounded-full border border-white/15 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-white/65">{{ article.views.toLocaleString('id-ID') }} dibaca</span>
            </div>

            <h1 class="hero-title mt-5 max-w-5xl text-balance text-white">{{ article.title }}</h1>
            <p v-if="article.excerpt" class="hero-copy-gap max-w-3xl text-sm font-medium leading-relaxed text-white/55 sm:text-base">
              {{ article.excerpt }}
            </p>

            <div class="mt-8 flex flex-col justify-between gap-5 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
              <div class="flex items-center gap-3">
                <span class="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5 text-xs font-black text-lime-soft">
                  <img v-if="article.authorAvatar" :src="article.authorAvatar" :alt="article.author" class="h-full w-full object-cover" />
                  <span v-else>{{ initials(article.author) }}</span>
                </span>
                <div>
                  <p class="flex items-center gap-1.5 text-xs font-extrabold text-white/85">
                    {{ article.author }}
                    <svg class="h-3 w-3 text-lime-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </p>
                  <p class="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/60">
                    {{ article.authorRole || 'Tim Redaksi' }} · {{ formatDate(article.publishedAt, article.status) }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="flex h-9 items-center gap-2 rounded-full border px-3.5 text-[9px] font-extrabold uppercase tracking-[0.1em] transition-all disabled:opacity-60"
                  :class="isLiked ? 'border-lime bg-lime text-white' : 'border-white/15 text-white/55 hover:border-lime-soft hover:text-lime-soft'"
                  :aria-pressed="isLiked"
                  :disabled="isLiking"
                  @click="toggleLike"
                >
                  <svg class="h-3.5 w-3.5" :fill="isLiked ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9">
                    <path d="M4.3 6.3a4.5 4.5 0 000 6.4L12 20.4l7.7-7.7a4.5 4.5 0 00-6.4-6.4L12 7.6l-1.3-1.3a4.5 4.5 0 00-6.4 0z" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  {{ likesCount }} suka
                </button>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full border transition-all disabled:opacity-60"
                  :class="store.isBookmarked(article.slug) ? 'border-lime bg-lime text-white' : 'border-white/15 text-white/55 hover:border-lime-soft hover:text-lime-soft'"
                  :aria-label="store.isBookmarked(article.slug) ? 'Hapus simpanan' : 'Simpan berita'"
                  :disabled="isBookmarking"
                  @click="toggleBookmark"
                >
                  <svg class="h-3.5 w-3.5" :fill="store.isBookmarked(article.slug) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.9">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="flex h-9 items-center gap-2 rounded-full border border-white/15 px-3.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white/55 transition-all hover:border-lime-soft hover:text-lime-soft"
                  @click="copyLink"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                    <path d="M8.7 13.3a3 3 0 010-2.7m0 2.7l6.6 3.3m-6.6-6l6.6-3.3m0 0a3 3 0 105.4-2.7 3 3 0 00-5.4 2.7zm0 9.3a3 3 0 105.4 2.7 3 3 0 00-5.4-2.7z" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  Salin tautan
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Content -->
      <div class="container-wide relative z-10 -mt-20 pb-14 sm:pb-20">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <!-- Main article -->
          <article class="overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-soft">
            <div v-if="article.coverImage" class="relative aspect-[16/9] overflow-hidden bg-paper-deep">
              <img :src="article.coverImage" :alt="article.title" class="h-full w-full object-cover" />
            </div>
            <div v-else class="relative flex aspect-[16/7] items-center justify-center overflow-hidden bg-ink">
              <div class="absolute inset-0 bg-grid-dark opacity-60" />
              <StarMark :size="64" class="relative text-lime-soft/80" />
            </div>

            <div class="p-5 sm:p-8 lg:p-10">
              <div class="article-body" v-html="article.content" />

              <div class="mt-10 flex flex-col justify-between gap-4 border-t border-line pt-5 sm:flex-row sm:items-center">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-[9px] font-black uppercase tracking-[0.12em] text-muted">Tag</span>
                  <RouterLink
                    v-for="tag in article.tags"
                    :key="tag"
                    :to="{ name: 'news', query: { q: tag } }"
                    class="rounded-full border border-line bg-paper px-2.5 py-1 text-[9px] font-bold text-ink/60 transition-colors hover:border-ink hover:bg-ink hover:text-lime-soft"
                  >
                    #{{ tag }}
                  </RouterLink>
                </div>
                <span class="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">{{ article.views.toLocaleString('id-ID') }} kali dibaca</span>
              </div>

              <!-- Author box -->
              <div class="mt-8 flex flex-col gap-4 rounded-[1.4rem] bg-paper p-5 sm:flex-row sm:items-center">
                <span class="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-lime bg-white text-sm font-black text-moss">
                  <img v-if="article.authorAvatar" :src="article.authorAvatar" :alt="article.author" class="h-full w-full object-cover" />
                  <span v-else>{{ initials(article.author) }}</span>
                </span>
                <div class="flex-1">
                  <p class="text-[8px] font-black uppercase tracking-[0.16em] text-muted">Ditulis oleh</p>
                  <h3 class="mt-1 font-display text-lg font-semibold tracking-tight text-ink">{{ article.author }}</h3>
                  <p class="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-moss">{{ article.authorRole || 'Tim Redaksi' }}</p>
                </div>
                <button type="button" class="btn btn-outline-dark self-start sm:self-auto" @click="copyLink">Bagikan</button>
              </div>

              <!-- Comments -->
              <section class="mt-10 border-t border-line pt-8">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <span class="eyebrow">Ruang diskusi</span>
                    <h2 class="display-md mt-3 text-2xl">Tanggapan<span class="text-moss">.</span></h2>
                  </div>
                  <span class="rounded-full bg-paper px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-muted">
                    {{ commentStore.comments.length }} komentar
                  </span>
                </div>

                <form class="mt-6 space-y-2.5 rounded-[1.4rem] border border-line bg-paper p-4 sm:p-5" @submit.prevent="handleAddComment">
                  <input
                    v-model="newCommentAuthor"
                    type="text"
                    placeholder="Nama lengkap"
                    class="field"
                    required
                  />
                  <textarea
                    v-model="newCommentText"
                    rows="3"
                    placeholder="Tuliskan pandangan atau tanggapan Anda..."
                    class="field resize-none"
                    required
                  />
                  <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <p class="text-[9px] font-semibold text-muted">Bersikaplah sopan dan relevan dengan topik.</p>
                    <button type="submit" :disabled="commentStore.isSubmitting" class="btn btn-ink disabled:opacity-60">
                      {{ commentStore.isSubmitting ? 'Mengirim...' : 'Kirim komentar' }}
                    </button>
                  </div>
                  <p v-if="commentStore.error" class="text-[10px] font-semibold text-red-600">{{ commentStore.error }}</p>
                </form>

                <p v-if="commentStore.isLoading" class="mt-5 text-xs font-semibold text-muted">Memuat komentar...</p>
                <div v-else-if="commentStore.comments.length" class="mt-5 space-y-3">
                  <div v-for="comment in commentStore.comments" :key="comment.id" class="rounded-[1.2rem] border border-line bg-white p-4">
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2.5">
                        <span class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-paper text-[9px] font-black text-moss">
                          <img v-if="comment.avatar" :src="comment.avatar" :alt="comment.author" class="h-full w-full object-cover" />
                          <span v-else>{{ initials(comment.author) }}</span>
                        </span>
                        <div>
                          <p class="text-[10px] font-extrabold text-ink">{{ comment.author }}</p>
                          <p class="mt-0.5 text-[8px] font-semibold text-muted">{{ formatCommentDate(comment.createdAt) }}</p>
                        </div>
                      </div>
                    </div>
                    <p class="mt-3 text-xs font-medium leading-relaxed text-ink/65">{{ comment.text }}</p>
                  </div>
                </div>
                <p v-else class="mt-5 rounded-[1.2rem] border border-dashed border-line p-5 text-center text-xs font-semibold text-muted">
                  Belum ada komentar. Jadilah yang pertama berdiskusi.
                </p>
              </section>
            </div>
          </article>

          <!-- Sidebar -->
          <aside class="space-y-4 lg:sticky lg:top-[calc(var(--nav-offset)+clamp(1rem,2svh,2rem))]">
            <div class="rounded-[1.4rem] border border-line bg-white p-5">
              <div class="flex items-center justify-between border-b border-line pb-3">
                <h3 class="text-[9px] font-black uppercase tracking-[0.14em] text-ink">Paling dibaca</h3>
                <span class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">Top 4</span>
              </div>
              <div v-if="store.trendingArticles.length" class="mt-4 space-y-4">
                <RouterLink
                  v-for="(item, index) in store.trendingArticles.slice(0, 4)"
                  :key="item.id"
                  :to="`/berita/${item.slug}`"
                  class="group flex items-start gap-3"
                >
                  <span class="w-6 flex-shrink-0 font-display text-2xl font-bold leading-none text-paper-deep transition-colors group-hover:text-moss">0{{ index + 1 }}</span>
                  <div class="min-w-0">
                    <h4 class="line-clamp-2 text-xs font-bold leading-snug text-ink transition-colors group-hover:text-moss">{{ item.title }}</h4>
                    <p class="mt-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-muted">{{ item.category }} · {{ item.views.toLocaleString('id-ID') }} dibaca</p>
                  </div>
                </RouterLink>
              </div>
              <p v-else class="mt-4 text-[11px] font-semibold text-muted">Belum ada berita populer.</p>
            </div>

            <div class="rounded-[1.4rem] border border-line bg-white p-5">
              <h3 class="text-[9px] font-black uppercase tracking-[0.14em] text-ink">Bagikan berita</h3>
              <div class="mt-3 grid grid-cols-2 gap-2">
                <a
                  v-for="link in shareLinks"
                  :key="link.label"
                  :href="link.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rounded-full border border-line px-3 py-2 text-center text-[8px] font-black uppercase tracking-[0.1em] text-ink/55 transition-colors hover:border-ink hover:bg-ink hover:text-lime-soft"
                >
                  {{ link.label }}
                </a>
              </div>
              <button
                type="button"
                class="mt-2 w-full rounded-full bg-lime px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-lime-bright"
                @click="copyLink"
              >
                Salin tautan
              </button>
            </div>

            <div class="relative overflow-hidden rounded-[1.4rem] bg-ink p-5 text-paper">
              <div class="absolute inset-0 bg-grid-dark opacity-50" />
              <div class="relative">
                <StarMark :size="26" class="text-lime-soft" />
                <h3 class="mt-4 font-display text-lg font-semibold leading-tight tracking-tight text-white">Jelajahi berita lainnya</h3>
                <p class="mt-2 text-[11px] font-medium leading-relaxed text-white/60">
                  Laporan, opini, dan rilis pers terbaru dari HMI Insan Cita.
                </p>
                <RouterLink to="/berita" class="btn btn-lime mt-4 w-full text-[9px]">
                  Buka portal berita
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </RouterLink>
              </div>
            </div>
          </aside>
        </div>

        <!-- Related -->
        <section v-if="relatedArticles.length" class="mt-14 border-t border-line pt-10">
          <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span class="eyebrow">Bacaan lanjutan</span>
              <h2 class="display-md mt-3">Berita terkait<span class="text-moss">.</span></h2>
            </div>
            <RouterLink to="/berita" class="link-arrow text-ink">
              Semua berita
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </RouterLink>
          </div>
          <div class="mt-6 grid gap-3 sm:grid-cols-3">
            <RouterLink
              v-for="item in relatedArticles"
              :key="item.id"
              :to="`/berita/${item.slug}`"
              class="group overflow-hidden rounded-[1.4rem] border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-ink/30 hover:shadow-soft"
            >
              <div class="relative aspect-[16/10] overflow-hidden bg-forest">
                <img v-if="item.coverImage" :src="item.coverImage" :alt="item.title" class="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
                <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest to-ink">
                  <StarMark :size="32" class="text-lime-soft/70" />
                </div>
                <span class="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-ink backdrop-blur">{{ item.category }}</span>
              </div>
              <div class="p-4">
                <p class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{{ formatDate(item.publishedAt, item.status) }}</p>
                <h3 class="mt-2 line-clamp-2 font-display text-base font-semibold leading-snug tracking-tight text-ink group-hover:text-moss">{{ item.title }}</h3>
              </div>
            </RouterLink>
          </div>
        </section>
      </div>
    </template>

    <!-- Loading -->
    <div v-else-if="isLoading" class="screen-70 flex items-center justify-center bg-ink px-4">
      <div class="text-center">
        <span class="mx-auto flex h-12 w-12 items-center justify-center">
          <span class="h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-lime-soft" />
        </span>
        <p class="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-white/60">Memuat berita...</p>
      </div>
    </div>

    <!-- Not found -->
    <div v-else class="screen-75 relative flex items-center justify-center overflow-hidden bg-ink px-4 py-16 text-paper">
      <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
      <div class="relative max-w-md text-center">
        <StarMark :size="42" class="mx-auto animate-spin-slow text-lime-soft" />
        <p class="mt-8 font-display text-7xl font-bold leading-none tracking-tight text-lime-soft">404</p>
        <h1 class="mt-4 font-display text-2xl font-semibold tracking-tight text-white">Berita tidak ditemukan<span class="text-lime-soft">.</span></h1>
        <p class="mt-3 text-sm font-medium leading-relaxed text-white/60">
          Berita yang Anda cari mungkin telah dipindahkan atau dihapus.
        </p>
        <RouterLink to="/berita" class="btn btn-lime mt-7">
          Kembali ke portal berita
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 200ms ease, transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
