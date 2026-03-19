import { NextResponse } from 'next/server';

interface CaseStudy {
  companyName: string;
  industry: string;
  challenge: string;
  result: string;
}

interface SimilarCaseResponse {
  companyName: string;
  industry: string;
  challenge: string;
  result: string;
  source: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company, industry, product, caseStudies } = body;

    if (!company) {
      return NextResponse.json({ error: '会社名が必要です' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const productName = product || 'DOMO';

    // Gemini Web検索でDOMO導入事例から業界が近い企業を検索
    let cases: SimilarCaseResponse[] = [];

    if (apiKey) {
      try {
        cases = await searchDomoCustomersFromWeb(
          company,
          industry || '',
          productName,
          apiKey
        );
        console.log('Web search found cases:', cases.length);
      } catch (error) {
        console.error('Web search failed:', error);
      }
    }

    // Web検索で見つからなかった場合、Excelデータからフォールバック
    if (cases.length === 0 && caseStudies && caseStudies.length > 0) {
      console.log('Falling back to Excel case studies');
      cases = fallbackStaticMatching(company, industry || '', caseStudies);
    }

    // 最終フィルタリング: 業界カテゴリが一致するものだけを返す
    const targetCategory = getIndustryCategory(industry || '');
    const filteredCases = targetCategory
      ? cases.filter(c => {
          const caseCategory = getIndustryCategory(c.industry);
          return caseCategory === targetCategory || caseCategory === null;
        })
      : cases;

    console.log(`Returning ${filteredCases.length} cases for industry category: ${targetCategory}`);

    return NextResponse.json({ cases: filteredCases.slice(0, 5) });
  } catch (error) {
    console.error('Similar cases fetch error:', error);
    return NextResponse.json({ error: '類似事例の取得に失敗しました' }, { status: 500 });
  }
}

// 業界カテゴリの定義
const INDUSTRY_CATEGORIES: Record<string, string[]> = {
  '通信・IT': ['通信', 'IT', 'ソフトウェア', 'インターネット', 'SaaS', 'クラウド', 'AI', 'テクノロジー', '情報', 'システム', 'データ', 'EC', 'プラットフォーム', 'HR Tech'],
  '製造・エレクトロニクス': ['製造', 'メーカー', '電機', '自動車', '機械', '部品', '工場', '生産', 'ものづくり', '化学', '素材', '精密機器', 'ヘルスケア', '化粧品', '食品'],
  '金融・保険': ['銀行', '証券', '保険', '金融', '投資', 'ファイナンス', '資産運用', 'クレジット', '決済'],
  '小売・流通': ['小売', '流通', '店舗', 'コンビニ', 'スーパー', '百貨店', '物流', '卸売', 'アパレル'],
  'コンサルティング': ['コンサル', '戦略', '経営', 'アドバイザリー', 'シンクタンク', '研究所'],
  'メディア・エンターテイメント': ['メディア', '広告', '出版', '放送', 'エンターテイメント', 'ゲーム', '映像', 'コンテンツ'],
};

// 業界カテゴリを判定
function getIndustryCategory(industry: string): string | null {
  const industryLower = industry.toLowerCase();
  for (const [category, keywords] of Object.entries(INDUSTRY_CATEGORIES)) {
    if (keywords.some(kw => industryLower.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  return null;
}

// Web検索でDOMO導入事例企業を検索し、業界が近い企業を抽出
async function searchDomoCustomersFromWeb(
  companyName: string,
  industry: string,
  productName: string,
  apiKey: string
): Promise<SimilarCaseResponse[]> {
  const targetCategory = getIndustryCategory(industry);

  // 業界カテゴリに基づくキーワード
  const industryKeywords: Record<string, string> = {
    '通信・IT': '通信 IT ソフトウェア インターネット テクノロジー',
    '製造・エレクトロニクス': '製造 メーカー 電機 自動車 機械 化学',
    '金融・保険': '銀行 証券 保険 金融',
    '小売・流通': '小売 流通 EC コンビニ スーパー アパレル',
    'コンサルティング': 'コンサル コンサルティング シンクタンク',
    'メディア・エンターテイメント': 'メディア 広告 出版 エンターテイメント',
  };

  const searchKeyword = targetCategory ? industryKeywords[targetCategory] || industry : industry;

  const prompt = `【タスク】
Web検索で「${productName} 導入事例」「${productName} お客様事例」「${productName} customer」などを検索し、${productName}を実際に導入している日本企業のリストを取得してください。

その中から「${companyName}」（${industry}）と業界が近い企業を3社選んでください。

【検索対象企業の条件】
- 業界: ${industry}と同じまたは近い業界（${searchKeyword}など）
${targetCategory ? `- 業界カテゴリ「${targetCategory}」に該当する企業を優先` : ''}
- ${productName}を実際に導入している企業（公式サイトや事例ページで確認できるもの）
- 「${companyName}」自体は含めない

【重要】
- 必ずWeb検索で${productName}の導入事例を調べてください
- 架空の企業や導入していない企業は出力しないでください
- 業界が「${industry}」と近い企業のみを選んでください

【出力形式】JSONのみ（説明文不要）
{
  "cases": [
    {
      "companyName": "企業名",
      "industry": "業界",
      "challenge": "導入前の課題（Web検索で見つかった情報）",
      "result": "導入効果（Web検索で見つかった情報）",
      "source": "DOMO導入事例"
    }
  ]
}

該当する企業が見つからない場合: {"cases": []}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Web Search API error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('Gemini Web Search response:', content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return (parsed.cases || [])
      .filter((c: any) => {
        const caseName = (c.companyName || '').toLowerCase();
        const searchName = companyName.toLowerCase();
        return !caseName.includes(searchName) && !searchName.includes(caseName);
      })
      .slice(0, 5)
      .map((c: any) => ({
        companyName: c.companyName || '',
        industry: c.industry || '',
        challenge: c.challenge || '',
        result: c.result || '',
        source: 'DOMO導入事例',
      }));
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}

// 静的マッチング（AIが使えない場合のフォールバック）
function fallbackStaticMatching(
  companyName: string,
  targetIndustry: string,
  caseStudies: CaseStudy[]
): SimilarCaseResponse[] {
  if (!caseStudies || caseStudies.length === 0) {
    return [];
  }

  const companyLower = companyName.toLowerCase();
  const targetCategory = getIndustryCategory(targetIndustry);

  // 業界カテゴリでフィルタリング（同じカテゴリのみ）
  const sameCategoryCases = targetCategory
    ? caseStudies.filter(c => {
        const caseCategory = getIndustryCategory(c.industry);
        return caseCategory === targetCategory;
      })
    : caseStudies;

  // 自社を除外
  const filteredCases = sameCategoryCases.filter(c => {
    const caseName = (c.companyName || '').toLowerCase();
    return !caseName.includes(companyLower) && !companyLower.includes(caseName);
  });

  // 同じ業界カテゴリの事例がない場合は空を返す（異なる業界は出さない）
  if (filteredCases.length === 0) {
    console.log(`No cases found for industry category: ${targetCategory}`);
    return [];
  }

  // 上位3件を返す
  return filteredCases.slice(0, 3).map(c => ({
    companyName: c.companyName,
    industry: c.industry,
    challenge: c.challenge || '',
    result: c.result || '',
    source: 'Excel導入事例',
  }));
}

// GETもサポート（後方互換性）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');
  const industry = searchParams.get('industry') || '';

  if (!company) {
    return NextResponse.json({ error: '会社名が必要です' }, { status: 400 });
  }

  return NextResponse.json({ cases: [] });
}

