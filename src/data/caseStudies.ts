import { CaseStudy, ObjectionHandler } from '@/types';

export const caseStudies: CaseStudy[] = [
  {
    id: 'panasonic',
    companyName: 'パナソニック',
    industry: '製造・エレクトロニクス',
    subIndustry: '総合電機',
    challenge: '複数の事業部門にまたがるデータの統合と可視化が困難だった',
    solution: 'DOMOを導入し、全社横断的なデータプラットフォームを構築',
    result: 'データドリブンな意思決定が可能になり、レポート作成時間を80%削減',
    quote: '部門を超えたデータ活用が実現し、経営判断のスピードが格段に向上しました',
    url: 'https://www.domo.com/jp/customers/panasonic',
  },
  {
    id: 'kddi',
    companyName: 'KDDI',
    industry: '通信・IT',
    subIndustry: '通信キャリア',
    challenge: '膨大な顧客データと通信データの分析に時間がかかっていた',
    solution: 'DOMOによるリアルタイムダッシュボードを構築',
    result: '顧客行動の即時把握が可能になり、解約率を15%改善',
    quote: 'リアルタイムでKPIを追跡できるようになり、素早い施策実行が可能になりました',
    url: 'https://www.domo.com/jp/customers/kddi',
  },
  {
    id: 'omron',
    companyName: 'オムロン',
    industry: '製造・エレクトロニクス',
    subIndustry: '制御機器',
    challenge: '製造現場のIoTデータと基幹システムの連携が課題だった',
    solution: 'DOMOで工場データと経営データを統合分析',
    result: '設備稼働率が12%向上、予知保全の精度が大幅に改善',
    quote: '現場のデータがリアルタイムで経営層に届くようになりました',
    url: 'https://www.domo.com/jp/customers/omron',
  },
  {
    id: 'softbank',
    companyName: 'ソフトバンク',
    industry: '通信・IT',
    subIndustry: '通信キャリア',
    challenge: '多角化した事業のKPI管理が複雑化していた',
    solution: 'DOMO導入により統合的なKPIダッシュボードを構築',
    result: '経営会議の準備時間を90%削減、リアルタイム経営を実現',
    quote: 'データに基づく意思決定のスピードが劇的に向上しました',
    url: 'https://www.domo.com/jp/customers/softbank',
  },
  {
    id: 'nri',
    companyName: '野村総合研究所',
    industry: 'コンサルティング',
    subIndustry: 'ITコンサルティング',
    challenge: 'クライアントへのレポーティングに多大な工数がかかっていた',
    solution: 'DOMOでクライアント向けダッシュボードを自動生成',
    result: 'レポート作成工数を70%削減、コンサルタントの付加価値業務に注力可能に',
    quote: 'データ活用のプロとしてDOMOは欠かせないツールです',
    url: 'https://www.domo.com/jp/customers/nri',
  },
  {
    id: 'rakuten',
    companyName: '楽天グループ',
    industry: '通信・IT',
    subIndustry: 'EC・インターネットサービス',
    challenge: 'グループ各社のデータサイロ化が進んでいた',
    solution: 'DOMOを活用してグループ横断のデータ基盤を構築',
    result: 'クロスセル施策の精度向上、顧客単価が20%アップ',
    quote: 'ポイント経済圏の価値を最大化するためにDOMOは不可欠です',
    url: 'https://www.domo.com/jp/customers/rakuten',
  },
  {
    id: 'toyota',
    companyName: 'トヨタ自動車',
    industry: '製造・エレクトロニクス',
    subIndustry: '自動車',
    challenge: 'グローバルサプライチェーンの可視化が困難だった',
    solution: 'DOMOで世界中の拠点データをリアルタイム統合',
    result: 'サプライチェーンのボトルネック特定時間を95%短縮',
    quote: 'カイゼンのスピードがDOMOによって加速しました',
    url: 'https://www.domo.com/jp/customers/toyota',
  },
  {
    id: 'sony',
    companyName: 'ソニーグループ',
    industry: '製造・エレクトロニクス',
    subIndustry: 'エンターテイメント・電機',
    challenge: 'エンターテイメント事業のコンテンツパフォーマンス分析に時間がかかっていた',
    solution: 'DOMOでストリーミングデータをリアルタイム分析',
    result: 'コンテンツ投資判断のサイクルを週次から日次に短縮',
    quote: 'クリエイティブとデータの融合がDOMOで実現しました',
    url: 'https://www.domo.com/jp/customers/sony',
  },
  {
    id: 'mitsubishi-ufj',
    companyName: '三菱UFJフィナンシャル・グループ',
    industry: '金融・保険',
    subIndustry: '銀行',
    challenge: '複数の金融サービスにまたがるリスク管理の統合が課題だった',
    solution: 'DOMOで統合リスクダッシュボードを構築',
    result: 'リスク報告の自動化により、規制対応工数を60%削減',
    quote: '金融規制への対応スピードが大幅に向上しました',
    url: 'https://www.domo.com/jp/customers/mufg',
  },
  {
    id: 'dentsu',
    companyName: '電通グループ',
    industry: 'メディア・エンターテイメント',
    subIndustry: '広告',
    challenge: '複数メディアの広告効果測定が分散していた',
    solution: 'DOMOでクロスメディアの統合分析基盤を構築',
    result: '広告ROIの可視化により、クライアント提案力が向上',
    quote: 'データドリブンな提案がDOMOで可能になりました',
    url: 'https://www.domo.com/jp/customers/dentsu',
  },
  {
    id: 'hitachi',
    companyName: '日立製作所',
    industry: '製造・エレクトロニクス',
    subIndustry: '総合電機・社会インフラ',
    challenge: '社会インフラ事業の複雑なプロジェクト管理が課題だった',
    solution: 'DOMOでプロジェクトポートフォリオの統合管理を実現',
    result: 'プロジェクトの進捗可視化により、遅延リスクを早期検知',
    quote: 'Lumadaとの連携でデータ活用が加速しています',
    url: 'https://www.domo.com/jp/customers/hitachi',
  },
  {
    id: 'seven-eleven',
    companyName: 'セブン‐イレブン・ジャパン',
    industry: '小売・流通',
    subIndustry: 'コンビニエンスストア',
    challenge: '全国2万店舗以上の店舗データ分析に時間がかかっていた',
    solution: 'DOMOで店舗パフォーマンスのリアルタイムモニタリングを実現',
    result: '廃棄ロスを15%削減、発注精度が大幅に向上',
    quote: '店舗オペレーションの最適化がDOMOで実現しました',
    url: 'https://www.domo.com/jp/customers/seven-eleven',
  },
  {
    id: 'ntt-data',
    companyName: 'NTTデータ',
    industry: '通信・IT',
    subIndustry: 'システムインテグレーター',
    challenge: '大規模プロジェクトの収益管理が複雑化していた',
    solution: 'DOMOでプロジェクト収益のリアルタイム管理を実現',
    result: 'プロジェクトの収益性可視化により、利益率が5%改善',
    quote: 'プロジェクトマネジメントの質が向上しました',
    url: 'https://www.domo.com/jp/customers/ntt-data',
  },
  {
    id: 'uniqlo',
    companyName: 'ファーストリテイリング（ユニクロ）',
    industry: '小売・流通',
    subIndustry: 'アパレル',
    challenge: 'グローバル店舗の在庫最適化が課題だった',
    solution: 'DOMOで世界中の店舗在庫をリアルタイム可視化',
    result: '在庫回転率が20%向上、機会損失を大幅削減',
    quote: 'グローバルなデータ活用がDOMOで加速しています',
    url: 'https://www.domo.com/jp/customers/fast-retailing',
  },
  {
    id: 'aeon',
    companyName: 'イオン',
    industry: '小売・流通',
    subIndustry: '総合小売',
    challenge: 'グループ各社のデータ統合と顧客分析が課題だった',
    solution: 'DOMOでグループ横断の顧客データ基盤を構築',
    result: '顧客理解が深まり、パーソナライズ施策のCVRが30%向上',
    quote: 'お客様をより深く理解できるようになりました',
    url: 'https://www.domo.com/jp/customers/aeon',
  },
  {
    id: 'fujifilm',
    companyName: '富士フイルムホールディングス',
    industry: '製造・エレクトロニクス',
    subIndustry: '精密機器・ヘルスケア',
    challenge: '多角化した事業ポートフォリオの経営管理が複雑だった',
    solution: 'DOMOで事業横断の経営ダッシュボードを構築',
    result: '経営会議の質が向上、戦略的意思決定が迅速化',
    quote: '事業変革をデータで加速させています',
    url: 'https://www.domo.com/jp/customers/fujifilm',
  },
  {
    id: 'recruit',
    companyName: 'リクルートホールディングス',
    industry: '通信・IT',
    subIndustry: 'HR Tech・マッチングプラットフォーム',
    challenge: '多様なサービスのKPI統合管理が課題だった',
    solution: 'DOMOで全サービスの統合KPIダッシュボードを構築',
    result: 'サービス間のシナジー効果を定量的に把握可能に',
    quote: 'データドリブン経営が加速しました',
    url: 'https://www.domo.com/jp/customers/recruit',
  },
  {
    id: 'tokyo-marine',
    companyName: '東京海上ホールディングス',
    industry: '金融・保険',
    subIndustry: '保険',
    challenge: '保険商品のリスク分析とアンダーライティングの高度化が課題だった',
    solution: 'DOMOでリスクデータの統合分析基盤を構築',
    result: '引受精度が向上、損害率が改善',
    quote: 'データに基づく保険引受が実現しています',
    url: 'https://www.domo.com/jp/customers/tokio-marine',
  },
  {
    id: 'shiseido',
    companyName: '資生堂',
    industry: '製造・エレクトロニクス',
    subIndustry: '化粧品',
    challenge: 'グローバル市場ごとの販売動向把握に時間がかかっていた',
    solution: 'DOMOでグローバルセールスのリアルタイムモニタリングを実現',
    result: '市場トレンドへの対応速度が向上、新商品の市場投入判断が迅速化',
    quote: '美のトレンドをデータで捉えています',
    url: 'https://www.domo.com/jp/customers/shiseido',
  },
  {
    id: 'mercari',
    companyName: 'メルカリ',
    industry: '通信・IT',
    subIndustry: 'C2Cプラットフォーム',
    challenge: '急成長に伴うデータ分析基盤のスケーリングが課題だった',
    solution: 'DOMOで分析基盤を構築、エンジニアリソースを開発に集中',
    result: 'データ分析の民主化が進み、全社員がデータ活用可能に',
    quote: 'Go Boldな意思決定をDOMOが支えています',
    url: 'https://www.domo.com/jp/customers/mercari',
  },
];

// 業界キーワードマッピング
export const industryKeywords: Record<string, string[]> = {
  '通信・IT': ['通信', 'IT', 'ソフトウェア', 'インターネット', 'SaaS', 'クラウド', 'AI', 'テクノロジー', '情報', 'システム', 'データ'],
  '製造・エレクトロニクス': ['製造', 'メーカー', '電機', '自動車', '機械', '部品', '工場', '生産', 'ものづくり', '化学', '素材'],
  '金融・保険': ['銀行', '証券', '保険', '金融', '投資', 'ファイナンス', '資産運用', 'クレジット', '決済'],
  '小売・流通': ['小売', '流通', '店舗', 'EC', 'コンビニ', 'スーパー', '百貨店', '物流', '卸売'],
  'コンサルティング': ['コンサル', '戦略', '経営', 'アドバイザリー', 'シンクタンク', '研究所'],
  'メディア・エンターテイメント': ['メディア', '広告', '出版', '放送', 'エンターテイメント', 'ゲーム', '映像', 'コンテンツ'],
};

// 反論対応トーク
export const objectionHandlers: ObjectionHandler[] = [
  {
    type: 'busy',
    label: '今忙しい',
    response: 'お忙しいところ恐れ入ります。実は、お忙しい企業様ほど、DOMOによる業務効率化の効果を実感いただいております。例えば{companyName}様では、レポート作成時間を80%削減されました。',
    followUp: '30秒だけお時間いただけますでしょうか？御社の課題に合った具体的な改善ポイントをお伝えできればと思います。',
  },
  {
    type: 'budget',
    label: '予算がない',
    response: '予算についてのご懸念、よく伺います。DOMOは導入により平均して年間数千万円のコスト削減効果があり、多くの企業様でROIを1年以内に達成されています。',
    followUp: '御社の現状の課題をお聞かせいただければ、どの程度のコスト削減が見込めるか、無料でシミュレーションさせていただきます。',
  },
  {
    type: 'timing',
    label: 'タイミングが悪い',
    response: 'タイミングについてですね。実は、来期の予算策定や中期計画の策定時期こそ、データ活用基盤の検討に最適なタイミングです。',
    followUp: '今のうちに情報収集していただくことで、いざ検討される際にスムーズに進められます。まずは15分程度の情報提供の場を設けさせていただけませんか？',
  },
  {
    type: 'competitor',
    label: '他社検討中',
    response: '他社様もご検討中とのこと、ありがとうございます。比較検討は重要ですね。DOMOはGartner Magic Quadrantで8年連続リーダーに選出されており、特にエンタープライズ向けの実績で高い評価をいただいております。',
    followUp: '比較検討の材料として、他社様との違いを整理した資料をお送りできればと思いますが、いかがでしょうか？',
  },
  {
    type: 'authority',
    label: '決裁権がない',
    response: 'ご担当者様のお立場でのご検討、ありがとうございます。むしろ現場の方からボトムアップでご検討いただくケースも多いです。',
    followUp: '上長の方へのご説明用に、ROI試算や導入事例をまとめた資料をご用意できます。まずは情報収集として、簡単なご説明の場を設けさせていただけませんか？',
  },
];

// 冒頭トークスクリプト
export const openingScript = `
お世話になっております。DOMOの〇〇と申します。
DOMOは、アメリカに本社を置くデータ活用プラットフォーム企業で、
Forbes Global 2000の企業の半数以上にご利用いただいております。

本日は、{companyName}様のようなお客様のデータ活用課題を解決してきた
実績についてご案内させていただければと思い、お電話いたしました。

{companyName}様では現在、複数のシステムやExcelからデータを集めて
レポートを作成されていることはございますでしょうか？
`;

// 興味ありトークスクリプト
export const interestedScript = `
ありがとうございます。
実は{industry}の企業様では、DOMOを導入されて大きな成果を出されています。

例えば{caseCompany}様では、{caseResult}といった成果を挙げられています。

{companyName}様でも同様の課題をお持ちでしたら、
どのような改善が可能か、具体的にご提案させていただければと思います。

よろしければ、オンラインで30分程度、デモを交えたご説明の場を
設けさせていただけませんでしょうか？
`;

// デモ提案トークスクリプト
export const demoProposalScript = `
ありがとうございます。
それでは、オンラインで30分程度のお時間をいただければ、
{companyName}様の課題に合わせた具体的なデモをお見せできればと思います。

来週でしたら、どの日程がご都合よろしいでしょうか？
例えば、○月○日の○時、もしくは○月○日の○時はいかがでしょうか？
`;
