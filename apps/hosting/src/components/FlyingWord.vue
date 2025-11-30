<template>
  <div
    v-if="visible"
    class="flying-word"
    :style="wordStyle"
  >
    {{ word }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  word: string
  speedMultiplier?: number
}

const props = withDefaults(defineProps<Props>(), {
  speedMultiplier: 1.0
})

const emit = defineEmits<{
  complete: []
}>()

const visible = ref(true)
const x = ref(0)
const y = ref(0)
const vx = ref(0)
const vy = ref(0)
const fontSize = ref(20 + Math.random() * 20)

// ランダムな開始位置と方向を設定
const initPosition = () => {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  
  // 画面の端から開始（上下左右のいずれか）
  const side = Math.floor(Math.random() * 4)
  
  switch (side) {
    case 0: // 上
      x.value = Math.random() * screenWidth
      y.value = -50
      break
    case 1: // 右
      x.value = screenWidth + 50
      y.value = Math.random() * screenHeight
      break
    case 2: // 下
      x.value = Math.random() * screenWidth
      y.value = screenHeight + 50
      break
    case 3: // 左
      x.value = -50
      y.value = Math.random() * screenHeight
      break
  }
  
  // ランダムな方向（画面の中心に向かう方向に少しランダム性を加える）
  const centerX = screenWidth / 2
  const centerY = screenHeight / 2
  const angle = Math.atan2(centerY - y.value, centerX - x.value) + (Math.random() - 0.5) * 0.8
  
  // ランダムな速度（1-3の範囲）に速度倍率を適用
  const baseSpeed = 1 + Math.random() * 2
  const speed = baseSpeed * props.speedMultiplier
  vx.value = Math.cos(angle) * speed
  vy.value = Math.sin(angle) * speed
}

const wordStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${x.value}px`,
  top: `${y.value}px`,
  color: '#ffffff',
  fontSize: `${fontSize.value}px`,
  fontWeight: 'bold' as const,
  pointerEvents: 'none' as const,
  whiteSpace: 'nowrap' as const,
  zIndex: 1000,
  textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
  transform: 'translate(-50%, -50%)',
}))

let animationFrameId: number | null = null

const animate = () => {
  x.value += vx.value
  y.value += vy.value
  
  // 画面外に出たら削除
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const margin = 100
  
  if (
    x.value < -margin ||
    x.value > screenWidth + margin ||
    y.value < -margin ||
    y.value > screenHeight + margin
  ) {
    visible.value = false
    emit('complete')
    return
  }
  
  animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
  initPosition()
  animationFrameId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
.flying-word {
  user-select: none;
}
</style>

