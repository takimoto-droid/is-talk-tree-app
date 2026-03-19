'use client';

import { useState } from 'react';
import { CaseStudy } from '@/types';

interface CasePanelProps {
  cases: CaseStudy[];
  onSelectCase: (caseStudy: CaseStudy) => void;
  isLoading?: boolean;
}

export default function CasePanel({ cases, onSelectCase, isLoading = false }: CasePanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleDetailClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="case-panel animate-in">
      {/* ヘッダー（クリックで開閉） */}
      <div className="case-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="case-header-left">
          <div className="case-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20V10"/>
              <path d="M18 20V4"/>
              <path d="M6 20v-4"/>
            </svg>
          </div>
          <div>
            <h3 className="case-title">類似企業の導入事例</h3>
            <p className="case-count">{cases.length}社の事例</p>
          </div>
        </div>
        <div className="case-header-right">
          <div className={`case-toggle ${isOpen ? 'open' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* 事例リスト（トグル） */}
      <div className={`case-content ${isOpen ? 'open' : ''}`}>
        {isLoading ? (
          <div className="case-loading">
            <div className="case-loading-spinner"></div>
            <p>AI検索中（Web + Excel）...</p>
          </div>
        ) : (
          <div className="case-list">
            {cases.map((caseStudy) => (
              <div
                key={caseStudy.id}
                onClick={() => onSelectCase(caseStudy)}
                className="case-item"
              >
                <div className="case-item-header">
                  <span className="case-company-name">{caseStudy.companyName}</span>
                  <span className="case-industry">{caseStudy.industry.split('・')[0]}</span>
                </div>
                <div className="case-item-body">
                  <div className="case-challenge">
                    <span className="case-label">課題</span>
                    <p>{caseStudy.challenge}</p>
                  </div>
                  <div className="case-result">
                    <span className="case-label">成果</span>
                    <p>{caseStudy.result}</p>
                  </div>
                </div>
                <div className="case-item-footer">
                  {caseStudy.url ? (
                    <span
                      className="case-detail-link"
                      onClick={(e) => handleDetailClick(e, caseStudy.url)}
                    >
                      詳細を見る →
                    </span>
                  ) : (
                    <span className={`case-source ${(caseStudy as any).source === 'Web検索' ? 'case-source-web' : ''}`}>
                      {(caseStudy as any).source === 'Web検索' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '4px', display: 'inline'}}>
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="2" y1="12" x2="22" y2="12"/>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                      )}
                      {(caseStudy as any).source || 'DOMO公式導入事例'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
