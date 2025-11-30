import { ref } from 'vue'

export interface TrainingSession {
  id: string
  method: string
  startTime: Date
  endTime?: Date
  duration?: number
  wordsRead: number
  averageWpm: number
  averageComprehension: number
  settings: Record<string, any>
}

const trainingSessions = ref<TrainingSession[]>([])

export function useProgress() {
  const createSession = (method: string, settings: Record<string, any> = {}): TrainingSession => {
    const session: TrainingSession = {
      id: `session-${Date.now()}`,
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

  const completeSession = (sessionId: string) => {
    const session = trainingSessions.value.find(s => s.id === sessionId)
    if (session) {
      session.endTime = new Date()
      session.duration = session.endTime.getTime() - session.startTime.getTime()
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

  const clearSessions = () => {
    trainingSessions.value = []
  }

  return {
    trainingSessions,
    createSession,
    updateSession,
    completeSession,
    getSessionsByMethod,
    getRecentSessions,
    getTotalWordsRead,
    getAverageWpm,
    getTotalTrainingTime,
    clearSessions
  }
}

