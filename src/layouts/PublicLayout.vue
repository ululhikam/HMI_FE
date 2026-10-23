<script setup lang="ts">
import { onMounted } from 'vue'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'
import { useSiteStore } from '@/stores/site'
import { useArticleStore } from '@/stores/articles'

const siteStore = useSiteStore()
const articleStore = useArticleStore()

onMounted(() => {
  // Data bersama untuk seluruh halaman publik.
  void siteStore.fetchSettings()
  void articleStore.fetchPublished()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#f8f8f8]">
    <TheNavbar />
    <!-- navbar height = 64px + 3px accent bar = 67px, use pt-[67px] on pages that need it -->
    <main class="flex-1">
      <RouterView />
    </main>
    <TheFooter />
  </div>
</template>
