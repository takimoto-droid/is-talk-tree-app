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

  const topNews = news.length > 0 ? news[0] : null;
  const secondNews = news.length > 1 ? news[1] : null;

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
      content: `${config.productName}は、${config.headquarters ? config.headquarters + 'に本社がございまして、' : ''}${config.productDescription}を提供しております。

${config.targetIndustries.length > 0 ? config.targetIndustries.slice(0, 3).join('、') + 'を中心に' : ''}多くの企業様にご導入いただいております。`,
      tip: '簡潔に。特徴を伝える',
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
        ? `弊社、丁度直近で「${bestCase.companyName}」様、「${secondCase.companyName}」様にご導入いただいております。`
        : config.caseStudies.length === 1
        ? `弊社、直近で「${bestCase.companyName}」様にご導入いただいております。`
        : `弊社、多くの企業様にご導入いただいております。`,
      tip: '同業他社の導入実績で信頼感を与える',
    },
    {
      step: 6,
      title: '課題と効果',
      content: `${bestCase.companyName}様では、「${bestCase.challenge}」という課題をお持ちでした。

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

よろしければ、${config.meetingDuration}程度のオンラインデモで、実際の画面をお見せしながらご説明させていただけませんでしょうか？`,
      tip: '具体的な成果数字を強調。Before/Afterを明確に。最後に日程提案',
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
