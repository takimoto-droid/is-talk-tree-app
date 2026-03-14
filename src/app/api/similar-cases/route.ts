import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Gemini APIが使える場合はAIで検索、使えない場合は静的マッチング
    let cases: SimilarCaseResponse[];

    if (apiKey && caseStudies && caseStudies.length > 0) {
      try {
        cases = await searchCasesWithGemini(
          company,
          industry || '',
          product || 'DOMO',
          caseStudies,
          apiKey
        );
      } catch (error) {
        console.error('Gemini API failed, falling back to static matching:', error);
        cases = fallbackStaticMatching(company, industry || '', caseStudies);
      }
    } else {
      cases = fallbackStaticMatching(company, industry || '', caseStudies || []);
    }

    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Similar cases fetch error:', error);
    return NextResponse.json({ error: '類似事例の取得に失敗しました' }, { status: 500 });
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
  const industryLower = targetIndustry.toLowerCase();

  // 業界キーワードグループ
  const industryGroups: Record<string, string[]> = {
    '通信・IT': ['通信', 'テクノロジー', 'it', 'ソフトウェア', 'システム', 'テレコム'],
    '製造': ['製造', 'メーカー', '家電', '電機', '工業', '機械', '自動車'],
    '金融': ['金融', '銀行', '証券', '保険'],
    '小売': ['小売', '流通', 'スーパー', 'コンビニ', 'ec'],
    '物流': ['物流', 'ロジスティクス', '運送', '配送'],
    '広告・メディア': ['広告', 'メディア', 'マーケティング', '出版'],
    '不動産': ['不動産', '建設', '住宅'],
    '旅行': ['旅行', '観光', 'ホテル', '航空'],
    'コンサル': ['コンサル', 'コンサルティング'],
    'エンタメ': ['エンタメ', 'エンターテイメント', '音楽', 'スポーツ'],
  };

  // 検索企業の業界グループを特定
  let targetGroup = '';
  for (const [group, keywords] of Object.entries(industryGroups)) {
    if (keywords.some(kw => industryLower.includes(kw) || companyLower.includes(kw))) {
      targetGroup = group;
      break;
    }
  }

  // スコアリング
  const scoredCases = caseStudies.map(c => {
    let score = 0;
    const caseIndustry = (c.industry || '').toLowerCase();
    const caseName = (c.companyName || '').toLowerCase();

    // 自社は除外
    if (caseName.includes(companyLower) || companyLower.includes(caseName)) {
      return { case: c, score: -1000 };
    }

    // 業界名の直接マッチ
    if (caseIndustry.includes(industryLower) || industryLower.includes(caseIndustry)) {
      score += 100;
    }

    // 業界グループマッチ
    if (targetGroup) {
      const groupKeywords = industryGroups[targetGroup] || [];
      if (groupKeywords.some(kw => caseIndustry.includes(kw))) {
        score += 50;
      }
    }

    return { case: c, score };
  });

  // スコア順にソート
  scoredCases.sort((a, b) => b.score - a.score);

  // 上位3件を返す
  return scoredCases
    .filter(s => s.score > 0)
    .slice(0, 3)
    .map(s => ({
      companyName: s.case.companyName,
      industry: s.case.industry,
      challenge: s.case.challenge || '',
      result: s.case.result || '',
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

async function searchCasesWithGemini(
  companyName: string,
  industry: string,
  productName: string,
  caseStudies: CaseStudy[],
  apiKey: string
): Promise<SimilarCaseResponse[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Excelから読み込んだ導入事例をリスト化
  const caseList = caseStudies
    .map((c, i) => `${i + 1}. ${c.companyName}（${c.industry}）: ${c.challenge || c.result}`)
    .join('\n');

  const prompt = `あなたは企業分析のエキスパートです。

【検索企業】
企業名: ${companyName}
推定業界: ${industry || '不明'}

【${productName}の導入事例一覧】
${caseList}

【タスク】
上記の導入事例一覧から、「${companyName}」と業界や事業内容が最も近い企業を2〜3社選んでください。

【選定基準】
1. 同じ業界の企業を優先
2. 業界が異なる場合は、事業規模や課題が似ている企業を選ぶ
3. 「${companyName}」自体は含めない

【出力形式】JSONのみ（説明文不要）
{
  "cases": [
    {
      "companyName": "企業名",
      "industry": "業界",
      "challenge": "課題",
      "result": "成果",
      "source": "Excel導入事例"
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const content = response.text();

  console.log('Gemini response:', content);

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return (parsed.cases || [])
    .filter((c: any) => {
      const caseName = (c.companyName || '').toLowerCase();
      const searchName = companyName.toLowerCase();
      return !caseName.includes(searchName) && !searchName.includes(caseName);
    })
    .slice(0, 3)
    .map((c: any) => ({
      companyName: c.companyName || '',
      industry: c.industry || '',
      challenge: c.challenge || '',
      result: c.result || '',
      source: c.source || 'Excel導入事例',
    }));
}
