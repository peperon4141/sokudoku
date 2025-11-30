export interface ReadingMethod {
  id: string
  name: string
  description: string
  icon: string
  route: string
  scientificBasis: string
  features: string[]
  limitations?: string[]
  recommendations?: string[]
  references: Array<{ text: string; url?: string }>
}

export const readingMethods: ReadingMethod[] = [
  {
    id: 'rsvp',
    name: 'RSVP',
    description: '単語を固定位置に順次表示する方式。眼球移動を最小限に抑えることで読書速度を向上させます。',
    icon: 'pi pi-eye',
    route: '/reading/rsvp',
    scientificBasis: '眼球運動の削減により、読書効率が向上することが実証されています。最適な表示速度は250-500 WPMです。',
    features: [
      '画面中央の固定位置に単語を順次表示',
      '視覚的固定点（Optimal Recognition Point）の設定',
      '速度調整機能（250-500 WPM）'
    ],
    limitations: [
      '理解度の低下: キース・レイナー教授の研究によると、RSVPでは作業記憶が過負荷となり、情報処理が追いつかなくなる可能性があります',
      '文脈処理の制限: 単語を順次表示するため、前後の文脈を同時に把握する能力が制限されます',
      '推論能力の低下: 複雑な文章理解や推論が必要な場合には不利になります',
      '日本語での効果: 九州大学の研究では、日本語の文章をRSVPで一文字ずつ表示する方法が、他の表示方法と比較して読解速度が最も遅くなる結果が示されています'
    ],
    recommendations: [
      '速度を適切に調整（理解度が80%以上を維持できる速度）',
      'チャンキング（意味のまとまり）での表示を併用',
      '定期的な理解度テストの実施',
      '単語単位ではなく、フレーズ単位での表示を検討'
    ],
    references: [
      { text: 'キース・レイナー教授の研究 - RSVPにおける作業記憶の過負荷に関する研究' },
      { text: 'WIRED - RSVPの理解度に関する研究報告', url: 'https://wired.jp/2017/04/05/speed-reading/' },
      { text: '九州大学の研究 - 日本語におけるRSVPの効果に関する研究' },
      { text: 'カリフォルニア大学（2016年） - 速読テクニックのレビュー論文', url: 'https://www.office-srr.com/speed-reading-technique-have-never-exist/' }
    ]
  },
  {
    id: 'chunking',
    name: 'チャンキング',
    description: '単語を意味のまとまり（チャンク）で読む方法。理解度を保ちながら読書速度を向上させます。',
    icon: 'pi pi-th-large',
    route: '/reading/chunking',
    scientificBasis: '認知科学の研究で、人間は情報をチャンク（まとまり）として処理することが示されています。単語単位ではなく、意味のまとまりで読むことで処理効率が向上します。',
    features: [
      '単語を意味のまとまり（フレーズ）で表示',
      '日本語の文節単位での表示',
      '自然な読み方に近い表示形式'
    ],
    references: [
      { text: '認知科学の研究 - チャンク処理に関する研究' },
      { text: 'arXiv - Neural Speed Reading with Structural-Jump-LSTM', url: 'https://arxiv.org/abs/1904.00761' }
    ]
  },
  {
    id: 'skimming',
    name: 'スキミング',
    description: '大量の情報を効率的に処理するための重要なスキル。重要情報を素早く抽出します。',
    icon: 'pi pi-filter',
    route: '/reading/skimming',
    scientificBasis: '2016年のカリフォルニア大学のレビュー論文で有効性が確認されています。眼球を速く動かすトレーニングや潜在意識への情報インプットといった従来の速読テクニックには科学的根拠が乏しいとされていますが、スキミングは有効であると結論付けられています。',
    features: [
      '重要語句のハイライト表示',
      '文脈に基づく重要度判定',
      '全体の理解度を保ちながら効率的に情報を処理'
    ],
    references: [
      { text: 'カリフォルニア大学（2016年） - 速読テクニックのレビュー論文', url: 'https://www.office-srr.com/speed-reading-technique-have-never-exist/' },
      { text: 'WIRED - 速読術には意味がなかった？', url: 'https://wired.jp/2017/04/05/speed-reading/' },
      { text: 'J-STAGE - 「速読は有益か」論文', url: 'https://www.jstage.jst.go.jp/article/sor/56/3-4/56_113/_article/-char/ja/' }
    ]
  },
  {
    id: 'park-sasaki',
    name: '朴-佐々木法',
    description: '慶應義塾大学と東京大学の共同研究により実証された速読法。熟達者は1分間に1万字を超える速度で日本語文章を理解しながら読めます。',
    icon: 'pi pi-star',
    route: '/reading/park-sasaki',
    scientificBasis: '慶應義塾大学と東京大学の共同研究で実証されています。現代語小説を高速で理解して読んでいることが科学的に証明されています。',
    features: [
      '丹田呼吸や漸進的筋弛緩法などの瞑想的訓練',
      '体系的な視覚訓練',
      '理解度を保ちながら読書速度を向上'
    ],
    references: [
      { text: '慶應義塾大学・東京大学共同研究 - 朴-佐々木法の研究' }
    ]
  },
  {
    id: 'speed-conversion',
    name: '話速変換トレーニング',
    description: '段階的に速度を上げることで、無理なく読書速度を向上させます。',
    icon: 'pi pi-forward',
    route: '/reading/speed-conversion',
    scientificBasis: '武田修一氏の研究で実証されています。このトレーニングにより、学生の速読語数が平均1.3倍に伸びることが確認されています。',
    features: [
      '段階的なスピード調整機能',
      '開始速度から徐々に速度を上げる自動調整',
      'ユーザーの習熟度に応じた速度設定'
    ],
    references: [
      { text: '武田修一氏の研究 - 話速変換トレーニング' }
    ]
  },
  {
    id: 'flying-words',
    name: '飛ぶ単語',
    description: '単語が様々な方向から飛んでくる速読練習。現在の実装です。',
    icon: 'pi pi-send',
    route: '/reading',
    scientificBasis: '視覚的な刺激により、注意力と反応速度を向上させる効果が期待できます。',
    features: [
      '単語が様々な方向から飛んでくる',
      '速度調整機能',
      '同時表示単語数の調整'
    ],
    references: [
      { text: '視覚的な刺激による注意力と反応速度の向上に関する研究' }
    ]
  },
  {
    id: 'joint-method',
    name: '川村式ジョイント速読法',
    description: '脳の可塑性を利用した科学的根拠に基づく訓練法。情報処理速度の向上を目指します。',
    icon: 'pi pi-brain',
    route: '/reading/joint-method',
    scientificBasis: 'アメリカのブリガムヤング大学やユタ大学での検証により、脳の情報処理速度の向上が確認されています。日本、アメリカ、中国で特許を取得しています。',
    features: [
      '瞬間認識トレーニング（フラッシュ表示）',
      'パターン認識トレーニング',
      '並列処理トレーニング（複数単語の同時表示）',
      '段階的難易度調整（レベル1-5）',
      '反復トレーニング（間隔反復）'
    ],
    limitations: [
      '論文詳細: 不明（ブリガムヤング大学・ユタ大学での検証とされるが、具体的な論文タイトル・URL: 不明）'
    ],
    references: [
      { text: 'ブリガムヤング大学・ユタ大学 - 川村式速読法の検証' },
      { text: '川村式ジョイント速読法 - 40年以上の実績と科学的検証' }
    ]
  },
  {
    id: 'activeread',
    name: 'ActiveRead',
    description: '右脳の働きに着目した速読メソッド。受講者の95％以上が速読をマスターしています。',
    icon: 'pi pi-objects-column',
    route: '/reading/activeread',
    scientificBasis: '日本マーケティングリサーチ機構の調査で、「短期間で速読が身に付くスクール」など3部門でNo.1を獲得しています。',
    features: [
      '右脳を活用したイメージ処理',
      '視覚的な全体把握',
      '高い習得率を目指すトレーニング'
    ],
    limitations: [
      '科学的根拠: 学術論文ではなく、マーケティングリサーチ機構の調査に基づく（学術的な検証: 不明）'
    ],
    references: [
      { text: '日本マーケティングリサーチ機構の調査 - 「短期間で速読が身に付くスクール」など3部門でNo.1' }
    ]
  },
  {
    id: 'sp-method',
    name: 'SP速読学院メソッド',
    description: '京都大学医学部との共同研究により開発。認知症予防や視野の拡大に効果があります。',
    icon: 'pi pi-eye-slash',
    route: '/reading/sp-method',
    scientificBasis: '京都大学医学部との共同研究により、速読と記憶術が高齢者の認知症予防や視野の拡大に効果があることが実証されています。',
    features: [
      '視野拡大トレーニング',
      '認知症予防効果',
      '年齢を問わず効果がある'
    ],
    limitations: [
      '論文詳細: 不明（京都大学医学部との共同研究とされるが、具体的な論文タイトル・URL: 不明）'
    ],
    references: [
      { text: '京都大学医学部 - SP速読学院との共同研究' }
    ]
  }
]

export function useReadingMethods() {
  const getMethodById = (id: string): ReadingMethod | undefined => {
    return readingMethods.find(method => method.id === id)
  }

  return {
    readingMethods,
    getMethodById
  }
}

