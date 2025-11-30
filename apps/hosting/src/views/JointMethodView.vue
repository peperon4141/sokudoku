<template>
  <div class="joint-method-view min-h-screen bg-surface-900">
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

    <!-- トレーニングモード選択 -->
    <div v-if="!selectedMode && !selectedWordListId" class="mode-selection min-h-screen flex items-center justify-center p-8">
      <Card class="max-w-5xl w-full">
        <template #title>トレーニングモードを選択</template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              severity="primary"
              class="h-32 flex flex-col items-center justify-center p-4"
              @click="selectedMode = 'flash'"
            >
              <i class="pi pi-bolt text-4xl mb-2"></i>
              <span class="font-semibold mb-2">瞬間認識</span>
              <span class="text-base">フラッシュ表示で瞬間認識力を向上</span>
            </Button>
            <Button
              severity="primary"
              class="h-32 flex flex-col items-center justify-center p-4"
              @click="selectedMode = 'parallel'"
            >
              <i class="pi pi-th-large text-4xl mb-2"></i>
              <span class="font-semibold mb-2">並列処理</span>
              <span class="text-base">複数単語を同時に処理</span>
            </Button>
            <Button
              severity="primary"
              class="h-32 flex flex-col items-center justify-center p-4"
              @click="selectedMode = 'pattern'"
            >
              <i class="pi pi-shapes text-4xl mb-2"></i>
              <span class="font-semibold mb-2">パターン認識</span>
              <span class="text-base">文字パターンを素早く認識</span>
            </Button>
          </div>
        </template>
      </Card>
    </div>

    <!-- テキストソース選択 -->
    <div v-else-if="!selectedWordListId" class="word-list-selection min-h-screen flex items-center justify-center p-8">
      <TextSourceSelector
        @select="handleSourceSelect"
        @cancel="selectedMode = null"
      />
    </div>

    <!-- 瞬間認識トレーニング -->
    <div v-else-if="selectedMode === 'flash' && !isPlaying" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">瞬間認識トレーニング</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>レベル: {{ level }}</p>
        <p>表示時間: {{ flashDuration }}ms</p>
        <p>難易度: {{ difficultyLevels[level - 1] }}</p>
      </div>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startFlashTraining"
      />
    </div>

    <div v-else-if="selectedMode === 'flash' && isPlaying" class="flash-display min-h-screen flex items-center justify-center">
      <div
        v-if="currentFlashWord"
        class="flash-word"
        :style="flashWordStyle"
      >
        {{ currentFlashWord }}
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- 並列処理トレーニング -->
    <div v-else-if="selectedMode === 'parallel' && !isPlaying" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">並列処理トレーニング</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>同時表示数: {{ parallelCount }}語</p>
        <p>レベル: {{ level }}</p>
      </div>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startParallelTraining"
      />
    </div>

    <div v-else-if="selectedMode === 'parallel' && isPlaying" class="parallel-display min-h-screen flex items-center justify-center">
      <div class="parallel-words grid gap-8" :style="parallelGridStyle">
        <div
          v-for="(word, index) in parallelWords"
          :key="index"
          class="parallel-word"
          :style="parallelWordStyle"
        >
          {{ word }}
        </div>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- パターン認識トレーニング -->
    <div v-else-if="selectedMode === 'pattern' && !isPlaying" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">パターン認識トレーニング</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>レベル: {{ level }}</p>
        <p>表示時間: {{ flashDuration }}ms</p>
      </div>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startPatternTraining"
      />
    </div>

    <div v-else-if="selectedMode === 'pattern' && isPlaying" class="pattern-display min-h-screen flex items-center justify-center">
      <div
        v-if="currentPattern"
        class="pattern-word"
        :style="patternWordStyle"
      >
        {{ currentPattern }}
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- 理解度テスト -->
    <Dialog
      v-model:visible="showComprehensionDialog"
      modal
      header="理解度テスト"
      :style="{ width: '700px' }"
    >
      <div class="flex flex-col gap-4">
        <p class="text-surface-700">表示された内容を理解できましたか？</p>
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

    <!-- 認識テスト -->
    <Dialog
      v-model:visible="showRecognitionDialog"
      modal
      header="認識テスト"
      :style="{ width: '700px' }"
    >
      <div class="flex flex-col gap-4">
        <p class="text-surface-700">表示された単語を選択してください</p>
        <div class="grid grid-cols-2 gap-2">
          <Button
            v-for="option in recognitionOptions"
            :key="option"
            :label="option"
            :severity="option === correctAnswer ? 'success' : 'secondary'"
            @click="checkRecognition(option)"
          />
        </div>
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
          <p class="text-sm text-surface-600 mt-2">{{ difficultyLevels[level - 1] }}</p>
        </div>
        <div>
          <label class="block mb-2 font-medium">フラッシュ表示時間: {{ flashDuration }}ms</label>
          <Slider
            v-model="flashDuration"
            :min="50"
            :max="500"
            :step="50"
            class="w-full"
          />
        </div>
        <div v-if="selectedMode === 'parallel'">
          <label class="block mb-2 font-medium">同時表示数: {{ parallelCount }}語</label>
          <Slider
            v-model="parallelCount"
            :min="2"
            :max="5"
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
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import TextSourceSelector from '@/components/TextSourceSelector.vue'
import { useWords } from '@/composables/useWords'
import { useTextContent, type TextSource } from '@/composables/useTextContent'
import { useComprehension } from '@/composables/useComprehension'

type TrainingMode = 'flash' | 'parallel' | 'pattern' | null

const { words, loadWords } = useWords()
const { loadText } = useTextContent()
const { recordScore } = useComprehension()

const selectedMode = ref<TrainingMode>(null)
const selectedWordListId = ref<string | null>(null)
const isPlaying = ref(false)
const level = ref(1)
const flashDuration = ref(200)
const parallelCount = ref(3)
const fontSize = ref(48)
const showSettingsDialog = ref(false)
const showComprehensionDialog = ref(false)
const showRecognitionDialog = ref(false)
const progress = ref(0)

// 瞬間認識トレーニング
const currentFlashWord = ref('')
const flashWordIndex = ref(0)

// 並列処理トレーニング
const parallelWords = ref<string[]>([])
const parallelIndex = ref(0)

// パターン認識トレーニング
const currentPattern = ref('')
const patternIndex = ref(0)
const recognitionOptions = ref<string[]>([])
const correctAnswer = ref('')

let intervalId: number | null = null
let wordArray: string[] = []

const difficultyLevels = ['初心者', '初級', '中級', '上級', '熟練']

const flashWordStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
}))

const parallelGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(parallelCount.value))}, 1fr)`,
  maxWidth: '80%'
}))

const parallelWordStyle = computed(() => ({
  fontSize: `${fontSize.value * 0.8}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
}))

const patternWordStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
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
}

const startFlashTraining = () => {
  if (wordArray.length === 0) return
  
  isPlaying.value = true
  flashWordIndex.value = 0
  progress.value = 0
  
  const showNextFlash = () => {
    if (flashWordIndex.value >= wordArray.length) {
      stopTraining()
      return
    }
    
    currentFlashWord.value = wordArray[flashWordIndex.value]
    progress.value = ((flashWordIndex.value + 1) / wordArray.length) * 100
    flashWordIndex.value++
    
    // フラッシュ表示時間後に次の単語へ
    intervalId = window.setTimeout(() => {
      currentFlashWord.value = ''
      // 20語ごとに認識テスト
      if (flashWordIndex.value % 20 === 0 && flashWordIndex.value > 0) {
        pauseTraining()
        showRecognitionTest()
        return
      }
      showNextFlash()
    }, flashDuration.value)
  }
  
  showNextFlash()
}

const startParallelTraining = () => {
  if (wordArray.length === 0) return
  
  isPlaying.value = true
  parallelIndex.value = 0
  progress.value = 0
  
  const showNextParallel = () => {
    if (parallelIndex.value >= wordArray.length) {
      stopTraining()
      return
    }
    
    const words: string[] = []
    for (let i = 0; i < parallelCount.value && parallelIndex.value + i < wordArray.length; i++) {
      words.push(wordArray[parallelIndex.value + i])
    }
    parallelWords.value = words
    progress.value = ((parallelIndex.value + 1) / wordArray.length) * 100
    parallelIndex.value += parallelCount.value
    
    // 表示時間後に次のセットへ
    intervalId = window.setTimeout(() => {
      parallelWords.value = []
      // 20語ごとに理解度テスト
      if (parallelIndex.value % 20 === 0 && parallelIndex.value > 0) {
        pauseTraining()
        showComprehensionDialog.value = true
        return
      }
      showNextParallel()
    }, flashDuration.value * 2)
  }
  
  showNextParallel()
}

const startPatternTraining = () => {
  if (wordArray.length === 0) return
  
  isPlaying.value = true
  patternIndex.value = 0
  progress.value = 0
  
  const showNextPattern = () => {
    if (patternIndex.value >= wordArray.length) {
      stopTraining()
      return
    }
    
    currentPattern.value = wordArray[patternIndex.value]
    progress.value = ((patternIndex.value + 1) / wordArray.length) * 100
    patternIndex.value++
    
    intervalId = window.setTimeout(() => {
      currentPattern.value = ''
      // 20語ごとに認識テスト
      if (patternIndex.value % 20 === 0 && patternIndex.value > 0) {
        pauseTraining()
        showRecognitionTest()
        return
      }
      showNextPattern()
    }, flashDuration.value)
  }
  
  showNextPattern()
}

const showRecognitionTest = () => {
  // 正解を選択
  const correct = wordArray[flashWordIndex.value - 1] || wordArray[patternIndex.value - 1]
  correctAnswer.value = correct
  
  // 選択肢を生成（正解 + ランダムな3つの単語）
  const options = [correct]
  while (options.length < 4) {
    const randomWord = wordArray[Math.floor(Math.random() * wordArray.length)]
    if (!options.includes(randomWord)) {
      options.push(randomWord)
    }
  }
  // シャッフル
  recognitionOptions.value = options.sort(() => Math.random() - 0.5)
  showRecognitionDialog.value = true
}

const checkRecognition = (selected: string) => {
  showRecognitionDialog.value = false
  const isCorrect = selected === correctAnswer.value
  
  // 正解率に応じてレベル調整
  if (isCorrect && level.value < 5) {
    // 連続正解でレベルアップ
    const recentCorrect = true // 簡易版
    if (recentCorrect) {
      level.value = Math.min(5, level.value + 1)
      flashDuration.value = Math.max(50, flashDuration.value - 50)
    }
  }
  
  // トレーニングを続ける
  if (selectedMode.value === 'flash') {
    startFlashTraining()
  } else if (selectedMode.value === 'pattern') {
    startPatternTraining()
  }
}

const pauseTraining = () => {
  if (intervalId !== null) {
    clearTimeout(intervalId)
    intervalId = null
  }
}

const stopTraining = () => {
  pauseTraining()
  isPlaying.value = false
  currentFlashWord.value = ''
  parallelWords.value = []
  currentPattern.value = ''
  flashWordIndex.value = 0
  parallelIndex.value = 0
  patternIndex.value = 0
  progress.value = 0
}

const recordComprehension = (score: number) => {
  recordScore(score, 'joint-method')
  showComprehensionDialog.value = false
  
  // トレーニングを続ける
  if (selectedMode.value === 'parallel') {
    startParallelTraining()
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
  stopTraining()
})
</script>

<style scoped>
.joint-method-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.flash-display,
.parallel-display,
.pattern-display {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.flash-word,
.pattern-word {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.parallel-words {
  display: grid;
  gap: 2rem;
  max-width: 80%;
}

.parallel-word {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
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

