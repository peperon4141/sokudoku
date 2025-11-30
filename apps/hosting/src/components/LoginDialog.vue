<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    class="w-[25rem] max-w-[90vw] p-4"
    :closable="true"
    :dismissable-mask="true"
    :draggable="false"
    :resizable="false"
    @hide="closeModal"
  >
    <template #header>
      <h2 class="text-xl font-bold">速読アプリ</h2>
    </template>

    <p class="mb-6">
      速読アプリで単語を飛ばして練習しましょう。
      Googleアカウントでログインしてください。
    </p>
    
    <!-- Google Login Button -->
    <Button
      @click="handleGoogleLogin"
      :loading="loading"
      :disabled="loading"
      class="w-full mb-4"
      severity="primary"
      icon="pi pi-google"
      label="Googleでログイン"
      aria-label="Googleでログイン"
    />
    
    <!-- Error Message -->
    <Message v-if="error" severity="error" class="mt-4">
      {{ error }}
    </Message>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuth } from '@/composables/useAuth'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const { loginWithGoogle, loading, error, clearError, isAuthenticated } = useAuth()
const loginSuccess = ref(false)

const isOpen = computed({ get: () => props.isOpen, set: (value) => { if (!value) emit('close') } })

const closeModal = () => {
  clearError()
  loginSuccess.value = false
  emit('close')
}

// ログイン成功後、認証状態が更新されたら進捗管理にリダイレクト
watch(isAuthenticated, (authenticated) => {
  if (authenticated && loginSuccess.value) {
    closeModal()
    router.push('/progress')
  }
})

const handleGoogleLogin = async () => {
  try {
    clearError()
    loginSuccess.value = true
    await loginWithGoogle()
    // リダイレクトはwatchで処理される
  } catch {
    loginSuccess.value = false
    // Error is handled by the composable
  }
}
</script>

