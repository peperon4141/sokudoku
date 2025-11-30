import { ref, computed } from 'vue'
import { collection, addDoc, query, orderBy, getDocs, doc, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuth } from './useAuth'
import { useUserStats } from './useUserStats'

export type GoalType = 'speed' | 'time' | 'frequency' | 'comprehension'

export interface Goal {
  id?: string
  userId: string
  type: GoalType
  target: number // 目標値
  current: number // 現在値
  deadline: Date
  status: 'active' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

const goals = ref<Goal[]>([])
const loading = ref(false)

export function useGoals() {
  const { user } = useAuth()
  const { stats } = useUserStats()

  const loadGoals = async () => {
    if (!user.value) return

    loading.value = true
    try {
      const q = query(
        collection(db, 'users', user.value.id, 'goals'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      goals.value = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          deadline: data.deadline.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Goal
      })

      // 目標の進捗を更新
      await updateGoalProgress()
    } catch (err) {
      console.error('目標の読み込みに失敗しました:', err)
    } finally {
      loading.value = false
    }
  }

  const createGoal = async (type: GoalType, target: number, deadline: Date): Promise<string> => {
    if (!user.value) {
      throw new Error('ユーザーがログインしていません')
    }

    const goal: Omit<Goal, 'id'> = {
      userId: user.value.id,
      type,
      target,
      current: 0,
      deadline,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    try {
      const docRef = await addDoc(collection(db, 'users', user.value.id, 'goals'), {
        ...goal,
        deadline: Timestamp.fromDate(goal.deadline),
        createdAt: Timestamp.fromDate(goal.createdAt),
        updatedAt: Timestamp.fromDate(goal.updatedAt)
      })
      await loadGoals()
      return docRef.id
    } catch (err) {
      console.error('目標の作成に失敗しました:', err)
      throw err
    }
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user.value) return

    try {
      const goal = goals.value.find(g => g.id === goalId)
      if (!goal) return

      const updatedGoal = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      }

      await updateDoc(doc(db, 'users', user.value.id, 'goals', goalId), updatedGoal)
      await loadGoals()
    } catch (err) {
      console.error('目標の更新に失敗しました:', err)
      throw err
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!user.value) return

    try {
      await deleteDoc(doc(db, 'users', user.value.id, 'goals', goalId))
      goals.value = goals.value.filter(g => g.id !== goalId)
    } catch (err) {
      console.error('目標の削除に失敗しました:', err)
      throw err
    }
  }

  const updateGoalProgress = async () => {
    if (!user.value || !stats.value) return

    const now = new Date()

    for (const goal of goals.value) {
      if (goal.status !== 'active') continue

      let current = 0
      let status: Goal['status'] = 'active'

      switch (goal.type) {
        case 'speed':
          current = stats.value.averageWpm
          break
        case 'time':
          // 週間または月間の練習時間を計算
          const startDate = new Date(goal.createdAt)
          const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          if (daysDiff <= 7) {
            // 週間目標
            current = stats.value.totalPracticeTime / 60 // 分単位
          } else {
            // 月間目標
            current = stats.value.totalPracticeTime / 60 // 分単位
          }
          break
        case 'frequency':
          // 週間または月間の練習日数を計算
          const weekStart = new Date(now)
          weekStart.setDate(weekStart.getDate() - 7)
          // 簡易実装: 統計の連続日数を使用
          current = stats.value.currentStreak
          break
        case 'comprehension':
          // 理解度の平均を計算（進捗記録から）
          // 簡易実装: 80%を仮定
          current = 80
          break
      }

      // 目標達成判定
      if (current >= goal.target) {
        status = 'completed'
      } else if (now > goal.deadline) {
        status = 'failed'
      }

      if (goal.current !== current || goal.status !== status) {
        await updateGoal(goal.id!, { current, status })
      }
    }
  }

  const getGoalTypeLabel = (type: GoalType): string => {
    const labels = {
      speed: '読書速度',
      time: '練習時間',
      frequency: '練習頻度',
      comprehension: '理解度'
    }
    return labels[type]
  }

  const getGoalUnit = (type: GoalType): string => {
    const units = {
      speed: 'WPM',
      time: '分',
      frequency: '日',
      comprehension: '%'
    }
    return units[type]
  }

  const activeGoals = computed(() => goals.value.filter(g => g.status === 'active'))
  const completedGoals = computed(() => goals.value.filter(g => g.status === 'completed'))
  const failedGoals = computed(() => goals.value.filter(g => g.status === 'failed'))

  return {
    goals: computed(() => goals.value),
    activeGoals,
    completedGoals,
    failedGoals,
    loading: computed(() => loading.value),
    loadGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    getGoalTypeLabel,
    getGoalUnit
  }
}

