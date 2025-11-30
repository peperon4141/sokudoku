<template>
  <div class="peripheral-vision-view min-h-screen bg-surface-900 flex items-center justify-center">
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

    <div v-if="!isPlaying && !isCompleted" class="ready-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">視幅拡大トレーニング</h2>
      <p class="text-white mb-2">レベル: {{ level }}</p>
      <p class="text-white mb-2">視野範囲: {{ fieldWidth }}文字</p>
      <p class="text-white mb-6">目標: 中央の文字に集中しながら、周辺の文字も認識</p>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startTraining"
      />
    </div>

    <div v-else-if="isPlaying" class="training-screen">
      <div class="relative w-full h-screen flex items-center justify-center">
        <div class="text-center">
          <div
            class="inline-block text-6xl font-bold text-white mb-8"
            :style="{ letterSpacing: '0.1em' }"
          >
            <span
              v-for="(char, index) in displayedText"
              :key="index"
              :class="[
                'inline-block',
                index === centerIndex ? 'text-primary scale-150' : 'text-surface-400'
              ]"
              :style="{
                transform: index === centerIndex ? 'scale(1.5)' : 'scale(1)',
                transition: 'all 0.3s'
              }"
            >
              {{ char }}
            </span>
          </div>
          <div class="mt-8 text-white">
            <p>レベル: {{ level }}</p>
            <p>残り: {{ remainingTime }}秒</p>
            <p>認識テスト: {{ testCount }}回</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isCompleted" class="completed-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">トレーニング完了</h2>
      <p class="text-white mb-2">認識テスト: {{ testCount }}回</p>
      <p class="text-white mb-2">正答率: {{ accuracy.toFixed(1) }}%</p>
      <div class="flex gap-4 justify-center">
        <Button
          label="もう一度"
          icon="pi pi-refresh"
          severity="primary"
          @click="resetTraining"
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
      :style="{ width: '400px' }"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label class="block mb-2 text-white">レベル</label>
          <Select
            v-model="level"
            :options="levels"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            :disabled="isPlaying"
            @change="updateFieldWidth"
          />
        </div>
        <div>
          <label class="block mb-2 text-white">視野範囲（文字数）</label>
          <InputNumber
            v-model="fieldWidth"
            :min="3"
            :max="15"
            :disabled="isPlaying"
            class="w-full"
          />
        </div>
        <div>
          <label class="block mb-2 text-white">表示時間 (ms)</label>
          <InputNumber
            v-model="displayDuration"
            :min="500"
            :max="5000"
            :step="100"
            :disabled="isPlaying"
            class="w-full"
          />
        </div>
        <div>
          <label class="block mb-2 text-white">トレーニング時間 (秒)</label>
          <InputNumber
            v-model="trainingDuration"
            :min="10"
            :max="300"
            :step="10"
            :disabled="isPlaying"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="閉じる"
          severity="secondary"
          @click="showSettingsDialog = false"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'

const isPlaying = ref(false)
const isCompleted = ref(false)
const showSettingsDialog = ref(false)
const level = ref(1)
const fieldWidth = ref(3)
const displayDuration = ref(2000)
const trainingDuration = ref(60)
const displayedText = ref('')
const centerIndex = ref(0)
const remainingTime = ref(60)
const testCount = ref(0)
const correctCount = ref(0)

const levels = [
  { label: 'レベル1（3文字）', value: 1 },
  { label: 'レベル2（5文字）', value: 2 },
  { label: 'レベル3（7文字）', value: 3 },
  { label: 'レベル4（10文字）', value: 4 },
  { label: 'レベル5（15文字）', value: 5 }
]

const accuracy = computed(() => {
  if (testCount.value === 0) return 0
  return (correctCount.value / testCount.value) * 100
})

const generateText = () => {
  const chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'
  const text: string[] = []
  for (let i = 0; i < fieldWidth.value; i++) {
    text.push(chars[Math.floor(Math.random() * chars.length)])
  }
  displayedText.value = text.join('')
  centerIndex.value = Math.floor(fieldWidth.value / 2)
}

let displayInterval: number | null = null
let timerInterval: number | null = null

const updateFieldWidth = () => {
  const widthMap: Record<number, number> = {
    1: 3,
    2: 5,
    3: 7,
    4: 10,
    5: 15
  }
  fieldWidth.value = widthMap[level.value] || 3
}

const startTraining = () => {
  isPlaying.value = true
  isCompleted.value = false
  testCount.value = 0
  correctCount.value = 0
  remainingTime.value = trainingDuration.value
  generateText()

  displayInterval = window.setInterval(() => {
    generateText()
    testCount.value++
  }, displayDuration.value)

  timerInterval = window.setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      stopTraining()
    }
  }, 1000)
}

const stopTraining = () => {
  if (displayInterval !== null) {
    clearInterval(displayInterval)
    displayInterval = null
  }
  if (timerInterval !== null) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  isPlaying.value = false
  isCompleted.value = true
}

const resetTraining = () => {
  isCompleted.value = false
  testCount.value = 0
  correctCount.value = 0
  remainingTime.value = trainingDuration.value
}

onMounted(() => {
  updateFieldWidth()
})

onUnmounted(() => {
  if (displayInterval !== null) {
    clearInterval(displayInterval)
  }
  if (timerInterval !== null) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.peripheral-vision-view {
  font-family: 'Noto Sans JP', sans-serif;
}
</style>

