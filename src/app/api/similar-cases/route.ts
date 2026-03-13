import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SimilarCase {
  companyName: string;
  industry: string;
  challenge: string;
  result: string;
  source?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyName = searchParams.get('company');
  const industry = searchParams.get('industry') || '';
  const productName = searchParams.get('product') || 'DOMO';

  if (!companyName) {
    return NextResponse.json({ error: '会社名が必要です' }, { status: 400 });
  }

  // Gemini API キーの確認
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
): Promise<SimilarCase[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `あなたはBIツール「${productName}（DOMO/ドーモ）」の導入事例に詳しいエキスパートです。

対象企業: ${companyName}
推定業界: ${industry || '不明'}

以下のタスクを実行してください：

1. ${companyName}の業界を特定してください
2. ${productName}（DOMO）の実際の公開されている導入事例の中から、${companyName}と同じまたは類似した業界の企業を2〜3社見つけてください
3. 各企業について、導入前の課題と導入後の成果を要約してください

重要な注意事項：
- DOOMの実際に公開されている導入事例を基にしてください
- 架空の事例は絶対に作成しないでください
- 日本企業の事例を優先してください
- 情報が不確実な場合は、その旨を記載してください

以下のJSON形式のみで回答してください（説明文は不要、JSONのみ）：
{
  "cases": [
    {
      "companyName": "企業名",
      "industry": "業界",
      "challenge": "導入前の課題（100文字以内）",
      "result": "導入後の成果（100文字以内）",
      "source": "情報源（DOMO公式サイト、プレスリリース等）"
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    // JSONを抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const cases: SimilarCase[] = (parsed.cases || []).map((c: any) => ({
      companyName: c.companyName || '',
      industry: c.industry || '',
      challenge: c.challenge || '',
      result: c.result || '',
      source: c.source || 'Gemini調査',
    }));

    // 検索対象企業自身は除外
    return cases.filter(c =>
      !c.companyName.toLowerCase().includes(companyName.toLowerCase()) &&
      !companyName.toLowerCase().includes(c.companyName.toLowerCase())
    );
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}
