<template>
  <div class="saccade-training-view min-h-screen bg-surface-900 flex items-center justify-center">
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
      <h2 class="text-3xl font-bold text-white mb-4">視点移動トレーニング</h2>
      <p class="text-white mb-2">レベル: {{ level }}</p>
      <p class="text-white mb-2">点の数: {{ pointCount }}</p>
      <p class="text-white mb-2">移動速度: {{ speed }}ms</p>
      <p class="text-white mb-6">目標: 視点を素早く移動させ、停留時間を短縮</p>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startTraining"
      />
    </div>

    <div v-else-if="isPlaying" class="training-screen">
      <div class="relative w-full h-screen">
        <div
          v-for="(point, index) in points"
          :key="index"
          :class="[
            'absolute w-4 h-4 rounded-full transition-all duration-300',
            currentPointIndex === index ? 'bg-primary scale-150' : 'bg-surface-500'
          ]"
          :style="{
            left: `${point.x}%`,
            top: `${point.y}%`,
            transform: currentPointIndex === index ? 'scale(1.5)' : 'scale(1)'
          }"
        />
        <div class="absolute top-4 left-4 text-white">
          <p>レベル: {{ level }}</p>
          <p>残り: {{ remainingTime }}秒</p>
          <p>移動回数: {{ moveCount }}</p>
        </div>
      </div>
    </div>

    <div v-else-if="isCompleted" class="completed-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">トレーニング完了</h2>
      <p class="text-white mb-2">移動回数: {{ moveCount }}</p>
      <p class="text-white mb-2">平均移動時間: {{ averageMoveTime.toFixed(2) }}ms</p>
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
          />
        </div>
        <div>
          <label class="block mb-2 text-white">点の数</label>
          <InputNumber
            v-model="pointCount"
            :min="2"
            :max="10"
            :disabled="isPlaying"
            class="w-full"
          />
        </div>
        <div>
          <label class="block mb-2 text-white">移動速度 (ms)</label>
          <InputNumber
            v-model="speed"
            :min="100"
            :max="2000"
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

interface Point {
  x: number
  y: number
}

const isPlaying = ref(false)
const isCompleted = ref(false)
const showSettingsDialog = ref(false)
const level = ref(1)
const pointCount = ref(3)
const speed = ref(500)
const trainingDuration = ref(60)
const currentPointIndex = ref(0)
const moveCount = ref(0)
const remainingTime = ref(60)
const moveTimes: number[] = []
const startTime = ref(0)

const levels = [
  { label: 'レベル1（初心者）', value: 1 },
  { label: 'レベル2（初級）', value: 2 },
  { label: 'レベル3（中級）', value: 3 },
  { label: 'レベル4（上級）', value: 4 },
  { label: 'レベル5（熟練）', value: 5 }
]

const points = ref<Point[]>([])

const averageMoveTime = computed(() => {
  if (moveTimes.length === 0) return 0
  return moveTimes.reduce((a, b) => a + b, 0) / moveTimes.length
})

const generatePoints = () => {
  const newPoints: Point[] = []
  for (let i = 0; i < pointCount.value; i++) {
    newPoints.push({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    })
  }
  points.value = newPoints
}

let moveInterval: number | null = null
let timerInterval: number | null = null

const startTraining = () => {
  isPlaying.value = true
  isCompleted.value = false
  moveCount.value = 0
  remainingTime.value = trainingDuration.value
  moveTimes.length = 0
  currentPointIndex.value = 0
  generatePoints()
  startTime.value = Date.now()

  moveInterval = window.setInterval(() => {
    const moveStartTime = Date.now()
    currentPointIndex.value = (currentPointIndex.value + 1) % points.value.length
    moveCount.value++
    
    const moveEndTime = Date.now()
    moveTimes.push(moveEndTime - moveStartTime)
  }, speed.value)

  timerInterval = window.setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      stopTraining()
    }
  }, 1000)
}

const stopTraining = () => {
  if (moveInterval !== null) {
    clearInterval(moveInterval)
    moveInterval = null
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
  moveCount.value = 0
  remainingTime.value = trainingDuration.value
  moveTimes.length = 0
  currentPointIndex.value = 0
}

onMounted(() => {
  generatePoints()
})

onUnmounted(() => {
  if (moveInterval !== null) {
    clearInterval(moveInterval)
  }
  if (timerInterval !== null) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.saccade-training-view {
  font-family: 'Noto Sans JP', sans-serif;
}
</style>

