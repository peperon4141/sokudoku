<template>
  <div class="activeread-view min-h-screen bg-surface-900">
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
        @click="$router.push('/')"
        aria-label="戻る"
      />
    </div>

    <div v-if="!selectedWordListId" class="word-list-selection min-h-screen flex items-center justify-center p-8">
      <TextSourceSelector
        @select="handleSourceSelect"
        @cancel="$router.push('/')"
      />
    </div>

    <div v-else-if="!isPlaying" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">ActiveRead（右脳速読）</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>表示モード: {{ displayMode === 'whole' ? '全体把握' : 'イメージ処理' }}</p>
        <p>速度: {{ wpm }} WPM</p>
        <p>表示範囲: {{ displayRange }}語</p>
      </div>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startReading"
      />
    </div>

    <div v-else class="activeread-display">
      <!-- 全体把握モード -->
      <div v-if="displayMode === 'whole'" class="whole-display">
        <div
          class="whole-text"
          :style="wholeTextStyle"
        >
          {{ displayedText }}
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>

      <!-- イメージ処理モード -->
      <div v-else class="image-display">
        <div
          class="image-chunk"
          :style="imageChunkStyle"
        >
          {{ currentChunk }}
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showComprehensionDialog"
      modal
      header="理解度テスト"
      :style="{ width: '700px' }"
    >
      <div class="flex flex-col gap-4">
        <p class="text-surface-700">読んだ内容を理解できましたか？</p>
        <div class="flex gap-2">
          <Button
            v-for="score in [1, 2, 3, 4, 5]"
            :key="score"
            :label="score.toString()"
            :severity="score >= 4 ? 'success' : score >= 3 ? 'warning' : 'danger'"
            @click="recordComprehension(score)"
          />
        </div>
        <p class="text-sm text-surface-600">1: 全く理解できなかった 〜 5: 完全に理解できた</p>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showSettingsDialog"
      modal
      header="設定"
      :style="{ width: '600px' }"
    >
      <div class="flex flex-col gap-6">
        <div>
          <label class="block mb-2 font-medium">表示モード</label>
          <SelectButton
            v-model="displayMode"
            :options="displayModes"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">速度: {{ wpm }} WPM</label>
          <Slider
            v-model="wpm"
            :min="200"
            :max="600"
            :step="10"
            class="w-full"
          />
        </div>
        <div v-if="displayMode === 'whole'">
          <label class="block mb-2 font-medium">表示範囲: {{ displayRange }}語</label>
          <Slider
            v-model="displayRange"
            :min="5"
            :max="20"
            :step="1"
            class="w-full"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">フォントサイズ: {{ fontSize }}px</label>
          <Slider
            v-model="fontSize"
            :min="24"
            :max="72"
            :step="4"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="閉じる" severity="secondary" @click="showSettingsDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import SelectButton from 'primevue/selectbutton'
import TextSourceSelector from '@/components/TextSourceSelector.vue'
import { useWords } from '@/composables/useWords'
import { useTextContent, type TextSource } from '@/composables/useTextContent'
import { useComprehension } from '@/composables/useComprehension'

const { words, loadWords } = useWords()
const { loadText } = useTextContent()
const { recordScore } = useComprehension()

const selectedWordListId = ref<string | null>(null)
const isPlaying = ref(false)
const displayMode = ref<'whole' | 'image'>('whole')
const wpm = ref(400)
const displayRange = ref(10)
const fontSize = ref(48)
const showSettingsDialog = ref(false)
const showComprehensionDialog = ref(false)
const progress = ref(0)

const displayedText = ref('')
const currentChunk = ref('')
const currentIndex = ref(0)

const displayModes = [
  { label: '全体把握', value: 'whole' },
  { label: 'イメージ処理', value: 'image' }
]

let intervalId: number | null = null
let wordArray: string[] = []
let chunks: string[] = []

const wholeTextStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
  lineHeight: '2',
  maxWidth: '90%',
  margin: '0 auto'
}))

const imageChunkStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
  lineHeight: '1.5'
}))

const handleSourceSelect = async (source: TextSource | { id: string; type: 'words' }) => {
  if ('type' in source && source.type === 'words') {
    selectedWordListId.value = source.id
    await loadWords(source.id)
    wordArray = [...words.value]
  } else {
    const textSource = source as TextSource
    selectedWordListId.value = textSource.id
    const content = await loadText(textSource)
    wordArray = content.words
  }
  
  // チャンクを作成（イメージ処理モード用）
  createChunks()
}

const createChunks = () => {
  chunks = []
  const chunkSize = 5
  for (let i = 0; i < wordArray.length; i += chunkSize) {
    const chunk = wordArray.slice(i, i + chunkSize).join(' ')
    chunks.push(chunk)
  }
}

const startReading = () => {
  if (wordArray.length === 0) return
  
  isPlaying.value = true
  currentIndex.value = 0
  progress.value = 0
  
  if (displayMode.value === 'whole') {
    startWholeMode()
  } else {
    startImageMode()
  }
}

const startWholeMode = () => {
  const delay = (60 / wpm.value) * 1000
  
  const showNext = () => {
    if (currentIndex.value >= wordArray.length) {
      stopReading()
      return
    }
    
    const endIndex = Math.min(currentIndex.value + displayRange.value, wordArray.length)
    displayedText.value = wordArray.slice(currentIndex.value, endIndex).join(' ')
    progress.value = ((endIndex) / wordArray.length) * 100
    currentIndex.value = endIndex
    
    // 50語ごとに理解度テスト
    if (currentIndex.value % 50 === 0 && currentIndex.value > 0) {
      pauseReading()
      showComprehensionDialog.value = true
      return
    }
    
    intervalId = window.setTimeout(showNext, delay)
  }
  
  showNext()
}

const startImageMode = () => {
  const delay = (60 / wpm.value) * 1000
  
  const showNext = () => {
    if (currentIndex.value >= chunks.length) {
      stopReading()
      return
    }
    
    currentChunk.value = chunks[currentIndex.value]
    progress.value = ((currentIndex.value + 1) / chunks.length) * 100
    currentIndex.value++
    
    // 20チャンクごとに理解度テスト
    if (currentIndex.value % 20 === 0 && currentIndex.value > 0) {
      pauseReading()
      showComprehensionDialog.value = true
      return
    }
    
    intervalId = window.setTimeout(showNext, delay)
  }
  
  showNext()
}

const pauseReading = () => {
  if (intervalId !== null) {
    clearTimeout(intervalId)
    intervalId = null
  }
}

const stopReading = () => {
  pauseReading()
  isPlaying.value = false
  displayedText.value = ''
  currentChunk.value = ''
  currentIndex.value = 0
  progress.value = 0
}

const recordComprehension = (score: number) => {
  recordScore(score, 'activeread', wpm.value)
  showComprehensionDialog.value = false
  
  // 読み続ける
  if (displayMode.value === 'whole' && currentIndex.value < wordArray.length) {
    startReading()
  } else if (displayMode.value === 'image' && currentIndex.value < chunks.length) {
    startReading()
  }
}

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const wordListId = urlParams.get('wordList')
  if (wordListId) {
    handleSourceSelect({ id: wordListId, type: 'words' })
  }
})

onUnmounted(() => {
  stopReading()
})
</script>

<style scoped>
.activeread-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.activeread-display {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.whole-display,
.image-display {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.whole-text {
  max-width: 90%;
  word-break: keep-all;
}

.image-chunk {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  max-width: 80%;
}

.progress-bar {
  position: fixed;
  bottom: 0;
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

.ready-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.word-list-selection {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>

