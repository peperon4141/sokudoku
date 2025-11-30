import { ref } from 'vue'

export interface TextSource {
  id: string
  name: string
  type: 'local' | 'aozora' | 'url' | 'custom'
  source: string // ファイルパス、URL、またはテキストコンテンツ
  description?: string
}

export interface TextContent {
  id: string
  title: string
  author?: string
  text: string
  words: string[]
  chunks: string[]
}

// ローカルのサンプル文章
const sampleTexts: TextSource[] = [
  {
    id: 'sample-1',
    name: 'サンプル文章1',
    type: 'local',
    source: 'sample1.txt',
    description: '短い文章のサンプル'
  },
  {
    id: 'sample-2',
    name: 'サンプル文章2',
    type: 'local',
    source: 'sample2.txt',
    description: '中程度の長さの文章'
  }
]

// 青空文庫の人気作品（テキストファイルとして提供）
const aozoraTexts: TextSource[] = [
  {
    id: 'aozora-1',
    name: '走れメロス（太宰治）',
    type: 'aozora',
    source: 'https://www.aozora.gr.jp/cards/000035/files/1567_14913.html',
    description: '太宰治の短編小説'
  },
  {
    id: 'aozora-2',
    name: 'こころ（夏目漱石）',
    type: 'aozora',
    source: 'https://www.aozora.gr.jp/cards/000148/files/773_14560.html',
    description: '夏目漱石の長編小説'
  }
]

const textContent = ref<TextContent | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// テキストを単語に分割（日本語対応）
const splitIntoWords = (text: string): string[] => {
  // 句読点や記号を除去
  const cleaned = text.replace(/[。、，．「」『』（）【】［］｛｝〈〉《》]/g, ' ')
  // 空白で分割
  const words = cleaned.split(/\s+/).filter(word => word.length > 0)
  return words
}

// テキストをチャンク（意味のまとまり）に分割
const splitIntoChunks = (text: string, chunkSize: number = 3): string[] => {
  const words = splitIntoWords(text)
  const chunks: string[] = []
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim()) {
      chunks.push(chunk)
    }
  }
  
  return chunks
}

// 青空文庫のHTMLからテキストを抽出
const extractTextFromAozora = (html: string): string => {
  // 簡易的なHTMLパース（実際の実装ではより堅牢に）
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // main要素または本文を含む要素を探す
  const mainContent = doc.querySelector('main') || doc.querySelector('.main_text') || doc.body
  
  // テキストを抽出
  let text = mainContent?.textContent || ''
  
  // 余分な空白や改行を整理
  text = text.replace(/\s+/g, ' ').trim()
  
  return text
}

// ローカルファイルを読み込む
const loadLocalFile = async (filename: string): Promise<string> => {
  try {
    const module = await import(`../data/${filename}?raw`)
    return module.default
  } catch (err) {
    throw new Error(`Failed to load local file: ${filename}`)
  }
}

// URLからテキストを取得
const fetchTextFromUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const html = await response.text()
    return extractTextFromAozora(html)
  } catch (err) {
    throw new Error(`Failed to fetch text from URL: ${url}`)
  }
}

export function useTextContent() {
  const loadText = async (source: TextSource): Promise<TextContent> => {
    loading.value = true
    error.value = null
    
    try {
      let text = ''
      let title = source.name
      let author: string | undefined
      
      switch (source.type) {
        case 'local':
          text = await loadLocalFile(source.source)
          break
        case 'aozora':
        case 'url':
          text = await fetchTextFromUrl(source.source)
          // タイトルと著者を抽出（簡易版）
          const titleMatch = text.match(/^(.{1,50})/)
          if (titleMatch) {
            title = titleMatch[1]
          }
          break
        case 'custom':
          text = source.source
          break
        default:
          throw new Error(`Unknown source type: ${source.type}`)
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty text content')
      }
      
      const words = splitIntoWords(text)
      const chunks = splitIntoChunks(text, 3)
      
      const content: TextContent = {
        id: source.id,
        title,
        author,
        text,
        words,
        chunks
      }
      
      textContent.value = content
      return content
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error loading text:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getAvailableSources = (): TextSource[] => {
    return [...sampleTexts, ...aozoraTexts]
  }

  const createCustomSource = (name: string, text: string): TextSource => {
    return {
      id: `custom-${Date.now()}`,
      name,
      type: 'custom',
      source: text
    }
  }

  return {
    textContent,
    loading,
    error,
    loadText,
    getAvailableSources,
    createCustomSource,
    splitIntoWords,
    splitIntoChunks
  }
}

