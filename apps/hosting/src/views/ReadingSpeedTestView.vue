<template>
  <div class="reading-speed-test-view min-h-screen bg-surface-900">
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

    <div v-if="!selectedWordListId" class="word-list-selection min-h-screen flex items-center justify-center p-8">
      <TextSourceSelector
        mode="text"
        @select="handleSourceSelect"
        @cancel="$router.push('/methods')"
      />
    </div>

    <div v-else-if="!isPlaying && !isCompleted && !showResult" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">読書スピード計測</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>普段どおりの読み方で読んでください</p>
        <p v-if="wordArray.length > 0" class="text-sm">読み込み済み: {{ wordArray.length }}語</p>
      </div>
      <Button
        label="計測開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        :disabled="wordArray.length === 0"
        @click="startTest"
      />
      <p v-if="wordArray.length === 0" class="text-white mt-4 text-sm opacity-75">テキストを選択してください</p>
    </div>

    <div v-else-if="isPlaying" class="reading-display">
      <div class="text-display-container">
        <div
          ref="textContainer"
          class="text-display"
          :style="{ fontSize: `${fontSize}px` }"
        >
          <span
            v-for="(word, index) in wordArray"
            :key="index"
            class="word-span"
          >
            {{ word }}
          </span>
        </div>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <div class="timer-display">
        <p class="text-white text-2xl font-bold">{{ elapsedTime }}秒</p>
        <p class="text-white text-sm">読書速度: {{ currentSpeed }} WPM</p>
        <p class="text-white text-xs mt-2">読み終わったらスペースキーを押してください</p>
      </div>
      <div class="stop-button-container">
        <Button
          label="読み終わった"
          icon="pi pi-check"
          severity="success"
          size="large"
          @click="stopTest"
        />
      </div>
    </div>

    <div v-else-if="showResult" class="result-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">計測完了</h2>
      <div class="mb-6 space-y-4 text-white">
        <div>
          <p class="text-2xl font-bold text-primary">{{ finalSpeed }} WPM</p>
          <p class="text-sm">読書速度</p>
        </div>
        <div>
          <p class="text-lg">{{ wordCount }}語 / {{ elapsedTime }}秒</p>
        </div>
        <div>
          <p class="text-sm">理解度: {{ comprehensionScore }}%</p>
        </div>
      </div>
      <div class="flex gap-4 justify-center">
        <Button
          label="もう一度"
          icon="pi pi-refresh"
          severity="secondary"
          @click="restartTest"
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
      :style="{ width: '600px' }"
    >
      <div class="flex flex-col gap-6">
        <div>
          <label class="block mb-2 font-medium">フォントサイズ: {{ fontSize }}px</label>
          <Slider
            v-model="fontSize"
            :min="16"
            :max="32"
            :step="2"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="閉じる" severity="secondary" @click="showSettingsDialog = false" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showComprehensionDialog"
      modal
      header="理解度テスト"
      :style="{ width: '700px' }"
    >
      <div class="flex flex-col gap-4">
        <p class="text-surface-700">読んだ内容について、どの程度理解できましたか？</p>
        <div>
          <label class="block mb-2 font-medium">理解度: {{ comprehensionScore }}%</label>
          <Slider
            v-model="comprehensionScore"
            :min="0"
            :max="100"
            :step="5"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="確定" severity="primary" @click="finishTest" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import TextSourceSelector from '@/components/TextSourceSelector.vue'
import { useTextContent, type TextSource } from '@/composables/useTextContent'
import { useWords } from '@/composables/useWords'

const { loadText } = useTextContent()
const { words, loadWords } = useWords()

const selectedWordListId = ref<string | null>(null)
const wordArray = ref<string[]>([])
const isPlaying = ref(false)
const isCompleted = ref(false)
const showResult = ref(false)
const fontSize = ref(20)
const showSettingsDialog = ref(false)
const showComprehensionDialog = ref(false)
const progress = ref(0)
const startTime = ref<Date | null>(null)
const elapsedTime = ref(0)
const comprehensionScore = ref(80)
const textContainer = ref<HTMLElement | null>(null)

let timerInterval: number | null = null

const currentSpeed = computed(() => {
  if (elapsedTime.value === 0) return 0
  return Math.round((wordArray.value.length / elapsedTime.value) * 60)
})

const wordCount = ref(0)

const finalSpeed = computed(() => {
  if (elapsedTime.value === 0) return 0
  return Math.round((wordCount.value / elapsedTime.value) * 60)
})

const handleSourceSelect = async (source: TextSource | { id: string; type: 'words' }) => {
  try {
    if ('type' in source && source.type === 'words') {
      // 単語リストの場合
      selectedWordListId.value = source.id
      await loadWords(source.id)
      wordArray.value = [...words.value]
    } else {
      // テキストソースの場合
      const textSource = source as TextSource
      selectedWordListId.value = textSource.id
      const content = await loadText(textSource)
      wordArray.value = content.words
    }
  } catch (err) {
    console.error('Error loading text:', err)
    alert(`テキストの読み込みに失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    selectedWordListId.value = null
    wordArray.value = []
  }
}

const startTest = () => {
  if (wordArray.value.length === 0) return
  
  isPlaying.value = true
  isCompleted.value = false
  showResult.value = false
  progress.value = 0
  startTime.value = new Date()
  elapsedTime.value = 0
  wordCount.value = 0
  
  // タイマー開始
  timerInterval = window.setInterval(() => {
    if (startTime.value) {
      elapsedTime.value = Math.floor((new Date().getTime() - startTime.value.getTime()) / 1000)
    }
  }, 100)
  
  // ユーザーが自由に読めるように、自動スクロールは行わない
  // ユーザーが読み終わったら「読み終わった」ボタンを押す
}

// 読書スピード計測では、ユーザーが自由に読めるため、自動スクロールは不要

const stopTest = () => {
  if (timerInterval !== null) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  if (scrollInterval !== null) {
    clearInterval(scrollInterval)
    scrollInterval = null
  }
  
  // 全単語を読んだと仮定（実際にはユーザーが読み終わった時点）
  wordCount.value = wordArray.value.length
  
  isPlaying.value = false
  showComprehensionDialog.value = true
}

const finishTest = () => {
  showComprehensionDialog.value = false
  showResult.value = true
  isCompleted.value = true
  progress.value = 100
}

const restartTest = () => {
  showResult.value = false
  isCompleted.value = false
  progress.value = 0
  elapsedTime.value = 0
  wordCount.value = 0
  comprehensionScore.value = 80
  if (textContainer.value) {
    textContainer.value.scrollTop = 0
  }
}

// キーボードショートカット: スペースキーで停止
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.code === 'Space' && isPlaying.value) {
    event.preventDefault()
    stopTest()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

watch(() => isPlaying.value, (playing) => {
  if (!playing) {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (scrollInterval !== null) {
      clearInterval(scrollInterval)
      scrollInterval = null
    }
  }
})
</script>

<style scoped>
.reading-speed-test-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.reading-display {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.text-display-container {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background-color: var(--surface-900);
}

.text-display {
  max-width: 800px;
  margin: 0 auto;
  color: #ffffff;
  line-height: 2;
  word-break: break-word;
}

.word-span {
  margin-right: 0.25em;
  transition: background-color 0.2s ease;
}

.current-word {
  background-color: rgba(59, 130, 246, 0.5);
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
}

.progress-bar {
  position: fixed;
  bottom: 60px;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.2);
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.timer-display {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
}

.stop-button-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.ready-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.result-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>

