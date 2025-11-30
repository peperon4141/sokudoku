<template>
  <div class="park-sasaki-view min-h-screen bg-surface-900">
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

    <!-- ステップ1: 呼吸法 -->
    <div v-if="currentStep === 'breathing'" class="breathing-step min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-white mb-8">呼吸法トレーニング</h2>
        <div class="breathing-circle-container mb-8">
          <div
            class="breathing-circle"
            :style="breathingCircleStyle"
          />
        </div>
        <p class="text-white text-xl mb-4">{{ breathingInstruction }}</p>
        <p class="text-white text-sm mb-6">残り時間: {{ breathingTimeRemaining }}秒</p>
        <Button
          label="スキップ"
          severity="secondary"
          outlined
          @click="skipBreathing"
        />
      </div>
    </div>

    <!-- ステップ2: リラクゼーション -->
    <div v-if="currentStep === 'relaxation'" class="relaxation-step min-h-screen flex items-center justify-center">
      <div class="text-center max-w-2xl mx-auto p-8">
        <h2 class="text-3xl font-bold text-white mb-8">漸進的筋弛緩法</h2>
        <p class="text-white text-lg mb-6">{{ relaxationInstruction }}</p>
        <div class="mb-6">
          <ProgressBar :value="relaxationProgress" class="mb-4" />
          <p class="text-white text-sm">進捗: {{ relaxationStep }} / {{ relaxationSteps.length }}</p>
        </div>
        <Button
          label="次へ"
          severity="primary"
          @click="nextRelaxationStep"
        />
      </div>
    </div>

    <!-- ステップ3: 視覚訓練 -->
    <div v-if="currentStep === 'visual'" class="visual-step min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-white mb-8">視覚訓練</h2>
        <div class="visual-training-area mb-8">
          <div
            v-for="(char, index) in visualChars"
            :key="index"
            class="visual-char"
            :style="getVisualCharStyle(index)"
          >
            {{ char }}
          </div>
        </div>
        <p class="text-white mb-6">中央の文字を中心に、周辺の文字も認識してください</p>
        <Button
          label="次へ"
          severity="primary"
          @click="nextVisualStep"
        />
      </div>
    </div>

    <!-- ステップ4: 速読実践 -->
    <div v-if="currentStep === 'reading'" class="reading-step min-h-screen flex items-center justify-center">
      <div v-if="!selectedWordListId" class="word-list-selection">
        <TextSourceSelector
          @select="handleSourceSelect"
          @cancel="$router.push('/')"
        />
      </div>

      <div v-else-if="!isPlaying" class="ready-screen text-center">
        <h2 class="text-3xl font-bold text-white mb-4">準備完了</h2>
        <p class="text-white mb-6">速度: {{ wpm }} WPM</p>
        <Button
          label="開始"
          icon="pi pi-play"
          severity="primary"
          size="large"
          @click="startReading"
        />
      </div>

      <div v-else class="reading-display">
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
    </div>

    <!-- ステップ5: 理解度テスト -->
    <div v-if="currentStep === 'comprehension'" class="comprehension-step min-h-screen flex items-center justify-center p-8">
      <Card class="max-w-2xl w-full">
        <template #title>理解度テスト</template>
        <template #content>
          <div class="flex flex-col gap-6">
            <p class="text-surface-700">読んだ内容をどの程度理解できましたか？</p>
            <div class="flex gap-2 justify-center">
              <Button
                v-for="score in [1, 2, 3, 4, 5]"
                :key="score"
                :label="score.toString()"
                :severity="score >= 4 ? 'success' : score >= 3 ? 'warning' : 'danger'"
                size="large"
                @click="recordComprehension(score)"
              />
            </div>
            <p class="text-sm text-surface-600 text-center">1: 全く理解できなかった 〜 5: 完全に理解できた</p>
          </div>
        </template>
      </Card>
    </div>

    <Dialog
      v-model:visible="showSettingsDialog"
      modal
      header="設定"
      :style="{ width: '600px' }"
    >
      <div class="flex flex-col gap-6">
        <div>
          <label class="block mb-2 font-medium">読書速度: {{ wpm }} WPM</label>
          <Slider
            v-model="wpm"
            :min="200"
            :max="600"
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
            v-model="skipBreathingStep"
            inputId="skip-breathing"
            binary
          />
          <label for="skip-breathing" class="text-sm">呼吸法をスキップ</label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox
            v-model="skipRelaxationStep"
            inputId="skip-relaxation"
            binary
          />
          <label for="skip-relaxation" class="text-sm">リラクゼーションをスキップ</label>
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
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import ProgressBar from 'primevue/progressbar'
import TextSourceSelector from '@/components/TextSourceSelector.vue'
import { useWords } from '@/composables/useWords'
import { useTextContent, type TextSource } from '@/composables/useTextContent'
import { useComprehension } from '@/composables/useComprehension'

type Step = 'breathing' | 'relaxation' | 'visual' | 'reading' | 'comprehension'

const router = useRouter()
const { words, loadWords } = useWords()
const { loadText } = useTextContent()
const { recordScore } = useComprehension()

const currentStep = ref<Step>('breathing')
const selectedWordListId = ref<string | null>(null)
const isPlaying = ref(false)
const currentWord = ref('')
const currentWordIndex = ref(0)
const wpm = ref(300)
const fontSize = ref(48)
const showSettingsDialog = ref(false)
const skipBreathingStep = ref(false)
const skipRelaxationStep = ref(false)
const progress = ref(0)

// 呼吸法関連
const breathingPhase = ref<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale')
const breathingTimeRemaining = ref(4)
const breathingProgress = ref(0)

// リラクゼーション関連
const relaxationStep = ref(0)
const relaxationSteps = [
  '顔の筋肉を緊張させて5秒間保持し、その後リラックス',
  '首と肩の筋肉を緊張させて5秒間保持し、その後リラックス',
  '腕の筋肉を緊張させて5秒間保持し、その後リラックス',
  '脚の筋肉を緊張させて5秒間保持し、その後リラックス',
  '全身をリラックスさせ、深呼吸を3回行う'
]

// 視覚訓練関連
const visualChars = ref<string[]>([])
const visualFieldSize = ref(3)

let intervalId: number | null = null
let breathingIntervalId: number | null = null
let wordArray: string[] = []

const breathingInstruction = computed(() => {
  switch (breathingPhase.value) {
    case 'inhale': return '吸って...'
    case 'hold1': return '止めて...'
    case 'exhale': return '吐いて...'
    case 'hold2': return '止めて...'
    default: return ''
  }
})

const breathingCircleStyle = computed(() => {
  const size = breathingPhase.value === 'inhale' || breathingPhase.value === 'hold1' ? 200 : 100
  return {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    margin: '0 auto',
    transition: 'all 4s ease-in-out'
  }
})

const relaxationProgress = computed(() => {
  return ((relaxationStep.value + 1) / relaxationSteps.length) * 100
})

const relaxationInstruction = computed(() => {
  return relaxationSteps[relaxationStep.value] || ''
})

const wordStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  color: '#ffffff',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
}))

const getVisualCharStyle = (index: number) => {
  const center = Math.floor(visualChars.value.length / 2)
  const distance = Math.abs(index - center)
  const opacity = Math.max(0.3, 1 - distance * 0.2)
  const fontSize = Math.max(24, 48 - distance * 8)
  
  return {
    opacity,
    fontSize: `${fontSize}px`,
    color: '#ffffff',
    display: 'inline-block',
    margin: '0 4px'
  }
}

const startBreathing = () => {
  const cycle = () => {
    breathingTimeRemaining.value = 4
    breathingProgress.value = 0
    
    const phaseCycle = () => {
      if (breathingTimeRemaining.value <= 0) {
        switch (breathingPhase.value) {
          case 'inhale':
            breathingPhase.value = 'hold1'
            break
          case 'hold1':
            breathingPhase.value = 'exhale'
            break
          case 'exhale':
            breathingPhase.value = 'hold2'
            break
          case 'hold2':
            breathingPhase.value = 'inhale'
            break
        }
        breathingTimeRemaining.value = 4
      } else {
        breathingTimeRemaining.value--
        breathingProgress.value = ((4 - breathingTimeRemaining.value) / 4) * 100
      }
    }
    
    breathingIntervalId = window.setInterval(phaseCycle, 1000)
    
    // 30秒後に次のステップへ
    setTimeout(() => {
      if (breathingIntervalId !== null) {
        clearInterval(breathingIntervalId)
        breathingIntervalId = null
      }
      nextStep()
    }, 30000)
  }
  
  cycle()
}

const skipBreathing = () => {
  if (breathingIntervalId !== null) {
    clearInterval(breathingIntervalId)
    breathingIntervalId = null
  }
  nextStep()
}

const nextRelaxationStep = () => {
  if (relaxationStep.value < relaxationSteps.length - 1) {
    relaxationStep.value++
  } else {
    nextStep()
  }
}

const generateVisualChars = () => {
  const chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'
  const charArray = chars.split('')
  const selected: string[] = []
  const count = visualFieldSize.value * visualFieldSize.value
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * charArray.length)
    selected.push(charArray[randomIndex])
  }
  
  visualChars.value = selected
}

const nextVisualStep = () => {
  if (visualFieldSize.value < 7) {
    visualFieldSize.value++
    generateVisualChars()
  } else {
    nextStep()
  }
}

const nextStep = () => {
  switch (currentStep.value) {
    case 'breathing':
      currentStep.value = skipRelaxationStep.value ? 'visual' : 'relaxation'
      if (currentStep.value === 'visual') {
        generateVisualChars()
      }
      break
    case 'relaxation':
      currentStep.value = 'visual'
      generateVisualChars()
      break
    case 'visual':
      currentStep.value = 'reading'
      break
    case 'reading':
      currentStep.value = 'comprehension'
      break
    case 'comprehension':
      router.push('/')
      break
  }
}

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
    
    if (wordArray.length > 0) {
      currentWord.value = wordArray[0]
    }
  } catch (err) {
    console.error('Error in handleSourceSelect:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    alert(`テキストの読み込みに失敗しました。\n\n${errorMessage}\n\n別のテキストソースを選択してください。`)
    selectedWordListId.value = null
    wordArray = []
  }
}

const startReading = () => {
  if (wordArray.length === 0) return
  
  isPlaying.value = true
  currentWordIndex.value = 0
  progress.value = 0
  
  const delay = (60 / wpm.value) * 1000
  
  const showNextWord = () => {
    if (currentWordIndex.value >= wordArray.length) {
      stopReading()
      nextStep()
      return
    }
    
    currentWord.value = wordArray[currentWordIndex.value]
    progress.value = ((currentWordIndex.value + 1) / wordArray.length) * 100
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
}

const recordComprehension = (score: number) => {
  recordScore(score, 'park-sasaki', wpm.value)
  nextStep()
}

onMounted(() => {
  if (skipBreathingStep.value) {
    currentStep.value = skipRelaxationStep.value ? 'visual' : 'relaxation'
    if (currentStep.value === 'visual') {
      generateVisualChars()
    }
  } else {
    startBreathing()
  }
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearTimeout(intervalId)
  }
  if (breathingIntervalId !== null) {
    clearInterval(breathingIntervalId)
  }
})
</script>

<style scoped>
.park-sasaki-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.breathing-circle-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reading-display {
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

.visual-training-area {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 600px;
  margin: 0 auto;
}

.visual-char {
  transition: all 0.3s ease;
}
</style>

