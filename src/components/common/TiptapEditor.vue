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
    placeholder: 'Tuliskan isi konten berita secara mendalam di sini...',
  },
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
        class: 'text-moss underline decoration-lime decoration-2 underline-offset-2 font-semibold',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'rounded-xl max-w-full my-4 mx-auto border border-line',
      },
    }),
  ],
  editorProps: {
    attributes: {
      class: 'tiptap-content focus:outline-none min-h-[clamp(12rem,32svh,20rem)] p-5 text-ink',
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
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function setLink() {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('Masukkan tautan URL:', previousUrl)

  if (url === null) return

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

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
  <div class="overflow-hidden bg-white transition-colors focus-within:bg-white">
    <div v-if="editor" class="flex flex-wrap items-center gap-0.5 border-b border-line bg-paper/60 p-2">
      <button
        type="button"
        class="editor-tool font-black"
        :class="{ 'editor-tool-active': editor.isActive('bold') }"
        title="Tebal (Ctrl+B)"
        @click="editor.chain().focus().toggleBold().run()"
      >
        B
      </button>

      <button
        type="button"
        class="editor-tool font-serif italic"
        :class="{ 'editor-tool-active': editor.isActive('italic') }"
        title="Miring (Ctrl+I)"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        I
      </button>

      <button
        type="button"
        class="editor-tool line-through"
        :class="{ 'editor-tool-active': editor.isActive('strike') }"
        title="Coretan"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        S
      </button>

      <div class="mx-1 h-4 w-px bg-line" />

      <button
        type="button"
        class="editor-tool text-[10px] font-black"
        :class="{ 'editor-tool-active': editor.isActive('heading', { level: 1 }) }"
        title="Heading 1"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        H1
      </button>
      <button
        type="button"
        class="editor-tool text-[10px] font-black"
        :class="{ 'editor-tool-active': editor.isActive('heading', { level: 2 }) }"
        title="Heading 2"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        H2
      </button>
      <button
        type="button"
        class="editor-tool text-[10px] font-black"
        :class="{ 'editor-tool-active': editor.isActive('heading', { level: 3 }) }"
        title="Heading 3"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        H3
      </button>

      <div class="mx-1 h-4 w-px bg-line" />

      <button
        type="button"
        class="editor-tool"
        :class="{ 'editor-tool-active': editor.isActive('bulletList') }"
        title="Daftar poin"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 6h16M4 12h16M4 18h16M2 6h.01M2 12h.01M2 18h.01" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        class="editor-tool"
        :class="{ 'editor-tool-active': editor.isActive('orderedList') }"
        title="Daftar angka"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 6h13M7 12h13M7 18h13M3 5v2m0 4v2m0 4v2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        class="editor-tool"
        :class="{ 'editor-tool-active': editor.isActive('blockquote') }"
        title="Kutipan"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        class="editor-tool"
        :class="{ 'editor-tool-active': editor.isActive('codeBlock') }"
        title="Blok kode"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div class="mx-1 h-4 w-px bg-line" />

      <button
        type="button"
        class="editor-tool"
        :class="{ 'editor-tool-active': editor.isActive('link') }"
        title="Sisipkan tautan"
        @click="setLink"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        class="editor-tool"
        title="Sisipkan gambar"
        @click="addImage"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        class="editor-tool font-mono text-[11px]"
        title="Garis pemisah"
        @click="editor.chain().focus().setHorizontalRule().run()"
      >
        —
      </button>

      <div class="flex-1" />

      <button
        type="button"
        class="editor-tool"
        :disabled="!editor.can().undo()"
        title="Urungkan (Ctrl+Z)"
        @click="editor.chain().focus().undo().run()"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        class="editor-tool"
        :disabled="!editor.can().redo()"
        title="Ulangi (Ctrl+Y)"
        @click="editor.chain().focus().redo().run()"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <EditorContent :editor="editor" />
  </div>
</template>

<style>
.editor-tool {
  display: inline-flex;
  height: 1.9rem;
  min-width: 1.9rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.55rem;
  padding-inline: 0.35rem;
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 700;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    opacity 160ms ease;
  cursor: pointer;
}

.editor-tool:hover {
  background: var(--color-paper);
  color: var(--color-ink);
}

.editor-tool:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.editor-tool-active,
.editor-tool-active:hover {
  background: var(--color-ink);
  color: var(--color-lime-soft);
}

.tiptap-content {
  color: var(--color-ink);
  font-size: 0.94rem;
  line-height: 1.8;
}

.tiptap-content > * + * {
  margin-top: 0.9em;
}

.tiptap p {
  margin-block: 0.75em;
}

.tiptap h1,
.tiptap h2,
.tiptap h3 {
  color: var(--color-ink);
  font-family: "Space Grotesk", "Manrope", system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.tiptap h1 {
  margin-top: 1.3em;
  font-size: 1.75rem;
}

.tiptap h2 {
  margin-top: 1.2em;
  font-size: 1.4rem;
}

.tiptap h3 {
  margin-top: 1.1em;
  font-size: 1.15rem;
}

.tiptap ul,
.tiptap ol {
  margin-block: 0.75em;
  padding-left: 1.35rem;
}

.tiptap ul {
  list-style: disc;
}

.tiptap ol {
  list-style: decimal;
}

.tiptap li + li {
  margin-top: 0.35em;
}

.tiptap blockquote {
  margin-block: 1.1em;
  border-left: 3px solid var(--color-lime);
  border-radius: 0 0.9rem 0.9rem 0;
  background: var(--color-paper-deep);
  padding: 0.9rem 1.1rem;
  color: var(--color-ink);
  font-family: "Space Grotesk", "Manrope", system-ui, sans-serif;
  font-weight: 600;
}

.tiptap a {
  color: var(--color-lime);
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: var(--color-lime-soft);
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
}

.tiptap pre {
  margin-block: 1em;
  overflow-x: auto;
  border-radius: 0.85rem;
  background: var(--color-ink);
  padding: 0.9rem 1rem;
  color: var(--color-paper);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.82rem;
}

.tiptap code {
  border-radius: 0.3rem;
  background: var(--color-paper-deep);
  padding: 0.1em 0.35em;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
}

.tiptap hr {
  margin-block: 1.5em;
  border: 0;
  border-top: 1px solid var(--color-line);
}

.tiptap p.is-editor-empty:first-child::before {
  float: left;
  height: 0;
  color: var(--color-muted);
  content: attr(data-placeholder);
  font-weight: 500;
  pointer-events: none;
}
</style>
