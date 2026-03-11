'use client';

import { useState } from 'react';
import { CompanyInfo } from '@/types';

interface NewsPanelProps {
  companyInfo: CompanyInfo;
}

export default function NewsPanel({ companyInfo }: NewsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasNews = companyInfo.news && companyInfo.news.length > 0;

  return (
    <div className="news-panel animate-in">
      {/* ヘッダー（クリックで開閉） */}
      <div className="news-header" onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        <div className="news-header-left">
          <div className="news-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/>
            </svg>
          </div>
          <div>
            <h3 className="news-title">関連ニュース</h3>
            <p className="news-company">{companyInfo.name}</p>
          </div>
        </div>
        <div className="news-header-right">
          <span className="news-industry">{companyInfo.estimatedIndustry}</span>
          <div className={`news-toggle ${isOpen ? 'open' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* ニュースリスト（トグル） */}
      <div className={`news-content ${isOpen ? 'open' : ''}`}>
        <div className="news-list">
          {hasNews ? (
            companyInfo.news?.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-item"
              >
                <div className="news-item-header">
                  <span className={`news-relevance ${item.relevance === 'high' ? 'high' : 'medium'}`}>
                    {item.relevance === 'high' ? '注目' : '関連'}
                  </span>
                  <span className="news-date">{item.date}</span>
                </div>
                <h4 className="news-item-title">{item.title}</h4>
                <div className="news-item-footer">
                  <span className="news-source">{item.source}</span>
                  <span className="news-link">
                    記事を読む →
                  </span>
                </div>
              </a>
            ))
          ) : (
            <div className="news-loading">
              <div className="news-loading-spinner"></div>
              <p>ニュースを取得中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
