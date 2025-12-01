<template>
  <div class="vision-up-view min-h-screen bg-surface-900">
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
      <h2 class="text-3xl font-bold text-white mb-4">視力アップトレーニング</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>眼筋を鍛えることで、眼球の歪みが矯正され視力が回復します</p>
        <p class="text-sm">運動回数: {{ repetitions }}回</p>
        <p class="text-sm">速度: {{ speed }}秒/回</p>
        <p class="text-sm">レベル: {{ level }}</p>
      </div>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startTraining"
      />
    </div>

    <div v-else-if="isPlaying" class="training-display">
      <div class="training-container">
        <div
          ref="targetElement"
          class="training-target"
          :class="currentExercise"
          :style="targetStyle"
        >
          <div class="target-content">
            <div v-if="currentExercise === 'focus'" class="focus-circle"></div>
            <div v-else-if="currentExercise === 'distance'" class="distance-circles">
              <div class="circle circle-1"></div>
              <div class="circle circle-2"></div>
            </div>
            <div v-else-if="currentExercise === 'rotation'" class="rotation-circle"></div>
          </div>
        </div>
        <div class="instruction-text">
          <p class="text-white text-xl font-bold">{{ currentInstruction }}</p>
          <p class="text-white text-sm mt-2">{{ currentRepetition }} / {{ repetitions }}回</p>
        </div>
      </div>
    </div>

    <div v-else-if="isCompleted" class="completed-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">トレーニング完了</h2>
      <p class="text-white mb-6">{{ repetitions }}回のトレーニングを完了しました</p>
      <div class="mb-4">
        <p class="text-white text-sm">継続することで、眼筋が鍛えられ視力が回復します</p>
      </div>
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
          <label class="block mb-2 font-medium">運動回数: {{ repetitions }}回</label>
          <Slider
            v-model="repetitions"
            :min="5"
            :max="30"
            :step="5"
            class="w-full"
            :disabled="isPlaying"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">速度: {{ speed }}秒/回</label>
          <Slider
            v-model="speed"
            :min="1"
            :max="5"
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
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'

const isPlaying = ref(false)
const isCompleted = ref(false)
const showSettingsDialog = ref(false)
const repetitions = ref(15)
const speed = ref(2)
const level = ref(3)
const currentRepetition = ref(0)
const currentExercise = ref<string>('')
const currentInstruction = ref('')

const targetElement = ref<HTMLElement | null>(null)

const targetStyle = computed(() => ({
  transition: `all ${speed.value}s ease-in-out`
}))

const exercises = [
  { name: 'focus', instruction: '中央の点に焦点を合わせてください' },
  { name: 'distance', instruction: '近くの点と遠くの点を交互に見てください' },
  { name: 'rotation', instruction: '円を描くように眼球を動かしてください' },
  { name: 'horizontal', instruction: '左右に眼球を動かしてください' },
  { name: 'vertical', instruction: '上下に眼球を動かしてください' }
]

let exerciseInterval: number | null = null
let currentExerciseIndex = 0

const startTraining = () => {
  isPlaying.value = true
  isCompleted.value = false
  currentRepetition.value = 0
  currentExerciseIndex = 0
  
  performNextExercise()
}

const performNextExercise = () => {
  if (currentRepetition.value >= repetitions.value) {
    stopTraining()
    return
  }
  
  const exercise = exercises[currentExerciseIndex % exercises.length]
  currentExercise.value = exercise.name
  currentInstruction.value = exercise.instruction
  
  currentExerciseIndex++
  if (currentExerciseIndex % exercises.length === 0) {
    currentRepetition.value++
  }
  
  exerciseInterval = window.setTimeout(() => {
    performNextExercise()
  }, speed.value * 1000)
}

const stopTraining = () => {
  if (exerciseInterval !== null) {
    clearTimeout(exerciseInterval)
    exerciseInterval = null
  }
  isPlaying.value = false
  isCompleted.value = true
  currentExercise.value = ''
  currentInstruction.value = ''
}

const restartTraining = () => {
  isCompleted.value = false
  currentRepetition.value = 0
  currentExerciseIndex = 0
  currentExercise.value = ''
  currentInstruction.value = ''
}
</script>

<style scoped>
.vision-up-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.training-display {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.training-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.training-target {
  position: absolute;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.target-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.focus-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

.distance-circles {
  position: relative;
  width: 100%;
  height: 100%;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background-color: #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

.circle-1 {
  width: 30px;
  height: 30px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translateX(-100px);
}

.circle-2 {
  width: 30px;
  height: 30px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translateX(100px);
}

.rotation-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  animation: rotation-motion 4s linear infinite;
}

@keyframes rotation-motion {
  0% {
    transform: translateX(200px) translateY(0);
  }
  25% {
    transform: translateX(0) translateY(-200px);
  }
  50% {
    transform: translateX(-200px) translateY(0);
  }
  75% {
    transform: translateX(0) translateY(200px);
  }
  100% {
    transform: translateX(200px) translateY(0);
  }
}

.training-target.horizontal {
  animation: horizontal-motion 2s ease-in-out infinite;
}

@keyframes horizontal-motion {
  0%, 100% {
    left: 10%;
  }
  50% {
    left: 90%;
  }
}

.training-target.vertical {
  animation: vertical-motion 2s ease-in-out infinite;
}

@keyframes vertical-motion {
  0%, 100% {
    top: 10%;
  }
  50% {
    top: 90%;
  }
}

.instruction-text {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
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

