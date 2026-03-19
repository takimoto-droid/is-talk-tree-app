'use client';

import { useState } from 'react';
import { EmailGenerateOutput } from '@/types';

interface EmailOutputProps {
  output: EmailGenerateOutput;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export default function EmailOutput({ output, onRegenerate, isRegenerating }: EmailOutputProps) {
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyToClipboard = async (text: string, type: 'subject' | 'body' | 'all') => {
    await navigator.clipboard.writeText(text);
    if (type === 'subject') { setCopiedSubject(true); setTimeout(() => setCopiedSubject(false), 2000); }
    if (type === 'body') { setCopiedBody(true); setTimeout(() => setCopiedBody(false), 2000); }
    if (type === 'all') { setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000); }
  };

  const allText = `件名: ${output.subject}\n\n${output.body}`;

  return (
    <div className="email-output-panel">
      <div className="email-output-header">
        <div className="email-output-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="20" height="16" x="2" y="4" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          生成されたメール
        </div>
        <div className="email-output-actions">
          <button
            onClick={() => copyToClipboard(allText, 'all')}
            className="email-copy-all-btn"
          >
            {copiedAll ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                コピー済み
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="14" height="14" x="8" y="8" rx="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
                全文コピー
              </>
            )}
          </button>
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="email-regenerate-btn"
          >
            {isRegenerating ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                生成中...
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                再生成
              </>
            )}
          </button>
        </div>
      </div>

      {/* 件名 */}
      <div className="email-section">
        <div className="email-section-label">
          <span>件名</span>
          <button
            onClick={() => copyToClipboard(output.subject, 'subject')}
            className="email-copy-btn"
          >
            {copiedSubject ? 'コピー済み ✓' : 'コピー'}
          </button>
        </div>
        <div className="email-subject-content">{output.subject}</div>
      </div>

      {/* 本文 */}
      <div className="email-section">
        <div className="email-section-label">
          <span>本文</span>
          <button
            onClick={() => copyToClipboard(output.body, 'body')}
            className="email-copy-btn"
          >
            {copiedBody ? 'コピー済み ✓' : 'コピー'}
          </button>
        </div>
        <div className="email-body-content">{output.body}</div>
      </div>
    </div>
  );
}
