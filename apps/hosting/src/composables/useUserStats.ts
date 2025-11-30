import { ref, computed } from 'vue'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuth } from './useAuth'
import { useProgress } from './useProgress'

export interface UserStats {
  userId: string
  totalPracticeTime: number // 総練習時間（秒）
  averageWpm: number
  bestWpm: number
  currentStreak: number // 連続練習日数
  longestStreak: number
  totalSessions: number
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  lastUpdated: Date
}

const stats = ref<UserStats | null>(null)
const loading = ref(false)

// レベル判定
const calculateLevel = (wpm: number): UserStats['level'] => {
  if (wpm < 300) return 'beginner'
  if (wpm < 500) return 'intermediate'
  if (wpm < 800) return 'advanced'
  return 'expert'
}

// 一般的な読書速度の基準
export const readingSpeedBenchmarks = {
  average: 250, // 平均的な読書速度
  beginner: 300, // 速読初心者
  intermediate: 500, // 速読中級者
  advanced: 800, // 速読上級者
  expert: 1000 // エキスパート
}

export function useUserStats() {
  const { user } = useAuth()
  const { progressRecords, loadProgressRecords } = useProgress()

  const loadStats = async () => {
    if (!user.value) return

    loading.value = true
    try {
      // Firestoreから統計を読み込む
      const statsDoc = await getDoc(doc(db, 'users', user.value.id, 'stats', 'current'))
      
      if (statsDoc.exists()) {
        const data = statsDoc.data()
        stats.value = {
          ...data,
          lastUpdated: data.lastUpdated.toDate()
        } as UserStats
      } else {
        // 統計が存在しない場合は初期化
        await initializeStats()
      }

      // 進捗記録を読み込んで統計を更新
      await loadProgressRecords(1000) // 十分な数の記録を読み込む
      await updateStats()
    } catch (err) {
      console.error('統計の読み込みに失敗しました:', err)
    } finally {
      loading.value = false
    }
  }

  const initializeStats = async () => {
    if (!user.value) return

    const initialStats: Omit<UserStats, 'lastUpdated'> = {
      userId: user.value.id,
      totalPracticeTime: 0,
      averageWpm: 0,
      bestWpm: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalSessions: 0,
      level: 'beginner'
    }

    stats.value = {
      ...initialStats,
      lastUpdated: new Date()
    }

    await saveStats()
  }

  const updateStats = async () => {
    if (!user.value || !progressRecords.value.length) return

    // 統計を計算
    const totalTime = progressRecords.value.reduce((sum, r) => sum + r.duration, 0)
    const totalWpm = progressRecords.value.reduce((sum, r) => sum + r.wpm, 0)
    const averageWpm = totalWpm / progressRecords.value.length
    const bestWpm = Math.max(...progressRecords.value.map(r => r.wpm), 0)
    const totalSessions = progressRecords.value.length

    // 連続練習日数を計算
    const streak = calculateStreak(progressRecords.value)

    stats.value = {
      userId: user.value.id,
      totalPracticeTime: totalTime,
      averageWpm: Math.round(averageWpm),
      bestWpm: Math.round(bestWpm),
      currentStreak: streak.current,
      longestStreak: streak.longest,
      totalSessions,
      level: calculateLevel(averageWpm),
      lastUpdated: new Date()
    }

    await saveStats()
  }

  const calculateStreak = (records: typeof progressRecords.value): { current: number; longest: number } => {
    if (records.length === 0) return { current: 0, longest: 0 }

    // 日付ごとにグループ化
    const dates = new Set(records.map(r => {
      const date = new Date(r.date)
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    }))
    const sortedDates = Array.from(dates).sort().reverse()

    // 現在の連続日数を計算
    let currentStreak = 0
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
    const yesterdayStr = `${today.getFullYear()}-${today.getMonth()}-${new Date(today.getTime() - 86400000).getDate()}`

    if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
      currentStreak = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i - 1])
        const prevDate = new Date(sortedDates[i])
        const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // 最長連続日数を計算
    let longestStreak = 1
    let tempStreak = 1
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i - 1])
      const prevDate = new Date(sortedDates[i])
      const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    return { current: currentStreak, longest: longestStreak }
  }

  const saveStats = async () => {
    if (!user.value || !stats.value) return

    try {
      await setDoc(doc(db, 'users', user.value.id, 'stats', 'current'), {
        ...stats.value,
        lastUpdated: Timestamp.fromDate(stats.value.lastUpdated)
      })
    } catch (err) {
      console.error('統計の保存に失敗しました:', err)
    }
  }

  const getLevelLabel = (level: UserStats['level']): string => {
    const labels = {
      beginner: '初心者',
      intermediate: '中級者',
      advanced: '上級者',
      expert: 'エキスパート'
    }
    return labels[level]
  }

  const getLevelColor = (level: UserStats['level']): string => {
    const colors = {
      beginner: 'text-blue-500',
      intermediate: 'text-green-500',
      advanced: 'text-orange-500',
      expert: 'text-purple-500'
    }
    return colors[level]
  }

  return {
    stats: computed(() => stats.value),
    loading: computed(() => loading.value),
    loadStats,
    updateStats,
    getLevelLabel,
    getLevelColor,
    readingSpeedBenchmarks
  }
}

