'use client';

import { useState, useCallback } from 'react';
import { TalkNode, CaseStudy, GenerateTreeResponse, NewsItem } from '@/types';
import { generateTalkTree } from '@/lib/treeGenerator';
import CompanyInput from '@/components/CompanyInput';
import TalkTree from '@/components/TalkTree';
import TalkScriptPanel from '@/components/TalkScriptPanel';
import NewsPanel from '@/components/NewsPanel';
import CasePanel from '@/components/CasePanel';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [treeData, setTreeData] = useState<GenerateTreeResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<TalkNode | null>(null);

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

  const handleGenerateTree = useCallback(async (companyName: string) => {
    setIsLoading(true);

    try {
      // ニュースを取得
      const news = await fetchNews(companyName);

      // トークツリーを生成
      const result = generateTalkTree(companyName, news);
      setTreeData(result);
      setSelectedNode(result.tree);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectNode = useCallback((node: TalkNode) => {
    setSelectedNode(node);
  }, []);

  const handleReset = useCallback(() => {
    setTreeData(null);
    setSelectedNode(null);
  }, []);

  const handleSelectCase = useCallback((caseStudy: CaseStudy) => {
    alert(
      `【${caseStudy.companyName}】\n\n` +
      `業界: ${caseStudy.industry}\n\n` +
      `課題: ${caseStudy.challenge}\n\n` +
      `成果: ${caseStudy.result}\n\n` +
      (caseStudy.quote ? `声: 「${caseStudy.quote}」` : '')
    );
  }, []);

  return (
    <main className="app-container">
      {/* ヘッダー */}
      <header className="app-header">
        <h1 className="app-logo">
          <span>IS</span> Talk Tree
        </h1>
        {treeData && (
          <button onClick={handleReset} className="reset-button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            リセット
          </button>
        )}
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
            </div>
          </div>

          {/* 上部: ニュースと類似事例 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NewsPanel companyInfo={treeData.companyInfo} />
            <CasePanel cases={treeData.matchedCases} onSelectCase={handleSelectCase} />
          </div>

          {/* トークスクリプト（①〜⑥） */}
          <TalkScriptPanel
            companyName={treeData.companyInfo.name}
            industry={treeData.companyInfo.estimatedIndustry || ''}
            news={treeData.companyInfo.news || []}
            bestCase={treeData.matchedCases[0]}
            secondCase={treeData.matchedCases[1] || treeData.matchedCases[0]}
          />

          {/* トークツリー（⑥以降の分岐） */}
          <TalkTree
            tree={treeData.tree}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
          />
        </div>
      )}
    </main>
  );
}
