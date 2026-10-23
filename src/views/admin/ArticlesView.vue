<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/articles'
import type { Article } from '@/types'

const router = useRouter()
const store = useArticleStore()

const search = ref('')

const filtered = computed(() => {
  const query = search.value.toLowerCase()
  return store.articles.filter(
    (article) =>
      article.title.toLowerCase().includes(query) ||
      article.author.toLowerCase().includes(query),
  )
})

function openCreate() {
  router.push({ name: 'admin-article-create' })
}

function openEdit(article: Article) {
  router.push({ name: 'admin-article-edit', params: { id: article.id } })
}

async function deleteArticle(id: string) {
  if (confirm('Hapus artikel ini?')) {
    await store.deleteArticle(id)
  }
}

async function toggleStatus(article: Article) {
  await store.updateArticle(article.id, {
    status: article.status === 'published' ? 'draft' : 'published',
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => {
  void store.fetchAll()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-extrabold text-[#111212]">Berita &amp; Artikel</h1>
        <p class="text-[#4D4D4D] text-sm mt-0.5">Kelola semua konten berita dan artikel</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#009246] hover:bg-[#006837] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#009246]/20"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Artikel
      </button>
    </div>

    <p v-if="store.error" class="mb-4 text-sm text-red-500">{{ store.error }}</p>

    <!-- Search -->
    <div class="relative mb-5 max-w-sm">
      <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#C9C9C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
      <input v-model="search" type="text" placeholder="Cari artikel..." class="w-full pl-10 pr-8 py-2.5 border border-[#E6E6E6] rounded-xl text-sm focus:outline-none focus:border-[#009246] focus:ring-2 focus:ring-[#009246]/20 transition-all" />
      <button v-if="search" @click="search = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#C9C9C9] hover:text-[#4D4D4D]" title="Hapus pencarian">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-[#E6E6E6] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-[#F7F7F5] border-b border-[#E6E6E6]">
              <th class="text-left px-5 py-3 text-xs font-bold text-[#4D4D4D] uppercase tracking-wider">Judul</th>
              <th class="text-left px-4 py-3 text-xs font-bold text-[#4D4D4D] uppercase tracking-wider hidden md:table-cell">Kategori</th>
              <th class="text-left px-4 py-3 text-xs font-bold text-[#4D4D4D] uppercase tracking-wider hidden lg:table-cell">Tanggal</th>
              <th class="text-left px-4 py-3 text-xs font-bold text-[#4D4D4D] uppercase tracking-wider hidden lg:table-cell">Views</th>
              <th class="text-left px-4 py-3 text-xs font-bold text-[#4D4D4D] uppercase tracking-wider">Status</th>
              <th class="text-left px-4 py-3 text-xs font-bold text-[#4D4D4D] uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E6E6E6]">
            <tr v-for="article in filtered" :key="article.id" class="hover:bg-[#F7F7F5] transition-colors">
              <td class="px-5 py-3 max-w-[220px]">
                <div class="font-semibold text-[#111212] truncate">{{ article.title }}</div>
                <div class="text-xs text-[#4D4D4D] truncate">{{ article.author }}</div>
              </td>
              <td class="px-4 py-3 hidden md:table-cell">
                <span class="bg-[#009246]/10 text-[#009246] text-xs font-bold px-2.5 py-0.5 rounded-full">{{ article.category }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-[#4D4D4D] hidden lg:table-cell">{{ formatDate(article.publishedAt) }}</td>
              <td class="px-4 py-3 text-xs text-[#4D4D4D] hidden lg:table-cell">{{ article.views.toLocaleString() }}</td>
              <td class="px-4 py-3">
                <button @click="toggleStatus(article)" class="text-xs font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition-all"
                  :disabled="store.isSaving"
                  :class="article.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-yellow-100 text-yellow-700 hover:bg-green-100 hover:text-green-700'">
                  {{ article.status === 'published' ? 'Publik' : 'Draft' }}
                </button>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button @click="openEdit(article)" class="w-8 h-8 flex items-center justify-center rounded-lg text-[#4D4D4D] hover:bg-[#009246]/10 hover:text-[#009246] transition-colors" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="deleteArticle(article.id)" class="w-8 h-8 flex items-center justify-center rounded-lg text-[#4D4D4D] hover:bg-red-50 hover:text-red-500 transition-colors" title="Hapus">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="6" class="py-10 text-center text-[#4D4D4D] text-sm">
                {{ store.isLoading ? 'Memuat artikel...' : 'Tidak ada artikel ditemukan' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
