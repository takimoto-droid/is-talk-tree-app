'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { ja } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import {
  EmailUseCase,
  EmailGenerateInput,
  DirectAppointmentInput,
  SecretaryAppointmentInput,
  BusinessCardFollowupInput,
  OtherDeptExpansionInput,
  CustomUseCase,
  CustomEmailInput,
  AnyEmailGenerateInput,
} from '@/types';
import { BUILTIN_UC_DEFAULT_TITLES } from '@/data/builtinUCTemplates';

interface EmailFormProps {
  onSubmit: (input: AnyEmailGenerateInput) => void;
  isLoading: boolean;
  customUseCases: CustomUseCase[];
  builtinOverrides: Record<string, CustomUseCase>;
  onAddUseCase: () => void;
  onEditUseCase: (uc: CustomUseCase) => void;
  onDeleteUseCase: (id: string) => void;
  onEditBuiltinUseCase: (id: string) => void;
}

const BUILTIN_USE_CASES: { id: EmailUseCase; label: string }[] = [
  { id: 'direct-appointment', label: 'アポイント依頼（本人直送）' },
  { id: 'secretary-appointment', label: 'アポイント依頼（秘書あて）' },
  { id: 'business-card-followup', label: '名刺交換後の初回アプローチ' },
  { id: 'other-dept-expansion', label: '別部署導入済み展開' },
];

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

type DateEntry = { date: Date; startH: string; startM: string; endH: string; endM: string };

function formatDateJa(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dow = DAY_LABELS[date.getDay()];
  return `${m}/${String(d).padStart(2, '0')}（${dow}）`;
}

function formatDateEntry(entry: DateEntry): string {
  const base = formatDateJa(entry.date);
  if (!entry.startH) return base;
  const start = `${entry.startH}:${entry.startM || '00'}`;
  if (!entry.endH) return `${base} ${start}〜`;
  const end = `${entry.endH}:${entry.endM || '00'}`;
  return `${base} ${start}〜${end}`;
}

// カスタムドロップダウン
function UseCaseDropdown({
  selectedId, builtinOptions, customUseCases, builtinOverrides,
  onSelect, onAdd, onEdit, onDelete, onEditBuiltin,
}: {
  selectedId: string;
  builtinOptions: { id: string; label: string }[];
  customUseCases: CustomUseCase[];
  builtinOverrides: Record<string, CustomUseCase>;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (uc: CustomUseCase) => void;
  onDelete: (id: string) => void;
  onEditBuiltin: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allOptions = [
    ...builtinOptions.map(opt => ({
      ...opt,
      label: builtinOverrides[opt.id]?.title ?? opt.label,
    })),
    ...customUseCases.map(uc => ({ id: uc.id, label: uc.title, isCustom: true, uc })),
  ];
  const selectedLabel = allOptions.find(o => o.id === selectedId)?.label ?? selectedId;

  return (
    <div className="email-uc-select-wrap" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`email-uc-trigger ${open ? 'email-uc-trigger-open' : ''}`}
      >
        <span>{selectedLabel}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ flexShrink: 0, color: '#64748b', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="email-uc-dropdown">
          <div className="email-uc-group-label">標準</div>
          {builtinOptions.map(opt => (
            <div
              key={opt.id}
              className={`email-uc-item ${selectedId === opt.id ? 'active' : ''}`}
            >
              <span
                className="email-uc-item-label"
                onClick={() => { onSelect(opt.id); setOpen(false); }}
              >
                {builtinOverrides[opt.id]?.title ?? opt.label}
              </span>
              <div className="email-uc-item-actions">
                {builtinOverrides[opt.id] && (
                  <span className="email-uc-overridden-badge">編集済</span>
                )}
                <button
                  type="button"
                  className="email-uc-item-edit-btn"
                  onClick={(e) => { e.stopPropagation(); setOpen(false); onEditBuiltin(opt.id); }}
                >
                  編集
                </button>
              </div>
            </div>
          ))}

          {customUseCases.length > 0 && (
            <>
              <div className="email-uc-group-label">カスタム</div>
              {customUseCases.map(uc => (
                <div
                  key={uc.id}
                  className={`email-uc-item ${selectedId === uc.id ? 'active' : ''}`}
                >
                  <span
                    className="email-uc-item-label"
                    onClick={() => { onSelect(uc.id); setOpen(false); }}
                  >
                    {uc.title}
                  </span>
                  <div className="email-uc-item-actions">
                    <button
                      type="button"
                      className="email-uc-item-edit-btn"
                      onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(uc); }}
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      className="email-uc-item-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`「${uc.title}」を削除しますか？`)) {
                          onDelete(uc.id);
                          if (selectedId === uc.id) onSelect('direct-appointment');
                          setOpen(false);
                        }
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="email-uc-add-row" onClick={() => { onAdd(); setOpen(false); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            カスタムユースケースを追加
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmailForm({ onSubmit, isLoading, customUseCases, builtinOverrides, onAddUseCase, onEditUseCase, onDeleteUseCase, onEditBuiltinUseCase }: EmailFormProps) {
  const [selectedId, setSelectedId] = useState<string>('direct-appointment');
  const [showCalendar, setShowCalendar] = useState(false);

  // 共通フィールド
  const [companyName, setCompanyName] = useState('');
  const [department, setDepartment] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [industry, setIndustry] = useState('');

  // 差出人情報
  const [senderName, setSenderName] = useState('');
  const [senderCompany, setSenderCompany] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  // 本人直送アポ
  const [directWhyYou, setDirectWhyYou] = useState('');
  const [directInitiative, setDirectInitiative] = useState('');
  const [directChallenge, setDirectChallenge] = useState('');
  const [directDomoSolution, setDirectDomoSolution] = useState('');
  const [directDates, setDirectDates] = useState<DateEntry[]>([]);

  // 秘書あてアポ
  const [secSecretaryName, setSecSecretaryName] = useState('');
  const [secTargetRole, setSecTargetRole] = useState('');
  const [secTargetName, setSecTargetName] = useState('');
  const [secWhyYou, setSecWhyYou] = useState('');
  const [secInitiative, setSecInitiative] = useState('');
  const [secChallenge, setSecChallenge] = useState('');
  const [secDomoSolution, setSecDomoSolution] = useState('');
  const [secDates, setSecDates] = useState<DateEntry[]>([]);

  // カスタムフィールド
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const isOtherDept = selectedId === 'other-dept-expansion';
  const selectedCustomUC = customUseCases.find(uc => uc.id === selectedId);
  const selectedBuiltinOverride = !selectedCustomUC && builtinOverrides[selectedId]
    ? builtinOverrides[selectedId]
    : null;

  const senderInfo = {
    senderName: senderName || undefined,
    senderCompany: senderCompany || undefined,
    senderEmail: senderEmail || undefined,
    senderPhone: senderPhone || undefined,
  };

  const baseCommon = {
    companyName: companyName.trim(),
    department: department.trim() || undefined,
    contactName: contactName.trim() || undefined,
    contactRole: contactRole.trim() || undefined,
    industry: industry.trim() || undefined,
    ...senderInfo,
  };

  const isValid = (): boolean => {
    if (!companyName.trim()) return false;
    if (isOtherDept) return false;
    if (selectedCustomUC) {
      return selectedCustomUC.fields
        .filter(f => f.required && !f.isBuiltin)
        .every(f => !!customFieldValues[f.id]?.trim());
    }
    // 標準UCの追加カスタム項目のバリデーション
    if (selectedBuiltinOverride) {
      const extraFieldsValid = selectedBuiltinOverride.fields
        .filter(f => f.required && !f.isBuiltin)
        .every(f => !!customFieldValues[f.id]?.trim());
      if (!extraFieldsValid) return false;
    }
    if (selectedId === 'direct-appointment') {
      return !!(directWhyYou.trim() && directInitiative.trim() && directChallenge.trim() && directDomoSolution.trim());
    }
    if (selectedId === 'secretary-appointment') {
      return !!(secTargetRole.trim() && secTargetName.trim() && secWhyYou.trim() && secInitiative.trim() && secChallenge.trim() && secDomoSolution.trim());
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) return;

    if (selectedCustomUC) {
      const input: CustomEmailInput = {
        useCase: 'custom',
        useCaseId: selectedCustomUC.id,
        customPrompt: selectedCustomUC.prompt,
        ...baseCommon,
        customFields: customFieldValues,
      };
      onSubmit(input);
      return;
    }

    // 標準UCにoverride がある場合は CustomEmailInput として送信
    if (selectedBuiltinOverride) {
      let builtinCustomFields: Record<string, string> = { ...customFieldValues };
      if (selectedId === 'direct-appointment') {
        builtinCustomFields = {
          '業界': industry.trim(),
          '何を見たか': directWhyYou.trim(),
          '取り組み': directInitiative.trim(),
          '課題': directChallenge.trim(),
          'DOMOで解決できること': directDomoSolution.trim(),
          '候補日': directDates.length > 0 ? directDates.map(formatDateEntry).join('、') : '',
          ...customFieldValues,
        };
      } else if (selectedId === 'secretary-appointment') {
        builtinCustomFields = {
          '業界': industry.trim(),
          '秘書の名前': secSecretaryName.trim(),
          'アポ相手の役職': secTargetRole.trim(),
          'アポ相手の名前': secTargetName.trim(),
          '何を見たか': secWhyYou.trim(),
          '取り組み': secInitiative.trim(),
          '課題': secChallenge.trim(),
          'DOMOで解決できること': secDomoSolution.trim(),
          '候補日': secDates.length > 0 ? secDates.map(formatDateEntry).join('、') : '',
          ...customFieldValues,
        };
      } else if (selectedId === 'business-card-followup') {
        builtinCustomFields = {
          '業界': industry.trim(),
          ...customFieldValues,
        };
      }
      const input: CustomEmailInput = {
        useCase: 'custom',
        useCaseId: selectedBuiltinOverride.id,
        customPrompt: selectedBuiltinOverride.prompt,
        ...baseCommon,
        customFields: builtinCustomFields,
      };
      onSubmit(input);
      return;
    }

    let input: EmailGenerateInput;
    if (selectedId === 'direct-appointment') {
      input = {
        ...baseCommon,
        useCase: 'direct-appointment',
        contactRole: contactRole.trim(),
        whyYouReason: directWhyYou.trim(),
        currentInitiative: directInitiative.trim(),
        dataChallenge: directChallenge.trim(),
        domoSolution: directDomoSolution.trim(),
        candidateDates: directDates.length > 0 ? directDates.map(formatDateEntry) : undefined,
      } as DirectAppointmentInput;
    } else if (selectedId === 'secretary-appointment') {
      input = {
        ...baseCommon,
        useCase: 'secretary-appointment',
        secretaryName: secSecretaryName.trim() || undefined,
        targetRole: secTargetRole.trim(),
        targetName: secTargetName.trim(),
        whyYouReason: secWhyYou.trim(),
        currentInitiative: secInitiative.trim(),
        dataChallenge: secChallenge.trim(),
        domoSolution: secDomoSolution.trim(),
        candidateDates: secDates.length > 0 ? secDates.map(formatDateEntry) : undefined,
      } as SecretaryAppointmentInput;
    } else if (selectedId === 'business-card-followup') {
      input = { ...baseCommon, useCase: 'business-card-followup' } as BusinessCardFollowupInput;
    } else {
      input = { ...baseCommon, useCase: 'other-dept-expansion' } as OtherDeptExpansionInput;
    }

    onSubmit(input);
  };

  const currentDates = selectedId === 'direct-appointment' ? directDates : secDates;
  const setCurrentDates = selectedId === 'direct-appointment' ? setDirectDates : setSecDates;

  return (
    <form onSubmit={handleSubmit} className="email-form">

      {/* ユースケース選択 */}
      <div className="email-form-field">
        <label className="email-form-label">ユースケース</label>
        <UseCaseDropdown
          selectedId={selectedId}
          builtinOptions={BUILTIN_USE_CASES}
          customUseCases={customUseCases}
          builtinOverrides={builtinOverrides}
          onSelect={setSelectedId}
          onAdd={onAddUseCase}
          onEdit={onEditUseCase}
          onDelete={onDeleteUseCase}
          onEditBuiltin={onEditBuiltinUseCase}
        />
      </div>

      {/* 別部署導入済み：準備中 */}
      {isOtherDept && (
        <div className="email-placeholder-msg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          このユースケースは現在準備中です。プロンプトが揃い次第対応します。
        </div>
      )}

      {!isOtherDept && (
        <>
          {/* 共通フィールド */}
          <div className="email-form-section">
            <div className="email-form-row">
              <div className="email-form-field">
                <label className="email-form-label">企業名 <span className="email-required">*</span></label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="例：株式会社〇〇" className="email-form-input" />
              </div>
              <div className="email-form-field">
                <label className="email-form-label">部署名 <span className="email-optional">（任意）</span></label>
                <input type="text" value={department} onChange={e => setDepartment(e.target.value)}
                  placeholder="例：営業企画部" className="email-form-input" />
              </div>
            </div>
            <div className="email-form-row">
              <div className="email-form-field">
                <label className="email-form-label">役職名 <span className="email-optional">（任意）</span></label>
                <input type="text" value={contactRole} onChange={e => setContactRole(e.target.value)}
                  placeholder="例：営業部長" className="email-form-input" />
              </div>
              <div className="email-form-field">
                <label className="email-form-label">担当者名 <span className="email-optional">（任意）</span></label>
                <input type="text" value={contactName} onChange={e => setContactName(e.target.value)}
                  placeholder="例：山田 太郎" className="email-form-input" />
                {!contactName && <p className="email-form-hint">※ 未入力の場合「ご担当者様」と表記されます</p>}
              </div>
            </div>
          </div>

          {/* 標準UCの追加カスタムフィールド（override時） */}
          {selectedBuiltinOverride && selectedBuiltinOverride.fields.filter(f => !f.isBuiltin).length > 0 && (
            <div className="email-form-section">
              <div className="email-form-section-title">追加入力項目</div>
              {selectedBuiltinOverride.fields.filter(f => !f.isBuiltin).map(field => (
                <div key={field.id} className="email-form-field">
                  <label className="email-form-label">
                    {field.label}
                    {field.required
                      ? <span className="email-required"> *</span>
                      : <span className="email-optional">（任意）</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={customFieldValues[field.id] || ''}
                      onChange={e => setCustomFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                      className="email-form-textarea" rows={2}
                    />
                  ) : (
                    <input type="text"
                      value={customFieldValues[field.id] || ''}
                      onChange={e => setCustomFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                      className="email-form-input"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* カスタムUC固有フィールド */}
          {selectedCustomUC && (
            <div className="email-form-section">
              <div className="email-form-section-title">{selectedCustomUC.title} - 入力項目</div>
              {selectedCustomUC.fields.filter(f => !f.isBuiltin).map(field => (
                <div key={field.id} className="email-form-field">
                  <label className="email-form-label">
                    {field.label}
                    {field.required
                      ? <span className="email-required"> *</span>
                      : <span className="email-optional">（任意）</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={customFieldValues[field.id] || ''}
                      onChange={e => setCustomFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                      className="email-form-textarea" rows={2}
                    />
                  ) : (
                    <input type="text"
                      value={customFieldValues[field.id] || ''}
                      onChange={e => setCustomFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                      className="email-form-input"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 本人直送アポ固有フィールド */}
          {selectedId === 'direct-appointment' && (
            <div className="email-form-section">
              <div className="email-form-section-title">アポイント情報</div>
              <div className="email-form-field">
                <label className="email-form-label">何を見たか（具体的な情報源・施策・数字）<span className="email-required"> *</span></label>
                <textarea value={directWhyYou} onChange={e => setDirectWhyYou(e.target.value)}
                  placeholder="例：先日発表されたDX推進3ヵ年計画にて2026年度までにデータ基盤整備を完了させると明記されていたこと"
                  className="email-form-textarea" rows={2} />
              </div>
              <div className="email-form-field">
                <label className="email-form-label">取り組み・目指していること <span className="email-required">*</span></label>
                <textarea value={directInitiative} onChange={e => setDirectInitiative(e.target.value)}
                  placeholder="例：全社のデータを一元管理し、経営判断のスピードを上げること"
                  className="email-form-textarea" rows={2} />
              </div>
              <div className="email-form-field">
                <label className="email-form-label">データ活用基盤の課題・ボトルネック <span className="email-required">*</span></label>
                <textarea value={directChallenge} onChange={e => setDirectChallenge(e.target.value)}
                  placeholder="例：部門ごとにExcelで管理されており、経営層が必要な情報をリアルタイムに把握できない"
                  className="email-form-textarea" rows={2} />
              </div>
              <div className="email-form-field">
                <label className="email-form-label">DOMOで解決できること（断言） <span className="email-required">*</span></label>
                <textarea value={directDomoSolution} onChange={e => setDirectDomoSolution(e.target.value)}
                  placeholder="例：全社のKPIをリアルタイムで一元可視化し、経営判断を現場レベルまで即時反映させる"
                  className="email-form-textarea" rows={2} />
              </div>
              <DatePickerField
                entries={directDates} onChangeEntries={setDirectDates}
                showCalendar={showCalendar && selectedId === 'direct-appointment'}
                onToggleCalendar={() => setShowCalendar(v => !v)}
              />
            </div>
          )}

          {/* 秘書あてアポ固有フィールド */}
          {selectedId === 'secretary-appointment' && (
            <div className="email-form-section">
              <div className="email-form-section-title">秘書あてアポ情報</div>
              <div className="email-form-row">
                <div className="email-form-field">
                  <label className="email-form-label">秘書の名前 <span className="email-optional">（任意）</span></label>
                  <input type="text" value={secSecretaryName} onChange={e => setSecSecretaryName(e.target.value)}
                    placeholder="例：田中様" className="email-form-input" />
                  {!secSecretaryName && <p className="email-form-hint">※ 未入力の場合「秘書室 ご担当者様」と表記されます</p>}
                </div>
              </div>
              <div className="email-form-row">
                <div className="email-form-field">
                  <label className="email-form-label">アポが欲しい人の役職 <span className="email-required">*</span></label>
                  <input type="text" value={secTargetRole} onChange={e => setSecTargetRole(e.target.value)}
                    placeholder="例：代表取締役社長" className="email-form-input" />
                </div>
                <div className="email-form-field">
                  <label className="email-form-label">アポが欲しい人の名前 <span className="email-required">*</span></label>
                  <input type="text" value={secTargetName} onChange={e => setSecTargetName(e.target.value)}
                    placeholder="例：山田 太郎" className="email-form-input" />
                </div>
              </div>
              <div className="email-form-field">
                <label className="email-form-label">何を見たか（具体的な情報源・施策・数字）<span className="email-required"> *</span></label>
                <textarea value={secWhyYou} onChange={e => setSecWhyYou(e.target.value)}
                  placeholder="例：先日発表されたDX推進3ヵ年計画にて2026年度までにデータ基盤整備を完了させると明記されていたこと"
                  className="email-form-textarea" rows={2} />
              </div>
              <div className="email-form-field">
                <label className="email-form-label">取り組み・目指していること <span className="email-required">*</span></label>
                <textarea value={secInitiative} onChange={e => setSecInitiative(e.target.value)}
                  placeholder="例：全社のデータを一元管理し、経営判断のスピードを上げること"
                  className="email-form-textarea" rows={2} />
              </div>
              <div className="email-form-field">
                <label className="email-form-label">データ活用基盤の課題・ボトルネック <span className="email-required">*</span></label>
                <textarea value={secChallenge} onChange={e => setSecChallenge(e.target.value)}
                  placeholder="例：部門ごとにExcelで管理されており、経営層が必要な情報をリアルタイムに把握できない"
                  className="email-form-textarea" rows={2} />
              </div>
              <div className="email-form-field">
                <label className="email-form-label">DOMOで解決できること（断言） <span className="email-required">*</span></label>
                <textarea value={secDomoSolution} onChange={e => setSecDomoSolution(e.target.value)}
                  placeholder="例：全社のKPIをリアルタイムで一元可視化し、経営判断を現場レベルまで即時反映させる"
                  className="email-form-textarea" rows={2} />
              </div>
              <DatePickerField
                entries={secDates} onChangeEntries={setSecDates}
                showCalendar={showCalendar && selectedId === 'secretary-appointment'}
                onToggleCalendar={() => setShowCalendar(v => !v)}
              />
            </div>
          )}

          {/* ヒアリング情報（常に表示） */}
          <div className="email-hearing-section">
            <div className="email-hearing-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
              ヒアリング情報・差出人設定
              <span className="email-hearing-desc">入力するとメールの精度が向上します</span>
            </div>
            <div className="email-form-row">
              <div className="email-form-field">
                <label className="email-form-label">業界 <span className="email-optional">（任意）</span></label>
                <input type="text" value={industry} onChange={e => setIndustry(e.target.value)}
                  placeholder="例：製造・エレクトロニクス" className="email-form-input" />
              </div>
            </div>
            <div className="email-form-section-title" style={{ marginTop: '8px' }}>差出人情報</div>
            <div className="email-form-row">
              <div className="email-form-field">
                <label className="email-form-label">差出人名 <span className="email-optional">（任意）</span></label>
                <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)}
                  placeholder="例：Hikari Michimoto / 道本 光" className="email-form-input" />
              </div>
              <div className="email-form-field">
                <label className="email-form-label">差出人企業名 <span className="email-optional">（任意）</span></label>
                <input type="text" value={senderCompany} onChange={e => setSenderCompany(e.target.value)}
                  placeholder="例：ドーモ株式会社" className="email-form-input" />
              </div>
            </div>
            <div className="email-form-row">
              <div className="email-form-field">
                <label className="email-form-label">差出人メールアドレス <span className="email-optional">（任意）</span></label>
                <input type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)}
                  placeholder="例：hikari.domoto@domo.com" className="email-form-input" />
              </div>
              <div className="email-form-field">
                <label className="email-form-label">差出人電話番号 <span className="email-optional">（任意）</span></label>
                <input type="tel" value={senderPhone} onChange={e => setSenderPhone(e.target.value)}
                  placeholder="例：050-1782-7024" className="email-form-input" />
              </div>
            </div>
          </div>

          {/* 生成ボタン */}
          <div className="email-generate-divider" />
          <button type="submit" disabled={!isValid() || isLoading} className="email-generate-btn">
            {isLoading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                メールを生成中...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                メールを生成する
              </>
            )}
          </button>
        </>
      )}
    </form>
  );
}

function DatePickerField({ entries, onChangeEntries, showCalendar, onToggleCalendar }: {
  entries: DateEntry[];
  onChangeEntries: (d: DateEntry[]) => void;
  showCalendar: boolean;
  onToggleCalendar: () => void;
}) {
  const selectedDates = entries.map(e => e.date);

  const handleSelect = (dates: Date[] | undefined) => {
    if (!dates) { onChangeEntries([]); return; }
    if (dates.length > 5) return;
    const updated: DateEntry[] = dates.map(d => {
      const existing = entries.find(e => e.date.toDateString() === d.toDateString());
      return existing ?? { date: d, startH: '', startM: '', endH: '', endM: '' };
    });
    onChangeEntries(updated);
  };

  const updateTime = (index: number, field: 'startH' | 'startM' | 'endH' | 'endM', value: string) => {
    const updated = entries.map((e, i) => i === index ? { ...e, [field]: value } : e);
    onChangeEntries(updated);
  };

  const removeEntry = (index: number) => {
    onChangeEntries(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="email-form-field">
      <label className="email-form-label">候補日 <span className="email-optional">（任意・最大5日）</span></label>
      <button type="button" onClick={onToggleCalendar} className="email-date-trigger">
        {entries.length > 0
          ? <span style={{ color: '#93c5fd' }}>{entries.length}日選択中</span>
          : <span style={{ color: '#64748b' }}>クリックして日付を選択</span>}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </button>

      {entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {entries.map((entry, i) => (
            <div key={i} className="email-date-entry">
              <div className="email-date-entry-header">
                <span className="email-date-entry-label">{formatDateJa(entry.date)}</span>
                <button type="button" onClick={() => removeEntry(i)} className="email-date-entry-remove">×</button>
              </div>
              <div className="email-time-range">
                <input
                  type="text" inputMode="numeric" maxLength={2}
                  className="email-time-input" placeholder="10"
                  value={entry.startH}
                  onChange={e => updateTime(i, 'startH', e.target.value.replace(/\D/g, ''))}
                />
                <span className="email-time-sep">:</span>
                <input
                  type="text" inputMode="numeric" maxLength={2}
                  className="email-time-input" placeholder="00"
                  value={entry.startM}
                  onChange={e => updateTime(i, 'startM', e.target.value.replace(/\D/g, ''))}
                />
                <span className="email-time-sep">〜</span>
                <input
                  type="text" inputMode="numeric" maxLength={2}
                  className="email-time-input" placeholder="11"
                  value={entry.endH}
                  onChange={e => updateTime(i, 'endH', e.target.value.replace(/\D/g, ''))}
                />
                <span className="email-time-sep">:</span>
                <input
                  type="text" inputMode="numeric" maxLength={2}
                  className="email-time-input" placeholder="00"
                  value={entry.endM}
                  onChange={e => updateTime(i, 'endM', e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {showCalendar && (
        <div className="email-calendar-popup">
          <DayPicker mode="multiple" selected={selectedDates}
            onSelect={handleSelect}
            locale={ja} disabled={{ before: new Date() }} fromMonth={new Date()} />
        </div>
      )}
    </div>
  );
}
