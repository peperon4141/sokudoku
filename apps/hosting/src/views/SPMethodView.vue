<template>
  <div class="sp-method-view min-h-screen bg-surface-900">
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
        @select="handleSourceSelect"
        @cancel="$router.push('/methods')"
      />
    </div>

    <div v-else-if="!isPlaying && !isCompleted" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">SP速読学院メソッド</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>視野拡大トレーニング</p>
        <p>速度: {{ wpm }} WPM</p>
        <p>視野範囲: {{ fieldOfView }}語</p>
        <p>レベル: {{ level }}</p>
      </div>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startReading"
      />
    </div>

    <div v-else-if="!isPlaying && isCompleted" class="completed-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">読み取り完了</h2>
      <p class="text-white mb-6">{{ wordArray.length }}語を読み取りました</p>
      <div class="flex gap-4 justify-center">
        <Button
          label="もう一度"
          icon="pi pi-refresh"
          severity="secondary"
          @click="restartReading"
        />
        <Button
          label="戻る"
          icon="pi pi-arrow-left"
          severity="secondary"
          @click="$router.push('/methods')"
        />
      </div>
    </div>

    <div v-else class="sp-display">
      <div class="field-of-view-container">
        <div
          class="field-of-view-text"
          :style="fieldOfViewStyle"
        >
          {{ displayedText }}
        </div>
        <div class="focus-indicator" :style="focusIndicatorStyle"></div>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progress}%` }"
        />
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
          <label class="block mb-2 font-medium">レベル: {{ level }}</label>
          <Slider
            v-model="level"
            :min="1"
            :max="5"
            :step="1"
            class="w-full"
          />
          <p class="text-sm text-surface-600 mt-2">{{ levelDescriptions[level - 1] }}</p>
        </div>
        <div>
          <label class="block mb-2 font-medium">速度: {{ wpm }} WPM</label>
          <Slider
            v-model="wpm"
            :min="200"
            :max="800"
            :step="10"
            class="w-full"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">視野範囲: {{ fieldOfView }}語</label>
          <Slider
            v-model="fieldOfView"
            :min="3"
            :max="15"
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
import TextSourceSelector from '@/components/TextSourceSelector.vue'
import { useWords } from '@/composables/useWords'
import { useTextContent, type TextSource } from '@/composables/useTextContent'
import { useComprehension } from '@/composables/useComprehension'

const { words, loadWords } = useWords()
const { loadText } = useTextContent()
const { recordScore } = useComprehension()

const selectedWordListId = ref<string | null>(null)
const isPlaying = ref(false)
const isCompleted = ref(false)
const level = ref(1)
const wpm = ref(400)
const fieldOfView = ref(5)
const fontSize = ref(48)
const showSettingsDialog = ref(false)
const showComprehensionDialog = ref(false)
const progress = ref(0)

const displayedText = ref('')
const currentIndex = ref(0)

const levelDescriptions = [
  '初心者（視野3-5語）',
  '初級（視野5-7語）',
  '中級（視野7-10語）',
  '上級（視野10-12語）',
  '熟練（視野12-15語）'
]

let intervalId: number | null = null
let wordArray: string[] = []

const fieldOfViewStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  lineHeight: '2',
  maxWidth: '90%',
  margin: '0 auto',
  padding: '2rem',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '8px',
  backgroundColor: 'rgba(0, 0, 0, 0.3)'
}))

const focusIndicatorStyle = computed(() => ({
  width: `${fieldOfView.value * 60}px`,
  height: '4px',
  backgroundColor: '#3b82f6',
  position: 'absolute' as const,
  bottom: '1rem',
  left: '50%',
  transform: 'translateX(-50%)',
  borderRadius: '2px',
  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
}))

const handleSourceSelect = async (source: TextSource | { id: string; type: 'words' }) => {
  try {
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
    
    // レベルに応じて視野範囲を調整
    updateFieldOfViewByLevel()
  } catch (err) {
    console.error('Error in handleSourceSelect:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    alert(`テキストの読み込みに失敗しました。\n\n${errorMessage}\n\n別のテキストソースを選択してください。`)
    selectedWordListId.value = null
    wordArray = []
  }
}

const updateFieldOfViewByLevel = () => {
  const levelRanges: Record<number, [number, number]> = {
    1: [3, 5],
    2: [5, 7],
    3: [7, 10],
    4: [10, 12],
    5: [12, 15]
  }
  const [min, max] = levelRanges[level.value] || [3, 5]
  fieldOfView.value = Math.min(max, Math.max(min, fieldOfView.value))
}

const startReading = () => {
  if (wordArray.length === 0) return
  
  isPlaying.value = true
  currentIndex.value = 0
  progress.value = 0
  
  const delay = (60 / wpm.value) * 1000
  
  const showNext = () => {
    if (currentIndex.value >= wordArray.length) {
      stopReading()
      return
    }
    
    const endIndex = Math.min(currentIndex.value + fieldOfView.value, wordArray.length)
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

const pauseReading = () => {
  if (intervalId !== null) {
    clearTimeout(intervalId)
    intervalId = null
  }
}

const stopReading = () => {
  pauseReading()
  isPlaying.value = false
  isCompleted.value = true
  displayedText.value = ''
  currentIndex.value = 0
  progress.value = 100
}

const restartReading = () => {
  isCompleted.value = false
  currentIndex.value = 0
  progress.value = 0
  displayedText.value = ''
}

const recordComprehension = (score: number) => {
  recordScore(score, 'sp-method', wpm.value)
  showComprehensionDialog.value = false
  
  // 理解度に応じてレベル調整
  const recentScores = [score] // 簡易版
  const avg = recentScores.reduce((acc, s) => acc + s, 0) / recentScores.length
  
  if (avg >= 4 && level.value < 5) {
    level.value++
    updateFieldOfViewByLevel()
  } else if (avg <= 2 && level.value > 1) {
    level.value--
    updateFieldOfViewByLevel()
  }
  
  // 読み続ける
  if (currentIndex.value < wordArray.length) {
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
.sp-method-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.sp-display {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.field-of-view-container {
  position: relative;
  width: 100%;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.field-of-view-text {
  word-break: keep-all;
  transition: all 0.3s ease;
}

.focus-indicator {
  transition: width 0.3s ease;
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

.completed-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>

