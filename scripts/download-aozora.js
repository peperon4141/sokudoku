#!/usr/bin/env node
/**
 * 青空文庫のテキストファイルをダウンロードして処理するスクリプト
 * 
 * 使用方法:
 * node scripts/download-aozora.js <作品キー> [出力ファイル名]
 * 
 * 例:
 * node scripts/download-aozora.js rashomon
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 青空文庫の作品IDとファイル名のマッピング
const works = {
  'rashomon': { id: '000035', file: '301_ruby_5915', name: '羅生門' },
  'kumo-no-ito': { id: '000879', file: '92_ruby_2438', name: '蜘蛛の糸' },
  'wagahai': { id: '000148', file: '789_ruby_5639', name: '吾輩は猫である' },
  'ginga-tetsudo': { id: '000081', file: '243_ruby_1218', name: '銀河鉄道の夜' },
  'hashire-merosu': { id: '000148', file: '475_ruby_2365', name: '走れメロス' },
  'kokoro': { id: '001148', file: '43737_ruby_19028', name: 'こころ' },
  'ningen-shikkaku': { id: '000035', file: '301_ruby_5915', name: '人間失格' }
}

// 青空文庫のテキストファイルURLを生成
function getAozoraUrl(cardId, fileId) {
  // 青空文庫のテキストファイルは通常、cards/{cardId}/files/{fileId}.txt の形式
  return `https://www.aozora.gr.jp/cards/${cardId}/files/${fileId}.txt`
}

// Shift_JISをUTF-8に変換
function convertEncoding(buffer) {
  try {
    // Node.jsのTextDecoderを使用（Node.js 11.0.0以降）
    const decoder = new TextDecoder('Shift_JIS')
    return decoder.decode(buffer)
  } catch (err) {
    // Shift_JISの変換に失敗した場合は、UTF-8として処理
    console.warn('Shift_JISの変換に失敗しました。UTF-8として処理します。')
    return buffer.toString('utf-8')
  }
}

// 青空文庫のルビ記法を処理
function processAozoraText(text) {
  // ルビ記法を削除: 《ルビ》や｜《ルビ》を削除
  text = text.replace(/｜《[^》]+》/g, '')
  text = text.replace(/《[^》]+》/g, '')
  
  // 注釈を削除: ［＃注1］など
  text = text.replace(/［＃[^］]+］/g, '')
  
  // 改ページ指示を削除: ［＃改ページ］
  text = text.replace(/［＃改ページ］/g, '\n\n')
  
  // 余分な空白を整理
  text = text.replace(/\s+/g, ' ')
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n')
  
  return text.trim()
}

// ファイルをダウンロード
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AozoraDownloader/1.0)'
      }
    }
    
    https.get(options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // リダイレクトを追跡
        const redirectUrl = response.headers.location
        if (!redirectUrl) {
          return reject(new Error(`リダイレクト先が不明です: ${url}`))
        }
        // 相対URLの場合は絶対URLに変換
        const absoluteUrl = redirectUrl.startsWith('http') 
          ? redirectUrl 
          : `${urlObj.protocol}//${urlObj.hostname}${redirectUrl}`
        return downloadFile(absoluteUrl, outputPath).then(resolve).catch(reject)
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}: ${url}`))
      }
      
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const text = convertEncoding(buffer)
        const processedText = processAozoraText(text)
        
        fs.writeFileSync(outputPath, processedText, 'utf-8')
        console.log(`✓ ダウンロード完了: ${outputPath} (${processedText.length}文字)`)
        resolve(processedText)
      })
    }).on('error', reject)
  })
}

// メイン処理
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('使用方法: node scripts/download-aozora.js <作品キー> [出力ファイル名]')
    console.log('\n利用可能な作品:')
    Object.keys(works).forEach(key => {
      console.log(`  ${key}: ${works[key].name}`)
    })
    process.exit(1)
  }
  
  const workKey = args[0]
  const work = works[workKey]
  
  if (!work) {
    console.error(`エラー: 作品キー "${workKey}" が見つかりません`)
    process.exit(1)
  }
  
  const outputFileName = args[1] || `aozora-${workKey}.txt`
  const outputPath = path.join(__dirname, '..', 'apps', 'hosting', 'src', 'data', outputFileName)
  
  const url = getAozoraUrl(work.id, work.file)
  console.log(`ダウンロード中: ${work.name}`)
  console.log(`URL: ${url}`)
  console.log(`出力先: ${outputPath}`)
  
  try {
    await downloadFile(url, outputPath)
    console.log(`\n完了: ${outputPath}`)
  } catch (err) {
    console.error(`エラー: ${err.message}`)
    console.error('\n注意: 青空文庫のURL構造は作品によって異なる可能性があります。')
    console.error('手動でダウンロードする場合は、青空文庫の公式サイトから取得してください。')
    process.exit(1)
  }
}

// メインスクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { downloadFile, processAozoraText, works }

