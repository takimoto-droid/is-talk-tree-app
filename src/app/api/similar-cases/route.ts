import { NextResponse } from 'next/server';

interface SimilarCase {
  companyName: string;
  industry: string;
  challenge: string;
  result: string;
  source?: string;
  url?: string;
}

// 業界キーワードマッピング
const industryKeywords: Record<string, string[]> = {
  '通信・テクノロジー': ['通信', 'テレコム', 'IT', 'テクノロジー', 'ソフトウェア', 'システム'],
  '製造・家電': ['製造', 'メーカー', '電機', '家電', '工業', '自動車'],
  '金融': ['銀行', '証券', '保険', '金融', 'ファイナンス'],
  '小売・流通': ['小売', '流通', '百貨店', 'リテール', 'EC'],
  '物流': ['物流', 'ロジスティクス', '運送', '配送'],
  'メディア・広告': ['メディア', '広告', 'マーケティング', '放送'],
  '不動産・建設': ['不動産', '建設', '住宅', 'ディベロッパー'],
  '旅行・観光': ['旅行', '観光', 'ホテル', '航空'],
  'コンサルティング': ['コンサル', 'コンサルティング', '総研'],
  '医療・ヘルスケア': ['医療', 'ヘルスケア', '製薬', '病院'],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyName = searchParams.get('company');
  const industry = searchParams.get('industry') || '';

  if (!companyName) {
    return NextResponse.json({ error: '会社名が必要です' }, { status: 400 });
  }

  try {
    // Web検索でDOMOの導入事例を検索
    const cases = await searchDomoCases(industry);

    // 同じ会社は除外
    const filteredCases = cases.filter(c =>
      !c.companyName.toLowerCase().includes(companyName.toLowerCase()) &&
      !companyName.toLowerCase().includes(c.companyName.toLowerCase())
    );

    return NextResponse.json({ cases: filteredCases.slice(0, 3) });
  } catch (error) {
    console.error('Similar cases fetch error:', error);
    return NextResponse.json({ error: '類似事例の取得に失敗しました' }, { status: 500 });
  }
}

async function searchDomoCases(targetIndustry: string): Promise<SimilarCase[]> {
  const allCases: SimilarCase[] = [];

  // 業界に関連する検索クエリを生成
  const searchQueries = [
    `DOMO 導入事例 ${targetIndustry}`,
    `Domo BI 事例 ${targetIndustry}`,
    `DOMO 活用事例`,
  ];

  for (const query of searchQueries) {
    try {
      const cases = await fetchDomoSearchResults(query, targetIndustry);
      allCases.push(...cases);
    } catch (error) {
      console.error('Search error:', error);
    }
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 重複を除去
  const uniqueCases = allCases.filter((case_, index, self) =>
    index === self.findIndex(c => c.companyName === case_.companyName)
  );

  // 業界スコアでソート
  const scoredCases = uniqueCases.map(c => ({
    ...c,
    score: calculateIndustryMatch(c.industry, targetIndustry),
  }));

  scoredCases.sort((a, b) => b.score - a.score);

  return scoredCases;
}

async function fetchDomoSearchResults(query: string, targetIndustry: string): Promise<SimilarCase[]> {
  const encodedQuery = encodeURIComponent(query);
  const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=ja&gl=JP&ceid=JP:ja`;

  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseDomoResults(xml, targetIndustry);
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}

function parseDomoResults(xml: string, targetIndustry: string): SimilarCase[] {
  const cases: SimilarCase[] = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);

  if (!itemMatches) return cases;

  for (const itemXml of itemMatches.slice(0, 5)) {
    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                       itemXml.match(/<title>(.*?)<\/title>/);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);

    if (titleMatch) {
      const title = cleanText(titleMatch[1]);

      // DOMO関連の記事かチェック
      if (!title.toLowerCase().includes('domo') &&
          !title.includes('ドーモ') &&
          !title.includes('導入事例')) {
        continue;
      }

      // タイトルから企業名を抽出
      const companyInfo = extractCompanyInfo(title);
      if (companyInfo) {
        cases.push({
          companyName: companyInfo.company,
          industry: companyInfo.industry || targetIndustry,
          challenge: companyInfo.challenge || 'データ活用・業務効率化の課題',
          result: companyInfo.result || 'DOOMを活用した業務改善を実現',
          source: 'Web検索結果',
          url: linkMatch ? linkMatch[1] : '',
        });
      }
    }
  }

  // 検索結果が少ない場合はDOMO公式の事例を追加
  if (cases.length < 2) {
    const additionalCases = getKnownCasesByIndustry(targetIndustry);
    cases.push(...additionalCases);
  }

  return cases;
}

function extractCompanyInfo(title: string): { company: string; industry?: string; challenge?: string; result?: string } | null {
  // よくある企業名パターン
  const companyPatterns = [
    /「(.+?)」.*導入/,
    /(.+?)(株式会社|が|は|、).*(導入|活用|採用)/,
    /(.+?)(様|社).*(DOMO|Domo|ドーモ)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      const company = match[1].replace(/株式会社|有限会社/g, '').trim();
      if (company.length > 1 && company.length < 20) {
        return {
          company,
          industry: detectIndustryFromText(title),
          challenge: extractChallenge(title),
          result: extractResult(title),
        };
      }
    }
  }

  return null;
}

function detectIndustryFromText(text: string): string | undefined {
  const textLower = text.toLowerCase();

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        return industry;
      }
    }
  }

  return undefined;
}

function extractChallenge(title: string): string | undefined {
  const challengePatterns = [
    /課題[：:「](.+?)[」。]/,
    /(.+?)の課題/,
    /(.+?)を解決/,
  ];

  for (const pattern of challengePatterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

function extractResult(title: string): string | undefined {
  const resultPatterns = [
    /(.+?)を実現/,
    /(.+?)%削減/,
    /(.+?)向上/,
    /(.+?)を達成/,
  ];

  for (const pattern of resultPatterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim() + (title.includes('削減') ? '削減' : title.includes('向上') ? '向上' : 'を実現');
    }
  }

  return undefined;
}

function calculateIndustryMatch(caseIndustry: string, targetIndustry: string): number {
  if (!caseIndustry || !targetIndustry) return 0;

  const c = caseIndustry.toLowerCase();
  const t = targetIndustry.toLowerCase();

  if (c === t) return 100;
  if (c.includes(t) || t.includes(c)) return 80;

  // 業界グループマッチング
  for (const keywords of Object.values(industryKeywords)) {
    const cMatch = keywords.some(kw => c.includes(kw.toLowerCase()));
    const tMatch = keywords.some(kw => t.includes(kw.toLowerCase()));
    if (cMatch && tMatch) return 60;
  }

  return 0;
}

function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// 業界別の既知の導入事例（Web検索結果が少ない場合のフォールバック）
function getKnownCasesByIndustry(industry: string): SimilarCase[] {
  const knownCases: Record<string, SimilarCase[]> = {
    '通信': [
      {
        companyName: 'ソフトバンク',
        industry: '通信・テクノロジー',
        challenge: 'DX推進において複数システムからのデータ集約が課題',
        result: 'データ連携を自動化しコスト削減を実現。管理項目数は4倍に拡大',
        source: 'DOMO公式導入事例',
      },
      {
        companyName: 'KDDI',
        industry: '通信・テクノロジー',
        challenge: 'データ分析基盤の構築に専門知識が必要で現場活用が進まなかった',
        result: 'ノーコードでダッシュボード作成が可能になり現場主導のデータ活用を実現',
        source: 'DOMO公式導入事例',
      },
    ],
    '製造': [
      {
        companyName: 'パナソニック',
        industry: '製造・家電',
        challenge: 'SNS上の顧客の声の集約・分析に時間がかかっていた',
        result: 'FAQ改善サイクルを加速し顧客満足度が向上',
        source: 'DOMO公式導入事例',
      },
      {
        companyName: 'オムロン',
        industry: '製造',
        challenge: '品質監査に多大な工数がかかっていた',
        result: '品質監査の工数を20時間から1分へ99.9%削減',
        source: 'DOMO公式導入事例',
      },
    ],
    '金融': [
      {
        companyName: '野村総合研究所',
        industry: 'コンサルティング・金融',
        challenge: '一人当たりの生産性向上が課題',
        result: '粗利生産性20%アップ。一部業務では最大90%の削減効果',
        source: 'DOMO公式導入事例',
      },
    ],
    '小売': [
      {
        companyName: 'イオンリテール',
        industry: '小売・流通',
        challenge: '店舗データの集約と分析に時間がかかっていた',
        result: '店舗横断でのリアルタイムデータ可視化を実現',
        source: 'DOMO公式導入事例',
      },
    ],
    '物流': [
      {
        companyName: '日本通運',
        industry: '物流',
        challenge: 'DX人材育成と現場のデータ活用が課題',
        result: 'Excel担当者をデータ活用人材に変革。配送効率を改善',
        source: 'DOMO公式導入事例',
      },
    ],
    'メディア': [
      {
        companyName: 'サイバーエージェント',
        industry: 'メディア・広告',
        challenge: '広告データの処理に時間がかかっていた',
        result: 'データ処理時間を2〜3日から2〜3時間へ短縮',
        source: 'DOMO公式導入事例',
      },
    ],
    '不動産': [
      {
        companyName: '三井不動産',
        industry: '不動産・建設',
        challenge: '購買サイクル全体の把握が困難',
        result: '資料請求から契約までをリアルタイムで把握',
        source: 'DOMO公式導入事例',
      },
    ],
    '旅行': [
      {
        companyName: 'JTB',
        industry: '旅行・観光',
        challenge: '商材ごとにシステムとデータが分散',
        result: 'データを一元化し売上機会の発掘を実現',
        source: 'DOMO公式導入事例',
      },
    ],
    'コンサル': [
      {
        companyName: 'アクセンチュア',
        industry: 'コンサルティング',
        challenge: 'プロジェクト管理とリソース配分の最適化が必要',
        result: 'リアルタイムでプロジェクト状況把握と効率的なリソース配分を実現',
        source: 'DOMO公式導入事例',
      },
    ],
  };

  const industryLower = industry.toLowerCase();

  for (const [key, cases] of Object.entries(knownCases)) {
    if (industryLower.includes(key.toLowerCase())) {
      return cases;
    }
  }

  // デフォルトは通信系を返す
  return knownCases['通信'] || [];
}
