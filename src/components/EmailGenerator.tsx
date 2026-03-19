'use client';

import { useState, useEffect } from 'react';
import { EmailGenerateInput, EmailGenerateOutput, EmailHistoryItem, EmailUseCase, CustomUseCase, CustomEmailInput, AnyEmailGenerateInput } from '@/types';
import EmailForm from './EmailForm';
import EmailOutput from './EmailOutput';
import EmailHistory from './EmailHistory';
import UseCaseCreator from './UseCaseCreator';
import { BUILTIN_UC_FIXED_VARS, getBuiltinUCDefault } from '@/data/builtinUCTemplates';

const HISTORY_KEY = 'email-history';
const CUSTOM_UC_KEY = 'custom-use-cases';
const BUILTIN_OVERRIDES_KEY = 'builtin-uc-overrides';
const MAX_HISTORY = 20;

const USE_CASE_LABELS: Record<string, string> = {
  'direct-appointment': 'アポ（本人直送）',
  'secretary-appointment': 'アポ（秘書あて）',
  'business-card-followup': '名刺交換アプローチ',
  'other-dept-expansion': '別部署導入済み展開',
};

function loadHistory(): EmailHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function loadCustomUseCases(): CustomUseCase[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(CUSTOM_UC_KEY) || '[]'); } catch { return []; }
}

function loadBuiltinOverrides(): Record<string, CustomUseCase> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(BUILTIN_OVERRIDES_KEY) || '{}'); } catch { return {}; }
}

function saveHistory(items: EmailHistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function saveCustomUseCases(items: CustomUseCase[]) {
  localStorage.setItem(CUSTOM_UC_KEY, JSON.stringify(items));
}

function saveBuiltinOverrides(overrides: Record<string, CustomUseCase>) {
  localStorage.setItem(BUILTIN_OVERRIDES_KEY, JSON.stringify(overrides));
}

export default function EmailGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<EmailGenerateOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<AnyEmailGenerateInput | null>(null);
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);
  const [customUseCases, setCustomUseCases] = useState<CustomUseCase[]>([]);
  const [builtinOverrides, setBuiltinOverrides] = useState<Record<string, CustomUseCase>>({});
  const [showCreator, setShowCreator] = useState(false);
  const [editingUC, setEditingUC] = useState<CustomUseCase | null>(null);
  const [editingBuiltinId, setEditingBuiltinId] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
    setCustomUseCases(loadCustomUseCases());
    setBuiltinOverrides(loadBuiltinOverrides());
  }, []);

  const addToHistory = (output: EmailGenerateOutput, input: AnyEmailGenerateInput) => {
    const newItem: EmailHistoryItem = {
      id: Date.now().toString(),
      companyName: input.companyName,
      useCase: output.useCase as EmailUseCase,
      subject: output.subject,
      body: output.body,
      generatedAt: output.generatedAt,
    };
    const updated = [newItem, ...history].slice(0, MAX_HISTORY);
    setHistory(updated);
    saveHistory(updated);
  };

  const handleGenerate = async (input: AnyEmailGenerateInput) => {
    setIsGenerating(true);
    setError(null);
    setLastInput(input);

    try {
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'メールの生成に失敗しました');
      }

      const data = await response.json();
      setResult(data.email);
      addToHistory(data.email, input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => { if (lastInput) handleGenerate(lastInput); };

  const handleSelectHistory = (item: EmailHistoryItem) => {
    setResult({ subject: item.subject, body: item.body, useCase: item.useCase, generatedAt: item.generatedAt });
  };

  const handleSaveCustomUC = (uc: CustomUseCase) => {
    const updated = [...customUseCases, uc];
    setCustomUseCases(updated);
    saveCustomUseCases(updated);
    setShowCreator(false);
  };

  const handleUpdateCustomUC = (uc: CustomUseCase) => {
    const updated = customUseCases.map(u => u.id === uc.id ? uc : u);
    setCustomUseCases(updated);
    saveCustomUseCases(updated);
    setEditingUC(null);
  };

  const handleDeleteCustomUC = (id: string) => {
    const updated = customUseCases.filter(uc => uc.id !== id);
    setCustomUseCases(updated);
    saveCustomUseCases(updated);
  };

  const handleEditUseCase = (uc: CustomUseCase) => {
    setEditingUC(uc);
  };

  const handleEditBuiltinUseCase = (id: string) => {
    setEditingBuiltinId(id);
  };

  const handleSaveBuiltinOverride = (uc: CustomUseCase) => {
    const updated = { ...builtinOverrides, [uc.id]: uc };
    setBuiltinOverrides(updated);
    saveBuiltinOverrides(updated);
    setEditingBuiltinId(null);
  };

  const handleResetBuiltinOverride = (id: string) => {
    const updated = { ...builtinOverrides };
    delete updated[id];
    setBuiltinOverrides(updated);
    saveBuiltinOverrides(updated);
    setEditingBuiltinId(null);
  };

  const getUseCaseLabel = (useCase: string) => {
    return USE_CASE_LABELS[useCase] || customUseCases.find(uc => uc.id === useCase)?.title || useCase;
  };

  return (
    <>
      <div className="email-split-layout">
        {/* 左パネル */}
        <div className="email-left-panel">
          <div className="email-left-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            営業メール生成
          </div>
          <EmailForm
            onSubmit={handleGenerate}
            isLoading={isGenerating}
            customUseCases={customUseCases}
            builtinOverrides={builtinOverrides}
            onAddUseCase={() => setShowCreator(true)}
            onEditUseCase={handleEditUseCase}
            onDeleteUseCase={handleDeleteCustomUC}
            onEditBuiltinUseCase={handleEditBuiltinUseCase}
          />
          {error && (
            <div className="email-error" style={{ marginTop: '12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* 右パネル */}
        <div className="email-right-panel">
          {result ? (
            <div>
              <div className="email-right-header">
                <span className="email-result-badge">{getUseCaseLabel(result.useCase)}</span>
                <button onClick={() => setResult(null)} className="email-back-btn">← 履歴に戻る</button>
              </div>
              <EmailOutput output={result} onRegenerate={handleRegenerate} isRegenerating={isGenerating} />
            </div>
          ) : (
            <EmailHistory history={history} onSelect={handleSelectHistory} />
          )}
        </div>
      </div>

      {/* カスタムUC作成・編集モーダル */}
      {(showCreator || editingUC) && (
        <UseCaseCreator
          initialUC={editingUC ?? undefined}
          onSave={editingUC ? handleUpdateCustomUC : handleSaveCustomUC}
          onClose={() => { setShowCreator(false); setEditingUC(null); }}
        />
      )}

      {/* 標準UC編集モーダル */}
      {editingBuiltinId && (
        <UseCaseCreator
          initialUC={builtinOverrides[editingBuiltinId] ?? getBuiltinUCDefault(editingBuiltinId)}
          isBuiltinEdit
          builtinFixedVars={BUILTIN_UC_FIXED_VARS[editingBuiltinId]}
          onSave={handleSaveBuiltinOverride}
          onReset={() => handleResetBuiltinOverride(editingBuiltinId)}
          onClose={() => setEditingBuiltinId(null)}
        />
      )}
    </>
  );
}
