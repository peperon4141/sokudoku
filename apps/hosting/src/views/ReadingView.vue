<template>
  <div v-if="!selectedWordListId" class="word-list-selection min-h-screen bg-surface-0 flex items-center justify-center p-8">
    <Card class="max-w-md w-full">
      <template #title>単語リストを選択</template>
      <template #content>
        <div class="flex flex-col gap-4">
          <Button
            v-for="wordList in wordLists"
            :key="wordList.id"
            :label="wordList.name"
            severity="primary"
            class="w-full justify-start"
            @click="selectWordList(wordList.id)"
          />
          <Button
            label="キャンセル"
            severity="secondary"
            outlined
            class="w-full"
            @click="$router.push('/')"
          />
        </div>
      </template>
    </Card>
  </div>
  <div v-else class="reading-view">
    <div class="fixed top-4 right-4 z-50">
      <Button
        icon="pi pi-ellipsis-v"
        severity="secondary"
        outlined
        rounded
        @click="toggleMenu"
        aria-haspopup="true"
        aria-controls="settings-menu"
      />
      <Menu
        id="settings-menu"
        ref="menu"
        :model="menuItems"
        :popup="true"
        class="settings-menu"
      />
    </div>
    <Dialog
      v-model:visible="showSettingsDialog"
      modal
      header="設定"
      :style="{ width: '600px' }"
    >
      <div class="flex flex-col gap-6">
        <div>
          <label class="block mb-2 font-medium">移動速度: {{ speedMultiplier.toFixed(1) }}x</label>
          <Slider
            v-model="speedMultiplier"
            :min="0.1"
            :max="3.0"
            :step="0.1"
            class="w-full"
          />
        </div>
        <div>
          <label class="block mb-2 font-medium">表示単語数: {{ maxWords }}</label>
          <Slider
            v-model="maxWords"
            :min="1"
            :max="20"
            :step="1"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="閉じる" severity="secondary" @click="showSettingsDialog = false" />
      </template>
    </Dialog>
    <div v-if="error" class="error-message fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded z-50">
      {{ error }}
    </div>
    <div v-if="loading" class="loading-message fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xl z-50">
      読み込み中...
    </div>
    <FlyingWord
      v-for="wordData in activeWords"
      :key="wordData.id"
      :word="wordData.word"
      :speed-multiplier="speedMultiplier"
      @complete="removeWord(wordData.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuItem } from 'primevue/menuitem'
import FlyingWord from '@/components/FlyingWord.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import { useWords, wordLists } from '@/composables/useWords'

interface WordData {
  id: number
  word: string
}

const route = useRoute()
const router = useRouter()
const { getRandomWord, loading, loadWords, error } = useWords()
const selectedWordListId = ref<string | null>(null)
const activeWords = ref<WordData[]>([])
const speedMultiplier = ref(1.0)
const maxWords = ref(5)
const showSettingsDialog = ref(false)
const menu = ref<InstanceType<typeof Menu> | null>(null)
let wordIdCounter = 0
let intervalId: number | null = null

const menuItems = computed<MenuItem[]>(() => [
  {
    label: '設定',
    icon: 'pi pi-cog',
    command: () => { showSettingsDialog.value = true }
  },
  {
    separator: true
  },
  {
    label: '戻る',
    icon: 'pi pi-arrow-left',
    command: () => { goBack() }
  }
])

// 最大単語数を超えたら古い単語を削除
watch(activeWords, (newWords) => {
  if (newWords.length > maxWords.value) {
    const removeCount = newWords.length - maxWords.value
    activeWords.value.splice(0, removeCount)
  }
}, { deep: true })

const toggleMenu = (event: MouseEvent) => {
  menu.value?.toggle(event)
}

const selectWordList = async (wordListId: string) => {
  selectedWordListId.value = wordListId
  await loadWords(wordListId)
  
  // 初回の単語を追加
  addWord()
  
  // 定期的に新しい単語を追加（1-3秒のランダムな間隔）
  const scheduleNext = () => {
    const delay = 1000 + Math.random() * 2000 // 1-3秒
    intervalId = window.setTimeout(() => {
      addWord()
      scheduleNext()
    }, delay)
  }
  
  scheduleNext()
}

const addWord = () => {
  if (loading.value) {
    return
  }
  
  // 最大単語数に達している場合は追加しない
  if (activeWords.value.length >= maxWords.value) {
    return
  }
  
  const word = getRandomWord()
  if (word) {
    activeWords.value.push({
      id: wordIdCounter++,
      word
    })
  }
}

const removeWord = (id: number) => {
  const index = activeWords.value.findIndex(w => w.id === id)
  if (index !== -1) {
    activeWords.value.splice(index, 1)
  }
}

const goBack = () => {
  if (intervalId !== null) {
    clearTimeout(intervalId)
    intervalId = null
  }
  activeWords.value = []
  selectedWordListId.value = null
  router.push('/')
}

onMounted(() => {
  // クエリパラメータから単語リストIDを取得
  const wordListId = route.query.wordList as string | undefined
  if (wordListId) {
    selectWordList(wordListId)
  }
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearTimeout(intervalId)
  }
})
</script>

<style scoped>
.reading-view {
  width: 100vw;
  height: 100vh;
  background-color: #000000;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
}

</style>

