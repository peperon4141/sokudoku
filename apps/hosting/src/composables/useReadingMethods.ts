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
    id: 'sequential-display',
    name: '順次表示トレーニング',
    description: '単語・フレーズ・チャンクを固定位置に順次表示する方式。表示単位と速度を調整でき、段階的加速も可能です。RSVP、話速変換、ActiveReadを統合したトレーニングです。',
    icon: 'pi pi-eye',
    route: '/reading/sequential-display',
    scientificBasis: '眼球運動の削減により読書効率が向上することが実証されています。最適な表示速度は250-500 WPMです。武田修一氏の研究では、段階的に速度を上げることで学生の速読語数が平均1.3倍に伸びることが確認されています。',
    features: [
      '表示単位の選択（単語/フレーズ/チャンク）',
      '速度調整機能（100-1000 WPM）',
      '段階的加速機能（話速変換トレーニング）',
      '理解度モニタリングと自動速度調整',
      '画面中央の固定位置表示または視野拡大表示'
    ],
    limitations: [
      '理解度の低下: キース・レイナー教授の研究によると、単語単位のRSVPでは作業記憶が過負荷となり、情報処理が追いつかなくなる可能性があります',
      '文脈処理の制限: 単語を順次表示するため、前後の文脈を同時に把握する能力が制限されます',
      '推論能力の低下: 複雑な文章理解や推論が必要な場合には不利になります',
      '日本語での効果: 九州大学の研究では、日本語の文章をRSVPで一文字ずつ表示する方法が、他の表示方法と比較して読解速度が最も遅くなる結果が示されています'
    ],
    recommendations: [
      'フレーズ単位またはチャンク単位での表示を推奨（理解度を維持しやすい）',
      '速度を適切に調整（理解度が80%以上を維持できる速度）',
      '定期的な理解度テストの実施',
      '段階的加速機能を使用して無理なく速度を向上'
    ],
    references: [
      { text: 'キース・レイナー教授の研究 - RSVPにおける作業記憶の過負荷に関する研究' },
      { text: 'WIRED - RSVPの理解度に関する研究報告', url: 'https://wired.jp/2017/04/05/speed-reading/' },
      { text: '九州大学の研究 - 日本語におけるRSVPの効果に関する研究' },
      { text: 'カリフォルニア大学（2016年） - 速読テクニックのレビュー論文', url: 'https://www.office-srr.com/speed-reading-technique-have-never-exist/' },
      { text: '武田修一氏の研究 - 話速変換トレーニング（学生の速読語数が平均1.3倍に伸びることが確認）' }
    ]
  },
  {
    id: 'chunking',
    name: 'チャンキングトレーニング',
    description: '単語を意味のまとまり（チャンク）で読む方法。理解度を保ちながら読書速度を向上させます。日本語の文節単位での表示に対応しています。',
    icon: 'pi pi-th-large',
    route: '/reading/chunking',
    scientificBasis: '認知科学の研究で、人間は情報をチャンク（まとまり）として処理することが示されています。単語単位ではなく、意味のまとまりで読むことで処理効率が向上し、理解度を維持しながら読書速度を向上させることができます。',
    features: [
      'チャンクサイズの調整（2-10語）',
      '日本語の文節単位での分割',
      '意味のまとまりを考慮した自然な分割',
      '速度調整機能（100-500 WPM）',
      '理解度モニタリングと自動速度調整'
    ],
    recommendations: [
      'チャンクサイズは3-7語程度が推奨',
      '理解度が80%以上を維持できる速度でトレーニング',
      '文節単位での分割を活用（日本語の場合）'
    ],
    references: [
      { text: '認知科学の研究 - チャンク処理に関する研究' },
      { text: 'arXiv - Neural Speed Reading with Structural-Jump-LSTM', url: 'https://arxiv.org/abs/1904.00761' }
    ]
  },
  {
    id: 'field-expansion',
    name: '視野拡大トレーニング',
    description: '視野を広げ、一度に多くの文字を認識できるようにするトレーニング。SP速読学院メソッドと朴-佐々木法の視覚訓練を統合しています。',
    icon: 'pi pi-eye-slash',
    route: '/reading/field-expansion',
    scientificBasis: '京都大学医学部との共同研究により、速読と記憶術が高齢者の認知症予防や視野の拡大に効果があることが実証されています。慶應義塾大学と東京大学の共同研究では、視覚訓練により熟達者が1分間に1万字を超える速度で日本語文章を理解しながら読めることが示されています。',
    features: [
      '視野範囲の調整（3-15語）',
      '段階的視野拡大（レベル1-5）',
      '周辺視野の活用トレーニング',
      '速度調整機能（200-800 WPM）',
      '認知症予防効果（高齢者向け）'
    ],
    limitations: [
      '論文詳細: 京都大学医学部との共同研究とされるが、具体的な論文タイトル・URL: 不明'
    ],
    references: [
      { text: '京都大学医学部 - SP速読学院との共同研究（認知症予防・視野拡大の効果）' },
      { text: '慶應義塾大学・東京大学共同研究 - 朴-佐々木法の視覚訓練（熟達者は1分間に1万字超）' }
    ]
  },
  {
    id: 'skimming',
    name: 'スキミングトレーニング',
    description: '大量の情報を効率的に処理するための重要なスキル。重要情報を素早く抽出します。科学的に有効性が確認されている数少ない速読テクニックの一つです。',
    icon: 'pi pi-filter',
    route: '/reading/skimming',
    scientificBasis: '2016年のカリフォルニア大学のレビュー論文で有効性が確認されています。眼球を速く動かすトレーニングや潜在意識への情報インプットといった従来の速読テクニックには科学的根拠が乏しいとされていますが、スキミングは有効であると結論付けられています。',
    features: [
      '重要語句のハイライト表示',
      'TF-IDFによる重要度判定',
      '重要度閾値の調整',
      '自動スクロール機能',
      '全体の理解度を保ちながら効率的に情報を処理'
    ],
    references: [
      { text: 'カリフォルニア大学（2016年） - 速読テクニックのレビュー論文', url: 'https://www.office-srr.com/speed-reading-technique-have-never-exist/' },
      { text: 'WIRED - 速読術には意味がなかった？', url: 'https://wired.jp/2017/04/05/speed-reading/' },
      { text: 'J-STAGE - 「速読は有益か」論文', url: 'https://www.jstage.jst.go.jp/article/sor/56/3-4/56_113/_article/-char/ja/' }
    ]
  },
  {
    id: 'cognitive-training',
    name: '認知訓練トレーニング',
    description: '脳の可塑性を利用した情報処理速度向上トレーニング。瞬間認識、並列処理、パターン認識の3つのモードで構成されています。川村式ジョイント速読法と朴-佐々木法の瞑想的要素を統合しています。',
    icon: 'pi pi-brain',
    route: '/reading/cognitive-training',
    scientificBasis: 'アメリカのブリガムヤング大学やユタ大学での検証により、脳の情報処理速度の向上が確認されています。慶應義塾大学と東京大学の共同研究では、丹田呼吸や漸進的筋弛緩法などの瞑想的訓練が速読に効果があることが示されています。',
    features: [
      '瞬間認識トレーニング（フラッシュ表示: 0.1-0.5秒）',
      '並列処理トレーニング（複数単語の同時表示と認識）',
      'パターン認識トレーニング（文字パターンの識別）',
      '段階的難易度調整（レベル1-5）',
      '呼吸法・リラクゼーション（セッション前の準備、オプション）',
      '反復トレーニング（間隔反復）'
    ],
    limitations: [
      '論文詳細: ブリガムヤング大学・ユタ大学での検証とされるが、具体的な論文タイトル・URL: 不明'
    ],
    references: [
      { text: 'ブリガムヤング大学・ユタ大学 - 川村式速読法の検証（脳の情報処理速度の向上）' },
      { text: '川村式ジョイント速読法 - 40年以上の実績と科学的検証（日本、アメリカ、中国で特許取得）' },
      { text: '慶應義塾大学・東京大学共同研究 - 朴-佐々木法の瞑想的訓練（丹田呼吸・漸進的筋弛緩法）' }
    ]
  },
  {
    id: 'saccade-training',
    name: '視点移動トレーニング',
    description: '目の動き（サッカード）を改善し、視点の停留時間を短縮するトレーニング。2点間、3点間、複数点間の視点移動を練習することで読書速度を向上させます。',
    icon: 'pi pi-arrows-h',
    route: '/reading/saccade-training',
    scientificBasis: '視点移動の速度を向上させることで、読書時の目の動きが効率化され、読書速度が向上することが示されています。日本速読・記憶法セミナーの研究では、視点の停留時間を短縮することが重要であるとされています。',
    features: [
      '2点間、3点間、複数点間の視点移動練習',
      '視点移動の速度を測定・記録',
      '段階的に難易度を上げる（点の数、距離、速度）',
      '視点移動の軌跡を可視化',
      'レベル別トレーニング（レベル1-5）'
    ],
    references: [
      { text: '日本速読・記憶法セミナー - 視点移動トレーニング', url: 'https://www.sokudoku.gr.jp/rapid/self/b6.html' }
    ]
  },
  {
    id: 'peripheral-vision',
    name: '視幅拡大トレーニング',
    description: '一度に見える文字数を増やすトレーニング。中央視野だけでなく、周辺視野も活用して情報を取得し、視野の広さを段階的に拡大します。',
    icon: 'pi pi-eye-slash',
    route: '/reading/peripheral-vision',
    scientificBasis: '視野を広げることで、一度に多くの文字を認識できるようになり、読書速度が向上することが示されています。速読研究会の研究では、段階的視野拡大（3文字 → 5文字 → 7文字 → 10文字以上）が効果的であるとされています。',
    features: [
      '中央の文字に集中しながら、周辺の文字も認識する練習',
      '視野範囲の測定（何文字まで認識できるか）',
      '段階的視野拡大（3文字 → 5文字 → 7文字 → 10文字以上）',
      '視野拡大の可視化（認識できる範囲を視覚的に表示）',
      'レベル別トレーニング（レベル1-5）'
    ],
    references: [
      { text: '日本速読・記憶法セミナー - 視幅拡大トレーニング', url: 'https://www.sokudoku.gr.jp/rapid/self/index.html' },
      { text: '速読研究会 - 視幅拡大トレーニング', url: 'https://sokudokukenkyukai.com/training/' }
    ]
  },
  {
    id: 'subvocalization-control',
    name: '内音声のコントロール',
    description: '読書時の「頭の中で音読する」習慣を減らすトレーニング。内音声を抑制することで読書速度を向上させ、視覚的に文字を認識する能力を強化します。',
    icon: 'pi pi-volume-up',
    route: '/reading/subvocalization-control',
    scientificBasis: '内音声を抑制することで、読書速度が向上することが示されています。速読研究会の研究では、音読せずに視覚的に読む習慣を身につけることが重要であるとされています。',
    features: [
      '内音声を意識させる練習',
      '音読せずに視覚的に読む練習',
      '内音声の有無を自己チェック',
      '段階的に内音声を減らすトレーニング',
      'レベル別トレーニング（レベル1-5）'
    ],
    references: [
      { text: '速読研究会 - 内音声のコントロール', url: 'https://sokudokukenkyukai.com/training/' }
    ]
  },
  {
    id: 'eye-movement',
    name: '眼球運動トレーニング',
    description: '眼球を効率的に動かすためのトレーニング。水平、垂直、円運動など様々なパターンの眼球運動により、眼球の柔軟性と速度を向上させます。',
    icon: 'pi pi-sync',
    route: '/reading/eye-movement',
    scientificBasis: '眼球運動の柔軟性と速度を向上させることで、読書時の目の動きが効率化され、読書速度が向上することが示されています。朴-佐々木法の視覚訓練要素としても重要です。',
    features: [
      '水平眼球運動（左右に移動する文字を追跡）',
      '垂直眼球運動（上下に移動する文字を追跡）',
      '円運動（円を描くように移動する文字を追跡）',
      '速度調整（眼球運動の速度を段階的に上げる）',
      '眼球運動のパターンを記録・分析'
    ],
    references: [
      { text: '朴-佐々木法の視覚訓練要素' }
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

