# Wikipedia「人工知能」記事の参照可能なURL

## 1. 記事の直接URL

### 日本語版Wikipedia
- **記事URL**: https://ja.wikipedia.org/wiki/%E4%BA%BA%E5%B7%A5%E7%9F%A5%E8%83%BD
- **読みやすい形式**: https://ja.wikipedia.org/wiki/人工知能
- **説明**: 日本語版Wikipediaの「人工知能」記事

### 英語版Wikipedia
- **記事URL**: https://en.wikipedia.org/wiki/Artificial_intelligence
- **説明**: 英語版Wikipediaの「人工知能」記事（より詳細な情報が含まれる場合がある）

## 2. Wikipedia APIエンドポイント

### 記事の要約を取得
- **URL**: https://ja.wikipedia.org/api/rest_v1/page/summary/人工知能
- **説明**: 記事の要約（抜粋）を取得
- **形式**: JSON
- **例**:
```json
{
  "title": "人工知能",
  "extract": "記事の抜粋...",
  "content_urls": {
    "desktop": {
      "page": "https://ja.wikipedia.org/wiki/人工知能"
    }
  }
}
```

### 記事の全文を取得
- **URL**: https://ja.wikipedia.org/api/rest_v1/page/html/人工知能
- **説明**: 記事の全文をHTML形式で取得

### 記事のプレーンテキストを取得
- **URL**: https://ja.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=&explaintext=&titles=人工知能&format=json
- **説明**: 記事のテキストを取得（API形式）

## 3. ライセンス情報

### クリエイティブ・コモンズ・ライセンス
- **ライセンス**: CC BY-SA 3.0（Creative Commons Attribution-ShareAlike 3.0）
- **ライセンスURL**: https://creativecommons.org/licenses/by-sa/3.0/
- **説明**: 出典を明記し、同じライセンス（CC BY-SA）で公開すれば自由に利用可能

### Wikipediaの利用規約
- **利用規約URL**: https://ja.wikipedia.org/wiki/Wikipedia:著作権
- **説明**: Wikipediaの著作権とライセンスに関する詳細情報

## 4. 記事の履歴・バージョン情報

### 記事の履歴
- **URL**: https://ja.wikipedia.org/w/index.php?title=人工知能&action=history
- **説明**: 記事の編集履歴を確認

### 特定のバージョンを取得
- **URL**: https://ja.wikipedia.org/w/index.php?title=人工知能&oldid=[リビジョンID]
- **説明**: 特定のバージョンの記事を取得（固定版として使用する場合）

## 5. 出典の明記方法

### 推奨される出典表記
```
出典: Wikipedia「人工知能」
URL: https://ja.wikipedia.org/wiki/人工知能
ライセンス: CC BY-SA 3.0
```

または

```
この記事はWikipedia「人工知能」から引用しました。
出典: https://ja.wikipedia.org/wiki/人工知能
ライセンス: CC BY-SA 3.0
```

## 6. 実装例

### TypeScript/JavaScriptでの取得例
```typescript
// 記事の要約を取得
const fetchWikipediaSummary = async (title: string) => {
  const encodedTitle = encodeURIComponent(title)
  const response = await fetch(
    `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`
  )
  const data = await response.json()
  return {
    title: data.title,
    extract: data.extract,
    url: data.content_urls.desktop.page,
    license: 'CC BY-SA 3.0'
  }
}

// 使用例
const aiArticle = await fetchWikipediaSummary('人工知能')
console.log(aiArticle.extract) // 記事の抜粋
```

### 記事の全文を取得
```typescript
// 記事の全文を取得（テキスト形式）
const fetchWikipediaFullText = async (title: string) => {
  const encodedTitle = encodeURIComponent(title)
  const response = await fetch(
    `https://ja.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=&explaintext=&titles=${encodedTitle}&format=json`
  )
  const data = await response.json()
  const pages = data.query.pages
  const pageId = Object.keys(pages)[0]
  return pages[pageId].extract
}
```

## 7. 注意事項

### 利用条件
- **出典の明記**: 必須（CC BY-SA 3.0の条件）
- **同じライセンスで公開**: 必須（CC BY-SA 3.0の条件）
- **商用利用**: 可能
- **改変**: 可能（同じライセンスで公開する必要がある）

### 推奨事項
1. **出典を明記する**: 記事の出典を必ず明記する
2. **ライセンス情報を表示する**: CC BY-SA 3.0であることを明記する
3. **記事のURLを記載する**: 元の記事へのリンクを提供する
4. **固定版を使用する**: 特定のバージョンを使用する場合は、リビジョンIDを記録する

## 8. その他の関連記事

### 関連するWikipedia記事
- **機械学習**: https://ja.wikipedia.org/wiki/機械学習
- **深層学習**: https://ja.wikipedia.org/wiki/深層学習
- **ChatGPT**: https://ja.wikipedia.org/wiki/ChatGPT
- **ニューラルネットワーク**: https://ja.wikipedia.org/wiki/ニューラルネットワーク

## 参考リンク
- [Wikipedia「人工知能」](https://ja.wikipedia.org/wiki/人工知能)
- [Wikipedia API ドキュメント](https://www.mediawiki.org/wiki/API:Main_page/ja)
- [クリエイティブ・コモンズ CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)
- [Wikipedia:著作権](https://ja.wikipedia.org/wiki/Wikipedia:著作権)

