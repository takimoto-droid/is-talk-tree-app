import { NextRequest, NextResponse } from 'next/server';

const geminiApiKey = process.env.GEMINI_API_KEY || '';

interface RecommendedCompany {
  company_name: string;
  industry: string;
  revenue?: string;
  employees?: string;
  reason: string;
  dx_news?: {
    title: string;
    url: string;
  };
}

// 業界カテゴリの定義
const INDUSTRY_CATEGORIES: Record<string, string[]> = {
  '通信・IT': ['通信', 'IT', 'ソフトウェア', 'インターネット', 'SaaS', 'クラウド', 'テクノロジー', '情報', 'システム', 'EC', 'プラットフォーム'],
  '製造・エレクトロニクス': ['製造', 'メーカー', '電機', '自動車', '機械', '部品', '工場', '生産', '化学', '素材', '精密機器', '化粧品', '食品', '医薬品'],
  '金融・保険': ['銀行', '証券', '保険', '金融', '投資', 'ファイナンス', '資産運用', 'クレジット', '決済', 'リース'],
  '小売・流通': ['小売', '流通', '店舗', 'コンビニ', 'スーパー', '百貨店', '物流', '卸売', 'アパレル', 'ドラッグストア'],
  'コンサルティング': ['コンサル', '戦略', 'アドバイザリー', 'シンクタンク'],
  'メディア・広告': ['メディア', '広告', '出版', '放送', 'エンターテイメント', 'ゲーム', '映像', 'コンテンツ'],
  '建設・不動産': ['建設', '不動産', '住宅', 'ゼネコン', 'デベロッパー'],
  '運輸・物流': ['運輸', '物流', '倉庫', '航空', '鉄道', '海運', '陸運'],
  '商社': ['商社', '総合商社', '専門商社'],
  'サービス': ['サービス', '人材', '教育', '医療', '介護', 'ホテル', '旅行', '飲食'],
};

function getIndustryCategory(industry: string): string | null {
  if (!industry) return null;
  const industryLower = industry.toLowerCase();
  for (const [category, keywords] of Object.entries(INDUSTRY_CATEGORIES)) {
    if (keywords.some(kw => industryLower.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  return null;
}

function isSameCompany(name1: string, name2: string): boolean {
  const normalize = (s: string) => s
    .replace(/株式会社|（株）|\(株\)|㈱/g, '')
    .replace(/ホールディングス|HD|グループ/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

function extractTextFromResponse(data: any): string {
  let text = '';
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    for (const part of data.candidates[0].content.parts) {
      if (part.text) text += part.text;
    }
  }
  return text;
}

export async function POST(request: NextRequest) {
  let companyName = '';
  let industry = '';

  try {
    const body = await request.json();
    companyName = body.company_name || '';
    industry = body.industry || '';

    if (!companyName) {
      return NextResponse.json({
        success: false,
        error: '企業名が必要です',
        recommendations: [],
      });
    }

    // Gemini APIが設定されていない場合
    if (!geminiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'API未設定',
        recommendations: [],
      });
    }

    const industryCategory = getIndustryCategory(industry);
    const timestamp = Date.now(); // キャッシュ防止

    // Step 1: まず企業の売上高を調査
    const searchQuery = `${companyName} 売上高 2024 決算`;

    const prompt = `【重要】これはWeb検索を使って最新情報を取得するタスクです。必ずGoogle検索を実行してください。

タイムスタンプ: ${timestamp}

【タスク】
「${companyName}」（${industry}）でアポイントが取れました。
Google検索で以下を調べ、次にアポが取れそうな同業他社を5社推薦してください。

【Step 1: Google検索で調査】
以下のキーワードでGoogle検索してください：
- 「${companyName} 売上高 決算」→ 売上規模を把握
- 「${industry} 大手企業 売上ランキング」→ 同業他社をリストアップ
- 「${industry} DX 導入事例」→ DXに積極的な企業を特定

【Step 2: 推薦企業の選定条件】
1. 業界: 「${industry}」と完全に同じ業界のみ
${industryCategory ? `2. 業界カテゴリ「${industryCategory}」の企業のみ` : ''}
3. 売上規模: ${companyName}と近い規模（0.3倍〜3倍）
4. 除外: ${companyName}自身は絶対に含めない
5. 実在する日本企業のみ

【Step 3: 各企業について調査】
推薦する各企業について、Google検索で以下を調べてください：
- 最新の売上高・従業員数
- 最近のDX・データ活用ニュース
- ${companyName}との具体的な共通点

【推薦理由の書き方】
各企業ごとに異なる具体的な理由を100-150文字で記載：
- その企業「固有」の事業特徴（他社にはない強み）
- ${companyName}との「具体的」な共通点
- 「今」アポが取れそうな理由（最近の動き）

【出力形式】JSONのみ
{
  "source_company_info": {
    "name": "${companyName}",
    "revenue": "Web検索で調べた売上高",
    "industry": "${industry}"
  },
  "recommendations": [
    {
      "company_name": "企業名（正式名称）",
      "industry": "${industry}",
      "revenue": "Web検索で調べた売上高（例：1,234億円）",
      "employees": "Web検索で調べた従業員数",
      "reason": "【この企業固有の推薦理由。コピペ禁止。具体的な数字や事実を含める】",
      "dx_news": {
        "title": "Web検索で見つけた最新DXニュース",
        "url": "ニュースのURL"
      }
    }
  ]
}

【禁止事項】
- 同じ推薦理由を複数企業に使わないこと
- 架空の情報を出力しないこと
- Web検索せずに回答しないこと`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            tools: [{ googleSearch: {} }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 4000,
            }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = extractTextFromResponse(data);
      console.log('Gemini response for recommendations:', text.substring(0, 500));

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      let recs = (parsed.recommendations || [])
        .filter((r: RecommendedCompany) => !isSameCompany(r.company_name, companyName))
        .filter((r: RecommendedCompany) => {
          if (!industryCategory) return true;
          const recCategory = getIndustryCategory(r.industry);
          return recCategory === industryCategory || recCategory === null;
        });

      console.log(`Found ${recs.length} recommendations for ${companyName} (${industry})`);

      if (recs.length > 0) {
        return NextResponse.json({
          success: true,
          recommendations: recs.slice(0, 5),
          source_company: parsed.source_company_info || { company_name: companyName, industry },
        });
      }

      // 結果が0件の場合、再試行
      console.log('No results, retrying with broader search...');

    } catch (aiError) {
      console.error('AI error:', aiError);
    }

    // フォールバック: より簡単なプロンプトで再試行
    try {
      const simplePrompt = `Google検索で「${industry} 大手企業 売上ランキング 2024」を検索し、${companyName}と同じ業界の企業を5社、JSON形式で返してください。

出力形式:
{
  "recommendations": [
    {
      "company_name": "企業名",
      "industry": "${industry}",
      "revenue": "売上高",
      "employees": "従業員数",
      "reason": "推薦理由（100文字程度、各社で異なる内容）",
      "dx_news": { "title": "DXニュース", "url": "URL" }
    }
  ]
}`;

      const retryResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: simplePrompt }] }],
            tools: [{ googleSearch: {} }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 3000 }
          }),
        }
      );

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        const retryText = extractTextFromResponse(retryData);
        const retryJsonMatch = retryText.match(/\{[\s\S]*\}/);

        if (retryJsonMatch) {
          const retryParsed = JSON.parse(retryJsonMatch[0]);
          const retryRecs = (retryParsed.recommendations || [])
            .filter((r: RecommendedCompany) => !isSameCompany(r.company_name, companyName));

          if (retryRecs.length > 0) {
            return NextResponse.json({
              success: true,
              recommendations: retryRecs.slice(0, 5),
              source_company: { company_name: companyName, industry },
            });
          }
        }
      }
    } catch (retryError) {
      console.error('Retry error:', retryError);
    }

    return NextResponse.json({
      success: false,
      error: '推薦企業を取得できませんでした',
      recommendations: [],
      source_company: { company_name: companyName, industry },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'エラーが発生しました',
      recommendations: [],
    });
  }
}
