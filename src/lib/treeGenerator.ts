import { TalkNode, GenerateTreeResponse, CompanyInfo, NewsItem, ProjectConfig, CaseStudy } from '@/types';

export function generateTalkTree(
  companyName: string,
  config: ProjectConfig,
  news?: NewsItem[]
): GenerateTreeResponse {
  const caseStudies = config.caseStudies;
  const bestCase = caseStudies[0] || getDefaultCase(config.productName);
  const secondCase = caseStudies[1] || caseStudies[0] || getDefaultCase(config.productName);

  // 業界を推定
  const estimatedIndustry = estimateIndustryFromName(companyName, config.targetIndustries);

  // ニュースから最も関連度の高い記事を取得
  const topNews = news && news.length > 0 ? news[0] : null;
  const secondNews = news && news.length > 1 ? news[1] : null;

  // ===== ① 冒頭挨拶（固定） =====
  const script1 = `お世話になっております。
${config.companyName}の○○と申します。`;

  // ===== ② 記事拝見トーク（AIが生成） =====
  const script2 = topNews
    ? `先日、「${topNews.title}」という記事を拝見いたしまして、お電話させていただきました。`
    : `${companyName}様のDX推進に関する取り組みを拝見いたしまして、お電話させていただきました。`;

  // ===== ③ 製品の紹介（AIが生成） =====
  const script3 = `${config.productName}は、${config.headquarters ? config.headquarters + 'に本社がございまして、' : ''}${config.productDescription}を提供しております。

${config.targetIndustries.length > 0 ? config.targetIndustries.slice(0, 3).join('、') + 'を中心に' : ''}多くの企業様にご導入いただいております。`;

  // ===== ④ 記事の特徴を要約（AIが生成） =====
  const script4 = topNews
    ? `記事を拝見する中で、${companyName}様が${getNewsFeature(topNews.title)}という印象を受けました。${secondNews ? `

また、「${secondNews.title}」という記事からも、データを活用した意思決定の重要性を認識されていると感じております。` : ''}`
    : `${companyName}様は${estimatedIndustry}のリーディングカンパニーとして、業務効率化やデータ活用に積極的に取り組まれていると伺っております。`;

  // ===== ⑤ 類似企業を名乗る（AIが生成） =====
  const script5 = caseStudies.length >= 2
    ? `弊社、丁度直近で「${bestCase.companyName}」様、「${secondCase.companyName}」様にご導入いただいております。`
    : caseStudies.length === 1
    ? `弊社、直近で「${bestCase.companyName}」様にご導入いただいております。`
    : `弊社、多くの企業様にご導入いただいております。`;

  // ===== ⑥ 課題と効果（AIが生成） =====
  const script6 = `${bestCase.companyName}様では、「${bestCase.challenge}」という課題をお持ちでした。

具体的には、
・複数のシステムやExcelからデータを手作業で集約
・レポート作成に毎月数十時間の工数
・リアルタイムでの経営数字の把握が困難
・部門間でのデータの整合性が取れない
といった状況でした。

${config.productName}を導入されたことで、
・データの自動連携により集約作業がゼロに
・${bestCase.result}
・経営ダッシュボードでリアルタイムにKPIを可視化
・全社で同じデータを見ながら意思決定が可能に
という成果を達成されています。

${companyName}様でも、同様の課題をお感じでしたら、具体的な改善シナリオをご提案できます。

よろしければ、${config.meetingDuration}程度のオンラインデモで、実際の画面をお見せしながらご説明させていただけませんでしょうか？`;

  // 日程調整トーク
  const scheduleScript = `ありがとうございます！

それでは、${config.meetingDuration}のお打ち合わせということで、来週のご都合はいかがでしょうか？
例えば、○月○日（火）の14時〜、または○月○日（木）の15時〜はいかがでしょうか？

当日は私と弊社のソリューションコンサルタントで対応させていただきます。

事前に御社の状況を把握した上でデモを準備したいので、
・現在お使いのデータ分析ツール
・ご参加予定人数
・メールアドレス
をお教えいただけますでしょうか？`;

  const agendaText = config.meetingAgenda && config.meetingAgenda.length > 0
    ? config.meetingAgenda.map((item, i) => `・${item}`).join('\n')
    : `・製品紹介（15分）\n・デモ（30分）\n・質疑応答（15分）`;

  const appointmentConfirmScript = `ありがとうございます！

○月○日（○曜日）○時〜の${config.meetingDuration}で確定させていただきます。
本日中にカレンダー招待をお送りいたします。

当日のアジェンダとしては、
${agendaText}
を予定しております。

当日は、${companyName}様の課題解決に向けた具体的なご提案をさせていただきます。
本日はお時間いただきありがとうございました。`;

  // 反論ノード生成
  const objectionNodes: TalkNode[] = config.objectionHandlers.map((handler) => ({
    id: `objection-${handler.type}`,
    type: 'objection',
    label: handler.label,
    script: handler.response,
    tips: handler.followUp,
    children: {
      yes: {
        id: `objection-${handler.type}-recover`,
        type: 'demo',
        label: '日程調整へ',
        script: scheduleScript,
        children: {
          yes: {
            id: `objection-${handler.type}-schedule`,
            type: 'schedule',
            label: 'アポ確定',
            script: appointmentConfirmScript,
          },
        },
      },
      no: {
        id: `objection-${handler.type}-end`,
        type: 'no',
        label: '再度お断り',
        script: `承知いたしました。

${companyName}様のタイミングが合いましたら、ぜひまたお声がけください。
本日はお忙しい中、お時間いただきありがとうございました。`,
      },
    },
  }));

  // ===== メインツリー（①→②→③→④→⑤→⑥の直線フロー） =====
  const tree: TalkNode = {
    id: 'step1',
    type: 'start',
    label: '① 冒頭挨拶',
    script: script1,
    tips: `明るくハキハキと。社名は「${config.productNameKana || config.productName}」と伝える`,
    children: {
      yes: {
        id: 'step2',
        type: 'yes',
        label: '② 記事拝見',
        script: script2,
        tips: topNews ? `参照記事: ${topNews.source}` : '事前にニュースをチェック',
        children: {
          yes: {
            id: 'step3',
            type: 'yes',
            label: '③ 製品紹介',
            script: script3,
            tips: '簡潔に。特徴を伝える',
            children: {
              yes: {
                id: 'step4',
                type: 'yes',
                label: '④ 記事の特徴',
                script: script4,
                tips: '相手の取り組みを褒める。共感を示す',
                children: {
                  yes: {
                    id: 'step5',
                    type: 'case',
                    label: '⑤ 類似企業',
                    script: script5,
                    tips: '同業他社の導入実績で信頼感を与える',
                    children: {
                      yes: {
                        id: 'step6',
                        type: 'demo',
                        label: '⑥ 課題と効果',
                        script: script6,
                        tips: '具体的な成果数字を強調。最後に日程提案',
                        children: {
                          yes: {
                            id: 'schedule',
                            type: 'schedule',
                            label: '日程調整',
                            script: scheduleScript,
                            tips: '具体的な日程を2つ提示',
                            children: {
                              yes: {
                                id: 'appointment',
                                type: 'yes',
                                label: 'アポ確定',
                                script: appointmentConfirmScript,
                                tips: '当日中にカレンダー招待を送付',
                              },
                            },
                          },
                          no: {
                            id: 'objection-start',
                            type: 'no',
                            label: 'お断り',
                            script: `そうでしたか。

差し支えなければ、どのような点でご検討が難しいでしょうか？`,
                            tips: 'お断りの理由を聞き出し、適切な切り返しへ',
                            children: {
                              objections: objectionNodes,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  // 業界にマッチした事例を取得
  const matchedCases = getMatchedCases(caseStudies, estimatedIndustry);

  const companyInfo: CompanyInfo = {
    name: companyName,
    estimatedIndustry: estimatedIndustry as any,
    news: news || [],
  };

  return { tree, matchedCases, companyInfo };
}

function getDefaultCase(productName: string): CaseStudy {
  return {
    id: 'default',
    companyName: '導入企業',
    industry: 'その他',
    challenge: 'データ活用に課題があった',
    solution: productName + 'を導入',
    result: '業務効率化を実現',
    url: '',
  };
}

function estimateIndustryFromName(companyName: string, targetIndustries: string[]): string {
  const industryKeywords: Record<string, string[]> = {
    '通信': ['通信', 'テレコム', 'ソフトバンク', 'KDDI', 'NTT', 'ドコモ', '楽天モバイル'],
    'IT': ['IT', 'システム', 'ソフトウェア', 'テクノロジー', 'データ', 'AI', 'クラウド'],
    '製造': ['製造', 'メーカー', '自動車', '電機', '機械', 'トヨタ', 'ホンダ', 'パナソニック', 'ソニー'],
    '金融': ['銀行', '証券', '保険', '金融', 'ファイナンス', 'UFJ', 'みずほ', '三井住友'],
    '小売': ['小売', '流通', '百貨店', 'コンビニ', 'スーパー', 'イオン', 'セブン', 'ユニクロ'],
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    for (const keyword of keywords) {
      if (companyName.includes(keyword)) {
        return industry;
      }
    }
  }

  return targetIndustries[0] || 'その他';
}

function getNewsFeature(title: string): string {
  if (title.includes('DX') || title.includes('デジタル')) {
    return 'デジタルトランスフォーメーションに積極的に取り組まれている';
  } else if (title.includes('データ') || title.includes('AI')) {
    return 'データ活用・AI導入を推進されている';
  } else if (title.includes('中期') || title.includes('経営')) {
    return '中期経営計画でデータドリブン経営を掲げていらっしゃる';
  } else if (title.includes('クラウド') || title.includes('システム')) {
    return 'システムのクラウド化・刷新を進めていらっしゃる';
  }
  return '業務効率化やデータ活用に力を入れていらっしゃる';
}

function getMatchedCases(caseStudies: CaseStudy[], industry: string): CaseStudy[] {
  // 同じ業界の事例を優先
  const matched = caseStudies.filter(c => c.industry === industry);
  const others = caseStudies.filter(c => c.industry !== industry);
  return [...matched, ...others].slice(0, 3);
}
