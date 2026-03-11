import { TalkNode, IndustryCategory, GenerateTreeResponse, CompanyInfo, NewsItem } from '@/types';
import { estimateIndustry, getMatchedCases, getBestMatchCase, getIndustryLabel } from './industryMatcher';
import { objectionHandlers } from '@/data/caseStudies';

function replaceTemplateVars(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

export function generateTalkTree(companyName: string, news?: NewsItem[]): GenerateTreeResponse {
  const industry = estimateIndustry(companyName);
  const matchedCases = getMatchedCases(industry, 3);
  const bestCase = getBestMatchCase(industry);
  const secondCase = matchedCases[1] || matchedCases[0];
  const industryLabel = getIndustryLabel(industry);

  // ニュースから最も関連度の高い記事を取得
  const topNews = news && news.length > 0 ? news[0] : null;
  const secondNews = news && news.length > 1 ? news[1] : null;

  const templateVars = {
    companyName,
    industry: industryLabel,
    caseCompany: bestCase.companyName,
    caseResult: bestCase.result,
    caseChallenge: bestCase.challenge,
  };

  // ===== ① 冒頭挨拶（固定） =====
  const script1 = `お世話になっております。
DOMO株式会社の○○と申します。`;

  // ===== ② 記事拝見トーク（AIが生成） =====
  const script2 = topNews
    ? `先日、「${topNews.title}」という記事を拝見いたしまして、お電話させていただきました。`
    : `${companyName}様のDX推進に関する取り組みを拝見いたしまして、お電話させていただきました。`;

  // ===== ③ DOMOの紹介（AIが生成） =====
  const script3 = `DOMOは、アメリカのユタ州に本社がございまして、データ活用のクラウドプラットフォームを提供しております。

Fortune 500企業の半数以上、日本でも${industryLabel}を中心に多くの企業様にご導入いただいております。`;

  // ===== ④ 記事の特徴を要約（AIが生成） =====
  const script4 = topNews
    ? `記事を拝見する中で、${companyName}様が${
        topNews.title.includes('DX') || topNews.title.includes('デジタル')
          ? 'デジタルトランスフォーメーションに積極的に取り組まれている'
          : topNews.title.includes('データ') || topNews.title.includes('AI')
          ? 'データ活用・AI導入を推進されている'
          : topNews.title.includes('中期') || topNews.title.includes('経営')
          ? '中期経営計画でデータドリブン経営を掲げていらっしゃる'
          : topNews.title.includes('クラウド') || topNews.title.includes('システム')
          ? 'システムのクラウド化・刷新を進めていらっしゃる'
          : '業務効率化やデータ活用に力を入れていらっしゃる'
      }という印象を受けました。

${secondNews ? `また、「${secondNews.title}」という記事からも、データを活用した意思決定の重要性を認識されていると感じております。` : ''}`
    : `${companyName}様は${industryLabel}のリーディングカンパニーとして、データ活用や業務効率化に積極的に取り組まれていると伺っております。`;

  // ===== ⑤ 類似企業を名乗る（AIが生成） =====
  const script5 = `弊社、丁度直近で${industryLabel}の「${bestCase.companyName}」様、「${secondCase.companyName}」様にご導入いただいております。`;

  // ===== ⑥ 課題とDOMOの効果（AIが生成） =====
  const script6 = `${bestCase.companyName}様では、「${bestCase.challenge}」という課題をお持ちでした。

具体的には、
・複数のシステムやExcelからデータを手作業で集約
・レポート作成に毎月数十時間の工数
・リアルタイムでの経営数字の把握が困難
・部門間でのデータの整合性が取れない
といった状況でした。

DOMOを導入されたことで、
・データの自動連携により集約作業がゼロに
・${bestCase.result}
・経営ダッシュボードでリアルタイムにKPIを可視化
・全社で同じデータを見ながら意思決定が可能に
という成果を達成されています。

${companyName}様でも、同様の課題をお感じでしたら、具体的な改善シナリオをご提案できます。

よろしければ、1時間程度のオンラインデモで、実際の画面をお見せしながらご説明させていただけませんでしょうか？`;

  // 日程調整トーク
  const scheduleScript = `ありがとうございます！

それでは、1時間のお打ち合わせということで、来週のご都合はいかがでしょうか？
例えば、○月○日（火）の14時〜15時、または○月○日（木）の15時〜16時はいかがでしょうか？

当日は私と弊社のソリューションコンサルタントで対応させていただきます。

事前に御社の状況を把握した上でデモを準備したいので、
・現在お使いのデータ分析ツール
・ご参加予定人数
・メールアドレス
をお教えいただけますでしょうか？`;

  const appointmentConfirmScript = `ありがとうございます！

○月○日（○曜日）○時〜○時の1時間で確定させていただきます。
本日中にカレンダー招待をお送りいたします。

当日のアジェンダとしては、
・DOMO製品のご紹介（15分）
・${companyName}様の課題に合わせたデモ（30分）
・質疑応答・ディスカッション（15分）
を予定しております。

当日は、${companyName}様の課題解決に向けた具体的なご提案をさせていただきます。
本日はお時間いただきありがとうございました。`;

  // 反論ノード生成
  const objectionNodes: TalkNode[] = objectionHandlers.map((handler) => ({
    id: `objection-${handler.type}`,
    type: 'objection',
    label: handler.label,
    script: replaceTemplateVars(handler.response, { ...templateVars, companyName: bestCase.companyName }),
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
    tips: '明るくハキハキと。社名は「ドーモ」と伝える',
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
            label: '③ DOMO紹介',
            script: script3,
            tips: '簡潔に。アメリカ発のグローバル企業であることを伝える',
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

  const companyInfo: CompanyInfo = {
    name: companyName,
    estimatedIndustry: industry,
    news: news || [],
  };

  return { tree, matchedCases, companyInfo };
}
