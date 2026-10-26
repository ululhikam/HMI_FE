<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    theme?: 'light' | 'dark'
  }>(),
  {
    description: '',
    theme: 'light',
  },
)
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[1.75rem] border px-6 py-14 text-center sm:px-10"
    :class="theme === 'dark'
      ? 'border-white/10 bg-white/[0.035] text-white'
      : 'border-line bg-white text-ink'"
  >
    <div class="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/10 blur-3xl" />
    <div class="relative mx-auto flex max-w-md flex-col items-center gap-4">
      <span
        class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10"
        :class="theme === 'dark' ? 'bg-lime/20 text-lime-soft' : 'bg-lime/10 text-lime'"
      >
        <slot name="icon">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </slot>
      </span>
      <h3 class="display-md text-2xl">{{ title }}</h3>
      <p v-if="description" class="text-sm font-medium leading-relaxed" :class="theme === 'dark' ? 'text-white/60' : 'text-muted'">
        {{ description }}
      </p>
      <slot />
    </div>
  </div>
</template>
