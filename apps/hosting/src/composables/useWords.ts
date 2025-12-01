import { ref } from 'vue'

export interface Word {
  word: string
}

export interface WordList {
  id: string
  name: string
  file: string
  type: 'words'
}

export const wordLists: WordList[] = [
  { id: 'general', name: '一般単語', file: 'words.csv', type: 'words' },
  { id: 'law', name: '法律単語', file: 'words-law.csv', type: 'words' },
]

const words = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const parseCsv = (csvText: string): string[] => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '')
  // ヘッダー行をスキップ
  const dataLines = lines.slice(1)
  
  // CSVをパース（シンプルな実装、カンマ区切りを想定）
  const loadedWords: string[] = []
  for (const line of dataLines) {
    const trimmed = line.trim()
    if (trimmed) {
      // 最初のカラム（word）を取得
      const word = trimmed.split(',')[0]?.trim()
      if (word) {
        loadedWords.push(word)
      }
    }
  }
  
  return loadedWords
}

export function useWords() {
  const loadWords = async (wordListId: string = 'general') => {
    loading.value = true
    error.value = null
    
    try {
      const wordList = wordLists.find(wl => wl.id === wordListId)
      if (!wordList) {
        throw new Error(`Word list not found: ${wordListId}`)
      }
      
      // CSVファイルを読み込む
      let csvText: string
      if (wordListId === 'general') {
        const csvModule = await import('../data/words.csv?raw')
        csvText = csvModule.default
      } else if (wordListId === 'law') {
        const csvModule = await import('../data/words-law.csv?raw')
        csvText = csvModule.default
      } else {
        throw new Error(`Unknown word list: ${wordListId}`)
      }
      
      words.value = parseCsv(csvText)
      
      if (words.value.length === 0) {
        throw new Error('No words loaded')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error loading words:', err)
      words.value = []
    } finally {
      loading.value = false
    }
  }
  
  const getRandomWord = (): string | null => {
    if (words.value.length === 0) {
      return null
    }
    const randomIndex = Math.floor(Math.random() * words.value.length)
    return words.value[randomIndex]
  }
  
  return {
    words,
    loading,
    error,
    loadWords,
    getRandomWord
  }
}

