<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/articles'
import { useAuthStore } from '@/stores/auth'
import type { ArticleCategory, ArticleStatus } from '@/types'
import ImageUploadField from '@/components/common/ImageUploadField.vue'
import TiptapEditor from '@/components/common/TiptapEditor.vue'

const router = useRouter()
const route = useRoute()
const store = useArticleStore()
const auth = useAuthStore()

const articleId = computed(() => route.params.id as string | undefined)
const isEditing = computed(() => Boolean(articleId.value))

const categories: ArticleCategory[] = ['Kegiatan', 'Opini', 'Press Release', 'Pengumuman']
const statusOptions: Array<{ value: ArticleStatus; label: string }> = [
  { value: 'draft', label: 'Draf' },
  { value: 'published', label: 'Publik' },
]

function emptyForm() {
  return {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Kegiatan' as ArticleCategory,
    author: auth.currentUser?.name || 'Administrator',
    authorRole: 'Administrator',
    coverImage: '',
    tagsText: '',
    status: 'draft' as ArticleStatus,
    readTime: '',
  }
}

const form = reactive(emptyForm())
const formError = ref('')
const isLoading = ref(false)

const wordCount = computed(() => {
  const text = form.content.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
  return text.split(/\s+/).filter(Boolean).length
})

const characterCount = computed(() => form.content.replace(/<[^>]+>/g, '').length)

onMounted(async () => {
  await store.fetchAll()
  if (isEditing.value) {
    const article = store.articles.find((item) => item.id === articleId.value)
    if (article) {
      Object.assign(form, {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        author: article.author,
        authorRole: article.authorRole,
        coverImage: article.coverImage,
        tagsText: article.tags.join(', '),
        status: article.status,
        readTime: article.readTime ?? '',
      })
    } else {
      formError.value = 'Berita tidak ditemukan.'
    }
  }

  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

async function handleSave() {
  formError.value = ''
  if (!form.title.trim()) {
    formError.value = 'Judul berita wajib diisi.'
    return
  }

  isLoading.value = true
  const tags = form.tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  const input = {
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    excerpt: form.excerpt.trim(),
    content: form.content,
    category: form.category,
    author: form.author.trim() || auth.currentUser?.name || 'Administrator',
    authorRole: form.authorRole.trim() || 'Administrator',
    coverImage: form.coverImage.trim(),
    tags,
    status: form.status,
    readTime: form.readTime.trim() || undefined,
  }

  const result = isEditing.value
    ? await store.updateArticle(articleId.value!, input)
    : await store.createArticle(input)

  isLoading.value = false

  if (result) {
    router.push({ name: 'admin-articles' })
  } else {
    formError.value = store.error || 'Gagal menyimpan berita.'
  }
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    void handleSave()
  }
}

function goBack() {
  router.push({ name: 'admin-articles' })
}
</script>

<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div class="flex items-start gap-3">
        <button
          type="button"
          class="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line bg-white text-muted transition-colors hover:border-ink hover:text-ink"
          title="Kembali ke daftar berita"
          @click="goBack"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div>
          <span class="eyebrow eyebrow-ink">{{ isEditing ? 'Editor berita' : 'Berita baru' }}</span>
          <h1 class="display-md mt-4">{{ isEditing ? 'Edit berita' : 'Tulis berita' }}<span class="text-moss">.</span></h1>
          <p class="mt-2 text-xs font-semibold leading-relaxed text-muted">
            {{ isEditing ? 'Perbarui konten dan informasi publikasi berita.' : 'Susun konten baru untuk portal HMI Insan Cita.' }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-0.5 rounded-full border border-line bg-white p-1">
          <button
            v-for="option in statusOptions"
            :key="option.value"
            type="button"
            class="rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] transition-all"
            :class="form.status === option.value ? 'bg-ink text-lime-soft' : 'text-muted hover:text-ink'"
            @click="form.status = option.value"
          >
            {{ option.label }}
          </button>
        </div>
        <button
          type="button"
          :disabled="store.isSaving || isLoading"
          class="admin-btn admin-btn-lime"
          @click="handleSave"
        >
          <svg v-if="store.isSaving || isLoading" class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ store.isSaving || isLoading ? 'Menyimpan...' : 'Simpan berita' }}
        </button>
      </div>
    </div>

    <p v-if="formError" class="flex items-center gap-2 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
      <svg class="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" />
      </svg>
      {{ formError }}
    </p>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <!-- Main -->
      <div class="space-y-4">
        <section class="admin-card p-5 sm:p-6">
          <label class="admin-label" for="article-title">Judul berita <span class="text-red-500">*</span></label>
          <input
            id="article-title"
            v-model="form.title"
            type="text"
            placeholder="Tuliskan judul berita yang jelas dan menarik..."
            class="w-full border-0 bg-transparent p-0 font-display text-2xl font-bold leading-tight tracking-tight text-ink placeholder:text-muted focus:outline-none sm:text-3xl"
          />
          <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
            <span class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{{ form.title.length }} karakter</span>
            <span class="h-1 w-1 rounded-full bg-line" />
            <span class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{{ form.status === 'published' ? 'Akan tampil di portal' : 'Disimpan sebagai draf' }}</span>
          </div>
        </section>

        <section class="admin-card p-5">
          <label class="admin-label" for="article-excerpt">Ringkasan</label>
          <textarea
            id="article-excerpt"
            v-model="form.excerpt"
            rows="2"
            placeholder="Ringkasan singkat yang tampil di halaman daftar berita..."
            class="w-full resize-none border-0 bg-transparent p-0 text-sm font-medium leading-relaxed text-ink/70 placeholder:text-muted focus:outline-none"
          />
        </section>

        <section class="admin-card overflow-hidden">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
            <div>
              <p class="admin-label mb-0">Isi berita</p>
              <p class="mt-1 text-[8px] font-semibold text-muted">Gunakan editor untuk menyusun paragraf, daftar, dan kutipan.</p>
            </div>
            <div class="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.08em] text-muted">
              <span>{{ wordCount }} kata</span>
              <span class="h-1 w-1 rounded-full bg-line" />
              <span>{{ characterCount }} karakter</span>
            </div>
          </div>
          <TiptapEditor
            v-model="form.content"
            placeholder="Mulai menulis konten berita di sini..."
          />
        </section>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4 xl:sticky xl:top-[calc(var(--admin-bar-height)+1rem)]">
        <section class="admin-card p-4">
          <div class="flex items-center justify-between">
            <p class="admin-label mb-0">Publikasi</p>
            <span class="rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-[0.08em]" :class="form.status === 'published' ? 'bg-lime/30 text-forest' : 'bg-amber-50 text-amber-700'">
              {{ form.status === 'published' ? 'Publik' : 'Draf' }}
            </span>
          </div>
          <div class="mt-3 grid gap-3">
            <div>
              <label class="admin-label" for="article-category">Kategori</label>
              <select id="article-category" v-model="form.category" class="admin-input">
                <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
              </select>
            </div>
            <div>
              <label class="admin-label" for="article-slug">Slug URL</label>
              <input id="article-slug" v-model="form.slug" type="text" placeholder="otomatis dari judul" class="admin-input" />
            </div>
            <div>
              <label class="admin-label" for="article-read-time">Estimasi baca</label>
              <input id="article-read-time" v-model="form.readTime" type="text" placeholder="5 menit" class="admin-input" />
            </div>
          </div>
        </section>

        <section class="admin-card p-4">
          <ImageUploadField
            v-model="form.coverImage"
            label="Foto cover berita"
            aspect-ratio="video"
          />
        </section>

        <section class="admin-card p-4">
          <p class="admin-label">Penulis & metadata</p>
          <div class="mt-3 grid gap-3">
            <div>
              <label class="admin-label" for="article-author">Nama penulis</label>
              <input id="article-author" v-model="form.author" type="text" class="admin-input" />
            </div>
            <div>
              <label class="admin-label" for="article-role">Jabatan penulis</label>
              <input id="article-role" v-model="form.authorRole" type="text" class="admin-input" />
            </div>
            <div>
              <label class="admin-label" for="article-tags">Tag <span class="normal-case tracking-normal text-muted">(pisah koma)</span></label>
              <input id="article-tags" v-model="form.tagsText" type="text" placeholder="Kaderisasi, NDP" class="admin-input" />
            </div>
          </div>
        </section>

        <section class="rounded-[1.1rem] border border-dashed border-ink/20 p-4">
          <p class="text-[8px] font-black uppercase tracking-[0.12em] text-muted">Pintasan</p>
          <p class="mt-2 text-[10px] font-semibold leading-relaxed text-ink/55">
            Tekan <kbd class="rounded border border-line bg-white px-1.5 py-0.5 font-mono text-[9px]">Ctrl</kbd> + <kbd class="rounded border border-line bg-white px-1.5 py-0.5 font-mono text-[9px]">S</kbd> untuk menyimpan berita tanpa kembali ke daftar.
          </p>
        </section>

        <button
          type="button"
          :disabled="store.isSaving || isLoading"
          class="admin-btn admin-btn-dark w-full"
          @click="handleSave"
        >
          {{ store.isSaving || isLoading ? 'Menyimpan...' : 'Simpan berita' }}
        </button>
      </div>
    </div>
  </div>
</template>
