<script setup lang="ts">
import StarMark from '@/components/ui/StarMark.vue'

withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    accent?: string
    description?: string
    meta?: string
    image?: string
  }>(),
  {
    accent: '',
    description: '',
    meta: '',
    image: '',
  },
)
</script>

<template>
  <section class="hero-compact relative overflow-hidden bg-ink text-paper">
    <div class="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />
    <div class="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-lime/10 blur-[110px]" />
    <div class="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-moss/25 blur-[120px]" />

    <div class="container-wide relative z-10">
      <div class="flex items-center justify-between">
        <span class="eyebrow eyebrow-lime">{{ eyebrow }}</span>
        <StarMark :size="28" class="animate-spin-slow text-lime-soft" />
      </div>

      <div class="hero-gap grid items-end gap-[clamp(1.5rem,4vw,2.5rem)] lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <h1 class="hero-title max-w-4xl text-balance text-white">
            {{ title }}
            <span v-if="accent" class="text-lime-soft">{{ accent }}</span>
          </h1>
          <div v-if="meta" class="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
            <span class="rounded-full border border-white/15 px-3 py-1.5">{{ meta }}</span>
          </div>
        </div>

        <div class="space-y-4 lg:pb-1">
          <p v-if="description" class="max-w-md text-sm font-medium leading-relaxed text-white/55 sm:text-base">
            {{ description }}
          </p>
          <div v-if="image" class="relative ml-auto hidden w-full max-w-[clamp(12rem,24vw,17rem)] overflow-hidden rounded-[2rem] border border-white/10 lg:block">
            <img :src="image" alt="" class="aspect-[4/3] w-full object-cover grayscale" />
            <div class="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <div class="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
              <span class="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">HMI Insan Cita</span>
              <span class="h-2 w-2 rounded-full bg-lime-soft" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
