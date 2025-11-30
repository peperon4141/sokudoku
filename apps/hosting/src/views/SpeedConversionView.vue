<template>
  <div class="speed-conversion-view min-h-screen bg-surface-900 flex items-center justify-center">
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

    <div v-if="!selectedWordListId" class="word-list-selection">
      <TextSourceSelector
        @select="handleSourceSelect"
        @cancel="$router.push('/methods')"
      />
    </div>

    <div v-else-if="!isPlaying" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">話速変換トレーニング</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>開始速度: {{ baseWpm }} WPM</p>
        <p>目標速度: {{ targetWpm }} WPM</p>
        <p>現在のセッション: {{ currentSession }} / {{ totalSessions }}</p>
        <p>現在の速度: {{ currentWpm }} WPM ({{ speedMultiplier.toFixed(1) }}x)</p>
      </div>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startSession"
      />
    </div>

    <div v-else class="speed-conversion-display">
      <div class="session-info fixed top-4 left-4 z-50 bg-surface-900 bg-opacity-80 p-4 rounded">
        <div class="text-white text-sm space-y-1">
          <p>セッション: {{ currentSession }} / {{ totalSessions }}</p>
          <p>速度: {{ currentWpm }} WPM ({{ speedMultiplier.toFixed(1) }}x)</p>
          <p>進捗: {{ Math.round(progress) }}%</p>
        </div>
      </div>

      <div
        class="word-display"
        :class="{ 'vertical-layout': layout === 'vertical' }"
        :style="wordStyle"
      >
        {{ currentWord }}
      </div>

      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progress}%` }"
        />
      </div>

      <div class="comprehension-prompt fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div v-if="showComprehensionCheck" class="bg-surface-900 bg-opacity-90 p-4 rounded">
          <p class="text-white mb-2">理解度を評価してください</p>
          <div class="flex gap-2">
            <Button
              v-for="score in [1, 2, 3, 4, 5]"
              :key="score"
              :label="score.toString()"
              :severity="score >= 4 ? 'success' : score >= 3 ? 'warning' : 'danger'"
              size="small"
              @click="recordComprehension(score)"
            />
          </div>
        </div>
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
          <label class="block mb-2 font-medium">レイアウト</label>
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
          <label class="block mb-2 font-medium">開始速度: {{ baseWpm }} WPM</label>
          <Slider
            v-model="baseWpm"
            :min="100"
            :max="300"
            :step="10"
            class="w-full"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">目標速度: {{ targetWpm }} WPM</label>
          <Slider
            v-model="targetWpm"
            :min="200"
            :max="600"
            :step="10"
            class="w-full"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">セッション数: {{ totalSessions }}</label>
          <Slider
            v-model="totalSessions"
            :min="3"
            :max="10"
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
        <div class="flex items-center gap-2">
          <Checkbox
            v-model="autoAdjustSpeed"
            inputId="auto-adjust"
            binary
          />
          <label for="auto-adjust" class="text-sm">理解度に応じて自動調整</label>
        </div>
      </div>
      <template #footer>
        <Button label="閉じる" severity="secondary" @click="showSettingsDialog = false" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showSessionCompleteDialog"
      modal
      header="セッション完了"
      :style="{ width: '700px' }"
    >
      <div class="flex flex-col gap-4">
        <p class="text-surface-700">セッション {{ currentSession }} が完了しました。</p>
        <div class="bg-surface-100 p-4 rounded">
          <p class="font-semibold mb-2">統計情報:</p>
          <ul class="text-sm space-y-1">
            <li>平均理解度: {{ averageComprehension.toFixed(1) }} / 5.0</li>
            <li>最高速度: {{ currentWpm }} WPM</li>
            <li>読了単語数: {{ wordsRead }}語</li>
          </ul>
        </div>
        <div v-if="currentSession < totalSessions" class="text-surface-600 text-sm">
          <p>次のセッションでは速度が {{ nextSpeedMultiplier.toFixed(1) }}x に上がります。</p>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2">
          <Button
            v-if="currentSession < totalSessions"
            label="次のセッション"
            severity="primary"
            @click="startNextSession"
          />
          <Button
            label="もう一度"
            icon="pi pi-refresh"
            severity="secondary"
            @click="restartTraining"
          />
          <Button
            label="戻る"
            icon="pi pi-arrow-left"
            severity="secondary"
            @click="finishTraining"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import TextSourceSelector from '@/components/TextSourceSelector.vue'
import { useWords } from '@/composables/useWords'
import { useTextContent, type TextSource } from '@/composables/useTextContent'
import { useComprehension } from '@/composables/useComprehension'

type Layout = 'horizontal' | 'vertical'

const router = useRouter()
const { words, loadWords } = useWords()
const { loadText } = useTextContent()
const { recordScore, getRecentScores, shouldAdjustSpeed, getAverageScore } = useComprehension()

const selectedWordListId = ref<string | null>(null)
const isPlaying = ref(false)
const currentWord = ref('')
const currentWordIndex = ref(0)
const baseWpm = ref(200)
const targetWpm = ref(400)
const totalSessions = ref(5)
const currentSession = ref(1)
const speedMultiplier = ref(1.0)
const fontSize = ref(48)
const layout = ref<Layout>('horizontal')
const showSettingsDialog = ref(false)
const showComprehensionCheck = ref(false)
const showSessionCompleteDialog = ref(false)
const autoAdjustSpeed = ref(true)
const progress = ref(0)
const wordsRead = ref(0)

let intervalId: number | null = null
let wordArray: string[] = []

const layoutOptions = [
  { label: '横書き', value: 'horizontal' },
  { label: '縦書き', value: 'vertical' }
]

const currentWpm = computed(() => Math.round(baseWpm.value * speedMultiplier.value))
const nextSpeedMultiplier = computed(() => {
  const speedIncrease = (targetWpm.value / baseWpm.value - 1) / totalSessions.value
  return speedMultiplier.value + speedIncrease
})
const averageComprehension = computed(() => {
  return getAverageScore('speed-conversion', undefined)
})

const wordStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  writingMode: layout.value === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
  textOrientation: layout.value === 'vertical' ? 'upright' : 'mixed'
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
    
    if (wordArray.length > 0) {
      currentWord.value = wordArray[0]
    }
  } catch (err) {
    console.error('Error in handleSourceSelect:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    alert(`テキストの読み込みに失敗しました。\n\n${errorMessage}\n\n別のテキストソースを選択してください。`)
    selectedWordListId.value = null
    wordArray = []
  }
}

const calculateSpeedMultiplier = (session: number): number => {
  const speedIncrease = (targetWpm.value / baseWpm.value - 1) / totalSessions.value
  return 1.0 + (speedIncrease * (session - 1))
}

const startSession = () => {
  if (wordArray.length === 0) return
  
  speedMultiplier.value = calculateSpeedMultiplier(currentSession.value)
  isPlaying.value = true
  currentWordIndex.value = 0
  progress.value = 0
  wordsRead.value = 0
  showComprehensionCheck.value = false
  
  const delay = (60 / currentWpm.value) * 1000
  
  const showNextWord = () => {
    if (currentWordIndex.value >= wordArray.length) {
      completeSession()
      return
    }
    
    currentWord.value = wordArray[currentWordIndex.value]
    progress.value = ((currentWordIndex.value + 1) / wordArray.length) * 100
    currentWordIndex.value++
    wordsRead.value++
    
    // 50語ごとに理解度チェック
    if (currentWordIndex.value % 50 === 0 && currentWordIndex.value > 0) {
      pause()
      showComprehensionCheck.value = true
      return
    }
    
    intervalId = window.setTimeout(showNextWord, delay)
  }
  
  showNextWord()
}

const startNextSession = () => {
  showSessionCompleteDialog.value = false
  currentSession.value++
  startSession()
}

const pause = () => {
  if (intervalId !== null) {
    clearTimeout(intervalId)
    intervalId = null
  }
}

const completeSession = () => {
  pause()
  isPlaying.value = false
  showSessionCompleteDialog.value = true
}

const recordComprehension = (score: number) => {
  recordScore(score, 'speed-conversion', currentWpm.value)
  showComprehensionCheck.value = false
  
  // 自動調整が有効な場合、理解度に応じて速度を調整
  if (autoAdjustSpeed.value) {
    const recentScores = getRecentScores(3, 'speed-conversion')
    const adjustment = shouldAdjustSpeed(recentScores)
    
    if (adjustment === 'decrease' && speedMultiplier.value > 0.5) {
      speedMultiplier.value = Math.max(0.5, speedMultiplier.value - 0.1)
    } else if (adjustment === 'increase' && speedMultiplier.value < 3.0) {
      speedMultiplier.value = Math.min(3.0, speedMultiplier.value + 0.05)
    }
  }
  
  // 読み続ける
  if (currentWordIndex.value < wordArray.length) {
    startSession()
  }
}

const restartTraining = () => {
  showSessionCompleteDialog.value = false
  currentSession.value = 1
  speedMultiplier.value = 1.0
  wordsRead.value = 0
  currentWordIndex.value = 0
  progress.value = 0
}

const finishTraining = () => {
  showSessionCompleteDialog.value = false
  currentSession.value = 1
  speedMultiplier.value = 1.0
  wordsRead.value = 0
  router.push('/methods')
}

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const wordListId = urlParams.get('wordList')
  if (wordListId) {
    selectedWordListId.value = wordListId
  }
})

onUnmounted(() => {
  pause()
})
</script>

<style scoped>
.speed-conversion-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.speed-conversion-display {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.word-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
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

.session-info {
  backdrop-filter: blur(10px);
}
</style>

