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

  return (
    <div className="tech-panel animate-in">
      {/* ヘッダー（クリックで開閉） */}
      <div className="tech-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="tech-header-left">
          <div className="tech-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <div>
            <h3 className="tech-title">使用ツール・技術</h3>
            <p className="tech-domain">
              {domain || '技術スタック'}
              {source === 'mock' && ' (サンプル)'}
            </p>
          </div>
        </div>
        <div className="tech-header-right">
          <span className="tech-count">{technologies.length}件</span>
          <div className={`tech-toggle ${isOpen ? 'open' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* コンテンツ（トグル） */}
      <div className={`tech-content ${isOpen ? 'open' : ''}`}>
        {isLoading ? (
          <div className="tech-loading">
            <div className="tech-loading-spinner"></div>
            <span>技術スタックを取得中...</span>
          </div>
        ) : technologies.length === 0 ? (
          <div className="tech-empty">
            <p>技術情報が見つかりませんでした</p>
          </div>
        ) : (
          <div className="tech-list">
            {Object.entries(groupedTech).map(([category, techs]) => (
              <div key={category} className="tech-category-group">
                <div className="tech-category-name">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                  <span>{category}</span>
                </div>
                <div className="tech-items">
                  {techs.map((tech, idx) => (
                    <span key={idx} className="tech-item-tag">
                      {tech.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {source === 'mock' && (
          <div className="tech-note">
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
