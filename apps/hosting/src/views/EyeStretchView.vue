<template>
  <div class="eye-stretch-view min-h-screen bg-surface-900">
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
      <h2 class="text-3xl font-bold text-white mb-4">眼筋ストレッチ運動</h2>
      <div class="mb-6 space-y-2 text-white">
        <p>目の筋肉をストレッチする準備運動です</p>
        <p class="text-sm">視野拡大にも効果があります</p>
        <p class="text-sm">運動回数: {{ repetitions }}回</p>
        <p class="text-sm">速度: {{ speed }}秒/回</p>
      </div>
      <Button
        label="開始"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startStretch"
      />
    </div>

    <div v-else-if="isPlaying" class="stretch-display">
      <div class="stretch-container">
        <div
          ref="targetElement"
          class="stretch-target"
          :class="currentMovement"
          :style="targetStyle"
        >
          <div class="target-circle"></div>
        </div>
        <div class="instruction-text">
          <p class="text-white text-xl font-bold">{{ currentInstruction }}</p>
          <p class="text-white text-sm mt-2">{{ currentRepetition }} / {{ repetitions }}回</p>
        </div>
      </div>
    </div>

    <div v-else-if="isCompleted" class="completed-screen text-center">
      <h2 class="text-3xl font-bold text-white mb-4">ストレッチ完了</h2>
      <p class="text-white mb-6">{{ repetitions }}回のストレッチを完了しました</p>
      <div class="flex gap-4 justify-center">
        <Button
          label="もう一度"
          icon="pi pi-refresh"
          severity="secondary"
          @click="restartStretch"
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
            :max="20"
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
const repetitions = ref(10)
const speed = ref(2)
const currentRepetition = ref(0)
const currentMovement = ref<string>('')
const currentInstruction = ref('')

const targetElement = ref<HTMLElement | null>(null)

const targetStyle = computed(() => ({
  transition: `all ${speed.value}s ease-in-out`
}))

const movements = [
  { name: 'up', instruction: '上を見てください' },
  { name: 'down', instruction: '下を見てください' },
  { name: 'left', instruction: '左を見てください' },
  { name: 'right', instruction: '右を見てください' },
  { name: 'up-left', instruction: '左上を見てください' },
  { name: 'up-right', instruction: '右上を見てください' },
  { name: 'down-left', instruction: '左下を見てください' },
  { name: 'down-right', instruction: '右下を見てください' },
  { name: 'circle', instruction: '円を描くように動かしてください' }
]

let movementInterval: number | null = null
let currentMovementIndex = 0

const startStretch = () => {
  isPlaying.value = true
  isCompleted.value = false
  currentRepetition.value = 0
  currentMovementIndex = 0
  
  performNextMovement()
}

const performNextMovement = () => {
  if (currentRepetition.value >= repetitions.value) {
    stopStretch()
    return
  }
  
  const movement = movements[currentMovementIndex % movements.length]
  currentMovement.value = movement.name
  currentInstruction.value = movement.instruction
  
  currentMovementIndex++
  if (currentMovementIndex % movements.length === 0) {
    currentRepetition.value++
  }
  
  movementInterval = window.setTimeout(() => {
    performNextMovement()
  }, speed.value * 1000)
}

const stopStretch = () => {
  if (movementInterval !== null) {
    clearTimeout(movementInterval)
    movementInterval = null
  }
  isPlaying.value = false
  isCompleted.value = true
  currentMovement.value = ''
  currentInstruction.value = ''
}

const restartStretch = () => {
  isCompleted.value = false
  currentRepetition.value = 0
  currentMovementIndex = 0
  currentMovement.value = ''
  currentInstruction.value = ''
}
</script>

<style scoped>
.eye-stretch-view {
  font-family: 'Noto Sans JP', sans-serif;
}

.stretch-display {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.stretch-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.stretch-target {
  position: absolute;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.target-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

.stretch-target.up {
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
}

.stretch-target.down {
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
}

.stretch-target.left {
  left: 10%;
  top: 50%;
  transform: translateY(-50%);
}

.stretch-target.right {
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
}

.stretch-target.up-left {
  top: 10%;
  left: 10%;
}

.stretch-target.up-right {
  top: 10%;
  right: 10%;
}

.stretch-target.down-left {
  bottom: 10%;
  left: 10%;
}

.stretch-target.down-right {
  bottom: 10%;
  right: 10%;
}

.stretch-target.circle {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: circle-motion 4s linear infinite;
}

@keyframes circle-motion {
  0% {
    transform: translate(-50%, -50%) translateX(200px) translateY(0);
  }
  25% {
    transform: translate(-50%, -50%) translateX(0) translateY(-200px);
  }
  50% {
    transform: translate(-50%, -50%) translateX(-200px) translateY(0);
  }
  75% {
    transform: translate(-50%, -50%) translateX(0) translateY(200px);
  }
  100% {
    transform: translate(-50%, -50%) translateX(200px) translateY(0);
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

