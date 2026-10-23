<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { watch, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
  }>(),
  {
    modelValue: '',
    placeholder: 'Tuliskan isi konten artikel secara mendalam di sini...',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-[#009246] underline font-semibold hover:text-[#006837]',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'rounded-xl max-w-full my-4 mx-auto shadow-md',
      },
    }),
  ],
  editorProps: {
    attributes: {
      class:
        'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[220px] p-4 text-[#111212] leading-relaxed',
    },
  },
  onUpdate: () => {
    emit('update:modelValue', editor.value?.getHTML() || '')
  },
})

watch(
  () => props.modelValue,
  (val) => {
    const isSame = editor.value?.getHTML() === val
    if (!isSame && editor.value) {
      editor.value.commands.setContent(val || '', { emitUpdate: false })
    }
  }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function setLink() {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('Masukkan tautan URL:', previousUrl)

  // cancelled
  if (url === null) return

  // empty
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  // update link
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function addImage() {
  if (!editor.value) return
  const url = window.prompt('Masukkan tautan URL gambar:')
  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}
</script>

<template>
  <div class="border border-[#E6E6E6] rounded-2xl overflow-hidden bg-white focus-within:border-[#009246] focus-within:ring-2 focus-within:ring-[#009246]/10 transition-all">
    <!-- Tiptap Toolbar -->
    <div v-if="editor" class="flex flex-wrap items-center gap-1 p-2 bg-[#F7F7F5] border-b border-[#E6E6E6] text-xs">
      <!-- Bold -->
      <button
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'bg-white shadow-sm font-bold text-[#009246]': editor.isActive('bold') }"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors"
        title="Tebal (Ctrl+B)"
      >
        <span class="font-black px-1">B</span>
      </button>

      <!-- Italic -->
      <button
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'bg-white shadow-sm font-bold text-[#009246]': editor.isActive('italic') }"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors"
        title="Miring (Ctrl+I)"
      >
        <span class="italic font-serif px-1">I</span>
      </button>

      <!-- Strike -->
      <button
        type="button"
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'bg-white shadow-sm font-bold text-[#009246]': editor.isActive('strike') }"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors"
        title="Coretan"
      >
        <span class="line-through px-1">S</span>
      </button>

      <div class="w-px h-5 bg-gray-300 mx-1" />

      <!-- Heading 1 -->
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'bg-white shadow-sm font-bold text-[#009246]': editor.isActive('heading', { level: 1 }) }"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors font-bold px-2 text-[11px]"
        title="Heading 1"
      >
        H1
      </button>

      <!-- Heading 2 -->
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'bg-white shadow-sm font-bold text-[#009246]': editor.isActive('heading', { level: 2 }) }"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors font-bold px-2 text-[11px]"
        title="Heading 2"
      >
        H2
      </button>

      <!-- Heading 3 -->
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'bg-white shadow-sm font-bold text-[#009246]': editor.isActive('heading', { level: 3 }) }"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors font-bold px-2 text-[11px]"
        title="Heading 3"
      >
        H3
      </button>

      <div class="w-px h-5 bg-gray-300 mx-1" />

      <!-- Bullet List -->
      <button
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'bg-white shadow-sm font-bold text-[#009246]': editor.isActive('bulletList') }"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors"
        title="Daftar Poin"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16M2 6h.01M2 12h.01M2 18h.01" />
        </svg>
      </button>

      <!-- Ordered List -->
      <button
        type="button"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'bg-white shadow-sm font-bold text-[#009246]': editor.isActive('orderedList') }"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors"
        title="Daftar Angka"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6h13M7 12h13M7 18h13M3 5v2m0 4v2m0 4v2" />
        </svg>
      </button>

      <!-- Blockquote -->
      <button
        type="button"
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="{ 'bg-white shadow-sm font-bold text-[#009246]': editor.isActive('blockquote') }"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors"
        title="Kutipan (Quote)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      <!-- Code block -->
      <button
        type="button"
        @click="editor.chain().focus().toggleCodeBlock().run()"
        :class="{ 'bg-white shadow-sm font-bold text-[#009246]': editor.isActive('codeBlock') }"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors"
        title="Blok Kode"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </button>

      <div class="w-px h-5 bg-gray-300 mx-1" />

      <!-- Link -->
      <button
        type="button"
        @click="setLink"
        :class="{ 'bg-white shadow-sm font-bold text-[#009246]': editor.isActive('link') }"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors"
        title="Sisipkan Tautan"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>

      <!-- Image -->
      <button
        type="button"
        @click="addImage"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors"
        title="Sisipkan Gambar ke Teks"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      <!-- Horizontal Rule -->
      <button
        type="button"
        @click="editor.chain().focus().setHorizontalRule().run()"
        class="p-1.5 rounded-lg text-gray-700 hover:bg-white hover:text-black transition-colors font-mono text-xs px-2"
        title="Garis Pemisah"
      >
        —
      </button>

      <div class="flex-1" />

      <!-- Undo -->
      <button
        type="button"
        @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().undo()"
        class="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-black transition-colors disabled:opacity-30"
        title="Urungkan (Ctrl+Z)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      <!-- Redo -->
      <button
        type="button"
        @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().redo()"
        class="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-black transition-colors disabled:opacity-30"
        title="Ulangi (Ctrl+Y)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>
    </div>

    <!-- Tiptap Editor Content Area -->
    <EditorContent :editor="editor" />
  </div>
</template>

<style>
/* Tiptap editor prose enhancements */
.tiptap p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap {
  outline: none;
}

.tiptap h1 {
  font-size: 1.75rem;
  font-weight: 800;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #111212;
}

.tiptap h2 {
  font-size: 1.4rem;
  font-weight: 800;
  margin-top: 0.85rem;
  margin-bottom: 0.4rem;
  color: #111212;
}

.tiptap h3 {
  font-size: 1.15rem;
  font-weight: 700;
  margin-top: 0.75rem;
  margin-bottom: 0.3rem;
  color: #111212;
}

.tiptap ul {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.tiptap ol {
  list-style-type: decimal;
  padding-left: 1.25rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.tiptap blockquote {
  border-left: 3px solid #009246;
  padding-left: 1rem;
  font-style: italic;
  color: #4D4D4D;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

.tiptap pre {
  background: #111212;
  color: #f8f8f2;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  overflow-x: auto;
}

.tiptap hr {
  border: none;
  border-top: 1px solid #E6E6E6;
  margin: 1.25rem 0;
}
</style>
