import { NextResponse } from 'next/server';

interface ObjectionRequest {
  companyName: string;
  industry: string;
  productName: string;
  productDescription: string;
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
  thirdCase?: {
    companyName: string;
    industry: string;
    challenge: string;
    result: string;
  };
  meetingDuration: string;
  companyInsights?: string;
}

interface RedirectNode {
  type: string;
  label: string;
  question: string;
  questionTips: string;
  caseIntro: string;
  caseTips: string;
  appointmentScript: string;
  appointmentTips: string;
}

export async function POST(request: Request) {
  try {
    const body: ObjectionRequest = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        redirectNodes: getDefaultRedirectNodes(body),
        source: 'template',
      });
    }

    try {
      // AIで「ちなみに」リダイレクトトークを生成
      const redirectNodes = await generateRedirectNodesWithAI(body, apiKey);

      return NextResponse.json({
        redirectNodes,
        source: 'ai',
      });
    } catch (error) {
      console.error('AI redirect generation failed:', error);
      return NextResponse.json({
        redirectNodes: getDefaultRedirectNodes(body),
        source: 'fallback',
      });
    }
  } catch (error) {
    console.error('Redirect generation error:', error);
    return NextResponse.json(
      { error: 'トーク生成に失敗しました' },
      { status: 500 }
    );
  }
}

async function generateRedirectNodesWithAI(
  request: ObjectionRequest,
  apiKey: string
): Promise<RedirectNode[]> {
  const {
    companyName,
    industry,
    productName,
    productDescription,
    bestCase,
    secondCase,
    thirdCase,
    meetingDuration,
    companyInsights,
  } = request;

  const prompt = `あなたはインサイドセールスのトップパフォーマーです。
${companyName}（${industry}）への営業電話で、「ちなみに」を使って話題を変え、質問→事例紹介→アポ取得につなげるトークを生成してください。

【ターゲット企業】
企業名: ${companyName}
業界: ${industry}
${companyInsights ? `\n【Web検索で取得した企業情報】\n${companyInsights}` : ''}

【販売製品】
製品名: ${productName}
概要: ${productDescription}

【参考導入事例】
事例1: ${bestCase.companyName}（${bestCase.industry}）
- 課題: ${bestCase.challenge}
- 成果: ${bestCase.result}
${secondCase ? `\n事例2: ${secondCase.companyName}（${secondCase.industry}）\n- 課題: ${secondCase.challenge}\n- 成果: ${secondCase.result}` : ''}
${thirdCase ? `\n事例3: ${thirdCase.companyName}（${thirdCase.industry}）\n- 課題: ${thirdCase.challenge}\n- 成果: ${thirdCase.result}` : ''}

【トークフロー】
⑥の後、相手の反応に関わらず「ちなみに〜」で話題を変えて質問し、
その回答に対して関連する事例を紹介し、アポ取得につなげる。

【生成する5パターン】
1. データ活用・レポート作成について質問 → 関連事例 → アポ
2. 経営数字の可視化について質問 → 関連事例 → アポ
3. 部門間のデータ連携について質問 → 関連事例 → アポ
4. システム・ツールの課題について質問 → 関連事例 → アポ
5. 競合・業界動向について質問 → 関連事例 → アポ

【重要なポイント】
- 「ちなみに」で自然に話題を変える
- ${industry}業界特有の課題に関する質問
- ${companyName}が「はい」と答えやすい質問
- 回答を受けて自然に事例紹介につなげる
- 事例は具体的な数字・成果を含める
- 最終的に${meetingDuration}のデモへ誘導

【出力形式】JSONのみ
{
  "redirectNodes": [
    {
      "type": "data_reporting",
      "label": "データ・レポート",
      "question": "ちなみに〜で始まる質問（${companyName}様のデータ活用やレポート作成に関する具体的な質問）",
      "questionTips": "質問のポイント",
      "caseIntro": "そうなんですね。実は〜で始まる事例紹介（${bestCase.companyName}様の具体的な成果を含む）",
      "caseTips": "事例紹介のポイント",
      "appointmentScript": "よろしければ〜で始まるアポ取得トーク（${meetingDuration}のデモ提案）",
      "appointmentTips": "アポ取得のコツ"
    },
    {
      "type": "visualization",
      "label": "経営可視化",
      "question": "...",
      "questionTips": "...",
      "caseIntro": "...",
      "caseTips": "...",
      "appointmentScript": "...",
      "appointmentTips": "..."
    },
    {
      "type": "integration",
      "label": "部門連携",
      "question": "...",
      "questionTips": "...",
      "caseIntro": "...",
      "caseTips": "...",
      "appointmentScript": "...",
      "appointmentTips": "..."
    },
    {
      "type": "system",
      "label": "システム課題",
      "question": "...",
      "questionTips": "...",
      "caseIntro": "...",
      "caseTips": "...",
      "appointmentScript": "...",
      "appointmentTips": "..."
    },
    {
      "type": "industry",
      "label": "業界動向",
      "question": "...",
      "questionTips": "...",
      "caseIntro": "...",
      "caseTips": "...",
      "appointmentScript": "...",
      "appointmentTips": "..."
    }
  ]
}`;

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

    console.log('AI Redirect response:', content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.redirectNodes || getDefaultRedirectNodes(request);
  } catch (error) {
    console.error('AI redirect generation error:', error);
    throw error;
  }
}

function getDefaultRedirectNodes(request: ObjectionRequest): RedirectNode[] {
  const { companyName, productName, bestCase, secondCase, meetingDuration, industry } = request;

  return [
    {
      type: 'data_reporting',
      label: 'データ・レポート',
      question: `ちなみに、${companyName}様では、経営レポートやデータ集計って、今どのようにされていますか？

Excelで手作業で集計されているとか、複数のシステムからデータを引っ張ってこられているとか...`,
      questionTips: '相手が「はい」と答えやすい質問。現状の課題を引き出す',
      caseIntro: `そうなんですね。実は、${bestCase.companyName}様も同じ状況でいらっしゃいました。

${bestCase.challenge}という課題をお持ちだったのですが、${productName}を導入されて、${bestCase.result}を実現されました。

特に${industry}業界では、このようなデータ統合の課題を抱えている企業様が多いんです。`,
      caseTips: '共感 → 同業種の具体的な成果を提示 → 業界課題として一般化',
      appointmentScript: `よろしければ、${companyName}様でも同じような効果が出せるか、${meetingDuration}程度でデモをお見せしながらご説明できますが、来週のご都合いかがでしょうか？`,
      appointmentTips: '「同じような効果」で期待感を持たせる → 具体的な日程提案',
    },
    {
      type: 'visualization',
      label: '経営可視化',
      question: `ちなみに、${companyName}様では、売上や利益などの経営数字って、リアルタイムで把握できる環境になっていますか？

月次で締めてから初めてわかる、という企業様も多いのですが...`,
      questionTips: 'リアルタイム可視化の課題を引き出す。多くの企業が「できていない」と答える',
      caseIntro: `やはりそうですよね。実は${bestCase.companyName}様も、以前は月次レポートが出るまで経営数字が見えない状態でした。

${productName}導入後は、ダッシュボードでリアルタイムにKPIが見えるようになり、${bestCase.result}という成果を上げられています。

${industry}業界では、この「見える化」で意思決定スピードが大きく変わった企業様が増えています。`,
      caseTips: '共感 → ビフォーアフターを明確に → 業界トレンドとして紹介',
      appointmentScript: `${companyName}様でも、どの数字をどう可視化すれば効果的か、${meetingDuration}で実際の画面をお見せしながらご提案できますが、ご興味ありますか？`,
      appointmentTips: 'カスタマイズ提案をアピール → 興味確認から日程へ',
    },
    {
      type: 'integration',
      label: '部門連携',
      question: `ちなみに、${companyName}様では、営業部門と経理部門、あるいは本社と支店間で、同じデータを見ながら会話できる環境ってありますか？

部門ごとに違うデータを持っていて、数字が合わない...なんてことはありませんか？`,
      questionTips: '部門間のデータサイロ問題を引き出す。多くの企業が課題を持っている',
      caseIntro: `まさにそこなんです。${bestCase.companyName}様も、部門ごとに違うExcelを持っていて、会議のたびに「どの数字が正しいの？」という状況だったそうです。

${productName}で全社のデータを一元化されてからは、${bestCase.result}。特に会議の生産性が大きく上がったとおっしゃっています。`,
      caseTips: '具体的な課題シーンを描写 → 解決後の変化を伝える',
      appointmentScript: `${companyName}様のデータ環境をお聞きした上で、どう統合すれば効果的か、${meetingDuration}でご提案できますが、来週お時間いかがでしょうか？`,
      appointmentTips: 'ヒアリング＋提案のセットで価値を出す',
    },
    {
      type: 'system',
      label: 'システム課題',
      question: `ちなみに、${companyName}様では、基幹システムやSalesforce、様々なSaaSからデータを取り出して分析するのって、結構大変じゃないですか？

手作業でエクスポートして、Excelで加工して...という企業様も多いのですが...`,
      questionTips: 'データ連携の手間を引き出す。IT担当者の「あるある」課題',
      caseIntro: `そうなんですね。${secondCase ? secondCase.companyName : bestCase.companyName}様も、まさに同じ課題をお持ちでした。

${productName}は1,000種類以上のコネクターがあって、ノーコードでデータ連携ができるんです。${secondCase ? secondCase.result : bestCase.result}という成果を出されています。

特に${industry}業界でよく使われるシステムとの連携実績も豊富です。`,
      caseTips: '技術的な強みを具体的に → 業界実績をアピール',
      appointmentScript: `${companyName}様がお使いのシステムとの連携デモ、${meetingDuration}でお見せできますが、ご覧になりますか？`,
      appointmentTips: '具体的なデモを約束 → 「見るだけ」でハードルを下げる',
    },
    {
      type: 'industry',
      label: '業界動向',
      question: `ちなみに、${industry}業界では最近、データドリブン経営やDXの取り組みが加速していますが、${companyName}様ではそのあたり、どのような状況でしょうか？

競合他社の動きなども気になるところかと思いますが...`,
      questionTips: '業界動向への関心を引き出す。競合意識を刺激',
      caseIntro: `おっしゃる通りです。実は${industry}業界では、${bestCase.companyName}様をはじめ、データ活用で競争力を上げている企業様が増えています。

${bestCase.companyName}様は${bestCase.result}を実現されて、${industry}業界でも先進的な取り組みとして注目されています。`,
      caseTips: '業界内での位置づけを意識させる → 先進事例として紹介',
      appointmentScript: `${industry}業界の最新事例と、${companyName}様で実現できることを、${meetingDuration}でお伝えできますが、情報収集として聞いてみませんか？`,
      appointmentTips: '「情報収集」としてハードルを下げる → 業界事例の価値をアピール',
    },
  ];
}
