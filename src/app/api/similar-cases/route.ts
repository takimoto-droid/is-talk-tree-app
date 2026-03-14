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
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const cases = await searchCasesWithGemini(
      company,
      industry || '',
      product || 'DOMO',
      caseStudies || [],
      apiKey
    );

    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Similar cases fetch error:', error);
    return NextResponse.json({ error: '類似事例の取得に失敗しました' }, { status: 500 });
  }
}

// GETもサポート（後方互換性）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');
  const industry = searchParams.get('industry') || '';
  const product = searchParams.get('product') || 'DOMO';

  if (!company) {
    return NextResponse.json({ error: '会社名が必要です' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const cases = await searchCasesWithGemini(company, industry, product, [], apiKey);
    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Similar cases fetch error:', error);
    return NextResponse.json({ error: '類似事例の取得に失敗しました' }, { status: 500 });
  }
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
  const caseList = caseStudies.length > 0
    ? caseStudies.map((c, i) => `${i + 1}. ${c.companyName}（${c.industry}）: ${c.challenge || c.result}`).join('\n')
    : '（導入事例データなし）';

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
  "reason": "選定理由を簡潔に",
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

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    console.log('Gemini response:', content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found:', content);
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const filteredCases = (parsed.cases || [])
      .filter((c: any) => {
        const caseName = (c.companyName || '').toLowerCase();
        const searchName = companyName.toLowerCase();
        return !caseName.includes(searchName) && !searchName.includes(caseName);
      })
      .map((c: any) => ({
        companyName: c.companyName || '',
        industry: c.industry || '',
        challenge: c.challenge || '',
        result: c.result || '',
        source: c.source || 'Excel導入事例',
      }));

    return filteredCases.slice(0, 3);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}
