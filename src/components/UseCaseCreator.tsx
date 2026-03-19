'use client';

import { useState } from 'react';
import { CustomUseCase, CustomUseCaseField } from '@/types';

interface UseCaseCreatorProps {
  initialUC?: CustomUseCase;
  isBuiltinEdit?: boolean;
  builtinFixedVars?: string[];
  onSave: (uc: CustomUseCase) => void;
  onReset?: () => void;
  onClose: () => void;
}

const BUILTIN_FIELDS: { id: string; label: string; defaultChecked: boolean }[] = [
  { id: 'companyName',   label: '企業名',             defaultChecked: true  },
  { id: 'department',    label: '部署名',             defaultChecked: false },
  { id: 'contactRole',   label: '役職名',             defaultChecked: false },
  { id: 'contactName',   label: '担当者名',           defaultChecked: true  },
  { id: 'senderName',    label: '差出人名',           defaultChecked: true  },
  { id: 'senderCompany', label: '差出人企業名',       defaultChecked: true  },
  { id: 'senderEmail',   label: '差出人メールアドレス', defaultChecked: true },
  { id: 'senderPhone',   label: '差出人電話番号',     defaultChecked: false },
];

export default function UseCaseCreator({ initialUC, isBuiltinEdit = false, builtinFixedVars, onSave, onReset, onClose }: UseCaseCreatorProps) {
  const isEdit = !!initialUC;

  // 編集モードの場合は既存データで初期化
  const [title, setTitle] = useState(initialUC?.title ?? '');
  const [prompt, setPrompt] = useState(initialUC?.prompt ?? '');

  const [checkedBuiltins, setCheckedBuiltins] = useState<Record<string, boolean>>(() => {
    if (initialUC) {
      const base = Object.fromEntries(BUILTIN_FIELDS.map(f => [f.id, false]));
      initialUC.fields.filter(f => f.isBuiltin).forEach(f => { base[f.id] = true; });
      return base;
    }
    return Object.fromEntries(BUILTIN_FIELDS.map(f => [f.id, f.defaultChecked]));
  });

  const [customFields, setCustomFields] = useState<{ id: string; label: string; type: 'text' | 'textarea'; required: boolean }[]>(() => {
    if (initialUC) {
      return initialUC.fields.filter(f => !f.isBuiltin).map(f => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
      }));
    }
    return [];
  });

  const toggleBuiltin = (id: string) => {
    if (id === 'companyName') return;
    setCheckedBuiltins(p => ({ ...p, [id]: !p[id] }));
  };

  const addCustomField = () => {
    setCustomFields(p => [...p, { id: `custom-${Date.now()}`, label: '', type: 'text', required: false }]);
  };

  const updateCustomField = (id: string, updates: Partial<typeof customFields[0]>) => {
    setCustomFields(p => p.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeCustomField = (id: string) => {
    setCustomFields(p => p.filter(f => f.id !== id));
  };

  const allVariableHints = isBuiltinEdit
    ? [
        ...(builtinFixedVars ?? []),
        ...customFields.filter(f => f.label).map(f => `{${f.label}}`),
      ].join(' ')
    : [
        ...BUILTIN_FIELDS.filter(f => checkedBuiltins[f.id]).map(f => `{${f.label}}`),
        ...customFields.filter(f => f.label).map(f => `{${f.label}}`),
      ].join(' ');

  const isValid = title.trim() && prompt.trim();

  const handleSave = () => {
    if (!isValid) return;

    let fields: CustomUseCaseField[];
    if (isBuiltinEdit) {
      // 標準UC編集時：追加カスタム項目のみ保存
      fields = customFields.filter(f => f.label.trim()).map(f => ({
        ...f,
        label: f.label.trim(),
        isBuiltin: false,
      }));
    } else {
      fields = [
        ...BUILTIN_FIELDS.filter(f => checkedBuiltins[f.id]).map(f => ({
          id: f.id,
          label: f.label,
          type: 'text' as const,
          required: f.id === 'companyName',
          isBuiltin: true,
        })),
        ...customFields.filter(f => f.label.trim()).map(f => ({
          ...f,
          label: f.label.trim(),
          isBuiltin: false,
        })),
      ];
    }

    const newUC: CustomUseCase = {
      id: initialUC?.id ?? `custom-${Date.now()}`,
      title: title.trim(),
      prompt: prompt.trim(),
      fields,
      createdAt: initialUC?.createdAt ?? new Date().toISOString(),
    };
    onSave(newUC);
  };

  return (
    <div className="uc-modal-overlay" onClick={onClose}>
      <div className="uc-modal" onClick={e => e.stopPropagation()}>
        <div className="uc-modal-header">
          <span>
            {isBuiltinEdit ? '標準ユースケースを編集' : isEdit ? 'カスタムユースケースを編集' : 'カスタムユースケースを追加'}
          </span>
          <button onClick={onClose} className="uc-modal-close">✕</button>
        </div>

        <div className="uc-modal-body">
          {/* タイトル */}
          <div className="email-form-field">
            <label className="email-form-label">ユースケース名 <span className="email-required">*</span></label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="例：既存顧客へのアップセル" className="email-form-input" />
          </div>

          {/* 組み込み項目 or 固定変数バッジ */}
          {isBuiltinEdit ? (
            <div className="email-form-field">
              <label className="email-form-label">固定変数（変更不可）</label>
              <div className="uc-fixed-vars">
                {(builtinFixedVars ?? []).map(v => (
                  <span key={v} className="uc-fixed-var-badge">{v}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="email-form-field">
              <label className="email-form-label">使用する項目（組み込み）</label>
              <div className="uc-fields-grid">
                {BUILTIN_FIELDS.map(f => (
                  <label key={f.id} className={`uc-field-check ${f.id === 'companyName' ? 'uc-field-locked' : ''}`}>
                    <input type="checkbox" checked={!!checkedBuiltins[f.id]}
                      onChange={() => toggleBuiltin(f.id)} disabled={f.id === 'companyName'} />
                    {f.label}
                    {f.id === 'companyName' && <span style={{ fontSize: '10px', color: '#64748b' }}>（固定）</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* カスタム追加項目 */}
          <div className="email-form-field">
            <label className="email-form-label">追加カスタム項目</label>
            {customFields.map(f => (
              <div key={f.id} className="uc-custom-field-row">
                <input type="text" value={f.label} onChange={e => updateCustomField(f.id, { label: e.target.value })}
                  placeholder="項目名" className="email-form-input" style={{ flex: 1 }} />
                <select value={f.type} onChange={e => updateCustomField(f.id, { type: e.target.value as 'text' | 'textarea' })}
                  className="email-form-select" style={{ width: '110px' }}>
                  <option value="text">テキスト</option>
                  <option value="textarea">長文</option>
                </select>
                <label className="uc-required-check">
                  <input type="checkbox" checked={f.required} onChange={e => updateCustomField(f.id, { required: e.target.checked })} />
                  必須
                </label>
                <button type="button" onClick={() => removeCustomField(f.id)} className="uc-remove-btn">✕</button>
              </div>
            ))}
            <button type="button" onClick={addCustomField} className="uc-add-field-btn">
              ＋ 項目を追加
            </button>
          </div>

          {/* プロンプト */}
          <div className="email-form-field">
            <label className="email-form-label">
              プロンプトテンプレート <span className="email-required">*</span>
            </label>
            <div className="uc-variable-hints">
              使える変数: <span>{allVariableHints || '（項目を選択すると変数が表示されます）'}</span>
            </div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="例：以下の情報をもとに営業メールを作成してください。&#10;企業名：{企業名}&#10;担当者：{担当者名}&#10;..."
              className="email-form-textarea" rows={8} />
          </div>
        </div>

        <div className="uc-modal-footer">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="uc-cancel-btn">キャンセル</button>
            {isBuiltinEdit && onReset && (
              <button
                onClick={() => { if (window.confirm('デフォルトに戻しますか？\n編集内容はすべて削除されます。')) onReset(); }}
                className="uc-reset-btn"
              >
                デフォルトに戻す
              </button>
            )}
          </div>
          <button onClick={handleSave} disabled={!isValid} className="uc-save-btn">
            {isBuiltinEdit ? '変更を保存' : isEdit ? '更新して保存' : '保存して追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
