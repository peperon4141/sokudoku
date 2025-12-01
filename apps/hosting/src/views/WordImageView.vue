<template>
  <div class="word-image-view min-h-screen bg-surface-900">
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

    <div v-if="!selectedMode && !selectedWordListId" class="mode-selection min-h-screen flex items-center justify-center p-8">
      <Card class="max-w-4xl w-full">
        <template #title>トレーニングモードを選択</template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              label="インプット"
              icon="pi pi-download"
              severity="primary"
              size="large"
              class="h-32 flex flex-col gap-2"
              @click="selectMode('input')"
            >
              <template #icon>
                <i class="pi pi-download text-4xl"></i>
              </template>
              <span class="text-lg">頭の中のイメージをできるだけ速く思い出す</span>
            </Button>
            <Button
              label="アウトプット"
              icon="pi pi-upload"
              severity="primary"
              size="large"
              class="h-32 flex flex-col gap-2"
              :disabled="!hasInputData"
              @click="selectMode('output')"
            >
              <template #icon>
                <i class="pi pi-upload text-4xl"></i>
              </template>
              <span class="text-lg">インプットしたイメージを出力する</span>
            </Button>
          </div>
          <div class="mt-4">
            <Button
              label="キャンセル"
              severity="secondary"
              outlined
              class="w-full"
              @click="$router.push('/methods')"
            />
          </div>
        </template>
      </Card>
    </div>

    <div v-else-if="!selectedWordListId" class="word-list-selection min-h-screen flex items-center justify-center p-8">
      <TextSourceSelector
        mode="words"
        @select="handleSourceSelect"
        @cancel="selectedMode = null"
      />
    </div>

    <div v-else-if="!isPlaying && !isCompleted" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">
        {{ selectedMode === 'input' ? '単語イメージ（インプット）' : '単語イメージ（アウトプット）' }}
      </h2>
      <div class="mb-6 space-y-2 text-white">
        <p v-if="selectedMode === 'input'">頭の中のイメージをできるだけ速く思い出してください</p>
        <p v-else>インプットしたイメージを思い出してください</p>
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
    </div>

    <div v-else-if="isPlaying" class="training-display">
      <div class="word-display-container">
        <div
          v-if="currentWord"
          class="word-display"
          :style="wordStyle"
        >
          {{ currentWord }}
        </div>
        <div v-else class="word-display">
          <div class="blank-display"></div>
        </div>
      </div>
      <div class="progress-info">
        <p class="text-white text-sm">{{ currentIndex + 1 }} / {{ wordArray.length }}</p>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </div>

    <div v-else-if="isCompleted && selectedMode === 'input'" class="completed-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">インプット完了</h2>
      <p class="text-white mb-6">{{ wordArray.length }}語のイメージをインプットしました</p>
      <div class="mb-4">
        <p class="text-white text-sm mb-2">インプットデータを保存しました</p>
        <p class="text-white text-sm">次はアウトプットトレーニングを実施してください</p>
      </div>
      <div class="flex gap-4 justify-center">
        <Button
          label="アウトプットへ"
          icon="pi pi-upload"
          severity="primary"
          @click="goToOutput"
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
          @click="$router.push('/methods')"
        />
      </div>
    </div>

    <div v-else-if="isCompleted && selectedMode === 'output'" class="completed-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">アウトプット完了</h2>
      <p class="text-white mb-6">{{ wordArray.length }}語のイメージをアウトプットしました</p>
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
          <label class="block mb-2 font-medium">フォントサイズ: {{ fontSize }}px</label>
          <Slider
            v-model="fontSize"
            :min="32"
            :max="96"
            :step="8"
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
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import TextSourceSelector from '@/components/TextSourceSelector.vue'
import { useTextContent, type TextSource } from '@/composables/useTextContent'
import { useWords } from '@/composables/useWords'

const { loadText } = useTextContent()
const { words, loadWords } = useWords()

const selectedMode = ref<'input' | 'output' | null>(null)
const selectedWordListId = ref<string | null>(null)
const wordArray = ref<string[]>([])
const inputData = ref<string[]>([])
const isPlaying = ref(false)
const isCompleted = ref(false)
const currentWord = ref('')
const currentIndex = ref(0)
const displayDuration = ref(3)
const level = ref(3)
const fontSize = ref(64)
const showSettingsDialog = ref(false)
const progress = ref(0)

let trainingInterval: number | null = null

const hasInputData = computed(() => inputData.value.length > 0)

const wordStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const
}))

const handleSourceSelect = async (source: TextSource | { id: string; type: 'words' }) => {
  try {
    if (selectedMode.value === 'output' && inputData.value.length > 0) {
      // アウトプットモードで、インプットデータがある場合
      wordArray.value = inputData.value
      selectedWordListId.value = 'input-data'
    } else if ('type' in source && source.type === 'words') {
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

const selectMode = (mode: 'input' | 'output') => {
  selectedMode.value = mode
}

const startTraining = () => {
  if (wordArray.value.length === 0) return
  
  isPlaying.value = true
  isCompleted.value = false
  currentIndex.value = 0
  progress.value = 0
  
  showNextWord()
}

const showNextWord = () => {
  if (currentIndex.value >= wordArray.value.length) {
    stopTraining()
    return
  }
  
  // 単語を表示
  currentWord.value = wordArray.value[currentIndex.value]
  progress.value = ((currentIndex.value + 1) / wordArray.value.length) * 100
  
  // 表示時間（インプットモードでは長めに）
  const displayTime = selectedMode.value === 'input' 
    ? displayDuration.value * 1000 
    : displayDuration.value * 1000 * (1 - (level.value - 1) * 0.1)
  
  trainingInterval = window.setTimeout(() => {
    if (selectedMode.value === 'input') {
      // インプットモード: データを保存
      if (!inputData.value.includes(currentWord.value)) {
        inputData.value.push(currentWord.value)
      }
    }
    
    currentWord.value = ''
    
    // 空白時間後に次の単語へ
    const blankTime = 500
    trainingInterval = window.setTimeout(() => {
      currentIndex.value++
      showNextWord()
    }, blankTime)
  }, displayTime)
}

const stopTraining = () => {
  if (trainingInterval !== null) {
    clearTimeout(trainingInterval)
    trainingInterval = null
  }
  isPlaying.value = false
  isCompleted.value = true
  currentWord.value = ''
  progress.value = 100
}

const restartTraining = () => {
  isCompleted.value = false
  currentIndex.value = 0
  progress.value = 0
  currentWord.value = ''
}

const goToOutput = () => {
  selectedMode.value = 'output'
  selectedWordListId.value = 'input-data'
  isCompleted.value = false
  currentIndex.value = 0
  progress.value = 0
}
</script>

<style scoped>
.word-image-view {
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

.blank-display {
  width: 100px;
  height: 100px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
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

