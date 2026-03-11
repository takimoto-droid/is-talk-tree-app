'use client';

import { useState, useCallback, useEffect } from 'react';

interface CompanyInputProps {
  onSubmit: (companyName: string) => void;
  isLoading: boolean;
}

const STORAGE_KEY = 'is-talk-tree-search-history';
const MAX_HISTORY = 5;

export default function CompanyInput({ onSubmit, isLoading }: CompanyInputProps) {
  const [companyName, setCompanyName] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // 検索履歴をlocalStorageから読み込む
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }, []);

  // 検索履歴を保存
  const saveToHistory = useCallback((name: string) => {
    setSearchHistory(prev => {
      // 重複を除去し、新しい検索を先頭に追加
      const filtered = prev.filter(item => item !== name);
      const newHistory = [name, ...filtered].slice(0, MAX_HISTORY);

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
      saveToHistory(companyName.trim());
      onSubmit(companyName.trim());
    }
  }, [companyName, onSubmit, saveToHistory]);

  const handleQuickSelect = useCallback((name: string) => {
    setCompanyName(name);
    saveToHistory(name);
    onSubmit(name);
  }, [onSubmit, saveToHistory]);

  // デフォルトの企業リスト（履歴がない場合に表示）
  const defaultCompanies = ['トヨタ自動車', 'ソフトバンク', '三菱UFJ銀行', 'ソニー', '楽天'];
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
              {displayCompanies.map((c) => (
                <button
                  key={c}
                  onClick={() => handleQuickSelect(c)}
                  className="search-quick-item"
                  disabled={isLoading}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
