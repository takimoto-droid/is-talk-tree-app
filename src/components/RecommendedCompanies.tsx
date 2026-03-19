'use client';

import { RecommendedCompany } from '@/types';

interface RecommendedCompaniesProps {
  sourceCompany: string;
  recommendations: RecommendedCompany[];
  isLoading: boolean;
  error?: string;
  onSelectCompany: (company: RecommendedCompany) => void;
}

export default function RecommendedCompanies({
  sourceCompany,
  recommendations,
  isLoading,
  error,
  onSelectCompany,
}: RecommendedCompaniesProps) {
  if (!sourceCompany && !isLoading && recommendations.length === 0 && !error) {
    return null;
  }

  return (
    <div className="recommend-panel">
      <div className="recommend-header">
        <div className="recommend-header-left">
          <div className="recommend-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h3 className="recommend-title">
              AIおすすめ企業
              <span className="recommend-ai-badge">AI推薦</span>
            </h3>
            {sourceCompany && (
              <p className="recommend-source">
                <span className="recommend-source-label">アポ成功:</span>
                {sourceCompany}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="recommend-content">
        {isLoading ? (
          <div className="recommend-loading">
            <div className="recommend-loading-spinner" />
            <p>類似企業を分析中...</p>
          </div>
        ) : error ? (
          <div className="recommend-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
            <p>{error}</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="recommend-empty">
            <p>「アポ取得」ボタンを押すとAIが類似企業を推薦します</p>
          </div>
        ) : (
          <div className="recommend-list">
            {recommendations.map((company, index) => (
              <div
                key={index}
                className="recommend-card"
              >
                <div className="recommend-card-rank">
                  {index + 1}
                </div>
                <div className="recommend-card-main">
                  <div className="recommend-card-header">
                    <h4 className="recommend-card-name">{company.company_name}</h4>
                    <span className="recommend-card-industry">{company.industry}</span>
                  </div>
                  <div className="recommend-card-meta">
                    {company.revenue && (
                      <span className="recommend-card-meta-item revenue">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                        <strong>売上:</strong> {company.revenue}
                      </span>
                    )}
                    {company.employees && (
                      <span className="recommend-card-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <strong>従業員:</strong> {company.employees}
                      </span>
                    )}
                  </div>
                  <div className="recommend-card-reason-box">
                    <span className="recommend-reason-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4"/>
                        <path d="M12 8h.01"/>
                      </svg>
                      推薦理由
                    </span>
                    <p className="recommend-card-reason">{company.reason}</p>
                  </div>
                  {company.dx_news && (
                    <div className="recommend-card-news">
                      <span className="recommend-news-label">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                          <path d="M18 14h-8"/>
                          <path d="M15 18h-5"/>
                          <path d="M10 6h8v4h-8V6Z"/>
                        </svg>
                        DX・データ活用ニュース
                      </span>
                      <a
                        href={company.dx_news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="recommend-news-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {company.dx_news.title}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    </div>
                  )}
                  <button
                    className="recommend-search-btn"
                    onClick={() => onSelectCompany(company)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    この企業で検索
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
