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
  <div class="screen-min flex flex-col bg-ink text-paper">
    <TheNavbar />
    <main class="flex-1 pt-[var(--nav-offset)]">
      <RouterView />
    </main>
    <TheFooter />
  </div>
</template>
