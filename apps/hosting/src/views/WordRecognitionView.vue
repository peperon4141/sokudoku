<template>
  <div class="word-recognition-view min-h-screen bg-surface-900">
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

    <div v-else class="training-display">
      <div class="title-bar">
        <h2 class="text-xl font-bold text-white text-center">SP式無料速読トレーニング 単語再認自動化</h2>
      </div>

      <div class="word-display-container">
        <div class="word-display-box">
          <div
            v-for="(word, index) in displayedWords"
            :key="index"
            class="word-item"
            :style="wordItemStyle"
          >
            {{ word }}
          </div>
        </div>
      </div>

      <div class="control-bar">
        <div class="speed-indicator">
          <span class="text-white">SPEED : {{ speed.toFixed(2) }}</span>
        </div>
        <div class="control-buttons">
          <Button
            label="前へ(B)"
            severity="primary"
            @click="previousWords"
            @keydown.b="previousWords"
          />
          <Button
            :label="isPlaying ? '停止(P)' : '再生(P)'"
            severity="primary"
            @click="togglePlay"
            @keydown.p="togglePlay"
          />
          <Button
            label="終了"
            severity="danger"
            @click="endTraining"
          />
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
          <label class="block mb-2 font-medium">表示速度: {{ speed.toFixed(2) }}</label>
          <Slider
            v-model="speed"
            :min="0.1"
            :max="2.0"
            :step="0.01"
            class="w-full"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">同時表示単語数: {{ wordCount }}</label>
          <Slider
            v-model="wordCount"
            :min="1"
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
const currentIndex = ref(0)
const speed = ref(0.40)
const wordCount = ref(3)
const fontSize = ref(48)
const showSettingsDialog = ref(false)
const isPlaying = ref(false)

let playInterval: number | null = null

const displayedWords = computed(() => {
  const words: string[] = []
  for (let i = 0; i < wordCount.value; i++) {
    const index = currentIndex.value + i
    if (index < wordArray.value.length) {
      words.push(wordArray.value[index])
    }
  }
  return words
})

const wordItemStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#000000',
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
    currentIndex.value = 0
  } catch (err) {
    console.error('Error loading text:', err)
    alert(`テキストの読み込みに失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    selectedWordListId.value = null
    wordArray.value = []
  }
}

const previousWords = () => {
  if (currentIndex.value > 0) {
    currentIndex.value = Math.max(0, currentIndex.value - wordCount.value)
  }
}

const nextWords = () => {
  if (currentIndex.value + wordCount.value < wordArray.value.length) {
    currentIndex.value += wordCount.value
  } else {
    // 最後まで到達したら最初に戻る
    currentIndex.value = 0
  }
}

const togglePlay = () => {
  if (isPlaying.value) {
    stopPlay()
  } else {
    startPlay()
  }
}

const startPlay = () => {
  if (wordArray.value.length === 0) return
  
  isPlaying.value = true
  playInterval = window.setInterval(() => {
    nextWords()
  }, speed.value * 1000)
}

const stopPlay = () => {
  if (playInterval !== null) {
    clearInterval(playInterval)
    playInterval = null
  }
  isPlaying.value = false
}

const endTraining = () => {
  stopPlay()
  selectedWordListId.value = null
  currentIndex.value = 0
}

// キーボードショートカット
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'b' || event.key === 'B') {
    event.preventDefault()
    previousWords()
  } else if (event.key === 'p' || event.key === 'P') {
    event.preventDefault()
    togglePlay()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  stopPlay()
})
</script>

<style scoped>
.word-recognition-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.training-display {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--surface-900);
}

.title-bar {
  padding: 1rem;
  background-color: var(--surface-800);
  border-bottom: 1px solid var(--surface-700);
}

.word-display-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.word-display-box {
  width: 100%;
  max-width: 600px;
  min-height: 400px;
  background-color: #ffffff;
  border: 2px solid #000000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 2rem;
}

.word-item {
  width: 100%;
  text-align: center;
  line-height: 1.5;
}

.control-bar {
  padding: 1rem;
  background-color: var(--surface-800);
  border-top: 1px solid var(--surface-700);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.speed-indicator {
  font-size: 1.2rem;
  font-weight: bold;
}

.control-buttons {
  display: flex;
  gap: 1rem;
}

.word-list-selection {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
</style>
