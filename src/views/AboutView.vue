<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useSiteStore } from '@/stores/site'
import { useMemberStore } from '@/stores/members'
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHero from '@/components/ui/PageHero.vue'
import StarMark from '@/components/ui/StarMark.vue'

const route = useRoute()
const router = useRouter()
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

const tabs: { key: TabKey; label: string; index: string }[] = [
  { key: 'sejarah', label: 'Sejarah', index: '01' },
  { key: 'ndp', label: 'NDP HMI', index: '02' },
  { key: 'pengurus', label: 'Struktur Pengurus', index: '03' },
]

function syncTabFromHash() {
  const hash = route.hash.replace('#', '')
  if (hash === 'ndp' || hash === 'pengurus') activeTab.value = hash
  else if (hash === 'sejarah') activeTab.value = 'sejarah'
}

function selectTab(tab: TabKey) {
  activeTab.value = tab
  void router.replace({ hash: `#${tab}` })
}

watch(() => route.hash, syncTabFromHash)
syncTabFromHash()

onMounted(() => {
  void siteStore.fetchAbout()
  void memberStore.fetchMembers()
})
</script>

<template>
  <div class="bg-paper text-ink">
    <PageHero
      eyebrow="Tentang HMI"
      :title="about.hero.title || 'HMI Komisariat'"
      :accent="about.hero.highlight"
      :description="about.hero.description"
      :meta="about.hero.badge || 'Sejak 1947'"
      :image="about.history.imageUrl"
    />

    <!-- Sticky tab navigation -->
    <nav class="sticky top-[var(--nav-offset)] z-30 border-b border-line bg-paper/90 backdrop-blur-xl">
      <div class="container-wide">
        <div class="hide-scrollbar flex gap-2 overflow-x-auto py-3">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.1em] transition-all"
            :class="activeTab === tab.key
              ? 'border-lime bg-lime text-white'
              : 'border-line bg-transparent text-ink/55 hover:border-ink/30 hover:text-ink'"
            @click="selectTab(tab.key)"
          >
            <span class="text-[8px]" :class="activeTab === tab.key ? 'text-white/85' : 'text-muted'">{{ tab.index }}</span>
            {{ tab.label }}
          </button>
        </div>
      </div>
    </nav>

    <!-- Sejarah -->
    <Transition name="tab" mode="out-in">
      <section v-if="activeTab === 'sejarah'" id="sejarah" key="sejarah" class="section-pad">
        <div class="container-wide">
          <div class="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
            <div v-reveal>
              <span class="eyebrow">Akar perjalanan</span>
              <h2 class="display-md mt-5 max-w-xl">
                {{ about.history.heading || 'Sejarah HMI' }}
              </h2>
              <div class="mt-7 space-y-4">
                <p
                  v-for="(paragraph, index) in about.history.paragraphs"
                  :key="index"
                  class="max-w-xl text-sm font-medium leading-relaxed text-muted sm:text-base"
                >
                  {{ paragraph }}
                </p>
              </div>
              <blockquote v-if="about.history.quote" class="mt-8 border-l-4 border-moss pl-5 font-display text-lg font-semibold leading-snug tracking-tight text-ink sm:text-xl">
                “{{ about.history.quote }}”
              </blockquote>
            </div>

            <div v-reveal="{ delay: 100 }" class="relative">
              <div class="relative overflow-hidden rounded-[2rem] border border-line bg-forest">
                <img
                  v-if="about.history.imageUrl"
                  :src="about.history.imageUrl"
                  alt="Sejarah HMI"
                  class="aspect-[4/5] w-full object-cover grayscale transition duration-700 hover:scale-[1.02] hover:grayscale-0"
                />
                <div v-else class="relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-forest to-ink">
                  <div class="absolute inset-0 bg-grid-dark opacity-60" />
                  <StarMark :size="80" class="relative animate-spin-slow text-lime-soft" />
                  <p class="relative mt-6 font-display text-2xl font-bold tracking-tight text-white">HMI</p>
                </div>
                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/50 to-transparent p-6 pt-20">
                  <span class="text-[9px] font-black uppercase tracking-[0.2em] text-lime-soft">{{ about.history.sinceBadge || '5 Februari 1947' }}</span>
                </div>
              </div>
              <div class="absolute -right-3 -top-4 flex h-20 w-20 items-center justify-center rounded-full bg-lime text-white sm:-right-5 sm:h-24 sm:w-24">
                <div class="text-center">
                  <p class="font-display text-xl font-bold leading-none">{{ about.timeline.length || '—' }}</p>
                  <p class="mt-1 text-[7px] font-black uppercase tracking-[0.14em]">Titik sejarah</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div class="mt-20 border-t border-line pt-12">
            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span class="eyebrow">Linimasa</span>
                <h3 class="display-md mt-4">Jejak langkah<span class="text-moss">.</span></h3>
              </div>
              <p class="max-w-xs text-xs font-semibold leading-relaxed text-muted">
                Peristiwa dan tonggak yang membentuk arah gerakan HMI.
              </p>
            </div>

            <div v-if="about.timeline.length" class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="(item, index) in about.timeline"
                :key="`${item.year}-${index}`"
                v-reveal="{ delay: index * 50 }"
                class="group flex min-h-[clamp(8.5rem,22svh,11rem)] flex-col justify-between rounded-[1.4rem] border border-line bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-ink/30 hover:shadow-soft"
              >
                <span class="font-display text-3xl font-bold leading-none tracking-tight text-moss">{{ item.year }}</span>
                <p class="mt-6 text-xs font-semibold leading-relaxed text-muted">{{ item.event }}</p>
                <span class="mt-4 h-px w-full bg-line transition-colors group-hover:bg-lime" />
              </div>
            </div>
            <EmptyState
              v-else
              class="mt-8"
              title="Linimasa belum tersedia"
              description="Data perjalanan organisasi akan tampil setelah diisi melalui panel admin."
            />
          </div>
        </div>
      </section>

      <!-- NDP -->
      <section v-else-if="activeTab === 'ndp'" id="ndp" key="ndp" class="section-pad">
        <div class="container-wide">
          <div class="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div v-reveal class="lg:sticky lg:top-[calc(var(--nav-offset)+clamp(1rem,3svh,2rem))]">
              <span class="eyebrow">Nilai Dasar Perjuangan</span>
              <h2 class="display-md mt-5">{{ about.ndp.title || 'NDP HMI' }}</h2>
              <p class="mt-5 max-w-md text-sm font-medium leading-relaxed text-muted sm:text-base">{{ about.ndp.description }}</p>
              <StarMark :size="42" class="mt-8 text-moss" />
            </div>

            <div v-if="about.ndp.points.length" class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="(point, index) in about.ndp.points"
                :key="point.number"
                v-reveal="{ delay: index * 60 }"
                class="group relative overflow-hidden rounded-[1.5rem] border border-line bg-white p-6 transition duration-300 hover:border-ink/30 hover:shadow-soft"
              >
                <span class="absolute right-4 top-4 font-display text-5xl font-bold leading-none text-paper-deep transition-colors group-hover:text-lime/20">
                  {{ point.number }}
                </span>
                <span class="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[10px] font-black text-lime-soft">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                <h3 class="relative mt-6 font-display text-lg font-semibold tracking-tight text-ink">{{ point.title }}</h3>
                <p class="relative mt-2 text-xs font-medium leading-relaxed text-muted">{{ point.description }}</p>
              </div>
            </div>
            <EmptyState
              v-else
              title="Butir NDP belum tersedia"
              description="Materi Nilai Dasar Perjuangan akan ditampilkan setelah dilengkapi."
            />
          </div>

          <div v-if="about.ndp.quote" class="relative mt-12 overflow-hidden rounded-[2rem] bg-ink p-8 text-paper sm:p-12">
            <div class="absolute inset-0 bg-grid-dark opacity-60" />
            <div class="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <span class="font-display text-6xl leading-none text-lime-soft/40">“</span>
                <blockquote class="mt-2 max-w-3xl font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                  {{ about.ndp.quote }}
                </blockquote>
                <p v-if="about.ndp.quoteAuthor" class="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-lime-soft">{{ about.ndp.quoteAuthor }}</p>
              </div>
              <StarMark :size="54" class="hidden text-lime-soft lg:block" />
            </div>
          </div>
        </div>
      </section>

      <!-- Pengurus -->
      <section v-else id="pengurus" key="pengurus" class="section-pad">
        <div class="container-wide">
          <div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <span class="eyebrow">Struktur organisasi</span>
              <h2 class="display-md mt-5">Pengurus BPH<span class="text-moss">.</span></h2>
              <p class="mt-4 max-w-xl text-sm font-medium leading-relaxed text-muted">
                Pengurus HMI Insan Cita{{ bphPeriod ? ` periode ${bphPeriod}` : '' }} yang terpilih melalui Musyawarah Cabang.
              </p>
            </div>
            <span class="inline-flex w-fit items-center gap-2 rounded-full border border-line px-4 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-muted">
              <span class="h-1.5 w-1.5 rounded-full bg-moss" />
              {{ bph.length }} pengurus
            </span>
          </div>

          <div v-if="bph.length" class="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <article
              v-for="(member, index) in bph"
              :key="member.id"
              v-reveal="{ delay: index * 40 }"
              class="group overflow-hidden rounded-[1.5rem] border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-ink/30 hover:shadow-soft"
            >
              <div class="relative aspect-[4/5] overflow-hidden bg-paper-deep">
                <img
                  v-if="member.photo"
                  :src="member.photo"
                  :alt="member.name"
                  class="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <span v-else class="flex h-full w-full items-center justify-center font-display text-4xl font-bold text-moss/45">
                  {{ initials(member.name) }}
                </span>
                <div class="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-70" />
                <span v-if="member.department" class="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-ink backdrop-blur">
                  {{ member.department }}
                </span>
                <span class="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-lime text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
              <div class="p-4">
                <h3 class="font-display text-base font-semibold leading-snug tracking-tight text-ink">{{ member.name }}</h3>
                <p class="mt-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-moss">{{ member.position }}</p>
                <p v-if="member.period" class="mt-1 text-[10px] font-semibold text-muted">{{ member.period }}</p>
              </div>
            </article>
          </div>
          <p v-else-if="memberStore.isLoading" class="mt-10 text-center text-sm font-semibold text-muted">Memuat data pengurus...</p>
          <EmptyState
            v-else
            class="mt-10"
            title="Data pengurus belum tersedia"
            description="Struktur pengurus akan tampil setelah data anggota ditambahkan."
          />
        </div>
      </section>
    </Transition>

    <!-- Closing CTA -->
    <section class="bg-ink py-16 text-paper">
      <div class="container-wide flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <span class="eyebrow eyebrow-lime">Terus melangkah</span>
          <h2 class="display-md mt-4 max-w-2xl text-white">Kenali nilai, ambil peran<span class="text-lime-soft">.</span></h2>
        </div>
        <div class="flex flex-wrap gap-3">
          <RouterLink to="/daftar" class="btn btn-lime">Daftar LK 1</RouterLink>
          <RouterLink to="/kontak" class="btn btn-outline-light">Hubungi kami</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tab-enter-active,
.tab-leave-active {
  transition: opacity 200ms ease, transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}
.tab-enter-from,
.tab-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
