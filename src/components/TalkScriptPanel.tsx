'use client';

import { useState } from 'react';
import { NewsItem, CaseStudy, ProjectConfig } from '@/types';

interface TalkScriptPanelProps {
  companyName: string;
  industry: string;
  news: NewsItem[];
  bestCase: CaseStudy;
  secondCase: CaseStudy;
  config: ProjectConfig;
}

export default function TalkScriptPanel({ companyName, industry, news, bestCase, secondCase, config }: TalkScriptPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const topNews = news && news.length > 0 ? news[0] : null;
  const secondNews = news && news.length > 1 ? news[1] : null;

  // デフォルトのケーススタディ
  const defaultCase = {
    id: 'default',
    companyName: '導入企業',
    industry: 'その他',
    challenge: 'データ活用に課題があった',
    solution: config.productName + 'を導入',
    result: '業務効率化を実現',
    url: '',
    companyFeatures: '',
    mainFeatures: '',
    competitors: '',
  };

  const safebestCase = bestCase || defaultCase;
  const safesecondCase = secondCase || bestCase || defaultCase;

  // ニュースの特徴を分析
  const getNewsFeature = () => {
    if (!topNews) return '業務効率化やデータ活用に力を入れていらっしゃる';

    const title = topNews.title;
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
  };

  // 業界に応じたカスタマイズされた製品紹介を生成
  const getCustomizedProductIntro = () => {
    const mainFeatures = config.keyFeatures[0] || '';
    const industryLower = industry.toLowerCase();

    // 業界別のカスタマイズポイント
    let industrySpecificIntro = '';
    let relevantFeatures = '';

    if (industryLower.includes('通信') || industryLower.includes('it') || industryLower.includes('テクノロジー')) {
      industrySpecificIntro = `${companyName}様のような通信・IT業界では、膨大なデータをリアルタイムで分析し、迅速な意思決定を行うことが競争力の源泉となっています。`;
      relevantFeatures = '1,000種類以上のコネクターによる多様なデータソースとの連携、リアルタイムダッシュボード、AI機能による高度分析';
    } else if (industryLower.includes('製造') || industryLower.includes('メーカー') || industryLower.includes('電機') || industryLower.includes('家電')) {
      industrySpecificIntro = `${companyName}様のような製造業では、品質管理・生産効率・サプライチェーンのデータを横断的に分析することが重要です。`;
      relevantFeatures = '工場・生産ラインのデータ連携、品質監査の効率化、リアルタイムKPI可視化による迅速な問題検知';
    } else if (industryLower.includes('金融') || industryLower.includes('銀行') || industryLower.includes('証券') || industryLower.includes('保険')) {
      industrySpecificIntro = `${companyName}様のような金融業界では、厳格なセキュリティ要件を満たしながら、顧客データの分析と迅速な意思決定が求められます。`;
      relevantFeatures = 'SOC2 Type II、ISO27001対応のセキュリティ、細粒度アクセス権限管理、顧客行動分析';
    } else if (industryLower.includes('小売') || industryLower.includes('流通') || industryLower.includes('スーパー')) {
      industrySpecificIntro = `${companyName}様のような小売・流通業界では、店舗運営・在庫管理・顧客分析のデータを一元化することが競争優位につながります。`;
      relevantFeatures = '店舗横断のリアルタイムデータ可視化、需要予測、顧客行動分析';
    } else if (industryLower.includes('物流') || industryLower.includes('ロジスティクス')) {
      industrySpecificIntro = `${companyName}様のような物流業界では、配送効率・コスト管理・顧客への情報提供の高度化が重要課題です。`;
      relevantFeatures = '配送状況のリアルタイム可視化、コスト分析、顧客向けレポートの自動生成';
    } else if (industryLower.includes('メディア') || industryLower.includes('広告') || industryLower.includes('出版')) {
      industrySpecificIntro = `${companyName}様のようなメディア・広告業界では、コンテンツパフォーマンスと顧客エンゲージメントのリアルタイム把握が重要です。`;
      relevantFeatures = 'エンゲージメント分析、広告効果測定、コンテンツ施策への即時反映';
    } else if (industryLower.includes('不動産') || industryLower.includes('建設') || industryLower.includes('住宅')) {
      industrySpecificIntro = `${companyName}様のような不動産・建設業界では、プロジェクト管理と顧客購買サイクルの可視化が経営効率化の鍵となります。`;
      relevantFeatures = '財務・非財務データの統合、エリア別経営ダッシュボード、購買サイクル分析';
    } else if (industryLower.includes('旅行') || industryLower.includes('観光') || industryLower.includes('ホテル')) {
      industrySpecificIntro = `${companyName}様のような旅行・観光業界では、商材横断での売上把握と需要予測が重要です。`;
      relevantFeatures = '商材横断のリアルタイム売上可視化、予約状況分析、需要予測';
    } else {
      industrySpecificIntro = `${companyName}様の${industry}業界でも、データ活用による意思決定の高速化と業務効率化のニーズが高まっています。`;
      relevantFeatures = 'データ連携・統合、ダッシュボード可視化、AI分析機能';
    }

    return {
      intro: industrySpecificIntro,
      features: relevantFeatures,
      fullText: `${config.productName}は、${config.headquarters ? config.headquarters + 'に本社を置く' : ''}ビジネスインテリジェンスプラットフォームです。

${industrySpecificIntro}

${config.productName}の特徴として、
・${relevantFeatures}
がございます。

現在、世界2,500社以上、日本ではNTTグループ、大手金融機関、製造業など幅広い業種で採用が進んでおります。`
    };
  };

  const customProductIntro = getCustomizedProductIntro();

  const scripts = [
    {
      step: 1,
      title: '冒頭挨拶',
      content: `お世話になっております。
${config.companyName}の○○と申します。`,
      tip: `明るくハキハキと。社名は「${config.productNameKana || config.productName}」と伝える`,
    },
    {
      step: 2,
      title: '記事拝見',
      content: topNews
        ? `先日、「${topNews.title}」という記事を拝見いたしまして、お電話させていただきました。`
        : `${companyName}様のDX推進に関する取り組みを拝見いたしまして、お電話させていただきました。`,
      tip: topNews ? `出典: ${topNews.source}` : '事前にニュースをチェック',
    },
    {
      step: 3,
      title: '製品紹介',
      content: customProductIntro.fullText,
      tip: `${industry}業界向けにカスタマイズ。関連する特徴: ${customProductIntro.features}`,
    },
    {
      step: 4,
      title: '記事の特徴を要約',
      content: topNews
        ? `記事を拝見する中で、${companyName}様が${getNewsFeature()}という印象を受けました。${secondNews ? `

また、「${secondNews.title}」という記事からも、データを活用した意思決定の重要性を認識されていると感じております。` : ''}`
        : `${companyName}様は${industry}のリーディングカンパニーとして、データ活用や業務効率化に積極的に取り組まれていると伺っております。`,
      tip: '相手の取り組みを褒める。共感を示す',
    },
    {
      step: 5,
      title: '類似企業を名乗る',
      content: config.caseStudies.length >= 2
        ? `弊社、丁度直近で「${safebestCase.companyName}」様、「${safesecondCase.companyName}」様にご導入いただいております。${safebestCase.companyFeatures ? `\n\n${safebestCase.companyName}様は${safebestCase.companyFeatures}という特徴がある企業様です。` : ''}`
        : config.caseStudies.length === 1
        ? `弊社、直近で「${safebestCase.companyName}」様にご導入いただいております。${safebestCase.companyFeatures ? `\n\n${safebestCase.companyName}様は${safebestCase.companyFeatures}という特徴がある企業様です。` : ''}`
        : `弊社、多くの企業様にご導入いただいております。`,
      tip: '同業他社の導入実績で信頼感を与える' + (safebestCase.competitors ? `\n競合情報: ${safebestCase.competitors}` : ''),
    },
    {
      step: 6,
      title: '課題と効果',
      content: `${safebestCase.companyName}様（${safebestCase.industry}）では、以下のような取り組みをされています。

${safebestCase.challenge || safebestCase.result}

${companyName}様も${industry}として、同様の課題をお感じではないでしょうか。

${config.productName}を導入いただくことで、
・データの自動連携・統合によるレポート作成工数の大幅削減
・リアルタイムダッシュボードによる経営数字の即時把握
・部門横断でのデータ活用と意思決定の迅速化
を実現できます。

よろしければ、${config.meetingDuration}程度のオンラインデモで、${companyName}様の業界に近い活用事例をお見せしながらご説明させていただけませんでしょうか？`,
      tip: `参照事例: ${safebestCase.companyName}（${safebestCase.industry}）。具体的な成果を強調し、日程提案へ`,
    },
  ];

  return (
    <div className="script-panel animate-in">
      {/* ヘッダー */}
      <div className="script-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="script-header-left">
          <div className="script-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <h3 className="script-title">トークスクリプト</h3>
            <p className="script-subtitle">①〜⑥ 日程提案までの流れ</p>
          </div>
        </div>
        <div className="script-header-right">
          <div className={`script-toggle ${isOpen ? 'open' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* スクリプト本文 */}
      <div className={`script-content ${isOpen ? 'open' : ''}`}>
        <div className="script-list">
          {scripts.map((script, index) => (
            <div key={script.step} className="script-item">
              <div className="script-item-number">{script.step}</div>
              <div className="script-item-main">
                <div className="script-item-header">
                  <span className="script-step-title">{script.title}</span>
                </div>
                <div className="script-item-body">
                  {script.content}
                </div>
                <div className="script-item-tip">
                  <span className="script-tip-label">TIP</span>
                  {script.tip}
                </div>
              </div>
              {index < scripts.length - 1 && (
                <div className="script-item-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M19 12l-7 7-7-7"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
