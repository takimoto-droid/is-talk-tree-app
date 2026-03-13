import { TalkNode, GenerateTreeResponse, CompanyInfo, NewsItem, ProjectConfig, CaseStudy } from '@/types';

export function generateTalkTree(
  companyName: string,
  config: ProjectConfig,
  news?: NewsItem[]
): GenerateTreeResponse {
  const caseStudies = config.caseStudies;

  // 業界を推定
  const estimatedIndustry = estimateIndustryFromName(companyName, config.targetIndustries);

  // 業界にマッチした事例を取得（改善版）
  const matchedCases = getMatchedCasesByIndustry(caseStudies, estimatedIndustry, companyName);

  // マッチした事例から最適なケースを選択
  const bestCase = matchedCases[0] || getDefaultCase(config.productName);
  const secondCase = matchedCases[1] || matchedCases[0] || getDefaultCase(config.productName);

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
  const companyFeatureText = bestCase.companyFeatures
    ? `\n\n${bestCase.companyName}様は${bestCase.companyFeatures}という特徴がある企業様です。`
    : '';
  const script5 = caseStudies.length >= 2
    ? `弊社、丁度直近で「${bestCase.companyName}」様、「${secondCase.companyName}」様にご導入いただいております。${companyFeatureText}`
    : caseStudies.length === 1
    ? `弊社、直近で「${bestCase.companyName}」様にご導入いただいております。${companyFeatureText}`
    : `弊社、多くの企業様にご導入いただいております。`;

  // ===== ⑥ 課題と効果（AIが生成） =====
  const mainFeaturesText = bestCase.mainFeatures
    ? `\n【${config.productName}の主な特徴】\n${bestCase.mainFeatures}\n`
    : '';
  const script6 = `${bestCase.companyName}様では、「${bestCase.challenge}」という課題をお持ちでした。

具体的には、
・複数のシステムやExcelからデータを手作業で集約
・レポート作成に毎月数十時間の工数
・リアルタイムでの経営数字の把握が困難
・部門間でのデータの整合性が取れない
といった状況でした。

${config.productName}を導入されたことで、${mainFeaturesText}
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
  const name = companyName.toLowerCase();

  // 業界キーワードマッピング（より詳細に）
  const industryKeywords: Record<string, string[]> = {
    '通信・テクノロジー': ['通信', 'テレコム', 'ソフトバンク', 'kddi', 'ntt', 'ドコモ', 'docomo', '楽天モバイル', 'au', 'モバイル', 'テクノロジー', 'テック'],
    '通信': ['通信', 'テレコム', 'ソフトバンク', 'kddi', 'ntt', 'ドコモ', 'docomo', '楽天モバイル', 'au', 'モバイル'],
    'IT・ソフトウェア': ['it', 'システム', 'ソフトウェア', 'データ', 'ai', 'クラウド', 'デジタル', 'web', 'インターネット', 'サイバー'],
    'ITサービス': ['itサービス', 'システム', 'ソフトウェア', 'ソリューション', 'インテグレーター', 'si'],
    '製造・家電': ['パナソニック', 'panasonic', 'ソニー', 'sony', 'シャープ', 'sharp', '日立', 'hitachi', '東芝', 'toshiba', '家電', '電機', '電気'],
    '製造': ['製造', 'メーカー', '自動車', '機械', 'トヨタ', 'toyota', 'ホンダ', 'honda', '工業', '重工', '電子', '部品', 'オムロン'],
    '金融': ['銀行', '証券', '保険', '金融', 'ファイナンス', 'ufj', 'みずほ', '三井住友', 'smbc', '信託', 'リース', 'カード', '投資', 'キャピタル', '野村', 'nomura'],
    '小売・流通': ['小売', '流通', '百貨店', 'コンビニ', 'スーパー', 'イオン', 'セブン', 'ユニクロ', 'アマゾン', 'amazon', '楽天', 'ec', '通販', 'ストア', 'マート'],
    'コンサルティング': ['コンサル', 'コンサルティング', '総研', '研究所', 'シンクタンク', 'アクセンチュア', 'デロイト', 'pwc', 'マッキンゼー', 'nri', '野村総研', '野村総合研究所'],
    'メディア・広告': ['メディア', '広告', '放送', '出版', 'テレビ', 'tv', '新聞', 'ニュース', 'エンターテイメント', 'エンタメ', '電通', '博報堂'],
    '不動産・建設': ['不動産', '建設', '住宅', 'ディベロッパー', '建築', 'ハウス', 'ホーム', '地所'],
    '物流': ['物流', 'ロジスティクス', '運送', '運輸', '倉庫', '配送', 'ヤマト', '佐川', '日通'],
    '旅行・観光': ['旅行', '観光', 'トラベル', 'ツーリズム', 'jtb', 'his', 'ホテル', '航空', 'ana', 'jal'],
    '医療・ヘルスケア': ['医療', '製薬', 'ヘルスケア', '病院', '薬', 'ファーマ', 'バイオ', 'メディカル'],
    'サービス': ['サービス', '人材', '飲食', 'フード', 'レストラン', 'リクルート'],
  };

  // 最初にマッチした業界を返す
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    for (const keyword of keywords) {
      if (name.includes(keyword.toLowerCase())) {
        return industry;
      }
    }
  }

  // targetIndustriesがExcelから読み込まれた業界リストの場合、最初のものを返す
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

// 業界マッチングの類似度を計算（改善版）
function calculateIndustrySimilarity(caseIndustry: string, targetIndustry: string): number {
  if (!caseIndustry || !targetIndustry) return 0;

  const caseInd = caseIndustry.toLowerCase();
  const targetInd = targetIndustry.toLowerCase();

  // 完全一致
  if (caseInd === targetInd) return 100;

  // 業界の正規化マッピング（Excel の業界名と推定業界の対応表）
  const industryNormalization: Record<string, string[]> = {
    '通信・テクノロジー': ['通信', 'テクノロジー', 'it', 'テック', 'デジタル'],
    'itサービス': ['it', 'システム', 'ソフトウェア', 'ソリューション'],
    '製造・家電': ['製造', '家電', '電機', 'エレクトロニクス'],
    '小売・流通': ['小売', '流通', 'リテール'],
    'メディア・広告': ['メディア', '広告', 'マーケティング'],
    '不動産・建設': ['不動産', '建設', '住宅'],
    '旅行・観光': ['旅行', '観光', 'ホテル', 'トラベル'],
    '医療・ヘルスケア': ['医療', 'ヘルスケア', '製薬', 'バイオ'],
    'コンサルティング': ['コンサル', 'コンサルティング', '総研'],
  };

  // 正規化によるマッチング
  for (const [normalizedIndustry, aliases] of Object.entries(industryNormalization)) {
    const caseMatch = caseInd.includes(normalizedIndustry) || aliases.some(a => caseInd.includes(a));
    const targetMatch = targetInd.includes(normalizedIndustry) || aliases.some(a => targetInd.includes(a));

    if (caseMatch && targetMatch) {
      return 90;
    }
  }

  // 部分一致（どちらかが他方を含む）
  if (caseInd.includes(targetInd) || targetInd.includes(caseInd)) return 80;

  // 業界グループによるマッチング（類似業界同士）
  const industryGroups: Record<string, string[]> = {
    '通信・IT系': ['通信', 'it', 'テクノロジー', 'ソフトウェア', 'システム', 'デジタル', 'インターネット', 'web', 'クラウド', 'itサービス', 'テック'],
    '製造系': ['製造', 'メーカー', '電機', '機械', '自動車', '工業', 'エレクトロニクス', '電子', '部品', '家電'],
    '金融系': ['金融', '銀行', '証券', '保険', 'ファイナンス', '投資', 'リース', 'カード'],
    '小売・流通系': ['小売', '流通', '百貨店', 'スーパー', 'コンビニ', 'ec', 'eコマース', '通販', 'リテール'],
    'コンサル系': ['コンサル', 'コンサルティング', '総研', '研究所', 'シンクタンク'],
    'メディア系': ['メディア', '広告', '放送', '出版', 'エンターテイメント', '映像', 'マーケティング'],
    '不動産系': ['不動産', '建設', '住宅', 'ディベロッパー', '建築'],
    '物流系': ['物流', 'ロジスティクス', '運送', '運輸', '配送'],
    '旅行系': ['旅行', '観光', 'ホテル', 'トラベル', 'ツーリズム'],
    '医療系': ['医療', '製薬', 'ヘルスケア', '病院', '薬', 'バイオ'],
    'サービス系': ['サービス', '人材', '飲食', 'フード'],
  };

  // 両方の業界が同じグループに属しているかチェック
  for (const [group, keywords] of Object.entries(industryGroups)) {
    const caseInGroup = keywords.some(kw => caseInd.includes(kw));
    const targetInGroup = keywords.some(kw => targetInd.includes(kw));

    if (caseInGroup && targetInGroup) {
      return 70;
    }
  }

  // キーワード部分一致
  const caseWords = caseInd.split(/[・\s\/\-]/);
  const targetWords = targetInd.split(/[・\s\/\-]/);

  for (const cw of caseWords) {
    for (const tw of targetWords) {
      if (cw.length > 1 && tw.length > 1 && (cw.includes(tw) || tw.includes(cw))) {
        return 50;
      }
    }
  }

  return 0;
}

// 企業名からの類似度を計算
function calculateCompanySimilarity(caseCompanyName: string, targetCompanyName: string): number {
  if (!caseCompanyName || !targetCompanyName) return 0;

  const caseName = caseCompanyName.toLowerCase();
  const targetName = targetCompanyName.toLowerCase();

  // 同じ企業名の場合は除外（自社は参照しない）
  if (caseName === targetName) return -100;

  // 企業グループキーワード
  const companyGroups: string[][] = [
    ['ソフトバンク', 'yahoo', 'ヤフー', 'line', 'ライン', 'paypay'],
    ['ntt', 'ドコモ', 'docomo', 'データ', 'コミュニケーションズ'],
    ['kddi', 'au', 'jcom'],
    ['楽天', 'rakuten'],
    ['トヨタ', 'toyota', 'レクサス', 'デンソー'],
    ['ホンダ', 'honda', 'アキュラ'],
    ['ソニー', 'sony', 'プレイステーション'],
    ['パナソニック', 'panasonic', 'ナショナル'],
    ['三菱', 'mitsubishi'],
    ['三井', 'mitsui'],
    ['住友', 'sumitomo'],
    ['日立', 'hitachi'],
  ];

  // 同じ企業グループに属しているか
  for (const group of companyGroups) {
    const caseInGroup = group.some(kw => caseName.includes(kw.toLowerCase()));
    const targetInGroup = group.some(kw => targetName.includes(kw.toLowerCase()));

    if (caseInGroup && targetInGroup) {
      return 30; // 同じグループは少し加点
    }
  }

  return 0;
}

// 業界に基づいて類似事例を取得（改善版）
function getMatchedCasesByIndustry(
  caseStudies: CaseStudy[],
  estimatedIndustry: string,
  companyName: string
): CaseStudy[] {
  if (!caseStudies || caseStudies.length === 0) {
    return [];
  }

  // 各事例のスコアを計算
  const scoredCases = caseStudies.map(caseStudy => {
    const industryScore = calculateIndustrySimilarity(caseStudy.industry, estimatedIndustry);
    const companyScore = calculateCompanySimilarity(caseStudy.companyName, companyName);
    const totalScore = industryScore + companyScore;

    return {
      caseStudy,
      score: totalScore,
      industryScore,
      companyScore,
    };
  });

  // スコアでソート（高い順）、同スコアの場合は元の順序を維持
  scoredCases.sort((a, b) => b.score - a.score);

  // デバッグログ
  console.log('=== Industry Matching Debug ===');
  console.log('Search company:', companyName);
  console.log('Estimated industry:', estimatedIndustry);
  console.log('Total case studies:', caseStudies.length);
  console.log('Top matches:', scoredCases.slice(0, 5).map(s => ({
    company: s.caseStudy.companyName,
    caseIndustry: s.caseStudy.industry,
    industryScore: s.industryScore,
    companyScore: s.companyScore,
    totalScore: s.score,
  })));

  // スコアが0より大きい事例を優先、なければスコア0も含める（最大5件）
  const highScoreCases = scoredCases.filter(s => s.score > 0);

  if (highScoreCases.length >= 2) {
    return highScoreCases.slice(0, 5).map(s => s.caseStudy);
  }

  // スコアが高いものが2件未満の場合、同じ業界グループから補完
  return scoredCases
    .filter(s => s.score >= 0)
    .slice(0, 5)
    .map(s => s.caseStudy);
}
