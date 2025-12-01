<template>
  <div class="parallel-reading-view min-h-screen bg-surface-900">
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
      <h2 class="text-3xl font-bold text-white mb-4">平行読みトレーニング</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>視線をまったくスライドさせずに読む上級者向けのトレーニングです</p>
        <p class="text-sm">視野範囲: {{ fieldOfView }}文字</p>
        <p class="text-sm">速度: {{ wpm }} WPM</p>
        <p class="text-sm">レベル: {{ level }}</p>
      </div>
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

    <div v-else-if="isPlaying" class="parallel-display">
      <div class="text-display-container">
        <div
          ref="textContainer"
          class="text-display"
          :style="{ fontSize: `${fontSize}px` }"
        >
          <div
            v-for="(line, lineIndex) in displayLines"
            :key="lineIndex"
            class="text-line"
            :class="{ 'current-line': lineIndex === currentLineIndex }"
          >
            <span
              v-for="(word, wordIndex) in line"
              :key="wordIndex"
              class="word-span"
            >
              {{ word }}
            </span>
          </div>
        </div>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <div class="info-display">
        <p class="text-white text-sm">行: {{ currentLineIndex + 1 }} / {{ displayLines.length }}</p>
        <p class="text-white text-sm">速度: {{ wpm }} WPM</p>
      </div>
    </div>

    <div v-else-if="isCompleted" class="completed-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">トレーニング完了</h2>
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

    <Dialog
      v-model:visible="showSettingsDialog"
      modal
      header="設定"
      :style="{ width: '600px' }"
    >
      <div class="flex flex-col gap-6">
        <div>
          <label class="block mb-2 font-medium">視野範囲: {{ fieldOfView }}文字</label>
          <Slider
            v-model="fieldOfView"
            :min="10"
            :max="50"
            :step="5"
            class="w-full"
            :disabled="isPlaying"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">速度: {{ wpm }} WPM</label>
          <Slider
            v-model="wpm"
            :min="100"
            :max="1000"
            :step="50"
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
          <label class="block mb-2 font-medium">フォントサイズ: {{ fontSize }}px</label>
          <Slider
            v-model="fontSize"
            :min="16"
            :max="32"
            :step="2"
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
import { ref, computed, nextTick, watch } from 'vue'
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
const fieldOfView = ref(20)
const wpm = ref(300)
const level = ref(3)
const fontSize = ref(20)
const showSettingsDialog = ref(false)
const currentLineIndex = ref(0)
const progress = ref(0)
const textContainer = ref<HTMLElement | null>(null)

let readingInterval: number | null = null

const displayLines = computed(() => {
  const lines: string[][] = []
  let currentLine: string[] = []
  let currentLineLength = 0
  
  for (const word of wordArray.value) {
    const wordLength = word.length
    if (currentLineLength + wordLength + 1 > fieldOfView.value && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = [word]
      currentLineLength = wordLength
    } else {
      currentLine.push(word)
      currentLineLength += wordLength + 1
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }
  
  return lines
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

const startReading = () => {
  if (wordArray.value.length === 0) return
  
  isPlaying.value = true
  isCompleted.value = false
  currentLineIndex.value = 0
  progress.value = 0
  
  const delay = (60 / wpm.value) * 1000 * (1 - (level.value - 1) * 0.1)
  
  const showNextLine = () => {
    if (currentLineIndex.value >= displayLines.value.length) {
      stopReading()
      return
    }
    
    progress.value = ((currentLineIndex.value + 1) / displayLines.value.length) * 100
    scrollToCurrentLine()
    currentLineIndex.value++
    
    readingInterval = window.setTimeout(showNextLine, delay)
  }
  
  showNextLine()
}

const scrollToCurrentLine = async () => {
  await nextTick()
  const lineElements = textContainer.value?.querySelectorAll('.text-line')
  if (lineElements && lineElements[currentLineIndex.value]) {
    const lineElement = lineElements[currentLineIndex.value] as HTMLElement
    if (lineElement && textContainer.value) {
      const containerRect = textContainer.value.getBoundingClientRect()
      const elementRect = lineElement.getBoundingClientRect()
      const relativeTop = elementRect.top - containerRect.top + textContainer.value.scrollTop
      const scrollPosition = relativeTop - (containerRect.height / 2) + (elementRect.height / 2)
      
      textContainer.value.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      })
    }
  }
}

const stopReading = () => {
  if (readingInterval !== null) {
    clearTimeout(readingInterval)
    readingInterval = null
  }
  isPlaying.value = false
  isCompleted.value = true
  currentLineIndex.value = displayLines.value.length
  progress.value = 100
}

const restartReading = () => {
  isCompleted.value = false
  currentLineIndex.value = 0
  progress.value = 0
  if (textContainer.value) {
    textContainer.value.scrollTop = 0
  }
}

watch(currentLineIndex, () => {
  if (isPlaying.value) {
    scrollToCurrentLine()
  }
})
</script>

<style scoped>
.parallel-reading-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.parallel-display {
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
  line-height: 2.5;
}

.text-line {
  margin-bottom: 1rem;
  transition: background-color 0.3s ease;
  padding: 0.5rem;
  border-radius: 4px;
}

.current-line {
  background-color: rgba(59, 130, 246, 0.2);
}

.word-span {
  margin-right: 0.25em;
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

.info-display {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
  display: flex;
  gap: 1rem;
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

