'use client';

import { useState } from 'react';
import { EmailHistoryItem, EmailUseCase } from '@/types';

interface EmailHistoryProps {
  history: EmailHistoryItem[];
  onSelect: (item: EmailHistoryItem) => void;
}

const USE_CASE_LABELS: Record<EmailUseCase, string> = {
  'direct-appointment': 'アポ（本人直送）',
  'secretary-appointment': 'アポ（秘書あて）',
  'business-card-followup': '名刺交換アプローチ',
  'other-dept-expansion': '別部署導入済み展開',
};

export default function EmailHistory({ history, onSelect }: EmailHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyItem = async (item: EmailHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `件名: ${item.subject}\n\n${item.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (history.length === 0) {
    return (
      <div className="email-history-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect width="20" height="16" x="2" y="4" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
        <p>生成履歴がありません</p>
        <span>左のフォームからメールを生成してください</span>
      </div>
    );
  }

  return (
    <div className="email-history">
      <div className="email-history-header">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 8v4l3 3"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
        直近の生成履歴（{history.length}件）
      </div>
      <div className="email-history-list">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="email-history-item"
          >
            <div className="email-history-item-top">
              <span className="email-history-usecase">{USE_CASE_LABELS[item.useCase]}</span>
              <span className="email-history-date">{formatDate(item.generatedAt)}</span>
            </div>
            <div className="email-history-company">{item.companyName}</div>
            <div className="email-history-subject">{item.subject}</div>
            <button
              onClick={(e) => copyItem(item, e)}
              className="email-history-copy"
            >
              {copiedId === item.id ? 'コピー済み ✓' : '全文コピー'}
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
