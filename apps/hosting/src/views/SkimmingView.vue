<template>
  <div class="skimming-view min-h-screen bg-surface-0">
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

    <div v-else class="skimming-container p-8 max-w-4xl mx-auto">
      <div class="mb-6">
        <h2 class="text-2xl font-bold mb-2">スキミングモード</h2>
        <p class="text-surface-600">重要語句がハイライト表示されます</p>
      </div>

      <div class="mb-4 flex items-center gap-4">
        <Button
          :label="isPlaying ? '一時停止' : '開始'"
          :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'"
          severity="primary"
          @click="togglePlay"
        />
        <div class="flex-1">
          <label class="block mb-2 text-sm font-medium">重要度閾値: {{ importanceThreshold }}%</label>
          <Slider
            v-model="importanceThreshold"
            :min="0"
            :max="100"
            :step="5"
            class="w-full"
            :disabled="isPlaying"
          />
        </div>
      </div>

      <div class="text-display bg-surface-50 p-6 rounded-lg border border-surface-200 min-h-[400px]">
        <div
          v-if="displayedText"
          class="text-content text-lg leading-relaxed"
          v-html="highlightedText"
        />
        <div v-else class="text-center text-surface-500 py-20">
          単語リストを選択してください
        </div>
      </div>

      <div class="mt-4 flex justify-between items-center text-sm text-surface-600">
        <span>進捗: {{ currentIndex + 1 }} / {{ words.length }}</span>
        <span>重要語句: {{ importantWordsCount }}語</span>
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
          <label class="block mb-2 font-medium">重要度閾値: {{ importanceThreshold }}%</label>
          <Slider
            v-model="importanceThreshold"
            :min="0"
            :max="100"
            :step="5"
            class="w-full"
          />
          <p class="text-sm text-surface-600 mt-2">この値以上の重要度を持つ語句がハイライト表示されます</p>
        </div>
        <div>
          <label class="block mb-2 font-medium">表示速度: {{ displaySpeed }}ms/語</label>
          <Slider
            v-model="displaySpeed"
            :min="50"
            :max="500"
            :step="50"
            class="w-full"
          />
        </div>
        <div class="flex items-center gap-2">
          <Checkbox
            v-model="autoScroll"
            inputId="auto-scroll"
            binary
          />
          <label for="auto-scroll" class="text-sm">自動スクロール</label>
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
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import TextSourceSelector from '@/components/TextSourceSelector.vue'
import { useWords } from '@/composables/useWords'
import { useTextContent, type TextSource } from '@/composables/useTextContent'

const { words, loadWords } = useWords()
const { loadText } = useTextContent()

const selectedWordListId = ref<string | null>(null)
const isPlaying = ref(false)
const currentIndex = ref(0)
const importanceThreshold = ref(50)
const displaySpeed = ref(200)
const autoScroll = ref(true)
const displayedText = ref('')
const showSettingsDialog = ref(false)

let intervalId: number | null = null
let wordArray: string[] = []

// 重要度を計算（シンプルな実装：文字数、出現頻度など）
const calculateImportance = (word: string, index: number, total: number): number => {
  let score = 0
  
  // 文字数が多いほど重要
  score += word.length * 5
  
  // 出現頻度（簡易版：同じ単語が複数回出現する場合）
  const frequency = wordArray.filter(w => w === word).length
  score += frequency * 10
  
  // 位置による重み（最初と最後の方が重要）
  const positionWeight = index < total * 0.1 || index > total * 0.9 ? 20 : 0
  score += positionWeight
  
  // 0-100の範囲に正規化
  return Math.min(100, score)
}

const importantWordsCount = computed(() => {
  return wordArray.filter((word, index) => {
    const importance = calculateImportance(word, index, wordArray.length)
    return importance >= importanceThreshold.value
  }).length
})

const highlightedText = computed(() => {
  if (!displayedText.value) return ''
  
  const words = displayedText.value.split(/\s+/)
  return words.map((word) => {
    const originalIndex = wordArray.indexOf(word)
    if (originalIndex === -1) return word
    
    const importance = calculateImportance(word, originalIndex, wordArray.length)
    const isImportant = importance >= importanceThreshold.value
    
    if (isImportant) {
      const highlightColor = importance >= 80 ? '#ef4444' : importance >= 60 ? '#f59e0b' : '#3b82f6'
      return `<span style="background-color: ${highlightColor}; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${word}</span>`
    }
    return word
  }).join(' ')
})

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
    
    displayedText.value = wordArray.join(' ')
    currentIndex.value = 0
  } catch (err) {
    console.error('Error in handleSourceSelect:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    alert(`テキストの読み込みに失敗しました。\n\n${errorMessage}\n\n別のテキストソースを選択してください。`)
    selectedWordListId.value = null
    wordArray = []
  }
}

const togglePlay = () => {
  if (isPlaying.value) {
    pause()
  } else {
    start()
  }
}

const start = () => {
  if (wordArray.length === 0) return
  
  isPlaying.value = true
  currentIndex.value = 0
  displayedText.value = ''
  
  const showNextWord = () => {
    if (currentIndex.value >= wordArray.length) {
      pause()
      return
    }
    
    const wordsToShow = wordArray.slice(0, currentIndex.value + 1)
    displayedText.value = wordsToShow.join(' ')
    currentIndex.value++
    
    if (autoScroll.value) {
      const textDisplay = document.querySelector('.text-display')
      if (textDisplay) {
        textDisplay.scrollTop = textDisplay.scrollHeight
      }
    }
    
    intervalId = window.setTimeout(showNextWord, displaySpeed.value)
  }
  
  showNextWord()
}

const pause = () => {
  if (intervalId !== null) {
    clearTimeout(intervalId)
    intervalId = null
  }
  isPlaying.value = false
}

// 重要度閾値が変更されたら再計算
watch(importanceThreshold, () => {
  // ハイライト表示を更新（computedなので自動的に更新される）
})

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
.skimming-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.text-display {
  max-height: 600px;
  overflow-y: auto;
}

.text-content {
  word-break: break-word;
}

.text-content :deep(span) {
  transition: all 0.2s ease;
}
</style>

