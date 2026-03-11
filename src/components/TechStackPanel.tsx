'use client';

import { useState } from 'react';
import { TechItem } from '@/types';

interface TechStackPanelProps {
  technologies: TechItem[];
  domain?: string;
  isLoading?: boolean;
  source?: string;
}

export default function TechStackPanel({ technologies, domain, isLoading, source }: TechStackPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // カテゴリごとにグループ化
  const groupedTech = technologies.reduce((acc, tech) => {
    const category = tech.category || 'その他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tech);
    return acc;
  }, {} as Record<string, TechItem[]>);

  // カテゴリのアイコンを取得
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('analytics') || categoryLower.includes('分析')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"/>
          <path d="m19 9-5 5-4-4-3 3"/>
        </svg>
      );
    }
    if (categoryLower.includes('crm') || categoryLower.includes('sales')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      );
    }
    if (categoryLower.includes('cloud') || categoryLower.includes('hosting')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
        </svg>
      );
    }
    if (categoryLower.includes('cms') || categoryLower.includes('content')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      );
    }
    if (categoryLower.includes('marketing') || categoryLower.includes('ad')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      );
    }
    // デフォルトアイコン
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
      </svg>
    );
  };

  return (
    <div className="panel animate-in">
      {/* ヘッダー */}
      <div className="panel-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="panel-header-left">
          <div className="panel-icon tech">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <div>
            <h3 className="panel-title">使用ツール・技術</h3>
            <p className="panel-subtitle">
              {domain ? `${domain}` : '企業の技術スタック'}
              {source === 'mock' && ' (サンプル)'}
            </p>
          </div>
        </div>
        <div className="panel-header-right">
          <span className="panel-count">{technologies.length}件</span>
          <div className={`panel-toggle ${isOpen ? 'open' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className={`panel-content ${isOpen ? 'open' : ''}`}>
        {isLoading ? (
          <div className="panel-loading">
            <div className="loading-spinner"></div>
            <span>技術スタックを取得中...</span>
          </div>
        ) : technologies.length === 0 ? (
          <div className="panel-empty">
            <p>技術情報が見つかりませんでした</p>
          </div>
        ) : (
          <div className="tech-stack-list">
            {Object.entries(groupedTech).map(([category, techs]) => (
              <div key={category} className="tech-category">
                <div className="tech-category-header">
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                </div>
                <div className="tech-items">
                  {techs.map((tech, idx) => (
                    <div key={idx} className="tech-item">
                      <span className="tech-name">{tech.name}</span>
                      {tech.description && (
                        <span className="tech-desc">{tech.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {source === 'mock' && (
          <div className="tech-stack-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>BuiltWith APIキーを設定すると実際の技術スタックを取得できます</span>
          </div>
        )}
      </div>
    </div>
  );
}
