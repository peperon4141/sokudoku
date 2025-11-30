import { ref } from 'vue'

export interface ComprehensionScore {
  score: number
  timestamp: Date
  method: string
  wpm?: number
}

const comprehensionScores = ref<ComprehensionScore[]>([])

export function useComprehension() {
  const recordScore = (score: number, method: string, wpm?: number) => {
    const comprehensionScore: ComprehensionScore = {
      score,
      timestamp: new Date(),
      method,
      wpm
    }
    comprehensionScores.value.push(comprehensionScore)
    return comprehensionScore
  }

  const getAverageScore = (method?: string, recentCount?: number): number => {
    let scores = comprehensionScores.value
    
    if (method) {
      scores = scores.filter(s => s.method === method)
    }
    
    if (recentCount) {
      scores = scores.slice(-recentCount)
    }
    
    if (scores.length === 0) return 0
    
    const sum = scores.reduce((acc, s) => acc + s.score, 0)
    return sum / scores.length
  }

  const getRecentScores = (count: number = 5, method?: string): ComprehensionScore[] => {
    let scores = comprehensionScores.value
    
    if (method) {
      scores = scores.filter(s => s.method === method)
    }
    
    return scores.slice(-count)
  }

  const shouldAdjustSpeed = (recentScores: ComprehensionScore[]): 'increase' | 'maintain' | 'decrease' => {
    if (recentScores.length < 3) return 'maintain'
    
    const avg = recentScores.reduce((acc, s) => acc + s.score, 0) / recentScores.length
    
    if (avg >= 4) return 'increase'
    if (avg <= 2) return 'decrease'
    return 'maintain'
  }

  const clearScores = () => {
    comprehensionScores.value = []
  }

  return {
    comprehensionScores,
    recordScore,
    getAverageScore,
    getRecentScores,
    shouldAdjustSpeed,
    clearScores
  }
}

