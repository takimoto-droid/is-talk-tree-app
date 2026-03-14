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

  const prompt = `あなたはDOMO（ビジネスインテリジェンスツール）の導入事例を調査するエキスパートです。

【調査依頼】
検索企業: ${companyName}
推定業界: ${industry || '（不明）'}

【タスク】
DOOMを実際に導入している日本企業の中から、「${companyName}」と業界や事業内容が近い企業を探してください。

【DOOMの主な日本導入企業（参考）】
- 通信: ソフトバンク、KDDI、NTTコミュニケーションズ
- 製造: パナソニック、オムロン、コニカミノルタ、デンソー
- 金融: 三井住友銀行、野村総合研究所、SBI証券
- 小売: イオン、ローソン、ニトリ
- IT: サイバーエージェント、楽天、LINE
- 広告: 電通、博報堂
- 物流: 日本通運、ヤマト運輸
- 不動産: 三井不動産、大和ハウス
- 旅行: JTB、ANA
- 製薬: アステラス製薬、第一三共
- 食品: サントリー、味の素
- エネルギー: 東京ガス、関西電力

【回答ルール】
1. 「${companyName}」と同じ業界、または類似業界のDOMO導入企業を2〜3社選んでください
2. 各企業のDOMO導入における課題と成果を記載してください
3. 「${companyName}」自体は含めないでください
4. 実在する企業のみ記載してください

【出力形式】JSONのみ（説明文不要）
{
  "cases": [
    {
      "companyName": "企業名",
      "industry": "業界",
      "challenge": "DOMO導入前の課題",
      "result": "DOMO導入による成果・効果",
      "source": "DOMO公式導入事例"
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
        source: c.source || 'DOMO公式導入事例',
      }));

    return filteredCases.slice(0, 3);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}
