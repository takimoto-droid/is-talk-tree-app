'use client';

import { useState, useCallback } from 'react';
import { TalkNode, CaseStudy, GenerateTreeResponse, NewsItem, TechItem, GeneratedScript, GeneratedRedirect, RecommendedCompany } from '@/types';
import { generateTalkTree } from '@/lib/treeGenerator';
import { useProject } from '@/context/ProjectContext';
import ProjectSetup from '@/components/ProjectSetup';
import CompanyInput from '@/components/CompanyInput';
import TalkTree from '@/components/TalkTree';
import TalkScriptPanel from '@/components/TalkScriptPanel';
import NewsPanel from '@/components/NewsPanel';
import CasePanel from '@/components/CasePanel';
import TechStackPanel from '@/components/TechStackPanel';
import RecommendedCompanies from '@/components/RecommendedCompanies';

export default function Home() {
  const { config, isConfigured, reset: resetProject } = useProject();
  const [isLoading, setIsLoading] = useState(false);
  const [treeData, setTreeData] = useState<GenerateTreeResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<TalkNode | null>(null);
  const [techStack, setTechStack] = useState<TechItem[]>([]);
  const [techSource, setTechSource] = useState<string>('');
  const [techLoading, setTechLoading] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [aiCases, setAiCases] = useState<CaseStudy[]>([]);
  const [aiCasesLoading, setAiCasesLoading] = useState(false);
  const [aiScripts, setAiScripts] = useState<GeneratedScript[]>([]);
  const [aiScriptsLoading, setAiScriptsLoading] = useState(false);
  const [companyInsights, setCompanyInsights] = useState<string>('');
  const [aiRedirects, setAiRedirects] = useState<GeneratedRedirect[]>([]);
  const [aiRedirectsLoading, setAiRedirectsLoading] = useState(false);
  const slackUrl = 'https://app.slack.com/client/T041YUBTK6X/C09PDMPF3L7';

  // アポ取得・AI推薦
  const [appointmentSuccess, setAppointmentSuccess] = useState<string>('');
  const [recommendations, setRecommendations] = useState<RecommendedCompany[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendError, setRecommendError] = useState<string>('');
  const [appointmentSaving, setAppointmentSaving] = useState(false);

  const fetchNews = async (companyName: string): Promise<NewsItem[]> => {
    try {
      const response = await fetch(`/api/news?company=${encodeURIComponent(companyName)}`);
      if (!response.ok) throw new Error('News fetch failed');
      const data = await response.json();
      return data.news || [];
    } catch (error) {
      console.error('Failed to fetch news:', error);
      return [];
    }
  };

  const fetchAiScripts = async (
    companyName: string,
    industry: string,
    news: NewsItem[],
    bestCase: CaseStudy,
    secondCase?: CaseStudy
  ): Promise<void> => {
    if (!config) return;

    setAiScriptsLoading(true);
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          industry,
          news: news.map(n => ({ title: n.title, source: n.source, url: n.url })),
          bestCase: {
            companyName: bestCase.companyName,
            industry: bestCase.industry,
            challenge: bestCase.challenge,
            result: bestCase.result,
          },
          secondCase: secondCase ? {
            companyName: secondCase.companyName,
            industry: secondCase.industry,
            challenge: secondCase.challenge,
            result: secondCase.result,
          } : undefined,
          productName: config.productName,
          productDescription: config.productDescription,
          sellerCompanyName: config.companyName,
          meetingDuration: config.meetingDuration,
        }),
      });

      if (!response.ok) throw new Error('Script generation failed');
      const data = await response.json();

      if (data.scripts && data.scripts.length > 0) {
        setAiScripts(data.scripts);
      }
      if (data.companyInfo) {
        setCompanyInsights(data.companyInfo);
      }
    } catch (error) {
      console.error('Failed to fetch AI scripts:', error);
      setAiScripts([]);
    } finally {
      setAiScriptsLoading(false);
    }
  };

  const fetchAiRedirects = async (
    companyName: string,
    industry: string,
    bestCase: CaseStudy,
    secondCase?: CaseStudy,
    thirdCase?: CaseStudy,
    insights?: string
  ): Promise<void> => {
    if (!config) return;

    setAiRedirectsLoading(true);
    try {
      const response = await fetch('/api/generate-objections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          industry,
          productName: config.productName,
          productDescription: config.productDescription,
          bestCase: {
            companyName: bestCase.companyName,
            industry: bestCase.industry,
            challenge: bestCase.challenge,
            result: bestCase.result,
          },
          secondCase: secondCase ? {
            companyName: secondCase.companyName,
            industry: secondCase.industry,
            challenge: secondCase.challenge,
            result: secondCase.result,
          } : undefined,
          thirdCase: thirdCase ? {
            companyName: thirdCase.companyName,
            industry: thirdCase.industry,
            challenge: thirdCase.challenge,
            result: thirdCase.result,
          } : undefined,
          meetingDuration: config.meetingDuration,
          companyInsights: insights || '',
        }),
      });

      if (!response.ok) throw new Error('Redirect generation failed');
      const data = await response.json();

      if (data.redirectNodes && data.redirectNodes.length > 0) {
        setAiRedirects(data.redirectNodes);
      }
    } catch (error) {
      console.error('Failed to fetch AI redirects:', error);
      setAiRedirects([]);
    } finally {
      setAiRedirectsLoading(false);
    }
  };

  const fetchSimilarCases = async (companyName: string, industry: string, productName: string, caseStudies: CaseStudy[]): Promise<void> => {
    setAiCasesLoading(true);
    try {
      const response = await fetch('/api/similar-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyName,
          industry: industry,
          product: productName,
          caseStudies: caseStudies,
          enableWebSearch: true, // Web検索を有効化
        }),
      });
      if (!response.ok) throw new Error('Similar cases fetch failed');
      const data = await response.json();

      // APIレスポンスをCaseStudy形式に変換
      const cases: CaseStudy[] = (data.cases || []).map((c: any, idx: number) => ({
        id: `ai-case-${idx}`,
        companyName: c.companyName,
        industry: c.industry,
        challenge: c.challenge,
        solution: '',
        result: c.result,
        url: '',
        source: c.source,
      }));

      setAiCases(cases);
    } catch (error) {
      console.error('Failed to fetch similar cases:', error);
      setAiCases([]);
    } finally {
      setAiCasesLoading(false);
    }
  };

  const fetchTechStack = async (domain: string): Promise<void> => {
    if (!domain) return;

    setTechLoading(true);
    try {
      const response = await fetch(`/api/techstack?domain=${encodeURIComponent(domain)}`);
      if (!response.ok) throw new Error('TechStack fetch failed');
      const data = await response.json();
      setTechStack(data.technologies || []);
      setTechSource(data.source || '');
      setCurrentDomain(domain);
    } catch (error) {
      console.error('Failed to fetch tech stack:', error);
      setTechStack([]);
      setTechSource('error');
    } finally {
      setTechLoading(false);
    }
  };

  const handleGenerateTree = useCallback(async (companyName: string, domain?: string) => {
    if (!config) return;

    setIsLoading(true);
    setAiCases([]);
    setAiScripts([]);
    setCompanyInsights('');
    setAiRedirects([]);

    try {
      // ニュースを取得
      const news = await fetchNews(companyName);

      // トークツリーを生成
      const result = generateTalkTree(companyName, config, news);
      setTreeData(result);
      setSelectedNode(result.tree);

      // AIで類似企業の導入事例を検索
      const estimatedIndustry = result.companyInfo.estimatedIndustry || '';
      fetchSimilarCases(companyName, estimatedIndustry, config.productName, config.caseStudies);

      // AIでトークスクリプトを生成（企業情報も取得）
      const bestCase = result.matchedCases[0] || config.caseStudies[0];
      const secondCase = result.matchedCases[1] || config.caseStudies[1];
      const thirdCase = result.matchedCases[2] || config.caseStudies[2];
      if (bestCase) {
        // スクリプト生成（企業情報も取得される）
        fetchAiScripts(companyName, estimatedIndustry, news, bestCase, secondCase);

        // 「ちなみに」リダイレクトトークのAI生成
        fetchAiRedirects(companyName, estimatedIndustry, bestCase, secondCase, thirdCase, '');
      }

      // ドメインが指定されていれば技術スタックを取得
      if (domain) {
        fetchTechStack(domain);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const handleSelectNode = useCallback((node: TalkNode) => {
    setSelectedNode(node);
  }, []);

  const handleReset = useCallback(() => {
    setTreeData(null);
    setSelectedNode(null);
    setTechStack([]);
    setTechSource('');
    setCurrentDomain('');
    setAiCases([]);
    setAiScripts([]);
    setCompanyInsights('');
    setAiRedirects([]);
    setAppointmentSuccess('');
    setRecommendations([]);
    setRecommendError('');
  }, []);

  const handleChangeProject = useCallback(() => {
    setTreeData(null);
    setSelectedNode(null);
    resetProject();
  }, [resetProject]);

  const handleSelectCase = useCallback((caseStudy: CaseStudy) => {
    if (caseStudy.url) {
      window.open(caseStudy.url, '_blank');
    } else {
      alert(
        `【${caseStudy.companyName}】\n\n` +
        `業界: ${caseStudy.industry}\n\n` +
        `課題: ${caseStudy.challenge}\n\n` +
        `成果: ${caseStudy.result}`
      );
    }
  }, []);

  // アポ取得処理
  const handleAppointmentSuccess = useCallback(async () => {
    if (!treeData) return;

    const companyName = treeData.companyInfo.name;
    const industry = treeData.companyInfo.estimatedIndustry || '';

    setAppointmentSaving(true);
    setRecommendLoading(true);
    setRecommendError('');
    setRecommendations([]);

    try {
      // 1. アポ成功を保存
      const saveResponse = await fetch('/api/appointments/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          industry: industry,
          revenue: '',
          employees: '',
          memo: `トークツリー経由でアポ取得`,
        }),
      });

      setAppointmentSaving(false);

      if (saveResponse.ok) {
        setAppointmentSuccess(companyName);

        // 2. AI推薦を取得
        const recommendResponse = await fetch('/api/appointments/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: companyName,
            industry: industry,
          }),
        });

        const data = await recommendResponse.json();
        console.log('Recommend API response:', data);

        if (data.success && data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
        } else if (data.error) {
          setRecommendError(data.error);
        } else {
          setRecommendError('類似企業が見つかりませんでした');
        }
      } else {
        setRecommendError('アポ情報の保存に失敗しました');
      }
    } catch (error) {
      console.error('Appointment save error:', error);
      setRecommendError('エラーが発生しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setAppointmentSaving(false);
      setRecommendLoading(false);
    }
  }, [treeData]);

  // 推薦企業を選択して検索
  const handleSelectRecommendedCompany = useCallback((company: RecommendedCompany) => {
    // 推薦企業でツリーを再生成
    handleGenerateTree(company.company_name);
  }, [handleGenerateTree]);

  // 設定がない場合はセットアップ画面を表示
  if (!isConfigured || !config) {
    return <ProjectSetup />;
  }

  return (
    <main className="app-container">
      {/* ヘッダー */}
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-logo">
            <span>IS</span> Talk Tree
          </h1>
          <span className="app-project-name">{config.productName}</span>
        </div>
        <div className="app-header-right">
          {treeData && (
            <button onClick={handleReset} className="reset-button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              リセット
            </button>
          )}
          <button onClick={handleChangeProject} className="change-project-button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            案件変更
          </button>
        </div>
      </header>

      {/* メイン */}
      {!treeData ? (
        <CompanyInput onSubmit={handleGenerateTree} isLoading={isLoading} />
      ) : (
        <div className="space-y-5 animate-in">
          {/* 企業情報 */}
          <div className="company-info-panel">
            <div className="company-info-content">
              <div className="company-info-left">
                <div className="company-info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                    <path d="M9 9v.01"/>
                    <path d="M9 12v.01"/>
                    <path d="M9 15v.01"/>
                    <path d="M9 18v.01"/>
                  </svg>
                </div>
                <div>
                  <h2 className="company-info-name">{treeData.companyInfo.name}</h2>
                  <p className="company-info-industry">{treeData.companyInfo.estimatedIndustry}</p>
                </div>
              </div>
              <div className="company-info-actions">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(treeData.companyInfo.name + ' 公式サイト')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="company-info-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  公式サイトを検索
                </a>
                <button
                  onClick={handleAppointmentSuccess}
                  disabled={appointmentSaving || appointmentSuccess === treeData.companyInfo.name}
                  className={`appointment-button ${appointmentSuccess === treeData.companyInfo.name ? 'success' : ''}`}
                >
                  {appointmentSaving ? (
                    <>
                      <svg className="appointment-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      保存中...
                    </>
                  ) : appointmentSuccess === treeData.companyInfo.name ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      アポ取得済
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 2v4"/>
                        <path d="M16 2v4"/>
                        <rect width="18" height="18" x="3" y="4" rx="2"/>
                        <path d="M3 10h18"/>
                        <path d="m9 16 2 2 4-4"/>
                      </svg>
                      アポ取得
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 上部: ニュースと類似事例 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NewsPanel companyInfo={treeData.companyInfo} />
            <CasePanel
              cases={aiCases.length > 0 ? aiCases : treeData.matchedCases}
              onSelectCase={handleSelectCase}
              isLoading={aiCasesLoading}
            />
          </div>

          {/* 使用ツール・技術（BuiltWith） */}
          {(techStack.length > 0 || techLoading || currentDomain) && (
            <TechStackPanel
              technologies={techStack}
              domain={currentDomain}
              isLoading={techLoading}
              source={techSource}
            />
          )}

          {/* トークスクリプト（①〜⑥） */}
          <TalkScriptPanel
            companyName={treeData.companyInfo.name}
            industry={treeData.companyInfo.estimatedIndustry || ''}
            news={treeData.companyInfo.news || []}
            bestCase={aiCases[0] || treeData.matchedCases[0]}
            secondCase={aiCases[1] || aiCases[0] || treeData.matchedCases[1] || treeData.matchedCases[0]}
            config={config}
            aiScripts={aiScripts}
            aiScriptsLoading={aiScriptsLoading}
            companyInsights={companyInsights}
          />

          {/* トークツリー（⑥以降の分岐） */}
          <TalkTree
            tree={treeData.tree}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
            aiRedirects={aiRedirects}
            aiRedirectsLoading={aiRedirectsLoading}
            companyName={treeData.companyInfo.name}
            meetingDuration={config.meetingDuration}
            slackChannelUrl={slackUrl || config.slackChannelUrl}
          />

          {/* AIおすすめ企業 */}
          {(appointmentSuccess || recommendLoading || recommendations.length > 0 || recommendError) && (
            <RecommendedCompanies
              sourceCompany={appointmentSuccess}
              recommendations={recommendations}
              isLoading={recommendLoading}
              error={recommendError}
              onSelectCompany={handleSelectRecommendedCompany}
            />
          )}
        </div>
      )}
    </main>
  );
}
