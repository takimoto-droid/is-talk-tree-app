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

// 業界別フォールバックデータ
const FALLBACK_DATA: Record<string, RecommendedCompany[]> = {
  '製造': [
    { company_name: '日立製作所', industry: '製造・エレクトロニクス', revenue: '10兆8,811億円（2024年3月期）', employees: '約32万人', reason: '同じ製造業界でLumadaを中心としたDX推進に積極的。製造業向けIoTソリューションやデータ分析基盤への投資を拡大中。', dx_news: { title: '日立、生成AIで製造業DX加速 Lumada事業を強化', url: 'https://www.hitachi.co.jp/New/cnews/' } },
    { company_name: '三菱電機', industry: '製造・エレクトロニクス', revenue: '5兆2,579億円（2024年3月期）', employees: '約15万人', reason: 'FA事業でのデータ活用を強化中。e-F@ctory推進によりスマートファクトリー化を進めており、生産データの可視化・分析ニーズが高い。', dx_news: { title: '三菱電機、FA事業でAI・データ活用を加速', url: 'https://www.mitsubishielectric.co.jp/news/' } },
    { company_name: 'オムロン', industry: '製造・エレクトロニクス', revenue: '8,188億円（2024年3月期）', employees: '約28,000人', reason: '製造業DXの先進企業。i-Automationコンセプトを推進し、データ統合・分析基盤の強化を検討中。', dx_news: { title: 'オムロン、製造現場のデータ活用でAI協調ロボット展開', url: 'https://www.omron.com/jp/ja/news/' } },
    { company_name: 'キーエンス', industry: '製造・エレクトロニクス', revenue: '9,673億円（2024年3月期）', employees: '約12,000人', reason: 'データドリブン経営で有名な高収益企業。顧客データの分析基盤強化に関心が高い。', dx_news: { title: 'キーエンス、データ活用で営業効率を最大化', url: 'https://www.keyence.co.jp/' } },
    { company_name: 'ファナック', industry: '製造・エレクトロニクス', revenue: '8,243億円（2024年3月期）', employees: '約9,500人', reason: 'FIELD systemでスマートファクトリー推進。IoTデータ活用を進めており、クラウド基盤でのデータ活用に関心。', dx_news: { title: 'ファナック、製造業向けIoTプラットフォーム強化', url: 'https://www.fanuc.co.jp/' } },
  ],
  '通信': [
    { company_name: 'NTTデータ', industry: '通信・IT', revenue: '3兆4,901億円（2024年3月期）', employees: '約19万人', reason: 'IT業界でデジタル変革を推進。データ分析・AI基盤の構築案件が増加中で、自社のDX推進にも積極的。', dx_news: { title: 'NTTデータ、生成AIで業務改革支援を強化', url: 'https://www.nttdata.com/jp/ja/news/' } },
    { company_name: 'SCSK', industry: '通信・IT', revenue: '4,459億円（2024年3月期）', employees: '約16,000人', reason: '住友商事グループとしてDX推進に注力。データ活用基盤の提案・導入実績が豊富。', dx_news: { title: 'SCSK、DX支援サービスを強化', url: 'https://www.scsk.jp/news/' } },
    { company_name: 'TIS', industry: '通信・IT', revenue: '5,495億円（2024年3月期）', employees: '約22,000人', reason: 'ITホールディングスグループの中核企業。データ活用支援サービスを展開中。', dx_news: { title: 'TIS、データドリブン経営支援を拡充', url: 'https://www.tis.co.jp/news/' } },
    { company_name: '野村総合研究所', industry: 'コンサルティング・IT', revenue: '7,365億円（2024年3月期）', employees: '約16,000人', reason: 'コンサルとITの両面で強み。データ分析・AI活用のコンサルティングに実績。', dx_news: { title: 'NRI、AI活用コンサルティング強化', url: 'https://www.nri.com/jp/news' } },
    { company_name: '伊藤忠テクノソリューションズ', industry: '通信・IT', revenue: '5,712億円（2024年3月期）', employees: '約10,000人', reason: '法人向けITソリューションを展開。クラウド・データ基盤の提案に積極的。', dx_news: { title: 'CTC、クラウドネイティブ支援を拡大', url: 'https://www.ctc-g.co.jp/company/release/' } },
  ],
  '金融': [
    { company_name: '三菱UFJフィナンシャル・グループ', industry: '金融・保険', revenue: '7兆5,678億円（2024年3月期）', employees: '約15万人', reason: '金融業界でデジタル戦略に大型投資中。顧客データプラットフォームの構築やAI活用に積極的。', dx_news: { title: 'MUFG、デジタルサービス基盤を刷新', url: 'https://www.mufg.jp/dam/pressrelease/' } },
    { company_name: '三井住友フィナンシャルグループ', industry: '金融・保険', revenue: '6兆1,234億円（2024年3月期）', employees: '約10万人', reason: 'データ活用で顧客体験向上を推進。Olive等のデジタルサービスでデータ分析基盤を強化中。', dx_news: { title: '三井住友FG、データ活用型金融サービス展開', url: 'https://www.smfg.co.jp/news/' } },
    { company_name: 'みずほフィナンシャルグループ', industry: '金融・保険', revenue: '5兆8,000億円（2024年3月期）', employees: '約53,000人', reason: 'システム刷新・DX推進に注力。データ統合基盤の構築が経営課題。', dx_news: { title: 'みずほFG、次期システム構築でDX加速', url: 'https://www.mizuho-fg.co.jp/release/' } },
    { company_name: '東京海上ホールディングス', industry: '金融・保険', revenue: '7兆2,456億円（2024年3月期）', employees: '約43,000人', reason: '保険テック投資に積極的。データ活用による業務効率化・リスク分析を推進中。', dx_news: { title: '東京海上、データ活用で保険引受の高度化', url: 'https://www.tokiomarinehd.com/release_topics/' } },
    { company_name: '第一生命ホールディングス', industry: '金融・保険', revenue: '9兆8,000億円（2024年3月期）', employees: '約63,000人', reason: '生命保険業界でDX推進に積極的。データ活用による顧客サービス向上に注力。', dx_news: { title: '第一生命、AI活用で顧客体験向上', url: 'https://www.dai-ichi-life-hd.com/newsroom/' } },
  ],
  '小売': [
    { company_name: 'イオン', industry: '小売・流通', revenue: '9兆5,535億円（2024年2月期）', employees: '約57万人', reason: '小売業界でデジタル戦略を推進。顧客データ活用によるOMO戦略に注力中。', dx_news: { title: 'イオン、デジタル戦略で顧客体験を革新', url: 'https://www.aeon.info/news/' } },
    { company_name: 'セブン&アイ・ホールディングス', industry: '小売・流通', revenue: '11兆4,717億円（2024年2月期）', employees: '約14万人', reason: 'リテールデータ活用の先進企業。POSデータ・顧客購買データを活用したマーケティングを推進。', dx_news: { title: 'セブン&アイ、データ活用でOMO戦略を加速', url: 'https://www.7andi.com/company/news/' } },
    { company_name: 'ファーストリテイリング', industry: '小売・流通', revenue: '2兆7,665億円（2023年8月期）', employees: '約11万人', reason: 'ユニクロ運営企業。データドリブン経営で成長。サプライチェーン最適化にデータ活用。', dx_news: { title: 'ファストリ、AI活用でサプライチェーン最適化', url: 'https://www.fastretailing.com/jp/ir/news/' } },
    { company_name: '三井物産', industry: '総合商社', revenue: '14兆3,064億円（2024年3月期）', employees: '約46,000人', reason: 'DX投資を加速。データ活用による事業変革やスタートアップ投資に積極的。', dx_news: { title: '三井物産、DX投資でビジネス変革', url: 'https://www.mitsui.com/jp/ja/topics/' } },
    { company_name: '伊藤忠商事', industry: '総合商社', revenue: '14兆299億円（2024年3月期）', employees: '約110,000人', reason: 'ファミリーマート等を持つ総合商社。リテールテック・データ活用に注力。', dx_news: { title: '伊藤忠、DXで事業基盤を強化', url: 'https://www.itochu.co.jp/ja/news/' } },
  ],
  '建設': [
    { company_name: '大和ハウス工業', industry: '建設・不動産', revenue: '5兆2,029億円（2024年3月期）', employees: '約49,000人', reason: '建設・不動産業界でDX推進に積極的。BIMやIoT活用で建設現場のデータ化を推進中。', dx_news: { title: '大和ハウス、建設DXで生産性向上', url: 'https://www.daiwahouse.co.jp/about/release/' } },
    { company_name: '積水ハウス', industry: '建設・不動産', revenue: '3兆1,072億円（2024年1月期）', employees: '約30,000人', reason: '住宅メーカー大手。顧客データ活用やスマートホーム連携に注力。', dx_news: { title: '積水ハウス、スマートホーム戦略を加速', url: 'https://www.sekisuihouse.co.jp/company/topics/' } },
    { company_name: '三井不動産', industry: '不動産', revenue: '2兆3,834億円（2024年3月期）', employees: '約24,000人', reason: '不動産業界でDX先進企業。スマートビル・データ活用に投資中。', dx_news: { title: '三井不動産、スマートシティ構想を推進', url: 'https://www.mitsuifudosan.co.jp/corporate/news/' } },
    { company_name: '鹿島建設', industry: '建設', revenue: '2兆6,651億円（2024年3月期）', employees: '約21,000人', reason: 'スーパーゼネコンの一角。建設現場のDX化・データ活用を推進中。', dx_news: { title: '鹿島、建設現場のデジタル化を加速', url: 'https://www.kajima.co.jp/news/' } },
    { company_name: '大成建設', industry: '建設', revenue: '1兆9,184億円（2024年3月期）', employees: '約15,000人', reason: 'BIM・CIM活用やロボット導入などDX推進に注力。', dx_news: { title: '大成建設、DXで建設プロセスを変革', url: 'https://www.taisei.co.jp/about_us/release/' } },
  ],
  'default': [
    { company_name: 'トヨタ自動車', industry: '製造・自動車', revenue: '45兆953億円（2024年3月期）', employees: '約38万人', reason: '日本最大の製造業。コネクティッドカーやスマートファクトリーでDX推進中。', dx_news: { title: 'トヨタ、コネクティッド戦略でデータ活用加速', url: 'https://global.toyota/jp/newsroom/' } },
    { company_name: 'ソニーグループ', industry: '製造・エレクトロニクス', revenue: '13兆208億円（2024年3月期）', employees: '約11万人', reason: 'エンタメ×テクノロジーでデータ活用を推進。AI・データ分析に投資中。', dx_news: { title: 'ソニー、AIとデータで新事業創出', url: 'https://www.sony.com/ja/SonyInfo/News/' } },
    { company_name: 'リクルートホールディングス', industry: 'サービス・IT', revenue: '3兆4,164億円（2024年3月期）', employees: '約6万人', reason: 'データドリブン経営の代表格。データ活用で事業成長を実現。', dx_news: { title: 'リクルート、AIマッチングでHR事業を強化', url: 'https://www.recruit.co.jp/newsroom/' } },
    { company_name: 'ソフトバンクグループ', industry: '通信・投資', revenue: '6兆840億円（2024年3月期）', employees: '約55,000人', reason: 'AI・データ投資に積極的。データ活用による事業変革を推進。', dx_news: { title: 'ソフトバンク、生成AI活用で業務効率化', url: 'https://www.softbank.jp/corp/news/' } },
    { company_name: 'NTT', industry: '通信・IT', revenue: '13兆3,745億円（2024年3月期）', employees: '約33万人', reason: '日本最大の通信企業。DX推進・データ基盤構築に大型投資中。', dx_news: { title: 'NTT、IOWN構想でデータ活用基盤を革新', url: 'https://group.ntt/jp/newsrelease/' } },
  ],
};

function getFallbackRecommendations(companyName: string, industry: string): RecommendedCompany[] {
  const ind = (industry || '').toLowerCase();
  let key = 'default';

  if (ind.includes('製造') || ind.includes('メーカー') || ind.includes('エレクトロニクス') || ind.includes('機械') || ind.includes('自動車')) {
    key = '製造';
  } else if (ind.includes('通信') || ind.includes('it') || ind.includes('ソフトウェア') || ind.includes('情報') || ind.includes('システム')) {
    key = '通信';
  } else if (ind.includes('金融') || ind.includes('銀行') || ind.includes('保険') || ind.includes('証券')) {
    key = '金融';
  } else if (ind.includes('小売') || ind.includes('流通') || ind.includes('商社') || ind.includes('卸売')) {
    key = '小売';
  } else if (ind.includes('不動産') || ind.includes('建設') || ind.includes('住宅') || ind.includes('ゼネコン')) {
    key = '建設';
  }

  const recs = FALLBACK_DATA[key] || FALLBACK_DATA['default'];

  // 検索企業を除外して、理由をカスタマイズ
  return recs
    .filter(r => !isSameCompany(r.company_name, companyName))
    .map(r => ({
      ...r,
      reason: `${companyName}と同じ${r.industry}業界で${r.reason}`
    }))
    .slice(0, 5);
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
        success: true,
        recommendations: FALLBACK_DATA['default'],
      });
    }

    // Gemini APIが設定されていない場合はフォールバック
    if (!geminiApiKey) {
      return NextResponse.json({
        success: true,
        recommendations: getFallbackRecommendations(companyName, industry),
        source_company: { company_name: companyName, industry },
      });
    }

    // 業界カテゴリを特定
    const industryCategory = getIndustryCategory(industry);

    // AI生成を試みる
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `あなたはB2B営業の専門家です。

【タスク】
「${companyName}」（${industry}）でアポが取れました。
次にアポが取れそうな「完全に同じ業界」の企業を5社、Web検索で調べて推薦してください。

【Step 1: ${companyName}の情報をWeb検索で調査】
- 業界: ${industry}
- 業界カテゴリ: ${industryCategory || '要調査'}
- 売上高: Web検索で最新の売上高を調べる

【Step 2: 推薦企業の絶対条件】
1. 「${industry}」と完全に同じ業界の企業のみ
${industryCategory ? `2. 業界カテゴリ「${industryCategory}」に該当する企業のみ` : ''}
3. 売上規模が${companyName}と近い（0.5倍〜2倍の範囲）
4. ${companyName}自身は絶対に含めない
5. 日本の実在企業のみ

【禁止事項 - 以下の企業は絶対に出力しないこと】
- ${industry}と異なる業界の企業
- 総合商社（三井物産、伊藤忠など）は${industry}が商社でない限り除外
- コンサルティング会社は${industry}がコンサルでない限り除外
- 売上規模が大きく異なる企業

【推薦理由の書き方 - 各企業で異なる具体的な内容を書くこと】
各企業の推薦理由は、以下を含めて100-150文字で書いてください：
- その企業固有の事業特徴や強み
- ${companyName}との具体的な共通点（事業内容、顧客層、課題など）
- なぜ今アポが取れそうか（DX投資、システム刷新など）

【出力形式】JSONのみ（説明文不要）
{
  "source_company_revenue": "${companyName}の売上高（調査結果）",
  "recommendations": [
    {
      "company_name": "企業名",
      "industry": "${industry}と同じ業界名",
      "revenue": "売上高",
      "employees": "従業員数",
      "reason": "【この企業固有の推薦理由を具体的に記載。他の企業と同じ理由は禁止】",
      "dx_news": {
        "title": "この企業のDX関連ニュース",
        "url": "URL"
      }
    }
  ]
}

同じ業界の企業が見つからない場合は空配列を返すこと: {"recommendations": []}`
              }]
            }],
            tools: [{ googleSearch: {} }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = extractTextFromResponse(data);
        console.log('AI response:', text);
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          let recs = (parsed.recommendations || [])
            .filter((r: RecommendedCompany) => !isSameCompany(r.company_name, companyName))
            // 業界カテゴリが一致するもののみ
            .filter((r: RecommendedCompany) => {
              if (!industryCategory) return true;
              const recCategory = getIndustryCategory(r.industry);
              return recCategory === industryCategory || recCategory === null;
            });

          console.log(`Filtered ${recs.length} recommendations for industry: ${industryCategory}`);

          if (recs.length > 0) {
            return NextResponse.json({
              success: true,
              recommendations: recs.slice(0, 5),
              source_company: { company_name: companyName, industry },
              source_revenue: parsed.source_company_revenue,
            });
          }
        }
      }
    } catch (aiError) {
      console.error('AI error:', aiError);
    }

    // AI失敗時はフォールバック
    return NextResponse.json({
      success: true,
      recommendations: getFallbackRecommendations(companyName, industry),
      source_company: { company_name: companyName, industry },
    });

  } catch (error) {
    console.error('API error:', error);
    // 絶対にフォールバックを返す
    return NextResponse.json({
      success: true,
      recommendations: getFallbackRecommendations(companyName, industry),
      source_company: { company_name: companyName, industry },
    });
  }
}
