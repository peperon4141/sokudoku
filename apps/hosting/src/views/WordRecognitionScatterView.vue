<template>
  <div class="word-recognition-scatter-view min-h-screen bg-surface-900">
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
        mode="words"
        @select="handleSourceSelect"
        @cancel="$router.push('/methods')"
      />
    </div>

    <div v-else-if="!isPlaying && !isCompleted" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">単語再認トレーニング（散在表示）</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>画面全体に配置された単語を瞬間的に認識してください</p>
        <p class="text-sm">表示単語数: {{ wordCount }}</p>
        <p class="text-sm">表示時間: {{ displayDuration }}秒</p>
        <p class="text-sm">レベル: {{ level }}</p>
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
      <div
        v-for="(wordData, index) in displayedWords"
        :key="wordData.id"
        class="scattered-word"
        :style="getWordStyle(wordData)"
      >
        {{ wordData.word }}
      </div>
      <div class="progress-info">
        <p class="text-white text-sm">ラウンド: {{ currentRound }} / {{ totalRounds }}</p>
        <p class="text-white text-sm">残り時間: {{ remainingTime }}秒</p>
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
      <p class="text-white mb-6">{{ totalRounds }}ラウンドを完了しました</p>
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
          <label class="block mb-2 font-medium">表示単語数: {{ wordCount }}</label>
          <Slider
            v-model="wordCount"
            :min="5"
            :max="30"
            :step="5"
            class="w-full"
            :disabled="isPlaying"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">表示時間: {{ displayDuration }}秒</label>
          <Slider
            v-model="displayDuration"
            :min="1"
            :max="10"
            :step="0.5"
            class="w-full"
            :disabled="isPlaying"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">レベル: {{ level }}</label>
          <Slider
            v-model="level"
            :min="1"
            :max="5"
            :step="1"
            class="w-full"
            :disabled="isPlaying"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">ラウンド数: {{ totalRounds }}</label>
          <Slider
            v-model="totalRounds"
            :min="5"
            :max="20"
            :step="5"
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
const isPlaying = ref(false)
const isCompleted = ref(false)
const wordCount = ref(10)
const displayDuration = ref(3)
const level = ref(3)
const fontSize = ref(48)
const totalRounds = ref(10)
const showSettingsDialog = ref(false)
const currentRound = ref(0)
const remainingTime = ref(0)
const progress = ref(0)

interface WordData {
  id: number
  word: string
  x: number
  y: number
}

const displayedWords = ref<WordData[]>([])

let wordIdCounter = 0
let trainingInterval: number | null = null
let timerInterval: number | null = null

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
  } catch (err) {
    console.error('Error loading text:', err)
    alert(`テキストの読み込みに失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    selectedWordListId.value = null
    wordArray.value = []
  }
}

// 単語を重ならないようにランダム配置
const generateScatteredWords = (): WordData[] => {
  const words: WordData[] = []
  const usedPositions: Array<{ x: number; y: number; width: number; height: number }> = []
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const padding = 50
  const margin = 20 // 単語間の最小マージン
  
  // 単語のサイズを推定（フォントサイズに基づく）
  const estimatedWordWidth = fontSize.value * 3
  const estimatedWordHeight = fontSize.value * 1.5
  
  for (let i = 0; i < wordCount.value; i++) {
    let attempts = 0
    let placed = false
    
    while (!placed && attempts < 100) {
      const x = padding + Math.random() * (screenWidth - padding * 2 - estimatedWordWidth)
      const y = padding + Math.random() * (screenHeight - padding * 2 - estimatedWordHeight)
      
      // 既存の単語と重なっていないかチェック
      const overlaps = usedPositions.some(pos => {
        return !(
          x + estimatedWordWidth + margin < pos.x ||
          x - margin > pos.x + pos.width ||
          y + estimatedWordHeight + margin < pos.y ||
          y - margin > pos.y + pos.height
        )
      })
      
      if (!overlaps) {
        const word = wordArray.value[Math.floor(Math.random() * wordArray.value.length)]
        words.push({
          id: wordIdCounter++,
          word,
          x,
          y
        })
        usedPositions.push({
          x,
          y,
          width: estimatedWordWidth,
          height: estimatedWordHeight
        })
        placed = true
      }
      
      attempts++
    }
    
    // 100回試行しても配置できない場合はスキップ
    if (!placed) {
      console.warn(`Failed to place word ${i + 1} after 100 attempts`)
    }
  }
  
  return words
}

const getWordStyle = (wordData: WordData) => {
  const adjustedDuration = displayDuration.value * (1 - (level.value - 1) * 0.1)
  
  return {
    position: 'fixed' as const,
    left: `${wordData.x}px`,
    top: `${wordData.y}px`,
    fontSize: `${fontSize.value}px`,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    pointerEvents: 'none' as const,
    whiteSpace: 'nowrap' as const,
    zIndex: 1000,
    opacity: 1,
    transition: `opacity ${adjustedDuration * 0.2}s ease-out`
  }
}

const startTraining = () => {
  if (wordArray.value.length === 0) return
  
  isPlaying.value = true
  isCompleted.value = false
  currentRound.value = 0
  progress.value = 0
  
  startNextRound()
}

const startNextRound = () => {
  if (currentRound.value >= totalRounds.value) {
    stopTraining()
    return
  }
  
  currentRound.value++
  progress.value = (currentRound.value / totalRounds.value) * 100
  
  // 新しい単語を配置
  displayedWords.value = generateScatteredWords()
  
  // タイマー開始
  remainingTime.value = displayDuration.value
  timerInterval = window.setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      if (timerInterval !== null) {
        clearInterval(timerInterval)
        timerInterval = null
      }
      // 単語をフェードアウト
      displayedWords.value.forEach(word => {
        // フェードアウトはCSS transitionで処理
      })
      
      // 次のラウンドへ
      setTimeout(() => {
        displayedWords.value = []
        startNextRound()
      }, 500)
    }
  }, 1000)
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
  displayedWords.value = []
  progress.value = 100
}

const restartTraining = () => {
  isCompleted.value = false
  currentRound.value = 0
  progress.value = 0
  remainingTime.value = 0
  displayedWords.value = []
  wordIdCounter = 0
}
</script>

<style scoped>
.word-recognition-scatter-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.training-display {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.scattered-word {
  user-select: none;
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
  background-color: rgba(0, 0, 0, 0.5);
  padding: 1rem;
  border-radius: 8px;
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

