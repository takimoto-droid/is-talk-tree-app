'use client';

import { useState, useCallback, useEffect } from 'react';

interface CompanyInputProps {
  onSubmit: (companyName: string, domain?: string) => void;
  isLoading: boolean;
}

interface SearchHistoryItem {
  name: string;
  domain?: string;
}

const STORAGE_KEY = 'is-talk-tree-search-history';
const MAX_HISTORY = 5;

export default function CompanyInput({ onSubmit, isLoading }: CompanyInputProps) {
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // 検索履歴をlocalStorageから読み込む
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 旧形式（string[]）との互換性を保持
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
          setSearchHistory(parsed.map((name: string) => ({ name })));
        } else {
          setSearchHistory(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }, []);

  // 検索履歴を保存
  const saveToHistory = useCallback((name: string, domainValue?: string) => {
    setSearchHistory(prev => {
      // 重複を除去し、新しい検索を先頭に追加
      const filtered = prev.filter(item => item.name !== name);
      const newHistory = [{ name, domain: domainValue }, ...filtered].slice(0, MAX_HISTORY);

      // localStorageに保存
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.error('Failed to save search history:', e);
      }

      return newHistory;
    });
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim()) {
      const trimmedDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      saveToHistory(companyName.trim(), trimmedDomain || undefined);
      onSubmit(companyName.trim(), trimmedDomain || undefined);
    }
  }, [companyName, domain, onSubmit, saveToHistory]);

  const handleQuickSelect = useCallback((item: SearchHistoryItem) => {
    setCompanyName(item.name);
    setDomain(item.domain || '');
    saveToHistory(item.name, item.domain);
    onSubmit(item.name, item.domain);
  }, [onSubmit, saveToHistory]);

  // デフォルトの企業リスト（履歴がない場合に表示）
  const defaultCompanies: SearchHistoryItem[] = [
    { name: 'トヨタ自動車', domain: 'toyota.co.jp' },
    { name: 'ソフトバンク', domain: 'softbank.co.jp' },
    { name: '三菱UFJ銀行', domain: 'bk.mufg.jp' },
    { name: 'ソニー', domain: 'sony.co.jp' },
    { name: '楽天', domain: 'rakuten.co.jp' },
  ];
  const displayCompanies = searchHistory.length > 0 ? searchHistory : defaultCompanies;

  return (
    <div className="search-container animate-in">
      <div className="search-panel">
        {/* ヘッダー */}
        <div className="search-header">
          <div className="search-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <div>
            <h2 className="search-title">会社名を入力</h2>
            <p className="search-subtitle">業界に合わせたトークスクリプトを生成</p>
          </div>
        </div>

        {/* 検索フォーム */}
        <div className="search-body">
          <form onSubmit={handleSubmit}>
            <div className="search-input-wrapper">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例：トヨタ自動車"
                className="search-input"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!companyName.trim() || isLoading}
                className="search-button"
              >
                {isLoading ? (
                  <span className="search-loading">
                    <svg className="search-spinner" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" />
                    </svg>
                    生成中...
                  </span>
                ) : (
                  <span className="search-button-text">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    生成
                  </span>
                )}
              </button>
            </div>

            {/* ドメイン入力（オプション） */}
            <div className="search-domain-wrapper">
              <label className="search-domain-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
                使用ツール取得（任意）
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="例：toyota.co.jp"
                className="search-domain-input"
                disabled={isLoading}
              />
            </div>
          </form>

          {/* クイック選択 */}
          <div className="search-quick">
            <p className="search-quick-label">
              {searchHistory.length > 0 ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  最近の検索
                </>
              ) : (
                'クイック選択'
              )}
            </p>
            <div className="search-quick-list">
              {displayCompanies.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleQuickSelect(item)}
                  className="search-quick-item"
                  disabled={isLoading}
                  title={item.domain ? `ドメイン: ${item.domain}` : undefined}
                >
                  {item.name}
                  {item.domain && (
                    <span className="search-quick-domain">{item.domain}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
