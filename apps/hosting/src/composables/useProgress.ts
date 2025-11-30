import { ref, computed } from 'vue'
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuth } from './useAuth'

export interface TrainingSession {
  id: string
  userId: string
  method: string
  startTime: Date
  endTime?: Date
  duration?: number
  wordsRead: number
  averageWpm: number
  averageComprehension: number
  wordListId?: string
  settings: Record<string, any>
}

export interface ProgressRecord {
  id?: string
  userId: string
  method: string
  date: Date
  duration: number
  wordsRead: number
  wpm: number
  comprehension: number
  wordListId?: string
  settings: Record<string, any>
  createdAt: Date
}

const trainingSessions = ref<TrainingSession[]>([])
const progressRecords = ref<ProgressRecord[]>([])
const loading = ref(false)

export function useProgress() {
  const { user } = useAuth()

  const createSession = (method: string, settings: Record<string, any> = {}): TrainingSession => {
    if (!user.value) {
      throw new Error('ユーザーがログインしていません')
    }
    const session: TrainingSession = {
      id: `session-${Date.now()}`,
      userId: user.value.id,
      method,
      startTime: new Date(),
      wordsRead: 0,
      averageWpm: 0,
      averageComprehension: 0,
      settings
    }
    trainingSessions.value.push(session)
    return session
  }

  const updateSession = (sessionId: string, updates: Partial<TrainingSession>) => {
    const session = trainingSessions.value.find(s => s.id === sessionId)
    if (session) {
      Object.assign(session, updates)
    }
  }

  const completeSession = async (sessionId: string): Promise<void> => {
    const session = trainingSessions.value.find(s => s.id === sessionId)
    if (!session) return
    if (!user.value) return

    if (!session.endTime) {
      session.endTime = new Date()
    }
    if (!session.duration) {
      session.duration = session.endTime.getTime() - session.startTime.getTime()
    }

    // Firestoreに保存
    try {
      const progressRecord: Omit<ProgressRecord, 'id'> = {
        userId: user.value.id,
        method: session.method,
        date: session.startTime,
        duration: Math.floor((session.duration || 0) / 1000), // 秒単位
        wordsRead: session.wordsRead,
        wpm: session.averageWpm,
        comprehension: session.averageComprehension,
        wordListId: session.wordListId,
        settings: session.settings,
        createdAt: new Date()
      }

      await addDoc(collection(db, 'users', user.value.id, 'progress'), {
        ...progressRecord,
        date: Timestamp.fromDate(progressRecord.date),
        createdAt: Timestamp.fromDate(progressRecord.createdAt)
      })
    } catch (err) {
      console.error('進捗の保存に失敗しました:', err)
      throw err
    }
  }

  const getSessionsByMethod = (method: string): TrainingSession[] => {
    return trainingSessions.value.filter(s => s.method === method)
  }

  const getRecentSessions = (count: number = 10): TrainingSession[] => {
    return trainingSessions.value.slice(-count)
  }

  const getTotalWordsRead = (method?: string): number => {
    const sessions = method
      ? trainingSessions.value.filter(s => s.method === method)
      : trainingSessions.value
    
    return sessions.reduce((sum, s) => sum + s.wordsRead, 0)
  }

  const getAverageWpm = (method?: string): number => {
    const sessions = method
      ? trainingSessions.value.filter(s => s.method === method)
      : trainingSessions.value
    
    if (sessions.length === 0) return 0
    
    const sum = sessions.reduce((sum, s) => sum + s.averageWpm, 0)
    return sum / sessions.length
  }

  const getTotalTrainingTime = (method?: string): number => {
    const sessions = method
      ? trainingSessions.value.filter(s => s.method === method && s.duration)
      : trainingSessions.value.filter(s => s.duration)
    
    return sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  }

  const loadProgressRecords = async (limitCount: number = 50) => {
    if (!user.value) return

    loading.value = true
    try {
      const q = query(
        collection(db, 'users', user.value.id, 'progress'),
        orderBy('date', 'desc'),
        limit(limitCount)
      )
      const snapshot = await getDocs(q)
      progressRecords.value = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate()
        } as ProgressRecord
      })
    } catch (err) {
      console.error('進捗の読み込みに失敗しました:', err)
    } finally {
      loading.value = false
    }
  }

  const clearSessions = () => {
    trainingSessions.value = []
  }

  return {
    trainingSessions,
    progressRecords,
    loading: computed(() => loading.value),
    createSession,
    updateSession,
    completeSession,
    getSessionsByMethod,
    getRecentSessions,
    getTotalWordsRead,
    getAverageWpm,
    getTotalTrainingTime,
    loadProgressRecords,
    clearSessions
  }
}

