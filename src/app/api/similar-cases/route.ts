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

  const prompt = `あなたはBIツール「${productName}（DOMO/ドーモ）」の導入事例に詳しいエキスパートです。

対象企業: ${companyName}
推定業界: ${industry || '不明'}

タスク:
1. ${companyName}の業界を特定
2. ${productName}の実際の導入事例から、${companyName}と類似した業界の企業を2〜3社見つける
3. 各企業の導入前の課題と導入後の成果を要約

注意:
- 実際の公開事例のみ使用
- 架空の事例は禁止
- 日本企業を優先

JSON形式のみで回答（説明文不要）:
{"cases":[{"companyName":"企業名","industry":"業界","challenge":"課題","result":"成果","source":"情報源"}]}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found:', content);
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.cases || [])
      .filter((c: any) =>
        !c.companyName.toLowerCase().includes(companyName.toLowerCase()) &&
        !companyName.toLowerCase().includes(c.companyName.toLowerCase())
      )
      .map((c: any) => ({
        companyName: c.companyName || '',
        industry: c.industry || '',
        challenge: c.challenge || '',
        result: c.result || '',
        source: c.source || 'Gemini調査',
      }));
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}
