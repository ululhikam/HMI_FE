<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSiteStore } from '@/stores/site'
import { useMemberStore } from '@/stores/members'

const route = useRoute()
const siteStore = useSiteStore()
const memberStore = useMemberStore()

const about = computed(() => siteStore.about)
const bph = computed(() => memberStore.members)
const bphPeriod = computed(() => bph.value[0]?.period ?? '')

function initials(name?: string) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

type TabKey = 'sejarah' | 'ndp' | 'pengurus'
const activeTab = ref<TabKey>('sejarah')

const tabs: { key: TabKey; label: string }[] = [
  { key: 'sejarah', label: 'Sejarah' },
  { key: 'ndp', label: 'NDP HMI' },
  { key: 'pengurus', label: 'Struktur Pengurus' },
]

function syncTabFromHash() {
  const hash = route.hash.replace('#', '')
  if (hash === 'ndp' || hash === 'pengurus') activeTab.value = hash
  else if (hash === 'sejarah') activeTab.value = 'sejarah'
}

watch(() => route.hash, syncTabFromHash)
syncTabFromHash()

onMounted(() => {
  void siteStore.fetchAbout()
  void memberStore.fetchMembers()
})
</script>

<template>
  <div class="pt-[67px]">
    <!-- Hero -->
    <section class="relative bg-[#111212] overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-[#009246]/20 via-transparent to-[#111212]" />
      <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-[#009246]/5 rounded-full blur-3xl" />
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div class="inline-flex items-center gap-2 text-[#009246] text-xs font-bold uppercase tracking-widest mb-5">
          <span class="w-8 h-0.5 bg-[#009246] rounded-full" />
          {{ about.hero.badge }}
          <span class="w-8 h-0.5 bg-[#009246] rounded-full" />
        </div>
        <h1 class="text-4xl sm:text-6xl font-extrabold text-white mb-5 leading-tight">
          {{ about.hero.title }} <span class="text-[#009246]">{{ about.hero.highlight }}</span>
        </h1>
        <p class="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
          {{ about.hero.description }}
        </p>
      </div>
    </section>

    <!-- Tab Navigation -->
    <nav class="sticky top-[67px] z-30 bg-white border-b border-[#E6E6E6] shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex gap-1 overflow-x-auto py-2">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200"
            :class="activeTab === tab.key
              ? 'bg-[#009246] text-white shadow-lg shadow-[#009246]/20'
              : 'text-[#4D4D4D] hover:text-[#009246] hover:bg-[#009246]/10'"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      <!-- Sejarah -->
      <div v-if="activeTab === 'sejarah'" class="animate-fadeIn">
        <div class="grid lg:grid-cols-2 gap-14 items-center mb-16">
          <div>
            <h2 class="text-3xl font-extrabold text-[#111212] mb-5">{{ about.history.heading }}</h2>
            <p
              v-for="(paragraph, index) in about.history.paragraphs"
              :key="index"
              class="text-[#4D4D4D] leading-relaxed mb-4"
            >
              {{ paragraph }}
            </p>
            <p
              v-if="about.history.quote"
              class="text-[#4D4D4D] leading-relaxed italic border-l-4 border-[#009246] pl-4 text-[#009246]"
            >
              {{ about.history.quote }}
            </p>
          </div>
          <div class="relative">
            <div class="rounded-3xl overflow-hidden shadow-2xl aspect-square bg-gradient-to-br from-[#009246] to-[#111212]">
              <img
                v-if="about.history.imageUrl"
                :src="about.history.imageUrl"
                alt="Sejarah HMI"
                class="w-full h-full object-cover"
              />
              <span
                v-else
                class="w-full h-full flex items-center justify-center text-white/70 text-sm font-bold"
              >
                Foto belum tersedia
              </span>
              <div class="absolute inset-0 bg-gradient-to-t from-[#111212]/60 to-transparent" />
            </div>
            <div
              v-if="about.history.sinceBadge"
              class="absolute bottom-6 left-6 bg-[#009246] text-white rounded-2xl px-5 py-3 font-bold text-sm shadow-xl"
            >
              {{ about.history.sinceBadge }}
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <h3 class="text-2xl font-extrabold text-[#111212] mb-8 text-center">Linimasa Perjalanan HMI</h3>
        <p v-if="about.timeline.length === 0" class="text-center text-sm text-[#4D4D4D]">
          Data linimasa belum tersedia.
        </p>
        <div v-else class="relative">
          <div class="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#009246] to-[#E6E6E6]" />
          <div class="space-y-10">
            <div
              v-for="(item, i) in about.timeline"
              :key="`${item.year}-${i}`"
              class="relative flex items-start gap-8"
              :class="i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'"
            >
              <div class="flex-1" :class="i % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'">
                <div class="inline-block bg-white border border-[#E6E6E6] rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-[#009246]/30 transition-all">
                  <div class="text-[#009246] font-extrabold text-xl mb-1">{{ item.year }}</div>
                  <p class="text-[#4D4D4D] text-sm leading-relaxed">{{ item.event }}</p>
                </div>
              </div>
              <div class="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#009246] border-4 border-white shadow-lg ring-2 ring-[#009246]/30" />
              <div class="flex-1" />
            </div>
          </div>
        </div>
      </div>

      <!-- NDP -->
      <div v-if="activeTab === 'ndp'" class="animate-fadeIn">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-extrabold text-[#111212] mb-4">{{ about.ndp.title }}</h2>
          <p class="text-[#4D4D4D] max-w-2xl mx-auto leading-relaxed">
            {{ about.ndp.description }}
          </p>
        </div>
        <p v-if="about.ndp.points.length === 0" class="text-center text-sm text-[#4D4D4D] mb-12">
          Data NDP belum tersedia.
        </p>
        <div v-else class="grid sm:grid-cols-2 gap-6 mb-12">
          <div
            v-for="point in about.ndp.points"
            :key="point.number"
            class="group bg-white rounded-2xl p-7 border border-[#E6E6E6] hover:border-[#009246]/30 hover:shadow-xl transition-all duration-300"
          >
            <div class="w-12 h-12 rounded-xl bg-[#009246]/10 flex items-center justify-center mb-5 group-hover:bg-[#009246] transition-colors">
              <span class="text-[#009246] group-hover:text-white font-black text-sm transition-colors">{{ point.number }}</span>
            </div>
            <h3 class="text-[#111212] font-extrabold text-lg mb-2">{{ point.title }}</h3>
            <p class="text-[#4D4D4D] leading-relaxed">{{ point.description }}</p>
          </div>
        </div>
        <div
          v-if="about.ndp.quote"
          class="bg-gradient-to-br from-[#006837] to-[#009246] rounded-3xl p-8 sm:p-12 text-white text-center"
        >
          <blockquote class="text-xl sm:text-2xl font-bold leading-relaxed mb-4 italic">
            {{ about.ndp.quote }}
          </blockquote>
          <div v-if="about.ndp.quoteAuthor" class="text-white/70 text-sm font-semibold">{{ about.ndp.quoteAuthor }}</div>
        </div>
      </div>

      <!-- Pengurus -->
      <div v-if="activeTab === 'pengurus'" class="animate-fadeIn">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-extrabold text-[#111212] mb-4">Struktur Pengurus BPH</h2>
          <p class="text-[#4D4D4D] max-w-xl mx-auto">
            Pengurus HMI Insan Cita{{ bphPeriod ? ` periode ${bphPeriod}` : '' }} yang terpilih melalui Musyawarah Cabang.
          </p>
        </div>
        <div v-if="bph.length" class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div
            v-for="member in bph"
            :key="member.id"
            class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-[#E6E6E6] text-center"
          >
            <div class="relative overflow-hidden h-48 bg-[#009246]/10">
              <img
                v-if="member.photo"
                :src="member.photo"
                :alt="member.name"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <span v-else class="w-full h-full flex items-center justify-center text-3xl font-black text-[#009246]">
                {{ initials(member.name) }}
              </span>
              <div class="absolute inset-0 bg-gradient-to-t from-[#111212]/60 to-transparent" />
              <span v-if="member.department" class="absolute top-3 right-3 bg-[#009246] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ member.department }}</span>
            </div>
            <div class="p-4">
              <h3 class="text-[#111212] font-extrabold text-sm">{{ member.name }}</h3>
              <p class="text-[#009246] text-xs font-semibold mt-1">{{ member.position }}</p>
              <p v-if="member.period" class="text-[#4D4D4D] text-[11px] mt-1">{{ member.period }}</p>
            </div>
          </div>
        </div>
        <p v-else-if="memberStore.isLoading" class="text-center text-[#4D4D4D] text-sm">Memuat data pengurus...</p>
        <p v-else class="text-center text-[#4D4D4D] text-sm">Data pengurus belum tersedia.</p>
      </div>
    </div>
  </div>
</template>
