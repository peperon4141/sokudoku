import { ref } from 'vue'

export interface Paper {
  id: string
  title: string
  authors: string[]
  year: number
  source: 'jstage' | 'arxiv' | 'local'
  url?: string
  abstract?: string
  license?: 'CC BY' | 'CC BY-SA' | 'CC BY-NC' | 'other'
  doi?: string
  text?: string // 全文（ローカルファイルの場合）
}

// 最近の関心の高い論文（私的利用向け）
// 注意: 実際の論文は、J-STAGEやarXivから取得する必要があります
// ここでは、参考になる論文の情報をリスト化します
const recentPapers: Paper[] = [
  {
    id: 'paper-1',
    title: '深層学習を用いた自然言語処理の最新動向',
    authors: ['研究機関名'],
    year: 2024,
    source: 'jstage',
    url: 'https://www.jstage.jst.go.jp/',
    abstract: '深層学習を用いた自然言語処理に関する最新の研究動向をまとめた論文',
    license: 'CC BY',
    doi: '10.xxxx/xxxx'
  },
  {
    id: 'paper-2',
    title: '生成AIの社会的影響に関する研究',
    authors: ['研究機関名'],
    year: 2024,
    source: 'jstage',
    url: 'https://www.jstage.jst.go.jp/',
    abstract: 'ChatGPT、GPTなどの生成AIの社会的影響を分析した論文',
    license: 'CC BY',
    doi: '10.xxxx/xxxx'
  },
  {
    id: 'paper-3',
    title: 'デジタル時代における読書行動の変化',
    authors: ['研究機関名'],
    year: 2024,
    source: 'jstage',
    url: 'https://www.jstage.jst.go.jp/',
    abstract: '読書行動、速読、デジタル読書に関する研究',
    license: 'CC BY',
    doi: '10.xxxx/xxxx'
  },
  {
    id: 'paper-4',
    title: '日本社会におけるコロナ禍の興味関心度のデジタルデータ分析',
    authors: ['研究機関名'],
    year: 2024,
    source: 'jstage',
    url: 'https://www.jstage.jst.go.jp/article/bdajcs/13/1/13_31/_article/-char/ja/',
    abstract: 'デジタルデータを活用して日本社会におけるコロナ禍の関心度を分析',
    license: 'CC BY',
    doi: '10.xxxx/xxxx'
  }
]

const selectedPaper = ref<Paper | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// J-STAGEから論文を検索（実装は後で追加）
const searchJStage = async (keyword: string): Promise<Paper[]> => {
  // TODO: J-STAGE APIを使用して論文を検索
  // 現在は、ローカルのリストから検索
  return recentPapers.filter(paper => 
    paper.title.includes(keyword) || 
    paper.authors.some(author => author.includes(keyword))
  )
}

// arXivから論文を検索（実装は後で追加）
const searchArxiv = async (keyword: string): Promise<Paper[]> => {
  // TODO: arXiv APIを使用して論文を検索
  return []
}

// 論文の全文を取得（実装は後で追加）
const fetchPaperText = async (paper: Paper): Promise<string> => {
  if (paper.text) {
    return paper.text
  }
  
  if (paper.source === 'local' && paper.url) {
    // ローカルファイルから取得
    try {
      const response = await fetch(paper.url)
      return await response.text()
    } catch (err) {
      throw new Error(`論文の取得に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
  
  // TODO: J-STAGEやarXivから論文の全文を取得
  throw new Error('論文の全文取得は未実装です')
}

export function usePapers() {
  const getRecentPapers = () => recentPapers
  
  const searchPapers = async (keyword: string, source?: 'jstage' | 'arxiv' | 'all') => {
    loading.value = true
    error.value = null
    
    try {
      let results: Paper[] = []
      
      if (source === 'jstage' || source === 'all' || !source) {
        const jstageResults = await searchJStage(keyword)
        results = [...results, ...jstageResults]
      }
      
      if (source === 'arxiv' || source === 'all') {
        const arxivResults = await searchArxiv(keyword)
        results = [...results, ...arxivResults]
      }
      
      return results
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }
  
  const loadPaper = async (paper: Paper) => {
    loading.value = true
    error.value = null
    
    try {
      const text = await fetchPaperText(paper)
      selectedPaper.value = { ...paper, text }
      return text
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    recentPapers,
    selectedPaper,
    loading,
    error,
    getRecentPapers,
    searchPapers,
    loadPaper
  }
}

