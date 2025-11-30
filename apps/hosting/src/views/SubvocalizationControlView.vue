<template>
  <div class="subvocalization-control-view min-h-screen bg-surface-900 flex items-center justify-center">
    <div class="fixed top-4 right-4 z-50 flex gap-2">
      <Button
        icon="pi pi-cog"
        severity="secondary"
        outlined
        rounded
        @click="showSettingsDialog = true"
        aria-label="設定"
      />
      <Button
        icon="pi pi-arrow-left"
        severity="secondary"
        outlined
        rounded
        @click="$router.push('/methods')"
        aria-label="戻る"
      />
    </div>

    <div v-if="!isPlaying && !selectedSource && !isCompleted" class="word-list-selection">
      <TextSourceSelector
        @select="handleSourceSelect"
        @cancel="$router.push('/methods')"
      />
    </div>

    <div v-else-if="!isPlaying && !isCompleted" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">内音声のコントロール</h2>
      <p class="text-white mb-2">レベル: {{ level }}</p>
      <p class="text-white mb-2">表示速度: {{ wpm }} WPM</p>
      <p class="text-white mb-2" v-if="wordArray.length > 0">読み込み済み: {{ wordArray.length }}語</p>
      <p class="text-white mb-6">目標: 音読せずに視覚的に読む習慣を身につける</p>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        :disabled="wordArray.length === 0"
        @click="startTraining"
      />
      <p v-if="wordArray.length === 0" class="text-white mt-4 text-sm opacity-75">テキストを選択してください</p>
    </div>

    <div v-else-if="isPlaying" class="training-screen">
      <div class="relative w-full h-screen flex items-center justify-center">
        <div class="text-center">
          <div
            class="text-5xl font-bold text-white mb-8"
            :class="{ 'vertical-layout': layout === 'vertical' }"
            :style="wordStyle"
          >
            {{ currentWord }}
          </div>
          <div class="mt-8 text-white">
            <p>レベル: {{ level }}</p>
            <p>残り: {{ remainingTime }}秒</p>
            <p>読了: {{ wordIndex }} / {{ wordArray.length }}</p>
            <p class="text-sm text-surface-400 mt-4">
              内音声を意識せず、視覚的に文字を認識してください
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isCompleted" class="completed-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">トレーニング完了</h2>
      <p class="text-white mb-2">読了単語数: {{ wordArray.length }}</p>
      <p class="text-white mb-2">平均速度: {{ averageWpm.toFixed(0) }} WPM</p>
      <div class="flex gap-4 justify-center">
        <Button
          label="もう一度"
          icon="pi pi-refresh"
          severity="primary"
          @click="resetTraining"
        />
        <Button
          label="戻る"
          icon="pi pi-arrow-left"
          severity="secondary"
          @click="$router.push('/methods')"
        />
      </div>
    </div>

    <Dialog
      v-model:visible="showSettingsDialog"
      modal
      header="設定"
      :style="{ width: '400px' }"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label class="block mb-2 text-white">レイアウト</label>
          <Select
            v-model="layout"
            :options="layoutOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            :disabled="isPlaying"
          />
        </div>
        <div>
          <label class="block mb-2 text-white">レベル</label>
          <Select
            v-model="level"
            :options="levels"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            :disabled="isPlaying"
            @change="updateWpm"
          />
        </div>
        <div>
          <label class="block mb-2 text-white">表示速度 (WPM)</label>
          <InputNumber
            v-model="wpm"
            :min="100"
            :max="1000"
            :step="50"
            :disabled="isPlaying"
            class="w-full"
          />
        </div>
        <div>
          <label class="block mb-2 text-white">トレーニング時間 (秒)</label>
          <InputNumber
            v-model="trainingDuration"
            :min="10"
            :max="300"
            :step="10"
            :disabled="isPlaying"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="閉じる"
          severity="secondary"
          @click="showSettingsDialog = false"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import { useTextContent } from '@/composables/useTextContent'
import TextSourceSelector from '@/components/TextSourceSelector.vue'
import type { TextSource } from '@/composables/useTextContent'

type Layout = 'horizontal' | 'vertical'

const { loadText } = useTextContent()

const isPlaying = ref(false)
const isCompleted = ref(false)
const showSettingsDialog = ref(false)
const layout = ref<Layout>('horizontal')
const level = ref(1)
const wpm = ref(300)
const trainingDuration = ref(60)
const currentWord = ref('')
const wordArray = ref<string[]>([])
const wordIndex = ref(0)
const remainingTime = ref(60)
const selectedSource = ref<TextSource | null>(null)

const layoutOptions = [
  { label: '横書き', value: 'horizontal' },
  { label: '縦書き', value: 'vertical' }
]

const levels = [
  { label: 'レベル1（200 WPM）', value: 1 },
  { label: 'レベル2（300 WPM）', value: 2 },
  { label: 'レベル3（400 WPM）', value: 3 },
  { label: 'レベル4（500 WPM）', value: 4 },
  { label: 'レベル5（600 WPM）', value: 5 }
]

const averageWpm = computed(() => {
  if (wordIndex.value === 0) return 0
  const elapsed = trainingDuration.value - remainingTime.value
  if (elapsed === 0) return 0
  return (wordIndex.value / elapsed) * 60
})

const wordStyle = computed(() => ({
  letterSpacing: '0.1em',
  writingMode: layout.value === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
  textOrientation: layout.value === 'vertical' ? 'upright' : 'mixed'
}))

const updateWpm = () => {
  const wpmMap: Record<number, number> = {
    1: 200,
    2: 300,
    3: 400,
    4: 500,
    5: 600
  }
  wpm.value = wpmMap[level.value] || 300
}

const handleSourceSelect = async (source: TextSource | { id: string; type: 'words' }) => {
  if (source.type === 'words') {
    return
  }
  selectedSource.value = source
  try {
    const content = await loadText(source)
    wordArray.value = content.words
  } catch (err) {
    console.error('Failed to load text:', err)
  }
}

let wordInterval: number | null = null
let timerInterval: number | null = null

const startTraining = () => {
  if (wordArray.value.length === 0) {
    return
  }
  isPlaying.value = true
  isCompleted.value = false
  wordIndex.value = 0
  remainingTime.value = trainingDuration.value
  currentWord.value = wordArray.value[0]

  const intervalMs = (60 / wpm.value) * 1000

  wordInterval = window.setInterval(() => {
    wordIndex.value++
    if (wordIndex.value >= wordArray.value.length) {
      stopTraining()
      return
    }
    currentWord.value = wordArray.value[wordIndex.value]
  }, intervalMs)

  timerInterval = window.setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      stopTraining()
    }
  }, 1000)
}

const stopTraining = () => {
  if (wordInterval !== null) {
    clearInterval(wordInterval)
    wordInterval = null
  }
  if (timerInterval !== null) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  isPlaying.value = false
  isCompleted.value = true
}

const resetTraining = () => {
  isCompleted.value = false
  wordIndex.value = 0
  remainingTime.value = trainingDuration.value
}

onMounted(() => {
  updateWpm()
})

onUnmounted(() => {
  if (wordInterval !== null) {
    clearInterval(wordInterval)
  }
  if (timerInterval !== null) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.subvocalization-control-view {
  font-family: 'Noto Sans JP', sans-serif;
}
</style>

