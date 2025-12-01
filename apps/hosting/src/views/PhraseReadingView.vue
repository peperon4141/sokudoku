<template>
  <div class="phrase-reading-view min-h-screen bg-surface-900">
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

    <div v-else-if="!isPlaying && !isCompleted" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">文節読みトレーニング</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>インターチェンジ効果を利用したトレーニングです</p>
        <p class="text-sm">現在の速度: {{ currentWpm }} WPM</p>
        <p class="text-sm">段階: {{ currentPhase }}</p>
      </div>
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

    <div v-else-if="isPlaying" class="training-display">
      <div class="phase-indicator">
        <p class="text-white text-xl font-bold">{{ currentPhase }}</p>
        <p class="text-white text-sm">{{ phaseDescription }}</p>
      </div>
      <div class="word-display-container">
        <div
          v-if="currentPhrase"
          class="word-display"
          :style="wordStyle"
        >
          {{ currentPhrase }}
        </div>
      </div>
      <div class="speed-indicator">
        <p class="text-white text-2xl font-bold">{{ currentWpm }} WPM</p>
        <p class="text-white text-sm">経過時間: {{ elapsedTime }}秒</p>
      </div>
      <div class="progress-info">
        <p class="text-white text-sm">{{ currentIndex + 1 }} / {{ phraseArray.length }}</p>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </div>

    <div v-else-if="isCompleted" class="completed-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">トレーニング完了</h2>
      <div class="mb-6 space-y-4 text-white">
        <div>
          <p class="text-lg">最初の限界速度: {{ initialLimitSpeed }} WPM</p>
          <p class="text-lg">最終速度: {{ finalSpeed }} WPM</p>
          <p v-if="finalSpeed > initialLimitSpeed" class="text-primary text-xl font-bold">
            速度が {{ (finalSpeed - initialLimitSpeed).toFixed(0) }} WPM 向上しました！
          </p>
        </div>
      </div>
      <div class="flex gap-4 justify-center">
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
          <label class="block mb-2 font-medium">初期速度: {{ initialWpm }} WPM</label>
          <Slider
            v-model="initialWpm"
            :min="100"
            :max="500"
            :step="50"
            class="w-full"
            :disabled="isPlaying"
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
            :disabled="isPlaying"
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
import { ref, computed } from 'vue'
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
const phraseArray = ref<string[]>([])
const isPlaying = ref(false)
const isCompleted = ref(false)
const currentPhrase = ref('')
const currentIndex = ref(0)
const currentWpm = ref(300)
const initialWpm = ref(300)
const fontSize = ref(48)
const showSettingsDialog = ref(false)
const progress = ref(0)
const elapsedTime = ref(0)
const currentPhase = ref('')
const phaseDescription = ref('')
const initialLimitSpeed = ref(0)
const finalSpeed = ref(0)

let trainingInterval: number | null = null
let timerInterval: number | null = null
let startTime = 0

type Phase = 'limit-up' | 'ultra-high' | 'limit-down'

const currentPhaseType = ref<Phase>('limit-up')

const wordStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const
}))

const handleSourceSelect = async (source: TextSource | { id: string; type: 'words' }) => {
  try {
    if ('type' in source && source.type === 'words') {
      selectedWordListId.value = source.id
      await loadWords(source.id)
      wordArray.value = [...words.value]
    } else {
      const textSource = source as TextSource
      selectedWordListId.value = textSource.id
      const content = await loadText(textSource)
      wordArray.value = content.words
    }
    // 文節に分割（3-5語程度のまとまり）
    createPhrases()
  } catch (err) {
    console.error('Error loading text:', err)
    alert(`テキストの読み込みに失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    selectedWordListId.value = null
    wordArray.value = []
  }
}

const createPhrases = () => {
  const phrases: string[] = []
  const phraseSize = 3 + Math.floor(Math.random() * 3) // 3-5語
  
  for (let i = 0; i < wordArray.value.length; i += phraseSize) {
    const phrase = wordArray.value.slice(i, i + phraseSize).join(' ')
    if (phrase) {
      phrases.push(phrase)
    }
  }
  
  phraseArray.value = phrases
}

const startTraining = () => {
  if (phraseArray.value.length === 0) return
  
  isPlaying.value = true
  isCompleted.value = false
  currentIndex.value = 0
  progress.value = 0
  elapsedTime.value = 0
  currentWpm.value = initialWpm.value
  initialLimitSpeed.value = initialWpm.value
  currentPhaseType.value = 'limit-up'
  currentPhase.value = '段階1: 限界速度まで上げる'
  phaseDescription.value = '読める限界までスピードを上げてください'
  startTime = Date.now()
  
  startTimer()
  startPhaseLimitUp()
}

const startTimer = () => {
  timerInterval = window.setInterval(() => {
    elapsedTime.value = Math.floor((Date.now() - startTime) / 1000)
  }, 1000)
}

const startPhaseLimitUp = () => {
  // 段階1: 読める限界までスピードを上げる
  // ユーザーが「限界」と感じたらボタンを押す想定
  // ここでは自動的に速度を上げていく
  showNextPhrase()
  
  // 速度を徐々に上げる（10秒ごとに50 WPM増加）
  const speedUpInterval = window.setInterval(() => {
    if (currentPhaseType.value === 'limit-up') {
      currentWpm.value += 50
      if (currentWpm.value >= 800) {
        // 限界速度に到達したと仮定
        clearInterval(speedUpInterval)
        initialLimitSpeed.value = currentWpm.value
        startPhaseUltraHigh()
      }
    } else {
      clearInterval(speedUpInterval)
    }
  }, 10000)
}

const startPhaseUltraHigh = () => {
  // 段階2: スピードを0.12秒/語（約500 WPM相当）まで上げて1分ほど眺める
  currentPhaseType.value = 'ultra-high'
  currentPhase.value = '段階2: 超高速で眺める'
  phaseDescription.value = 'スピード0.12秒/語で1分間眺めてください'
  currentWpm.value = 500 // 0.12秒/語 ≈ 500 WPM
  
  // 1分間超高速で表示
  const ultraHighInterval = window.setInterval(() => {
    if (currentPhaseType.value === 'ultra-high') {
      showNextPhrase()
    } else {
      clearInterval(ultraHighInterval)
    }
  }, 120) // 0.12秒 = 120ms
  
  // 1分後に段階3へ
  setTimeout(() => {
    clearInterval(ultraHighInterval)
    startPhaseLimitDown()
  }, 60000)
}

const startPhaseLimitDown = () => {
  // 段階3: 再度読める限界までスピードを落としていく
  currentPhaseType.value = 'limit-down'
  currentPhase.value = '段階3: 限界速度まで下げる'
  phaseDescription.value = '再度読める限界までスピードを落としてください'
  currentWpm.value = 800 // 高速から開始
  
  showNextPhrase()
  
  // 速度を徐々に下げる（10秒ごとに50 WPM減少）
  const speedDownInterval = window.setInterval(() => {
    if (currentPhaseType.value === 'limit-down') {
      currentWpm.value -= 50
      if (currentWpm.value <= initialLimitSpeed.value) {
        // 限界速度まで下がった
        clearInterval(speedDownInterval)
        finalSpeed.value = currentWpm.value
        // さらに下げて最終的な限界速度を確認
        checkFinalLimit()
      }
    } else {
      clearInterval(speedDownInterval)
    }
  }, 10000)
}

const checkFinalLimit = () => {
  // 最終的な限界速度を確認（さらに下げてみる）
  const checkInterval = window.setInterval(() => {
    if (currentPhaseType.value === 'limit-down') {
      currentWpm.value -= 25
      if (currentWpm.value <= 100) {
        clearInterval(checkInterval)
        stopTraining()
      }
    } else {
      clearInterval(checkInterval)
    }
  }, 5000)
}

const showNextPhrase = () => {
  if (currentIndex.value >= phraseArray.value.length) {
    currentIndex.value = 0 // ループ
  }
  
  currentPhrase.value = phraseArray.value[currentIndex.value]
  progress.value = ((currentIndex.value + 1) / phraseArray.value.length) * 100
  
  const delay = (60 / currentWpm.value) * 1000
  
  if (trainingInterval !== null) {
    clearTimeout(trainingInterval)
  }
  
  trainingInterval = window.setTimeout(() => {
    currentIndex.value++
    if (currentPhaseType.value !== 'ultra-high') {
      showNextPhrase()
    }
  }, delay)
}

const stopTraining = () => {
  if (trainingInterval !== null) {
    clearTimeout(trainingInterval)
    trainingInterval = null
  }
  if (timerInterval !== null) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  isPlaying.value = false
  isCompleted.value = true
  finalSpeed.value = currentWpm.value
}

const restartTraining = () => {
  isCompleted.value = false
  currentIndex.value = 0
  progress.value = 0
  elapsedTime.value = 0
  currentPhrase.value = ''
  initialLimitSpeed.value = 0
  finalSpeed.value = 0
}
</script>

<style scoped>
.phrase-reading-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.training-display {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.phase-indicator {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
}

.word-display-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.word-display {
  text-align: center;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.speed-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  margin-top: 100px;
}

.progress-info {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 600px;
  text-align: center;
  z-index: 10;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
  border-radius: 2px;
}

.ready-screen {
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

