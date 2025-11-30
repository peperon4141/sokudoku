<template>
  <div class="chunking-view min-h-screen bg-surface-900 flex items-center justify-center">
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

    <div v-else-if="!isPlaying" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">準備完了</h2>
      <p class="text-white mb-6">速度: {{ wpm }} WPM | チャンクサイズ: {{ chunkSize }}語</p>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startReading"
      />
    </div>

    <div v-else class="chunking-display">
      <div
        class="chunk-display"
        :style="chunkStyle"
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
          <label class="block mb-2 font-medium">チャンクサイズ: {{ chunkSize }}語</label>
          <Slider
            v-model="chunkSize"
            :min="2"
            :max="7"
            :step="1"
            class="w-full"
          />
          <p class="text-sm text-surface-600 mt-2">意味のまとまりとして表示する単語数</p>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import TextSourceSelector from '@/components/TextSourceSelector.vue'
import { useWords } from '@/composables/useWords'
import { useTextContent, type TextSource } from '@/composables/useTextContent'
import { useComprehension } from '@/composables/useComprehension'

const router = useRouter()
const { words, loadWords } = useWords()
const { loadText } = useTextContent()
const { recordScore, getRecentScores, shouldAdjustSpeed } = useComprehension()
const wordArray = ref<string[]>([])

const selectedWordListId = ref<string | null>(null)
const isPlaying = ref(false)
const currentChunk = ref('')
const currentChunkIndex = ref(0)
const wpm = ref(300)
const chunkSize = ref(3)
const fontSize = ref(48)
const showSettingsDialog = ref(false)
const showComprehensionDialog = ref(false)
const progress = ref(0)

let intervalId: number | null = null
let chunks: string[] = []

const chunkStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
  lineHeight: '1.5'
}))

const createChunks = (wordArray: string[]): string[] => {
  const result: string[] = []
  for (let i = 0; i < wordArray.length; i += chunkSize.value) {
    const chunk = wordArray.slice(i, i + chunkSize.value).join(' ')
    result.push(chunk)
  }
  return result
}

const handleSourceSelect = async (source: TextSource | { id: string; type: 'words' }) => {
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
  
  chunks = createChunks(wordArray.value)
  if (chunks.length > 0) {
    currentChunk.value = chunks[0]
  }
}

const startReading = () => {
  if (chunks.length === 0) return
  
  isPlaying.value = true
  currentChunkIndex.value = 0
  progress.value = 0
  
  const delay = (60 / wpm.value) * 1000 // WPMをミリ秒に変換
  
  const showNextChunk = () => {
    if (currentChunkIndex.value >= chunks.length) {
      stopReading()
      return
    }
    
    currentChunk.value = chunks[currentChunkIndex.value]
    progress.value = ((currentChunkIndex.value + 1) / chunks.length) * 100
    currentChunkIndex.value++
    
    // 理解度テストを定期的に実施（20チャンクごと）
    if (currentChunkIndex.value % 20 === 0 && currentChunkIndex.value > 0) {
      pauseReading()
      showComprehensionDialog.value = true
      return
    }
    
    intervalId = window.setTimeout(showNextChunk, delay)
  }
  
  showNextChunk()
}

const pauseReading = () => {
  if (intervalId !== null) {
    clearTimeout(intervalId)
    intervalId = null
  }
}

const recordComprehension = (score: number) => {
  recordScore(score, 'chunking', wpm.value)
  showComprehensionDialog.value = false
  
  const recentScores = getRecentScores(3, 'chunking')
  const adjustment = shouldAdjustSpeed(recentScores)
  
  // 理解度に応じて速度を調整
  if (adjustment === 'decrease' && wpm.value > 100) {
    wpm.value = Math.max(100, wpm.value - 20)
  } else if (adjustment === 'increase' && wpm.value < 500) {
    wpm.value = Math.min(500, wpm.value + 10)
  }
  
  // 読み続ける
  if (currentChunkIndex.value < chunks.length) {
    startReading()
  }
}

const stopReading = () => {
  pauseReading()
  isPlaying.value = false
  currentChunk.value = ''
  currentChunkIndex.value = 0
  progress.value = 0
}

// チャンクサイズが変更されたら再生成
watch(chunkSize, () => {
  if (wordArray.value.length > 0) {
    chunks = createChunks(wordArray.value)
    if (chunks.length > 0 && !isPlaying.value) {
      currentChunk.value = chunks[0]
      currentChunkIndex.value = 0
    }
  }
})

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
.chunking-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.chunking-display {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.chunk-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  max-width: 80%;
  word-break: keep-all;
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

