<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    accent?: string
    description?: string
    theme?: 'light' | 'dark'
    align?: 'left' | 'center'
  }>(),
  {
    eyebrow: '',
    accent: '',
    description: '',
    theme: 'light',
    align: 'left',
  },
)
</script>

<template>
  <div
    class="flex flex-col gap-5"
    :class="align === 'center' ? 'items-center text-center' : 'items-start'"
  >
    <span
      v-if="eyebrow"
      class="eyebrow"
      :class="theme === 'dark' ? 'eyebrow-lime' : ''"
    >
      {{ eyebrow }}
    </span>
    <h2
      class="display-md max-w-3xl"
      :class="theme === 'dark' ? 'text-white' : 'text-ink'"
    >
      {{ title }}
      <span v-if="accent" :class="theme === 'dark' ? 'text-lime-soft' : 'text-moss'">
        {{ accent }}
      </span>
    </h2>
    <p
      v-if="description"
      class="max-w-2xl text-sm font-medium leading-relaxed sm:text-base"
      :class="theme === 'dark' ? 'text-white/55' : 'text-muted'"
    >
      {{ description }}
    </p>
  </div>
</template>
