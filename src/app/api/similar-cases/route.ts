import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SimilarCaseResponse {
  companyName: string;
  industry: string;
  challenge: string;
  result: string;
  source: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyName = searchParams.get('company');
  const industry = searchParams.get('industry') || '';
  const productName = searchParams.get('product') || 'DOMO';

  if (!companyName) {
    return NextResponse.json({ error: '会社名が必要です' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const cases = await searchCasesWithGemini(companyName, industry, productName, apiKey);
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
  apiKey: string
): Promise<SimilarCaseResponse[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `あなたはBIツール「DOMO（ドーモ）」の導入事例データベースです。

【検索対象】
企業名: ${companyName}
業界: ${industry || '不明'}

【あなたのタスク】
1. まず「${companyName}」がどの業界の企業かを特定してください
2. DOOMの公式サイトやプレスリリースで公開されている実際の導入事例から、「${companyName}」と同じ業界または類似業界の企業を2〜3社探してください
3. 各企業について以下を調べてください：
   - 企業名
   - 業界
   - DOMO導入前の課題
   - DOMO導入後の成果・効果

【重要なルール】
- DOOMの実際に公開されている導入事例のみを使用してください
- 架空の企業や事例を作らないでください
- 日本企業の事例を優先してください
- 「${companyName}」自身は除外してください
- 情報源（DOMO公式サイト、プレスリリース等）を明記してください

【出力形式】
以下のJSON形式のみで回答してください。説明文は不要です。

{
  "searchedCompanyIndustry": "${companyName}の業界",
  "cases": [
    {
      "companyName": "導入企業名",
      "industry": "業界",
      "challenge": "DOMO導入前の課題（50-100文字）",
      "result": "DOMO導入後の成果（50-100文字）",
      "source": "情報源"
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

    // 検索対象企業自身を除外
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
        source: c.source || 'DOMO導入事例',
      }));

    return filteredCases.slice(0, 3);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}
