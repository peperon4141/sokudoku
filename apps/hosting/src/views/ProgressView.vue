<template>
  <div class="progress-view min-h-screen bg-surface-0 p-8">
    <div class="max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">進捗管理</h1>
        <p class="text-surface-600">あなたの練習の成果を確認しましょう</p>
      </div>

      <div v-if="loading" class="flex justify-center items-center h-64">
        <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
      </div>

      <div v-else>
        <!-- タブ表示 -->
        <TabView>
          <TabPanel header="統計" value="stats">
            <div class="space-y-6">
              <!-- 統計カード -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <template #content>
                    <div class="p-4">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-surface-600 text-sm">平均読書速度</span>
                        <i class="pi pi-tachometer-alt text-primary"></i>
                      </div>
                      <div class="text-3xl font-bold">{{ stats?.averageWpm || 0 }} <span class="text-lg font-normal text-surface-500">WPM</span></div>
                      <div class="text-xs text-surface-500 mt-1">
                        <span :class="stats ? getLevelColor(stats.level) : ''">{{ stats ? getLevelLabel(stats.level) : 'データなし' }}</span>
                      </div>
                    </div>
                  </template>
                </Card>

                <Card>
                  <template #content>
                    <div class="p-4">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-surface-600 text-sm">最高速度</span>
                        <i class="pi pi-star text-primary"></i>
                      </div>
                      <div class="text-3xl font-bold">{{ stats?.bestWpm || 0 }} <span class="text-lg font-normal text-surface-500">WPM</span></div>
                    </div>
                  </template>
                </Card>

                <Card>
                  <template #content>
                    <div class="p-4">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-surface-600 text-sm">総練習時間</span>
                        <i class="pi pi-clock text-primary"></i>
                      </div>
                      <div class="text-3xl font-bold">{{ formatTime(stats?.totalPracticeTime || 0) }}</div>
                      <div class="text-xs text-surface-500 mt-1">{{ stats?.totalSessions || 0 }}回の練習</div>
                    </div>
                  </template>
                </Card>

                <Card>
                  <template #content>
                    <div class="p-4">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-surface-600 text-sm">連続練習日数</span>
                        <i class="pi pi-calendar text-primary"></i>
                      </div>
                      <div class="text-3xl font-bold">{{ stats?.currentStreak || 0 }} <span class="text-lg font-normal text-surface-500">日</span></div>
                      <div class="text-xs text-surface-500 mt-1">最長: {{ stats?.longestStreak || 0 }}日</div>
                    </div>
                  </template>
                </Card>
              </div>

              <!-- 速度比較グラフ -->
              <Card>
                <template #title>読書速度の比較</template>
                <template #content>
                  <div class="p-4">
                    <div class="space-y-4">
                      <div v-for="benchmark in speedBenchmarks" :key="benchmark.label" class="flex items-center gap-4">
                        <div class="w-40 text-sm text-surface-600">{{ benchmark.label }}</div>
                        <div class="flex-1">
                          <div class="h-6 bg-surface-200 rounded-full overflow-hidden">
                            <div
                              class="h-full bg-surface-300 transition-all duration-500"
                              :style="{ width: `${Math.min((benchmark.value / 1000) * 100, 100)}%` }"
                            ></div>
                          </div>
                        </div>
                        <div class="w-24 text-right text-sm font-semibold">{{ benchmark.value }} WPM</div>
                      </div>
                      <div class="flex items-center gap-4 pt-2 border-t-2 border-primary">
                        <div class="w-40 text-sm font-bold text-primary">あなた</div>
                        <div class="flex-1">
                          <div class="h-6 bg-surface-200 rounded-full overflow-hidden">
                            <div
                              class="h-full bg-primary transition-all duration-500"
                              :style="{ width: `${Math.min(((stats?.averageWpm || 0) / 1000) * 100, 100)}%` }"
                            ></div>
                          </div>
                        </div>
                        <div class="w-24 text-right text-sm font-bold text-primary">{{ stats?.averageWpm || 0 }} WPM</div>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </TabPanel>

          <TabPanel header="目標" value="goals">
            <div class="space-y-6">
              <!-- 読書スピード計測セクション -->
              <Card>
                <template #title>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-stopwatch text-primary"></i>
                    <span>読書スピードを計測</span>
                  </div>
                </template>
                <template #content>
                  <div class="p-4 space-y-4">
                    <div v-if="!speedTestText" class="text-center py-8">
                      <p class="text-surface-600 mb-4">テキストを読み込んで計測を開始します</p>
                      <Button
                        label="テキストを読み込む"
                        icon="pi pi-file"
                        severity="primary"
                        @click="loadSpeedTestText"
                      />
                    </div>
                    <div v-else-if="!speedTestStarted && !speedTestCompleted" class="space-y-4">
                      <div class="bg-surface-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                        <p class="text-surface-700 leading-relaxed whitespace-pre-wrap">{{ speedTestText }}</p>
                      </div>
                      <div class="flex items-center justify-center gap-4">
                        <Button
                          label="計測開始"
                          icon="pi pi-play"
                          severity="primary"
                          @click="startSpeedTest"
                        />
                        <Button
                          label="別のテキスト"
                          icon="pi pi-refresh"
                          severity="secondary"
                          outlined
                          @click="resetSpeedTest"
                        />
                      </div>
                    </div>
                    <div v-else-if="speedTestStarted && !speedTestCompleted" class="space-y-4">
                      <div class="bg-surface-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                        <p class="text-surface-700 leading-relaxed whitespace-pre-wrap">{{ speedTestText }}</p>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-primary mb-2">{{ formatElapsedTime(speedTestElapsedTime) }}</div>
                        <p class="text-sm text-surface-600">読了したら「計測終了」を押してください</p>
                      </div>
                      <div class="flex items-center justify-center">
                        <Button
                          label="計測終了"
                          icon="pi pi-stop"
                          severity="success"
                          @click="completeSpeedTest"
                        />
                      </div>
                    </div>
                    <div v-else-if="speedTestCompleted" class="space-y-4">
                      <div class="bg-primary-50 p-6 rounded-lg text-center">
                        <div class="text-4xl font-bold text-primary mb-2">{{ speedTestResult }} WPM</div>
                        <p class="text-surface-600">読書速度</p>
                      </div>
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span class="text-surface-600">読了時間:</span>
                          <span class="font-semibold ml-2">{{ formatElapsedTime(speedTestElapsedTime) }}</span>
                        </div>
                        <div>
                          <span class="text-surface-600">単語数:</span>
                          <span class="font-semibold ml-2">{{ speedTestWordCount }}語</span>
                        </div>
                      </div>
                      <div class="flex items-center justify-center gap-4">
                        <Button
                          label="結果を保存"
                          icon="pi pi-check"
                          severity="primary"
                          @click="saveSpeedTestResult"
                        />
                        <Button
                          label="再計測"
                          icon="pi pi-refresh"
                          severity="secondary"
                          outlined
                          @click="resetSpeedTest"
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </Card>

              <div class="flex justify-between items-center">
                <h2 class="text-2xl font-semibold">目標管理</h2>
                <Button
                  label="新しい目標を設定"
                  icon="pi pi-plus"
                  severity="primary"
                  @click="showGoalDialog = true"
                />
              </div>

              <!-- アクティブな目標 -->
              <div v-if="activeGoals.length > 0">
                <h3 class="text-xl font-semibold mb-4">進行中の目標</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card v-for="goal in activeGoals" :key="goal.id" class="hover:shadow-lg transition-shadow">
                    <template #content>
                      <div class="p-4">
                        <div class="flex items-center justify-between mb-4">
                          <div>
                            <h4 class="font-semibold text-lg">{{ getGoalTypeLabel(goal.type) }}</h4>
                            <p class="text-sm text-surface-600">期限: {{ formatDate(goal.deadline) }}</p>
                          </div>
                          <Button
                            icon="pi pi-trash"
                            severity="danger"
                            text
                            rounded
                            @click="deleteGoal(goal.id!)"
                          />
                        </div>
                        <div class="mb-2">
                          <div class="flex items-center justify-between text-sm mb-1">
                            <span class="text-surface-700">進捗</span>
                            <span class="font-semibold">{{ goal.current }} / {{ goal.target }} {{ getGoalUnit(goal.type) }}</span>
                          </div>
                          <ProgressBar
                            :value="Math.min((goal.current / goal.target) * 100, 100)"
                            :showValue="true"
                          />
                        </div>
                      </div>
                    </template>
                  </Card>
                </div>
              </div>

              <!-- 完了した目標 -->
              <div v-if="completedGoals.length > 0">
                <h3 class="text-xl font-semibold mb-4">達成した目標</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card v-for="goal in completedGoals" :key="goal.id" class="opacity-75">
                    <template #content>
                      <div class="p-4">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="font-semibold">{{ getGoalTypeLabel(goal.type) }}</h4>
                          <i class="pi pi-check-circle text-green-500 text-xl"></i>
                        </div>
                        <p class="text-sm text-surface-600">{{ goal.target }} {{ getGoalUnit(goal.type) }} 達成</p>
                        <p class="text-xs text-surface-500 mt-1">達成日: {{ formatDate(goal.updatedAt) }}</p>
                      </div>
                    </template>
                  </Card>
                </div>
              </div>

              <div v-if="activeGoals.length === 0 && completedGoals.length === 0" class="text-center py-12">
                <i class="pi pi-flag text-6xl text-surface-300 mb-4"></i>
                <p class="text-surface-600">目標が設定されていません</p>
                <Button
                  label="目標を設定する"
                  icon="pi pi-plus"
                  severity="primary"
                  class="mt-4"
                  @click="showGoalDialog = true"
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="練習履歴" value="history">
            <div class="space-y-4">
              <div v-if="progressRecords.length === 0" class="text-center py-12">
                <i class="pi pi-history text-6xl text-surface-300 mb-4"></i>
                <p class="text-surface-600">練習履歴がありません</p>
              </div>
              <div v-else class="space-y-2">
                <Card v-for="record in progressRecords.slice(0, 20)" :key="record.id" class="hover:shadow-md transition-shadow">
                  <template #content>
                    <div class="p-4">
                      <div class="flex items-center justify-between">
                        <div>
                          <h4 class="font-semibold">{{ getMethodName(record.method) }}</h4>
                          <p class="text-sm text-surface-600">{{ formatDateTime(record.date) }}</p>
                        </div>
                        <div class="text-right">
                          <div class="text-lg font-bold">{{ record.wpm }} WPM</div>
                          <div class="text-sm text-surface-600">{{ formatTime(record.duration) }}</div>
                        </div>
                      </div>
                    </div>
                  </template>
                </Card>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>

    <!-- 目標設定ダイアログ -->
    <Dialog
      v-model:visible="showGoalDialog"
      modal
      header="新しい目標を設定"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold mb-2">目標の種類</label>
          <Select
            v-model="newGoal.type"
            :options="goalTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="目標の種類を選択"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-2">目標値</label>
          <InputNumber
            v-model="newGoal.target"
            :min="0"
            :max="10000"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-2">期限</label>
          <Calendar
            v-model="newGoal.deadline"
            dateFormat="yy-mm-dd"
            :minDate="new Date()"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="キャンセル" severity="secondary" @click="showGoalDialog = false" />
        <Button label="設定" severity="primary" @click="handleCreateGoal" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ProgressBar from 'primevue/progressbar'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import { useAuth } from '@/composables/useAuth'
import { useUserStats, readingSpeedBenchmarks } from '@/composables/useUserStats'
import { useGoals, type GoalType } from '@/composables/useGoals'
import { useProgress } from '@/composables/useProgress'
import { useReadingMethods } from '@/composables/useReadingMethods'
import { useTextContent } from '@/composables/useTextContent'

const { isAuthenticated } = useAuth()
const { stats, loadStats, getLevelLabel, getLevelColor, updateStats } = useUserStats()
const { activeGoals, completedGoals, loadGoals, createGoal, deleteGoal, getGoalTypeLabel, getGoalUnit, updateGoalProgress } = useGoals()
const { progressRecords, loadProgressRecords, createSession, completeSession, updateSession } = useProgress()
const { getMethodById } = useReadingMethods()
const { loadText, getAvailableSources } = useTextContent()

const loading = ref(false)
const showGoalDialog = ref(false)
const newGoal = ref<{ type: GoalType | null; target: number | null; deadline: Date | null }>({
  type: null,
  target: null,
  deadline: null
})

// 読書スピード計測関連
const speedTestText = ref<string>('')
const speedTestStarted = ref(false)
const speedTestCompleted = ref(false)
const speedTestStartTime = ref<Date | null>(null)
const speedTestElapsedTime = ref(0)
const speedTestResult = ref(0)
const speedTestWordCount = ref(0)
let speedTestTimer: number | null = null

const goalTypes = [
  { label: '読書速度', value: 'speed' as GoalType },
  { label: '練習時間', value: 'time' as GoalType },
  { label: '練習頻度', value: 'frequency' as GoalType },
  { label: '理解度', value: 'comprehension' as GoalType }
]

onMounted(async () => {
  if (isAuthenticated.value) {
    loading.value = true
    await Promise.all([
      loadStats(),
      loadGoals(),
      loadProgressRecords(50)
    ])
    loading.value = false
  }
})

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}時間${minutes}分`
  }
  return `${minutes}分`
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getMethodName = (methodId: string): string => {
  const method = getMethodById(methodId)
  return method?.name || methodId
}

const speedBenchmarks = computed(() => [
  { label: '平均的な読書速度', value: readingSpeedBenchmarks.average },
  { label: '速読初心者', value: readingSpeedBenchmarks.beginner },
  { label: '速読中級者', value: readingSpeedBenchmarks.intermediate },
  { label: '速読上級者', value: readingSpeedBenchmarks.advanced },
  { label: 'エキスパート', value: readingSpeedBenchmarks.expert }
])

const handleCreateGoal = async () => {
  if (!newGoal.value.type || !newGoal.value.target || !newGoal.value.deadline) return

  try {
    await createGoal(newGoal.value.type, newGoal.value.target, newGoal.value.deadline)
    showGoalDialog.value = false
    newGoal.value = { type: null, target: null, deadline: null }
  } catch (err) {
    console.error('目標の作成に失敗しました:', err)
  }
}

// 読書スピード計測機能
const loadSpeedTestText = async () => {
  try {
    const sources = getAvailableSources()
    if (sources.length === 0) {
      alert('利用可能なテキストがありません')
      return
    }
    const textSource = sources[0] // 最初のテキストを使用
    const content = await loadText(textSource)
    speedTestText.value = content.text
    speedTestWordCount.value = content.words.length
  } catch (err) {
    console.error('テキストの読み込みに失敗しました:', err)
    alert('テキストの読み込みに失敗しました')
  }
}

const startSpeedTest = () => {
  speedTestStarted.value = true
  speedTestStartTime.value = new Date()
  speedTestElapsedTime.value = 0
  
  speedTestTimer = window.setInterval(() => {
    if (speedTestStartTime.value) {
      speedTestElapsedTime.value = Math.floor((new Date().getTime() - speedTestStartTime.value.getTime()) / 1000)
    }
  }, 100)
}

const completeSpeedTest = () => {
  if (speedTestTimer !== null) {
    clearInterval(speedTestTimer)
    speedTestTimer = null
  }
  
  speedTestStarted.value = false
  speedTestCompleted.value = true
  
  // WPMを計算（経過時間が0の場合は1秒として計算）
  const minutes = Math.max(speedTestElapsedTime.value / 60, 1 / 60)
  speedTestResult.value = Math.round(speedTestWordCount.value / minutes)
}

const resetSpeedTest = () => {
  if (speedTestTimer !== null) {
    clearInterval(speedTestTimer)
    speedTestTimer = null
  }
  
  speedTestText.value = ''
  speedTestStarted.value = false
  speedTestCompleted.value = false
  speedTestStartTime.value = null
  speedTestElapsedTime.value = 0
  speedTestResult.value = 0
  speedTestWordCount.value = 0
}

const saveSpeedTestResult = async () => {
  if (!isAuthenticated.value || !speedTestStartTime.value) return
  
  try {
    // セッションを作成して保存
    const session = createSession('speed-test', {
      wordCount: speedTestWordCount.value,
      duration: speedTestElapsedTime.value
    })
    
    // 開始時刻を計測開始時刻に設定
    session.startTime = speedTestStartTime.value
    const endTime = new Date()
    session.endTime = endTime
    session.duration = speedTestElapsedTime.value * 1000 // ミリ秒単位
    
    updateSession(session.id, {
      wordsRead: speedTestWordCount.value,
      averageWpm: speedTestResult.value,
      averageComprehension: 0,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration
    })
    
    await completeSession(session.id)
    await updateStats()
    await updateGoalProgress()
    
    // 統計を再読み込み
    await loadStats()
    await loadGoals()
    
    resetSpeedTest()
  } catch (err) {
    console.error('結果の保存に失敗しました:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    alert(`結果の保存に失敗しました: ${errorMessage}`)
  }
}

const formatElapsedTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.progress-view {
  font-family: 'Noto Sans JP', sans-serif;
}
</style>

