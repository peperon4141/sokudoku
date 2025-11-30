<template>
  <div class="eye-movement-view min-h-screen bg-surface-900 flex items-center justify-center">
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
      <h2 class="text-3xl font-bold text-white mb-4">眼球運動トレーニング</h2>
      <p class="text-white mb-2">パターン: {{ patternNames[pattern] }}</p>
      <p class="text-white mb-2">速度: {{ speed }}ms</p>
      <p class="text-white mb-6">目標: 眼球を効率的に動かす能力を向上</p>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startTraining"
      />
    </div>

    <div v-else-if="isPlaying" class="training-screen relative w-full h-screen overflow-hidden">
      <div
        class="absolute w-12 h-12 rounded-full bg-primary shadow-lg z-20"
        :style="ballStyle"
      />
        <div class="absolute top-4 left-4 text-white z-10">
          <p class="text-lg font-bold">パターン: {{ patternNames[pattern] }}</p>
          <p class="text-lg">残り: {{ remainingTime }}秒</p>
        </div>
    </div>

    <div v-else-if="isCompleted" class="completed-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">トレーニング完了</h2>
      <p class="text-white mb-2">トレーニング時間: {{ trainingDuration }}秒</p>
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
          <label class="block mb-2 text-white">パターン</label>
          <Select
            v-model="pattern"
            :options="patternOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            :disabled="isPlaying"
          />
        </div>
        <div>
          <label class="block mb-2 text-white">速度 (ms)</label>
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
import { ref, computed, onUnmounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'

type Pattern = 'horizontal' | 'vertical' | 'circular'

const isPlaying = ref(false)
const isCompleted = ref(false)
const showSettingsDialog = ref(false)
const pattern = ref<Pattern>('horizontal')
const speed = ref(500)
const trainingDuration = ref(60)
const remainingTime = ref(60)
const ballPosition = ref({ x: 50, y: 50 })
const angle = ref(0)

const patternNames: Record<Pattern, string> = {
  horizontal: '水平運動',
  vertical: '垂直運動',
  circular: '円運動'
}

const patternOptions = [
  { label: '水平運動', value: 'horizontal' },
  { label: '垂直運動', value: 'vertical' },
  { label: '円運動', value: 'circular' }
]

const ballStyle = computed(() => {
  // パーセンテージベースで位置を指定（親要素のサイズに応じて自動調整）
  return {
    left: `${ballPosition.value.x}%`,
    top: `${ballPosition.value.y}%`,
    transform: 'translate(-50%, -50%)',
    transition: `left ${speed.value}ms linear, top ${speed.value}ms linear`
  }
})

let animationInterval: number | null = null
let timerInterval: number | null = null
let animationFrameId: number | null = null
let lastUpdateTime = 0

const startTraining = () => {
  isPlaying.value = true
  isCompleted.value = false
  remainingTime.value = trainingDuration.value
  angle.value = 0
  ballPosition.value = { x: 50, y: 50 }
  lastUpdateTime = Date.now()

  const animate = () => {
    if (!isPlaying.value) return
    
    const now = Date.now()
    const deltaTime = now - lastUpdateTime
    
    if (deltaTime >= speed.value / 10) {
      if (pattern.value === 'horizontal') {
        ballPosition.value.x = 50 + Math.sin(angle.value) * 40
        ballPosition.value.y = 50
      } else if (pattern.value === 'vertical') {
        ballPosition.value.x = 50
        ballPosition.value.y = 50 + Math.sin(angle.value) * 40
      } else if (pattern.value === 'circular') {
        ballPosition.value.x = 50 + Math.cos(angle.value) * 40
        ballPosition.value.y = 50 + Math.sin(angle.value) * 40
      }
      angle.value += 0.1
      lastUpdateTime = now
    }
    
    animationFrameId = requestAnimationFrame(animate)
  }

  animationFrameId = requestAnimationFrame(animate)

  timerInterval = window.setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      stopTraining()
    }
  }, 1000)
}

const stopTraining = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (animationInterval !== null) {
    clearInterval(animationInterval)
    animationInterval = null
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
  remainingTime.value = trainingDuration.value
  angle.value = 0
  ballPosition.value = { x: 50, y: 50 }
}

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  if (animationInterval !== null) {
    clearInterval(animationInterval)
  }
  if (timerInterval !== null) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.eye-movement-view {
  font-family: 'Noto Sans JP', sans-serif;
}
</style>

