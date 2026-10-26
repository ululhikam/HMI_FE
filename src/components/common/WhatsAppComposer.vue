<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { buildWhatsAppUrl, isValidWhatsAppNumber } from '@/utils/whatsapp'

const props = withDefaults(
  defineProps<{
    recipientName: string
    phone?: string | null
    defaultMessage: string
    eyebrow?: string
    title?: string
  }>(),
  {
    phone: '',
    eyebrow: 'Pendaftar',
    title: 'Kirim pesan WhatsApp',
  },
)

const emit = defineEmits<{ close: [] }>()

const message = ref(props.defaultMessage)
const textarea = ref<HTMLTextAreaElement | null>(null)

const validNumber = computed(() => isValidWhatsAppNumber(props.phone))
const canSend = computed(() => validNumber.value && message.value.trim().length > 0)
const changed = computed(() => message.value !== props.defaultMessage)

function resetMessage() {
  message.value = props.defaultMessage
  textarea.value?.focus()
}

function openWhatsApp() {
  if (!canSend.value) return
  const url = buildWhatsAppUrl(props.phone, message.value)
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
  emit('close')
}

onMounted(() => {
  textarea.value?.focus()
  textarea.value?.setSelectionRange(message.value.length, message.value.length)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="wa-composer" appear>
      <div
        class="fixed inset-0 z-[110] flex items-center justify-center bg-ink/80 p-3 backdrop-blur-sm sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wa-composer-title"
        @click.self="emit('close')"
        @keydown.esc="emit('close')"
      >
        <div class="modal-viewport flex w-full max-w-lg flex-col overflow-hidden rounded-[1.6rem] border border-line bg-paper shadow-2xl">
          <div class="flex flex-shrink-0 items-start justify-between gap-4 border-b border-line bg-white px-5 py-4">
            <div class="flex min-w-0 items-center gap-3">
              <span class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-lime text-white">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2a9.9 9.9 0 00-8.5 15.02L2 22l5.1-1.5A9.9 9.9 0 1012.04 2zm0 18.1a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.02.89.9-2.95-.2-.31A8.2 8.2 0 1112.04 20.1zm4.5-6.14c-.25-.13-1.47-.73-1.7-.81-.23-.09-.4-.13-.56.12-.17.25-.64.81-.78.98-.14.16-.29.18-.53.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.12.17 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.23-.17-.48-.3z" />
                </svg>
              </span>
              <div class="min-w-0">
                <p class="text-[8px] font-black uppercase tracking-[0.16em] text-moss">{{ eyebrow }}</p>
                <h2 id="wa-composer-title" class="mt-1 truncate font-display text-lg font-bold tracking-tight text-ink">{{ title }}</h2>
                <p class="mt-0.5 truncate text-[9px] font-semibold text-muted">{{ recipientName }}</p>
              </div>
            </div>
            <button
              type="button"
              class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
              aria-label="Tutup"
              @click="emit('close')"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto space-y-3 p-5">
            <p class="text-[11px] font-semibold leading-relaxed text-muted">
              Sunting pesan sebelum dikirim. WhatsApp akan terbuka dengan isi pesan ini; tekan kirim di aplikasi WhatsApp Anda.
            </p>

            <div>
              <div class="flex items-center justify-between gap-3">
                <label for="wa-composer-message" class="admin-label mb-0">Isi pesan</label>
                <span class="text-[8px] font-bold tabular-nums tracking-[0.08em] text-muted">{{ message.length }}/4000</span>
              </div>
              <textarea
                id="wa-composer-message"
                ref="textarea"
                v-model="message"
                rows="10"
                maxlength="4000"
                class="admin-input mt-1.5 min-h-[13rem] resize-y font-medium leading-relaxed"
              />
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 rounded-[0.9rem] bg-paper px-3 py-2.5">
              <p class="text-[9px] font-semibold leading-relaxed text-muted">
                Nomor tujuan: <span class="font-extrabold text-ink">{{ phone || 'Belum diisi' }}</span>
              </p>
              <button
                v-if="changed"
                type="button"
                class="text-[9px] font-extrabold uppercase tracking-[0.08em] text-moss underline-offset-2 hover:underline"
                @click="resetMessage"
              >
                Pulihkan pesan awal
              </button>
            </div>

            <p
              v-if="!validNumber"
              class="rounded-[0.9rem] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] font-semibold leading-relaxed text-amber-700"
            >
              Nomor WhatsApp penerima belum tersedia atau tidak valid. Perbarui nomor terlebih dahulu agar pesan dapat dikirim.
            </p>
            <p
              v-else-if="!message.trim()"
              class="rounded-[0.9rem] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] font-semibold leading-relaxed text-amber-700"
            >
              Isi pesan tidak boleh kosong.
            </p>
          </div>

          <div class="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-white px-5 py-4">
            <button type="button" class="admin-btn admin-btn-ghost" @click="emit('close')">Nanti</button>
            <button type="button" class="admin-btn admin-btn-lime disabled:cursor-not-allowed disabled:opacity-60" :disabled="!canSend" @click="openWhatsApp">
              Buka WhatsApp
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M7 17L17 7M7 7h10v10" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.wa-composer-enter-active,
.wa-composer-leave-active {
  transition: opacity 200ms ease;
}
.wa-composer-enter-active > div,
.wa-composer-leave-active > div {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease;
}
.wa-composer-enter-from,
.wa-composer-leave-to {
  opacity: 0;
}
.wa-composer-enter-from > div,
.wa-composer-leave-to > div {
  transform: translateY(14px) scale(0.985);
  opacity: 0;
}
</style>
