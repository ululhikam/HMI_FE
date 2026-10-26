<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/articles'
import type { Article } from '@/types'

const router = useRouter()
const store = useArticleStore()

const search = ref('')
const statusFilter = ref<'all' | 'published' | 'draft'>('all')
const categoryFilter = ref('Semua')
const statusOptions: Array<{ value: 'all' | 'published' | 'draft'; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'published', label: 'Publik' },
  { value: 'draft', label: 'Draf' },
]

const categories = computed(() => [...new Set(store.articles.map((article) => article.category))])

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return store.articles.filter((article) => {
    const matchesSearch =
      !query ||
      article.title.toLowerCase().includes(query) ||
      article.author.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query)
    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'published' && article.status === 'published') ||
      (statusFilter.value === 'draft' && article.status !== 'published')
    const matchesCategory = categoryFilter.value === 'Semua' || article.category === categoryFilter.value
    return matchesSearch && matchesStatus && matchesCategory
  })
})

const summary = computed(() => {
  const published = store.articles.filter((article) => article.status === 'published').length
  return [
    { label: 'Total berita', value: store.articles.length },
    { label: 'Publik', value: published },
    { label: 'Draf', value: store.articles.length - published },
    { label: 'Total dibaca', value: store.articles.reduce((total, article) => total + article.views, 0).toLocaleString('id-ID') },
  ]
})

function openCreate() {
  router.push({ name: 'admin-article-create' })
}

function openEdit(article: Article) {
  router.push({ name: 'admin-article-edit', params: { id: article.id } })
}

async function deleteArticle(id: string) {
  if (confirm('Hapus berita ini? Tindakan ini tidak dapat dibatalkan.')) {
    await store.deleteArticle(id)
  }
}

async function toggleStatus(article: Article) {
  await store.updateArticle(article.id, {
    status: article.status === 'published' ? 'draft' : 'published',
  })
}

function formatDate(iso: string | null | undefined, status?: Article['status']) {
  if (!iso) return status === 'published' ? 'Baru terbit' : 'Belum terbit'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function resetFilters() {
  search.value = ''
  statusFilter.value = 'all'
  categoryFilter.value = 'Semua'
}

onMounted(() => {
  void store.fetchAll()
})
</script>

<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <span class="eyebrow eyebrow-ink">Kelola berita</span>
        <h1 class="display-md mt-4">Berita<span class="text-moss">.</span></h1>
        <p class="mt-2 max-w-xl text-xs font-semibold leading-relaxed text-muted">
          Kelola seluruh berita, status publikasi, dan kategori konten portal.
        </p>
      </div>
      <button type="button" class="admin-btn admin-btn-lime self-start sm:self-auto" @click="openCreate">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 4v16m8-8H4" stroke-linecap="round" />
        </svg>
        Tambah berita
      </button>
    </div>

    <p v-if="store.error" class="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{{ store.error }}</p>

    <!-- Summary -->
    <div class="admin-card grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
      <div v-for="(item, index) in summary" :key="item.label" class="p-4 sm:p-5" :class="index >= 2 ? 'border-t border-line sm:border-t-0' : ''">
        <p class="text-[8px] font-black uppercase tracking-[0.14em] text-muted">{{ item.label }}</p>
        <p class="mt-2 font-display text-2xl font-bold leading-none tracking-tight text-ink">{{ item.value }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="admin-card p-3 sm:p-4">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div class="relative flex-1 xl:max-w-sm">
          <svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" stroke-linecap="round" />
          </svg>
          <input
            v-model="search"
            type="search"
            placeholder="Cari judul, penulis, atau kategori..."
            class="admin-input pl-9"
          />
        </div>

        <div class="hide-scrollbar flex items-center gap-1.5 overflow-x-auto">
          <button
            v-for="option in statusOptions"
            :key="option.value"
            type="button"
            class="flex-shrink-0 rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.08em] transition-colors"
            :class="statusFilter === option.value ? 'border-ink bg-ink text-lime-soft' : 'border-line bg-white text-muted hover:border-ink/30 hover:text-ink'"
            @click="statusFilter = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <select v-model="categoryFilter" class="admin-input w-full flex-shrink-0 text-[10px] font-bold xl:ml-auto xl:w-auto">
          <option value="Semua">Semua kategori</option>
          <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
        </select>

        <div class="flex items-center justify-between gap-3 xl:justify-end">
          <span class="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{{ filtered.length }} hasil</span>
          <button
            v-if="search || statusFilter !== 'all' || categoryFilter !== 'Semua'"
            type="button"
            class="text-[8px] font-black uppercase tracking-[0.08em] text-moss transition-colors hover:text-ink"
            @click="resetFilters"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Berita</th>
              <th class="hidden md:table-cell">Kategori</th>
              <th class="hidden xl:table-cell">Terbit</th>
              <th class="hidden xl:table-cell">Dibaca</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in filtered" :key="article.id">
              <td class="max-w-[340px]">
                <div class="flex items-center gap-3">
                  <span class="hidden h-10 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-paper sm:block">
                    <img v-if="article.coverImage" :src="article.coverImage" :alt="article.title" class="h-full w-full object-cover" />
                    <span v-else class="flex h-full w-full items-center justify-center text-[7px] font-black uppercase text-muted">HMI</span>
                  </span>
                  <div class="min-w-0">
                    <button type="button" class="block max-w-full truncate text-left text-[11px] font-extrabold text-ink transition-colors hover:text-moss" @click="openEdit(article)">
                      {{ article.title }}
                    </button>
                    <p class="mt-1 truncate text-[9px] font-semibold text-muted">{{ article.author }} · {{ article.readTime || 'Tanpa estimasi baca' }}</p>
                  </div>
                </div>
              </td>
              <td class="hidden md:table-cell">
                <span class="rounded-full bg-paper px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.05em] text-moss">{{ article.category }}</span>
              </td>
              <td class="hidden text-[10px] text-muted xl:table-cell">{{ formatDate(article.publishedAt, article.status) }}</td>
              <td class="hidden font-mono text-[10px] text-muted xl:table-cell">{{ article.views.toLocaleString('id-ID') }}</td>
              <td>
                <button
                  type="button"
                  :disabled="store.isSaving"
                  class="rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] transition-colors disabled:opacity-50"
                  :class="article.status === 'published' ? 'bg-lime/30 text-forest hover:bg-amber-50 hover:text-amber-700' : 'bg-amber-50 text-amber-700 hover:bg-lime/30 hover:text-forest'"
                  :title="article.status === 'published' ? 'Ubah ke draf' : 'Terbitkan berita'"
                  @click="toggleStatus(article)"
                >
                  {{ article.status === 'published' ? 'Publik' : 'Draf' }}
                </button>
              </td>
              <td>
                <div class="flex items-center justify-end gap-1">
                  <a
                    v-if="article.status === 'published'"
                    :href="`/berita/${article.slug}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-moss"
                    title="Lihat berita"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke-linecap="round" stroke-linejoin="round" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-moss"
                    title="Edit berita"
                    @click="openEdit(article)"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Hapus berita"
                    @click="deleteArticle(article.id)"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="6" class="py-14 text-center">
                <p class="text-xs font-bold text-ink">{{ store.isLoading ? 'Memuat berita...' : 'Tidak ada berita ditemukan.' }}</p>
                <button v-if="!store.isLoading && (search || statusFilter !== 'all' || categoryFilter !== 'Semua')" type="button" class="mt-3 text-[9px] font-black uppercase tracking-[0.1em] text-moss hover:underline" @click="resetFilters">
                  Reset filter
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
