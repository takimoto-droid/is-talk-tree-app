'use client';

import { useState, useCallback } from 'react';
import { useProject } from '@/context/ProjectContext';
import { generateTemplateExcel } from '@/lib/excelParser';

export default function ProjectSetup() {
  const { loadFromExcel, loadDefault } = useProject();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      await loadFromExcel(file);
    } catch (err) {
      console.error('Excel parse error:', err);
      setError('Excelファイルの読み込みに失敗しました。フォーマットを確認してください。');
    } finally {
      setIsLoading(false);
    }
  }, [loadFromExcel]);

  const handleDownloadTemplate = useCallback(() => {
    const blob = generateTemplateExcel();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'talk-tree-template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleUseDefault = useCallback(() => {
    setIsLoading(true);
    loadDefault();
    setIsLoading(false);
  }, [loadDefault]);

  return (
    <div className="setup-container animate-in">
      <div className="setup-panel">
        {/* ヘッダー */}
        <div className="setup-header">
          <div className="setup-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <h1 className="setup-title">IS Talk Tree</h1>
            <p className="setup-subtitle">案件設定を選択してください</p>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="setup-body">
          {error && (
            <div className="setup-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          {/* Excelアップロード */}
          <div className="setup-option">
            <div className="setup-option-header">
              <div className="setup-option-icon excel">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <h3 className="setup-option-title">Excelから読み込む</h3>
                <p className="setup-option-desc">案件の設定ファイルをアップロード</p>
              </div>
            </div>
            <label className="setup-upload-btn">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
                style={{ display: 'none' }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {isLoading ? 'アップロード中...' : 'ファイルを選択'}
            </label>
          </div>

          {/* テンプレートダウンロード */}
          <div className="setup-template">
            <button onClick={handleDownloadTemplate} className="setup-template-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              テンプレートをダウンロード
            </button>
          </div>

          {/* 区切り線 */}
          <div className="setup-divider">
            <span>または</span>
          </div>

          {/* デフォルト（DOMO）を使用 */}
          <div className="setup-option">
            <div className="setup-option-header">
              <div className="setup-option-icon domo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
              </div>
              <div>
                <h3 className="setup-option-title">DOMO（デフォルト）を使用</h3>
                <p className="setup-option-desc">DOMOの導入事例とトークスクリプトを使用</p>
              </div>
            </div>
            <button onClick={handleUseDefault} className="setup-default-btn" disabled={isLoading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              DOMOで開始
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="setup-footer">
          <p>Excelテンプレートには「製品情報」「導入事例」「反論対応」の3シートが含まれています</p>
        </div>
      </div>
    </div>
  );
}
