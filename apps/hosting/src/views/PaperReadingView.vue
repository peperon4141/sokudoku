<template>
  <div class="paper-reading-view min-h-screen bg-surface-900">
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

    <!-- 論文選択画面 -->
    <div v-if="!selectedPaper" class="paper-selection min-h-screen flex items-center justify-center p-8">
      <Card class="max-w-6xl w-full">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-file"></i>
            <span>論文リーディングモード</span>
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-6">
            <div>
              <p class="text-surface-600 mb-4">
                私的利用を目的として、論文を速読トレーニングで読むことができます。
              </p>
              <p class="text-sm text-surface-500 mb-4">
                注意: この機能は個人で読むためのものです。論文の著作権を尊重し、適切に利用してください。
              </p>
            </div>

            <!-- 検索機能 -->
            <div>
              <label class="block mb-2 font-medium">論文を検索</label>
              <div class="flex gap-2">
                <InputText
                  v-model="searchKeyword"
                  placeholder="キーワード、著者名、タイトルで検索"
                  class="flex-1"
                  @keyup.enter="handleSearch"
                />
                <Button
                  label="検索"
                  icon="pi pi-search"
                  @click="handleSearch"
                  :loading="loading"
                />
              </div>
            </div>

            <!-- 最近の論文 -->
            <div>
              <h3 class="text-lg font-semibold mb-4">最近の関心の高い論文</h3>
              <div v-if="loading" class="text-center py-8">
                <ProgressSpinner />
              </div>
              <div v-else-if="searchResults.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  v-for="paper in searchResults"
                  :key="paper.id"
                  class="cursor-pointer hover:shadow-lg transition-shadow"
                  @click="selectPaper(paper)"
                >
                  <template #title>
                    <div class="text-base font-semibold">{{ paper.title }}</div>
                  </template>
                  <template #content>
                    <div class="flex flex-col gap-2">
                      <div class="text-sm text-surface-600">
                        <div>著者: {{ paper.authors.join(', ') }}</div>
                        <div>発行年: {{ paper.year }}</div>
                        <div v-if="paper.license">ライセンス: {{ paper.license }}</div>
                      </div>
                      <p v-if="paper.abstract" class="text-sm text-surface-700 mt-2 line-clamp-3">
                        {{ paper.abstract }}
                      </p>
                      <div v-if="paper.url" class="mt-2">
                        <a
                          :href="paper.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-sm text-primary hover:underline"
                          @click.stop
                        >
                          元の論文を見る
                        </a>
                      </div>
                    </div>
                  </template>
                </Card>
              </div>
              <div v-else class="text-center py-8 text-surface-500">
                論文が見つかりませんでした
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- 論文読み取り画面 -->
    <div v-else-if="!isPlaying && !isCompleted" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">準備完了</h2>
      <div class="mb-6 space-y-2 text-white">
        <p class="text-lg">{{ selectedPaper.title }}</p>
        <p class="text-sm">著者: {{ selectedPaper.authors.join(', ') }}</p>
        <p class="text-sm">発行年: {{ selectedPaper.year }}</p>
        <p v-if="selectedPaper.license" class="text-sm">ライセンス: {{ selectedPaper.license }}</p>
        <p class="text-sm">速度: {{ wpm }} WPM</p>
      </div>
      <div class="mb-4">
        <Button
          label="開始"
          icon="pi pi-play"
          severity="primary"
          size="large"
          :disabled="wordArray.length === 0"
          @click="startReading"
        />
      </div>
      <div v-if="selectedPaper.url" class="mt-4">
        <a
          :href="selectedPaper.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-white hover:underline"
        >
          元の論文を見る
        </a>
      </div>
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
          @click="goBack"
        />
      </div>
    </div>

    <!-- 読み取り表示 -->
    <div v-else class="paper-display">
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
      </div>
      <template #footer>
        <Button label="閉じる" severity="secondary" @click="showSettingsDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import { usePapers, type Paper } from '@/composables/usePapers'
import { useTextContent } from '@/composables/useTextContent'

const router = useRouter()
const { recentPapers, searchPapers, loadPaper, loading, error } = usePapers()
const { loadText } = useTextContent()

const selectedPaper = ref<Paper | null>(null)
const searchKeyword = ref('')
const searchResults = ref<Paper[]>([])
const isPlaying = ref(false)
const isCompleted = ref(false)
const currentWord = ref('')
const currentWordIndex = ref(0)
const wpm = ref(250)
const fontSize = ref(48)
const showSettingsDialog = ref(false)
const progress = ref(0)

let intervalId: number | null = null
const wordArray = ref<string[]>([])

onMounted(() => {
  // 初期表示では最近の論文を表示
  searchResults.value = recentPapers
})

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = recentPapers
    return
  }
  
  const results = await searchPapers(searchKeyword.value)
  searchResults.value = results
}

const selectPaper = async (paper: Paper) => {
  try {
    selectedPaper.value = paper
    const text = await loadPaper(paper)
    
    // テキストを単語に分割
    const cleaned = text.replace(/[。、，．「」『』（）【】［］｛｝〈〉《》]/g, ' ')
    wordArray.value = cleaned.split(/\s+/).filter(word => word.length > 0)
    
    if (wordArray.value.length > 0) {
      currentWord.value = wordArray.value[0]
    }
  } catch (err) {
    console.error('Error loading paper:', err)
    alert(`論文の読み込みに失敗しました。\n\n${err instanceof Error ? err.message : 'Unknown error'}`)
    selectedPaper.value = null
  }
}

const wordStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
}))

const startReading = () => {
  if (wordArray.value.length === 0) return
  
  isPlaying.value = true
  isCompleted.value = false
  currentWordIndex.value = 0
  progress.value = 0
  
  const delay = (60 / wpm.value) * 1000
  
  const showNextWord = () => {
    if (currentWordIndex.value >= wordArray.value.length) {
      stopReading()
      return
    }
    
    currentWord.value = wordArray.value[currentWordIndex.value]
    progress.value = ((currentWordIndex.value + 1) / wordArray.value.length) * 100
    currentWordIndex.value++
    
    intervalId = window.setTimeout(showNextWord, delay)
  }
  
  showNextWord()
}

const stopReading = () => {
  if (intervalId !== null) {
    clearTimeout(intervalId)
    intervalId = null
  }
  isPlaying.value = false
  isCompleted.value = true
  currentWord.value = ''
  currentWordIndex.value = 0
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

const goBack = () => {
  selectedPaper.value = null
  wordArray.value = []
  currentWordIndex.value = 0
  progress.value = 0
  isCompleted.value = false
}

onMounted(() => {
  // 初期表示
})
</script>

<style scoped>
.paper-reading-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.paper-selection {
  background-color: var(--surface-900);
}

.paper-display {
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

.completed-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>

