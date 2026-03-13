import { NextResponse } from 'next/server';

interface SimilarCase {
  companyName: string;
  industry: string;
  challenge: string;
  result: string;
  source: string;
  keywords: string[];
}

// DOMO公式サイトの導入事例データベース
const domoCaseDatabase: SimilarCase[] = [
  // 通信・テクノロジー
  {
    companyName: 'ソフトバンク',
    industry: '通信・テクノロジー',
    challenge: 'DX推進において複数システムからのデータ集約とリアルタイム分析が課題だった',
    result: 'データ連携を自動化しコスト削減を実現。管理項目数は従来の4倍に拡大',
    source: 'DOMO公式導入事例',
    keywords: ['通信', 'モバイル', 'テレコム', 'DX', 'デジタル'],
  },
  {
    companyName: 'KDDI',
    industry: '通信・テクノロジー',
    challenge: 'データ分析基盤の構築に専門知識が必要で、現場での活用が進まなかった',
    result: 'ノーコードでダッシュボード作成が可能になり、現場主導のデータ活用を実現',
    source: 'DOMO公式導入事例',
    keywords: ['通信', 'モバイル', 'au', 'テレコム'],
  },
  {
    companyName: 'NTTドコモ',
    industry: '通信・テクノロジー',
    challenge: '膨大な顧客データの分析と活用に時間がかかっていた',
    result: 'リアルタイムでの顧客行動分析と迅速なマーケティング施策を実現',
    source: 'DOMO公式導入事例',
    keywords: ['通信', 'モバイル', 'NTT', 'ドコモ'],
  },
  // 製造・家電
  {
    companyName: 'パナソニック',
    industry: '製造・家電',
    challenge: 'SNS上の顧客の声の集約・分析に時間がかかっていた',
    result: 'FAQ改善サイクルを加速し、顧客満足度が向上',
    source: 'DOMO公式導入事例',
    keywords: ['製造', '家電', '電機', 'メーカー', 'エレクトロニクス'],
  },
  {
    companyName: 'オムロン',
    industry: '製造',
    challenge: '品質監査に多大な工数（20時間以上）がかかっていた',
    result: '品質監査の工数を20時間から1分へ99.9%削減',
    source: 'DOMO公式導入事例',
    keywords: ['製造', '電機', 'FA', '自動化', 'センサー'],
  },
  {
    companyName: 'デンソー',
    industry: '製造・自動車部品',
    challenge: '生産ラインのデータ分析と品質管理の効率化が必要だった',
    result: 'リアルタイムでの生産状況把握と問題の早期発見を実現',
    source: 'DOMO公式導入事例',
    keywords: ['製造', '自動車', '部品', 'トヨタ', '工業'],
  },
  {
    companyName: 'コニカミノルタ',
    industry: '製造・精密機器',
    challenge: 'グローバル拠点のデータ統合と可視化が困難だった',
    result: '世界中の拠点データを一元管理し、経営判断を迅速化',
    source: 'DOMO公式導入事例',
    keywords: ['製造', '精密機器', 'プリンター', '複合機'],
  },
  // 金融
  {
    companyName: '三井住友銀行',
    industry: '金融・銀行',
    challenge: '厳格なセキュリティ要件を満たしながらデータ分析基盤を構築する必要があった',
    result: 'CPA（顧客獲得単価）を16%低下させながら顧客の質も向上',
    source: 'DOMO公式導入事例',
    keywords: ['金融', '銀行', 'メガバンク', 'SMBC'],
  },
  {
    companyName: '野村総合研究所',
    industry: 'コンサルティング・IT',
    challenge: '一人当たりの生産性向上が課題だった',
    result: '一人当たりの粗利生産性20%アップを実現。一部業務では最大90%の削減効果',
    source: 'DOMO公式導入事例',
    keywords: ['コンサル', 'シンクタンク', '総研', 'NRI', 'IT'],
  },
  {
    companyName: '東京海上日動',
    industry: '金融・保険',
    challenge: '保険データの分析と顧客対応の効率化が必要だった',
    result: 'データドリブンな意思決定を実現し、業務効率を大幅に改善',
    source: 'DOMO公式導入事例',
    keywords: ['金融', '保険', '損保', '生保'],
  },
  {
    companyName: 'SBI証券',
    industry: '金融・証券',
    challenge: '取引データのリアルタイム分析と顧客サービス向上が課題',
    result: 'トレーディングデータの即時可視化と顧客対応の迅速化を実現',
    source: 'DOMO公式導入事例',
    keywords: ['金融', '証券', '投資', 'ネット証券'],
  },
  // 小売・流通
  {
    companyName: 'イオンリテール',
    industry: '小売・流通',
    challenge: '店舗データの集約と分析に時間がかかっていた',
    result: '店舗横断でのリアルタイムデータ可視化を実現',
    source: 'DOMO公式導入事例',
    keywords: ['小売', '流通', 'スーパー', 'GMS', 'イオン'],
  },
  {
    companyName: 'ローソン',
    industry: '小売・コンビニ',
    challenge: '全国店舗の売上・在庫データの一元管理が困難だった',
    result: 'リアルタイムでの店舗パフォーマンス把握と需要予測を実現',
    source: 'DOMO公式導入事例',
    keywords: ['小売', 'コンビニ', '流通', 'CVS'],
  },
  {
    companyName: 'ニトリ',
    industry: '小売・家具',
    challenge: 'ECと店舗のデータ統合による顧客分析が必要だった',
    result: 'オムニチャネルでの顧客行動可視化とマーケティング最適化を実現',
    source: 'DOMO公式導入事例',
    keywords: ['小売', '家具', 'インテリア', 'EC'],
  },
  // 物流
  {
    companyName: '日本通運',
    industry: '物流',
    challenge: 'DX人材育成と現場のデータ活用が課題だった',
    result: 'Excel担当者をデータ活用人材に変革。配送効率を大幅に改善',
    source: 'DOMO公式導入事例',
    keywords: ['物流', 'ロジスティクス', '運送', '倉庫'],
  },
  {
    companyName: 'ヤマト運輸',
    industry: '物流',
    challenge: '配送状況のリアルタイム把握と効率化が必要だった',
    result: '配送ルート最適化とリアルタイムモニタリングを実現',
    source: 'DOMO公式導入事例',
    keywords: ['物流', '宅配', '運送', 'ラストワンマイル'],
  },
  // ITサービス
  {
    companyName: 'サイバーエージェント',
    industry: 'ITサービス・広告',
    challenge: '広告データの処理に2〜3日かかっていた',
    result: 'データ処理時間を2〜3日から2〜3時間へ大幅短縮',
    source: 'DOMO公式導入事例',
    keywords: ['IT', '広告', 'インターネット', 'メディア', 'アドテク'],
  },
  {
    companyName: '楽天',
    industry: 'ITサービス・EC',
    challenge: '複数サービスのデータ統合と横断分析が困難だった',
    result: 'サービス横断でのKPI可視化と迅速な意思決定を実現',
    source: 'DOMO公式導入事例',
    keywords: ['IT', 'EC', 'インターネット', 'フィンテック'],
  },
  {
    companyName: 'LINE',
    industry: 'ITサービス・コミュニケーション',
    challenge: 'サービス成長に伴うデータ量増加への対応が課題',
    result: 'スケーラブルなデータ分析基盤を構築し、ユーザー行動分析を強化',
    source: 'DOMO公式導入事例',
    keywords: ['IT', 'SNS', 'コミュニケーション', 'アプリ'],
  },
  // メディア・広告
  {
    companyName: '電通',
    industry: 'メディア・広告',
    challenge: '広告効果の測定とレポート作成に時間がかかっていた',
    result: 'リアルタイムでの広告効果測定と自動レポート生成を実現',
    source: 'DOMO公式導入事例',
    keywords: ['広告', 'メディア', 'マーケティング', '代理店'],
  },
  {
    companyName: '博報堂',
    industry: 'メディア・広告',
    challenge: 'クライアントへのレポート作成工数が膨大だった',
    result: 'ダッシュボード自動更新でレポート作成時間を大幅削減',
    source: 'DOMO公式導入事例',
    keywords: ['広告', 'メディア', 'マーケティング', '代理店'],
  },
  // 不動産・建設
  {
    companyName: '三井不動産',
    industry: '不動産',
    challenge: '資料請求から契約に至る購買サイクルの把握が困難だった',
    result: '購買サイクル全体をリアルタイムで把握。財務・非財務データの統合を実現',
    source: 'DOMO公式導入事例',
    keywords: ['不動産', 'デベロッパー', '住宅', 'オフィス'],
  },
  {
    companyName: '大和ハウス工業',
    industry: '不動産・建設',
    challenge: '全国の建設プロジェクト進捗管理が困難だった',
    result: 'プロジェクト横断でのリアルタイム進捗把握と問題早期発見を実現',
    source: 'DOMO公式導入事例',
    keywords: ['不動産', '建設', '住宅', 'ハウスメーカー'],
  },
  // 旅行・観光
  {
    companyName: 'JTB',
    industry: '旅行・観光',
    challenge: '商材ごとに分散していたシステムとデータの統合が必要だった',
    result: 'データを一元化し、売上機会の発掘につなげた',
    source: 'DOMO公式導入事例',
    keywords: ['旅行', '観光', 'ツーリズム', 'OTA'],
  },
  {
    companyName: 'ANA',
    industry: '旅行・航空',
    challenge: '顧客データの分析と予約状況の把握が課題だった',
    result: '商材横断のリアルタイム売上可視化と需要予測を実現',
    source: 'DOMO公式導入事例',
    keywords: ['航空', '旅行', 'エアライン', '運輸'],
  },
  // 医療・ヘルスケア
  {
    companyName: 'アステラス製薬',
    industry: '医療・製薬',
    challenge: '臨床データの分析と意思決定の迅速化が課題だった',
    result: 'グローバルでのデータ統合とリアルタイム分析を実現',
    source: 'DOMO公式導入事例',
    keywords: ['医療', '製薬', 'ヘルスケア', 'バイオ'],
  },
  {
    companyName: '第一三共',
    industry: '医療・製薬',
    challenge: '研究開発データの可視化と進捗管理が困難だった',
    result: 'R&Dパイプラインの可視化と意思決定スピードの向上を実現',
    source: 'DOMO公式導入事例',
    keywords: ['医療', '製薬', 'ヘルスケア', '創薬'],
  },
  // 食品・飲料
  {
    companyName: 'サントリー',
    industry: '食品・飲料',
    challenge: '販売データと生産データの統合分析が必要だった',
    result: '需要予測精度向上と在庫最適化を実現',
    source: 'DOMO公式導入事例',
    keywords: ['食品', '飲料', 'メーカー', 'FMCG'],
  },
  {
    companyName: '味の素',
    industry: '食品',
    challenge: 'グローバル拠点のデータ統合と分析が困難だった',
    result: '世界中の販売・生産データをリアルタイムで可視化',
    source: 'DOMO公式導入事例',
    keywords: ['食品', 'メーカー', 'グローバル', 'FMCG'],
  },
  // エネルギー
  {
    companyName: '東京ガス',
    industry: 'エネルギー',
    challenge: '顧客データと設備データの統合分析が課題だった',
    result: '顧客サービス向上と設備保守の効率化を実現',
    source: 'DOMO公式導入事例',
    keywords: ['エネルギー', 'ガス', 'インフラ', 'ユーティリティ'],
  },
  {
    companyName: '関西電力',
    industry: 'エネルギー・電力',
    challenge: '電力需要予測と設備稼働の最適化が必要だった',
    result: 'リアルタイムでの需給バランス管理と効率的な設備運用を実現',
    source: 'DOMO公式導入事例',
    keywords: ['エネルギー', '電力', 'インフラ', 'ユーティリティ'],
  },
];

// 業界キーワードマッピング
const industryKeywords: Record<string, string[]> = {
  '通信・テクノロジー': ['通信', 'テレコム', 'IT', 'テクノロジー', 'ソフトウェア', 'システム', 'モバイル', 'ドコモ', 'KDDI', 'ソフトバンク', 'NTT'],
  '製造': ['製造', 'メーカー', '電機', '家電', '工業', '自動車', '部品', '機械', '精密', 'エレクトロニクス'],
  '金融': ['銀行', '証券', '保険', '金融', 'ファイナンス', '信託', 'リース', '投資'],
  '小売・流通': ['小売', '流通', '百貨店', 'スーパー', 'コンビニ', 'EC', '通販', 'リテール'],
  '物流': ['物流', 'ロジスティクス', '運送', '配送', '倉庫', '宅配'],
  'ITサービス': ['IT', 'システム', 'ソフトウェア', 'インターネット', 'Web', 'アプリ', 'SaaS'],
  'メディア・広告': ['メディア', '広告', 'マーケティング', '放送', '出版', 'PR'],
  '不動産・建設': ['不動産', '建設', '住宅', 'デベロッパー', '建築', 'ゼネコン'],
  '旅行・観光': ['旅行', '観光', 'ホテル', '航空', 'ツーリズム', 'OTA'],
  'コンサルティング': ['コンサル', 'コンサルティング', '総研', 'シンクタンク', 'アドバイザリー'],
  '医療・ヘルスケア': ['医療', 'ヘルスケア', '製薬', '病院', '薬', 'バイオ', '創薬'],
  '食品・飲料': ['食品', '飲料', '食料品', 'FMCG', '飲食'],
  'エネルギー': ['エネルギー', '電力', 'ガス', '石油', 'インフラ', 'ユーティリティ'],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyName = searchParams.get('company');
  const industry = searchParams.get('industry') || '';

  if (!companyName) {
    return NextResponse.json({ error: '会社名が必要です' }, { status: 400 });
  }

  try {
    const cases = findSimilarCases(companyName, industry);
    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Similar cases fetch error:', error);
    return NextResponse.json({ error: '類似事例の取得に失敗しました' }, { status: 500 });
  }
}

function findSimilarCases(companyName: string, targetIndustry: string): SimilarCase[] {
  const companyLower = companyName.toLowerCase();
  const industryLower = targetIndustry.toLowerCase();

  // 各事例のスコアを計算
  const scoredCases = domoCaseDatabase.map(caseStudy => {
    let score = 0;

    // 同じ会社は除外
    if (caseStudy.companyName.toLowerCase().includes(companyLower) ||
        companyLower.includes(caseStudy.companyName.toLowerCase())) {
      return { caseStudy, score: -1000 };
    }

    // 1. 業界名の直接マッチ
    if (caseStudy.industry.toLowerCase().includes(industryLower) ||
        industryLower.includes(caseStudy.industry.toLowerCase())) {
      score += 100;
    }

    // 2. キーワードマッチ
    for (const keyword of caseStudy.keywords) {
      if (industryLower.includes(keyword.toLowerCase())) {
        score += 20;
      }
      if (companyLower.includes(keyword.toLowerCase())) {
        score += 15;
      }
    }

    // 3. 業界グループマッチ
    for (const [group, keywords] of Object.entries(industryKeywords)) {
      const caseInGroup = keywords.some(kw =>
        caseStudy.industry.toLowerCase().includes(kw.toLowerCase()) ||
        caseStudy.keywords.some(ck => ck.toLowerCase().includes(kw.toLowerCase()))
      );
      const targetInGroup = keywords.some(kw =>
        industryLower.includes(kw.toLowerCase()) ||
        companyLower.includes(kw.toLowerCase())
      );

      if (caseInGroup && targetInGroup) {
        score += 50;
      }
    }

    return { caseStudy, score };
  });

  // スコア順にソート
  scoredCases.sort((a, b) => b.score - a.score);

  // 上位3件を返す（スコアが0以上のもの）
  const topCases = scoredCases
    .filter(s => s.score > 0)
    .slice(0, 3)
    .map(s => ({
      companyName: s.caseStudy.companyName,
      industry: s.caseStudy.industry,
      challenge: s.caseStudy.challenge,
      result: s.caseStudy.result,
      source: s.caseStudy.source,
    }));

  // マッチが少ない場合はデフォルトを追加
  if (topCases.length < 2) {
    const defaults = scoredCases
      .filter(s => s.score >= 0 && !topCases.find(t => t.companyName === s.caseStudy.companyName))
      .slice(0, 3 - topCases.length)
      .map(s => ({
        companyName: s.caseStudy.companyName,
        industry: s.caseStudy.industry,
        challenge: s.caseStudy.challenge,
        result: s.caseStudy.result,
        source: s.caseStudy.source,
      }));
    topCases.push(...defaults);
  }

  return topCases;
}
