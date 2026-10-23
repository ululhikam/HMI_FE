<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
const isEditing = computed(() => !!articleId.value)

const categories: ArticleCategory[] = ['Kegiatan', 'Opini', 'Press Release', 'Pengumuman']

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

onMounted(async () => {
  await store.fetchAll()
  if (isEditing.value) {
    const article = store.articles.find((a) => a.id === articleId.value)
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
      formError.value = 'Artikel tidak ditemukan.'
    }
  }
})

async function handleSave() {
  formError.value = ''
  if (!form.title.trim()) {
    formError.value = 'Judul artikel wajib diisi.'
    return
  }

  isLoading.value = true
  const tags = form.tagsText
    .split(',')
    .map((t) => t.trim())
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
    formError.value = store.error || 'Gagal menyimpan artikel.'
  }
}

function goBack() {
  router.push({ name: 'admin-articles' })
}
</script>

<template>
  <div class="min-h-screen bg-[#F7F7F5]">
    <!-- Top Bar -->
    <div class="bg-white border-b border-[#E6E6E6] sticky top-0 z-30 shadow-sm">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <!-- Back + Breadcrumb -->
        <div class="flex items-center gap-3 min-w-0">
          <button
            @click="goBack"
            class="w-9 h-9 flex items-center justify-center rounded-xl text-[#4D4D4D] hover:bg-[#F7F7F5] hover:text-[#111212] transition-colors shrink-0 border border-[#E6E6E6]"
            title="Kembali ke Daftar Artikel"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="min-w-0">
            <p class="text-xs text-[#4D4D4D]">Berita &amp; Artikel /</p>
            <h1 class="text-sm font-extrabold text-[#111212] truncate">
              {{ isEditing ? 'Edit Artikel' : 'Artikel Baru' }}
            </h1>
          </div>
        </div>

        <!-- Status toggle + Save -->
        <div class="flex items-center gap-2 shrink-0">
          <div class="hidden sm:flex items-center p-0.5 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl text-xs font-bold gap-0.5">
            <button
              v-for="st in (['draft', 'published'] as ArticleStatus[])"
              :key="st"
              @click="form.status = st"
              class="px-3 py-1.5 rounded-lg transition-all"
              :class="form.status === st
                ? 'bg-white text-[#009246] shadow-sm'
                : 'text-[#4D4D4D] hover:text-[#111212]'"
            >
              {{ st === 'published' ? 'Publik' : 'Draft' }}
            </button>
          </div>

          <button
            @click="handleSave"
            :disabled="store.isSaving || isLoading"
            class="inline-flex items-center gap-2 px-5 py-2 bg-[#009246] hover:bg-[#006837] disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#009246]/20"
          >
            <svg v-if="store.isSaving || isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ store.isSaving || isLoading ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <p
        v-if="formError"
        class="mb-5 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-2"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ formError }}
      </p>

      <div class="grid lg:grid-cols-[1fr_296px] gap-6 items-start">
        <!-- ── Main Column ── -->
        <div class="space-y-4">
          <!-- Judul -->
          <div class="bg-white rounded-2xl border border-[#E6E6E6] p-5 shadow-sm">
            <label class="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest block mb-2">
              Judul Artikel <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="Tuliskan judul artikel yang menarik..."
              class="w-full text-xl font-bold text-[#111212] bg-transparent border-none outline-none placeholder-[#C9C9C9]"
            />
          </div>

          <!-- Ringkasan -->
          <div class="bg-white rounded-2xl border border-[#E6E6E6] p-5 shadow-sm">
            <label class="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest block mb-2">Ringkasan</label>
            <textarea
              v-model="form.excerpt"
              rows="2"
              placeholder="Ringkasan singkat yang tampil di halaman daftar berita..."
              class="w-full text-sm text-[#4D4D4D] bg-transparent border-none outline-none placeholder-[#C9C9C9] resize-none leading-relaxed"
            />
          </div>

          <!-- Tiptap Editor -->
          <div class="bg-white rounded-2xl border border-[#E6E6E6] shadow-sm overflow-hidden">
            <div class="px-5 pt-4 pb-2 border-b border-[#E6E6E6]">
              <p class="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">Isi Artikel</p>
            </div>
            <TiptapEditor
              v-model="form.content"
              placeholder="Mulai menulis konten artikel di sini..."
            />
          </div>
        </div>

        <!-- ── Sidebar ── -->
        <div class="space-y-4">
          <!-- Status (mobile only) -->
          <div class="sm:hidden bg-white rounded-2xl border border-[#E6E6E6] p-4 shadow-sm">
            <label class="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest block mb-2">Status Publikasi</label>
            <div class="flex gap-2">
              <button
                v-for="st in (['draft', 'published'] as ArticleStatus[])"
                :key="st"
                @click="form.status = st"
                class="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                :class="form.status === st
                  ? 'bg-[#009246] text-white border-[#009246]'
                  : 'bg-white text-[#4D4D4D] border-[#E6E6E6] hover:border-[#009246]'"
              >
                {{ st === 'published' ? 'Publik' : 'Draft' }}
              </button>
            </div>
          </div>

          <!-- Cover Image -->
          <div class="bg-white rounded-2xl border border-[#E6E6E6] p-4 shadow-sm">
            <ImageUploadField
              v-model="form.coverImage"
              label="Foto Cover Artikel"
              aspect-ratio="video"
            />
          </div>

          <!-- Metadata -->
          <div class="bg-white rounded-2xl border border-[#E6E6E6] p-4 shadow-sm space-y-3.5">
            <p class="text-[10px] font-bold text-[#4D4D4D] uppercase tracking-widest">Informasi Artikel</p>

            <div>
              <label class="text-xs font-semibold text-[#4D4D4D] block mb-1">Kategori</label>
              <select v-model="form.category" class="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div>
              <label class="text-xs font-semibold text-[#4D4D4D] block mb-1">Slug URL</label>
              <input v-model="form.slug" type="text" placeholder="otomatis dari judul" class="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>

            <div>
              <label class="text-xs font-semibold text-[#4D4D4D] block mb-1">Penulis</label>
              <input v-model="form.author" type="text" class="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>

            <div>
              <label class="text-xs font-semibold text-[#4D4D4D] block mb-1">Jabatan Penulis</label>
              <input v-model="form.authorRole" type="text" class="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>

            <div>
              <label class="text-xs font-semibold text-[#4D4D4D] block mb-1">Tag <span class="text-[#C9C9C9] font-normal">(pisah koma)</span></label>
              <input v-model="form.tagsText" type="text" placeholder="Kaderisasi, NDP" class="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>

            <div>
              <label class="text-xs font-semibold text-[#4D4D4D] block mb-1">Estimasi Baca</label>
              <input v-model="form.readTime" type="text" placeholder="5 menit" class="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
