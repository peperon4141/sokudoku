<template>
  <div class="rsvp-view min-h-screen bg-surface-900 flex items-center justify-center">
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

    <div v-if="!isPlaying && !selectedWordListId" class="word-list-selection">
      <TextSourceSelector
        @select="handleSourceSelect"
        @cancel="$router.push('/')"
      />
    </div>

    <div v-else-if="!isPlaying && !isCompleted" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">準備完了</h2>
      <p class="text-white mb-6">速度: {{ wpm }} WPM</p>
      <p v-if="wordArray.length > 0" class="text-white mb-4 text-sm">読み込み済み: {{ wordArray.length }}語</p>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        :disabled="wordArray.length === 0"
        @click="startReading"
      />
      <p v-if="wordArray.length === 0" class="text-white mt-4 text-sm opacity-75">テキストを選択してください</p>
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
          @click="$router.push('/dashboard')"
        />
      </div>
    </div>

    <div v-else class="rsvp-display">
      <div
        class="word-display"
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
    </div>

    <Dialog
      v-model:visible="showSettingsDialog"
      modal
      header="設定"
      :style="{ width: '600px' }"
    >
      <div class="flex flex-col gap-6">
        <div>
          <label class="block mb-2 font-medium">速度: {{ wpm }} WPM</label>
          <Slider
            v-model="wpm"
            :min="100"
            :max="500"
            :step="10"
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
            v-model="showComprehensionWarning"
            inputId="comprehension-warning"
            binary
          />
          <label for="comprehension-warning" class="text-sm">理解度警告を表示</label>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import TextSourceSelector from '@/components/TextSourceSelector.vue'
import { useWords } from '@/composables/useWords'
import { useTextContent, type TextSource } from '@/composables/useTextContent'
import { useComprehension } from '@/composables/useComprehension'

const { words, loadWords } = useWords()
const { loadText } = useTextContent()
const { recordScore, getRecentScores, shouldAdjustSpeed } = useComprehension()

const selectedWordListId = ref<string | null>(null)
const isPlaying = ref(false)
const isCompleted = ref(false)
const currentWord = ref('')
const currentWordIndex = ref(0)
const wpm = ref(250)
const fontSize = ref(48)
const showSettingsDialog = ref(false)
const showComprehensionWarning = ref(true)
const showComprehensionDialog = ref(false)
const progress = ref(0)

let intervalId: number | null = null
const wordArray = ref<string[]>([])

const wordStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
}))

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
    
    isCompleted.value = false
    
    if (wordArray.value.length > 0) {
      currentWord.value = wordArray.value[0]
    }
  } catch (err) {
    console.error('Error in handleSourceSelect:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    // エラーダイアログを表示
    alert(`テキストの読み込みに失敗しました。\n\n${errorMessage}\n\n別のテキストソースを選択してください。`)
    // エラーが発生した場合は、選択をリセット
    selectedWordListId.value = null
    wordArray.value = []
  }
}

const startReading = () => {
  if (wordArray.value.length === 0) {
    return
  }
  
  isPlaying.value = true
  currentWordIndex.value = 0
  progress.value = 0
  
  const delay = (60 / wpm.value) * 1000 // WPMをミリ秒に変換
  
  const showNextWord = () => {
    if (currentWordIndex.value >= wordArray.value.length) {
      stopReading()
      return
    }
    
    currentWord.value = wordArray.value[currentWordIndex.value]
    progress.value = ((currentWordIndex.value + 1) / wordArray.value.length) * 100
    currentWordIndex.value++
    
    // 理解度テストを定期的に実施（50語ごと）
    if (showComprehensionWarning.value && currentWordIndex.value % 50 === 0 && currentWordIndex.value > 0) {
      pauseReading()
      showComprehensionDialog.value = true
      return
    }
    
    intervalId = window.setTimeout(showNextWord, delay)
  }
  
  showNextWord()
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
  currentWord.value = ''
  progress.value = 100
}

const restartReading = () => {
  isCompleted.value = false
  currentWordIndex.value = 0
  progress.value = 0
  if (wordArray.value.length > 0) {
    currentWord.value = wordArray.value[0]
  }
}

const recordComprehension = (score: number) => {
  recordScore(score, 'rsvp', wpm.value)
  showComprehensionDialog.value = false
  
  const recentScores = getRecentScores(3, 'rsvp')
  const adjustment = shouldAdjustSpeed(recentScores)
  
  // 理解度に応じて速度を調整
  if (adjustment === 'decrease' && wpm.value > 100) {
    wpm.value = Math.max(100, wpm.value - 20)
  } else if (adjustment === 'increase' && wpm.value < 500) {
    wpm.value = Math.min(500, wpm.value + 10)
  }
  
  // 読み続ける
  if (currentWordIndex.value < wordArray.value.length) {
    startReading()
  }
}

onMounted(() => {
  // クエリパラメータから単語リストIDを取得
  const urlParams = new URLSearchParams(window.location.search)
  const wordListId = urlParams.get('wordList')
  if (wordListId) {
    selectedWordListId.value = wordListId
  }
})

onUnmounted(() => {
  stopReading()
})
</script>

<style scoped>
.rsvp-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.rsvp-display {
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
</style>

