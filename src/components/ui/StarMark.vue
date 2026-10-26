<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string
    color?: string
    class?: string
  }>(),
  {
    size: 32,
    color: 'currentColor',
    class: '',
  },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="class"
    aria-hidden="true"
  >
    <path
      d="M24 0C25.4 12.1 35.9 22.6 48 24C35.9 25.4 25.4 35.9 24 48C22.6 35.9 12.1 25.4 0 24C12.1 22.6 22.6 12.1 24 0Z"
      :fill="color"
    />
  </svg>
</template>
