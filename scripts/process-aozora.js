#!/usr/bin/env node
/**
 * 青空文庫のテキストファイルを処理するスクリプト
 * 
 * 使用方法:
 * 1. 青空文庫の公式サイトからテキストファイルをダウンロード
 * 2. node scripts/process-aozora.js <入力ファイル> <出力ファイル>
 * 
 * 例:
 * node scripts/process-aozora.js ~/Downloads/rashomon.txt apps/hosting/src/data/aozora-rashomon.txt
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 青空文庫のルビ記法を処理
function processAozoraText(text) {
  // ルビ記法を削除: 《ルビ》や｜《ルビ》を削除
  text = text.replace(/｜《[^》]+》/g, '')
  text = text.replace(/《[^》]+》/g, '')
  
  // 注釈を削除: ［＃注1］など
  text = text.replace(/［＃[^］]+］/g, '')
  
  // 改ページ指示を改行に変換: ［＃改ページ］
  text = text.replace(/［＃改ページ］/g, '\n\n')
  
  // 余分な空白を整理（ただし改行は保持）
  text = text.replace(/[ \t]+/g, ' ')  // 連続する空白を1つに
  text = text.replace(/\n[ \t]+/g, '\n')  // 行頭の空白を削除
  text = text.replace(/[ \t]+\n/g, '\n')  // 行末の空白を削除
  text = text.replace(/\n{3,}/g, '\n\n')  // 3つ以上の連続改行を2つに
  
  return text.trim()
}

// メイン処理
function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('使用方法: node scripts/process-aozora.js <入力ファイル> <出力ファイル>')
    console.log('\n例:')
    console.log('  node scripts/process-aozora.js ~/Downloads/rashomon.txt apps/hosting/src/data/aozora-rashomon.txt')
    process.exit(1)
  }
  
  const inputPath = path.resolve(args[0])
  const outputPath = path.resolve(__dirname, '..', args[1])
  
  if (!fs.existsSync(inputPath)) {
    console.error(`エラー: 入力ファイルが見つかりません: ${inputPath}`)
    process.exit(1)
  }
  
  console.log(`処理中: ${inputPath}`)
  console.log(`出力先: ${outputPath}`)
  
  try {
    // ファイルを読み込み（Shift_JISまたはUTF-8を自動判定）
    const buffer = fs.readFileSync(inputPath)
    let text
    
    // Shift_JISとして試行
    try {
      const decoder = new TextDecoder('Shift_JIS')
      text = decoder.decode(buffer)
    } catch (err) {
      // UTF-8として処理
      text = buffer.toString('utf-8')
    }
    
    // 処理
    const processedText = processAozoraText(text)
    
    // 出力ディレクトリが存在しない場合は作成
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // ファイルに書き込み
    fs.writeFileSync(outputPath, processedText, 'utf-8')
    
    console.log(`✓ 処理完了: ${outputPath}`)
    console.log(`  文字数: ${processedText.length}`)
    console.log(`  行数: ${processedText.split('\n').length}`)
  } catch (err) {
    console.error(`エラー: ${err.message}`)
    process.exit(1)
  }
}

main()

