import { NextResponse } from 'next/server';

interface ScriptRequest {
  companyName: string;
  industry: string;
  news: Array<{ title: string; source: string; url: string }>;
  bestCase: {
    companyName: string;
    industry: string;
    challenge: string;
    result: string;
  };
  secondCase?: {
    companyName: string;
    industry: string;
    challenge: string;
    result: string;
  };
  productName: string;
  productDescription: string;
  sellerCompanyName: string;
  meetingDuration: string;
}

interface GeneratedScript {
  step: number;
  title: string;
  content: string;
  tip: string;
}

export async function POST(request: Request) {
  try {
    const body: ScriptRequest = await request.json();
    const {
      companyName,
      industry,
      news,
      bestCase,
      secondCase,
      productName,
      productDescription,
      sellerCompanyName,
      meetingDuration,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        scripts: getDefaultScripts(body),
        source: 'template',
      });
    }

    try {
      // Web検索でリアルタイム情報を取得
      const companyInfo = await searchCompanyInfo(companyName, industry, apiKey);

      // AIでスクリプトを生成
      const scripts = await generateScriptsWithAI(body, companyInfo, apiKey);

      return NextResponse.json({
        scripts,
        companyInfo,
        source: 'ai',
      });
    } catch (error) {
      console.error('AI script generation failed:', error);
      return NextResponse.json({
        scripts: getDefaultScripts(body),
        source: 'fallback',
      });
    }
  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { error: 'スクリプト生成に失敗しました' },
      { status: 500 }
    );
  }
}

// Web検索で企業情報を取得
async function searchCompanyInfo(
  companyName: string,
  industry: string,
  apiKey: string
): Promise<string> {
  const prompt = `「${companyName}」について、以下の情報をWeb検索で調べて簡潔にまとめてください：

1. 会社概要（事業内容、従業員数、売上規模）
2. 最近のニュース・プレスリリース（DX、データ活用、システム刷新関連）
3. 経営課題・中期経営計画のポイント
4. 競合他社との差別化ポイント
5. データ活用・IT投資の状況

【出力形式】
箇条書きで簡潔に。不明な情報は「情報なし」と記載。`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Company info search failed:', error);
    return '';
  }
}

// AIでスクリプトを生成
async function generateScriptsWithAI(
  request: ScriptRequest,
  companyInfo: string,
  apiKey: string
): Promise<GeneratedScript[]> {
  const {
    companyName,
    industry,
    news,
    bestCase,
    secondCase,
    productName,
    productDescription,
    sellerCompanyName,
    meetingDuration,
  } = request;

  const topNews = news && news.length > 0 ? news[0] : null;
  const secondNews = news && news.length > 1 ? news[1] : null;

  const prompt = `あなたはインサイドセールスのプロフェッショナルです。
以下の情報を元に、${companyName}向けの具体的で説得力のあるトークスクリプトを6ステップで生成してください。

【ターゲット企業情報】
企業名: ${companyName}
業界: ${industry}
${companyInfo ? `\n【Web検索で取得した最新情報】\n${companyInfo}` : ''}
${topNews ? `\n【関連ニュース】\n・${topNews.title}（${topNews.source}）` : ''}
${secondNews ? `・${secondNews.title}（${secondNews.source}）` : ''}

【販売製品】
製品名: ${productName}
概要: ${productDescription}
販売会社: ${sellerCompanyName}

【導入事例】
事例1: ${bestCase.companyName}（${bestCase.industry}）
- 課題: ${bestCase.challenge}
- 成果: ${bestCase.result}
${secondCase ? `\n事例2: ${secondCase.companyName}（${secondCase.industry}）\n- 課題: ${secondCase.challenge}\n- 成果: ${secondCase.result}` : ''}

【生成するスクリプト】
各ステップについて、${companyName}の実情に合わせた具体的なトークを生成してください。

【出力形式】JSONのみ
{
  "scripts": [
    {
      "step": 1,
      "title": "冒頭挨拶",
      "content": "実際のトーク内容（改行含む）",
      "tip": "このステップのポイント"
    },
    {
      "step": 2,
      "title": "記事・ニュース言及",
      "content": "具体的なニュースや取り組みに言及するトーク",
      "tip": "ポイント"
    },
    {
      "step": 3,
      "title": "製品紹介",
      "content": "${industry}業界向けにカスタマイズした製品紹介",
      "tip": "ポイント"
    },
    {
      "step": 4,
      "title": "企業の特徴・課題への共感",
      "content": "${companyName}の具体的な取り組みや課題に言及",
      "tip": "ポイント"
    },
    {
      "step": 5,
      "title": "類似企業の導入実績",
      "content": "導入事例を具体的に紹介",
      "tip": "ポイント"
    },
    {
      "step": 6,
      "title": "課題解決と日程提案",
      "content": "具体的な効果と${meetingDuration}のデモ提案",
      "tip": "ポイント"
    }
  ]
}

【重要な注意点】
- ${companyName}の実際の事業内容・課題に即した具体的な内容にする
- 業界特有の用語や課題を盛り込む
- 数字や具体例を可能な限り含める
- 自然な会話口調にする`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('AI Script response:', content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.scripts || getDefaultScripts(request);
  } catch (error) {
    console.error('AI script generation error:', error);
    throw error;
  }
}

// デフォルトスクリプト（フォールバック用）
function getDefaultScripts(request: ScriptRequest): GeneratedScript[] {
  const {
    companyName,
    industry,
    news,
    bestCase,
    secondCase,
    productName,
    productDescription,
    sellerCompanyName,
    meetingDuration,
  } = request;

  const topNews = news && news.length > 0 ? news[0] : null;

  return [
    {
      step: 1,
      title: '冒頭挨拶',
      content: `お世話になっております。\n${sellerCompanyName}の○○と申します。`,
      tip: '明るくハキハキと',
    },
    {
      step: 2,
      title: '記事・ニュース言及',
      content: topNews
        ? `先日、「${topNews.title}」という記事を拝見いたしまして、お電話させていただきました。`
        : `${companyName}様のDX推進に関する取り組みを拝見いたしまして、お電話させていただきました。`,
      tip: '事前にニュースをチェック',
    },
    {
      step: 3,
      title: '製品紹介',
      content: `${productName}は、${productDescription}を提供しております。\n\n${industry}業界でも多くの企業様にご導入いただいております。`,
      tip: '簡潔に特徴を伝える',
    },
    {
      step: 4,
      title: '企業の特徴・課題への共感',
      content: `${companyName}様は${industry}のリーディングカンパニーとして、業務効率化やデータ活用に積極的に取り組まれていると伺っております。`,
      tip: '相手の取り組みを褒める',
    },
    {
      step: 5,
      title: '類似企業の導入実績',
      content: `弊社、直近で「${bestCase.companyName}」様${secondCase ? `、「${secondCase.companyName}」様` : ''}にご導入いただいております。`,
      tip: '同業他社の実績で信頼感を与える',
    },
    {
      step: 6,
      title: '課題解決と日程提案',
      content: `${bestCase.companyName}様では、「${bestCase.challenge}」という課題をお持ちでしたが、${productName}導入後、${bestCase.result}という成果を達成されています。\n\n${companyName}様でも同様の課題をお感じでしたら、${meetingDuration}程度のオンラインデモでご説明させていただけませんでしょうか？`,
      tip: '具体的な成果と日程提案',
    },
  ];
}
