// トークツリーのノード型定義
export interface TalkNode {
  id: string;
  type: 'start' | 'yes' | 'no' | 'objection' | 'case' | 'demo' | 'schedule';
  label: string;
  script: string;
  tips?: string;
  children?: {
    yes?: TalkNode;
    no?: TalkNode;
    objections?: TalkNode[];
  };
}

// 導入事例
export interface CaseStudy {
  id: string;
  companyName: string;
  industry: string;
  subIndustry?: string;
  challenge: string;
  solution: string;
  result: string;
  quote?: string;
  url: string;
  // 追加フィールド
  companyFeatures?: string;  // 会社特徴
  mainFeatures?: string;     // 主な特徴
  competitors?: string;      // 競合
}

// 業界カテゴリ
export type IndustryCategory =
  | '通信・IT'
  | '製造・エレクトロニクス'
  | '金融・保険'
  | '小売・流通'
  | 'コンサルティング'
  | 'メディア・エンターテイメント'
  | 'その他';

// 会社情報
export interface CompanyInfo {
  name: string;
  domain?: string;
  industry?: IndustryCategory;
  estimatedIndustry?: IndustryCategory;
  news?: NewsItem[];
  techStack?: TechItem[];
}

// 技術スタック
export interface TechItem {
  name: string;
  category: string;
  description?: string;
}

// ニュース記事
export interface NewsItem {
  title: string;
  source: string;
  date: string;
  summary: string;
  relevance: 'high' | 'medium' | 'low';
  url: string;
}

// トークツリー生成リクエスト
export interface GenerateTreeRequest {
  companyName: string;
  config: ProjectConfig;
}

// トークツリー生成レスポンス
export interface GenerateTreeResponse {
  tree: TalkNode;
  matchedCases: CaseStudy[];
  companyInfo: CompanyInfo;
}

// 反論タイプ
export type ObjectionType = 'busy' | 'budget' | 'timing' | 'competitor' | 'authority';

// 反論切り返しトーク
export interface ObjectionHandler {
  type: ObjectionType;
  label: string;
  response: string;
  followUp: string;
}

// 案件設定（Excelから読み込む）
export interface ProjectConfig {
  // 製品/サービス情報
  productName: string;
  productNameKana?: string;
  companyName: string;
  headquarters?: string;
  productDescription: string;
  keyFeatures: string[];
  targetIndustries: string[];

  // 導入事例
  caseStudies: CaseStudy[];

  // 反論対応
  objectionHandlers: ObjectionHandler[];

  // 商談設定
  meetingDuration: string;
  meetingAgenda?: string[];

  // 検索キーワード（ニュース優先度用）
  searchKeywords?: string[];

  // 競合との差別化ポイント（Excelから読み込む）
  competitiveDiff?: string;
}

// ========== メール生成 ==========

export type EmailUseCase =
  | 'direct-appointment'      // アポイント依頼（本人直送）
  | 'secretary-appointment'   // アポイント依頼（秘書あて）
  | 'business-card-followup'  // 名刺交換後の初回アプローチ
  | 'other-dept-expansion';   // 別部署導入済み展開

export interface EmailBaseInput {
  companyName: string;
  department?: string;        // 任意（役員等部署なしのケースに対応）
  contactName?: string;
  contactRole?: string;       // 役職名
  industry?: string;
  // 差出人情報（任意・未入力時はデフォルト値を使用）
  senderName?: string;        // 例: Hikari Michimoto / 道本 光
  senderCompany?: string;     // 例: ドーモ株式会社
  senderEmail?: string;       // 例: hikari.domoto@domo.com
  senderPhone?: string;       // 例: 050-1782-7024
}

// カスタムユースケース
export interface CustomUseCaseField {
  id: string;
  label: string;
  type: 'text' | 'textarea';
  required: boolean;
  isBuiltin: boolean;
}

export interface CustomUseCase {
  id: string;
  title: string;
  prompt: string;
  fields: CustomUseCaseField[];
  createdAt: string;
}

// カスタムUCのメール生成入力
export interface CustomEmailInput {
  useCase: 'custom';
  useCaseId: string;
  customPrompt: string;
  companyName: string;
  department?: string;
  contactName?: string;
  contactRole?: string;
  senderName?: string;
  senderCompany?: string;
  senderEmail?: string;
  senderPhone?: string;
  customFields?: Record<string, string>;
}

export type AnyEmailGenerateInput = EmailGenerateInput | CustomEmailInput;

// アポイント依頼（本人直送）
export interface DirectAppointmentInput extends EmailBaseInput {
  useCase: 'direct-appointment';
  contactRole: string;           // 宛先の役職（必須）
  whyYouReason: string;          // 何を見たか（必須）
  currentInitiative: string;     // 取り組み・目指していること（必須）
  dataChallenge: string;         // データ活用基盤の課題（必須）
  domoSolution: string;          // DOMOで解決できること（必須）
  candidateDates?: string[];     // 候補日（カレンダーで複数選択）
}

// アポイント依頼（秘書あて）
export interface SecretaryAppointmentInput extends EmailBaseInput {
  useCase: 'secretary-appointment';
  secretaryName?: string;        // 秘書の名前（任意）
  targetRole: string;            // アポが欲しい人の役職（必須）
  targetName: string;            // アポが欲しい人の名前（必須）
  whyYouReason: string;          // 何を見たか（必須）
  currentInitiative: string;     // 取り組み・目指していること（必須）
  dataChallenge: string;         // データ活用基盤の課題（必須）
  domoSolution: string;          // DOMOで解決できること（必須）
  candidateDates?: string[];
}

// 名刺交換後の初回アプローチ
export interface BusinessCardFollowupInput extends EmailBaseInput {
  useCase: 'business-card-followup';
  // contactName は EmailBaseInput の任意項目を使用
}

// 別部署導入済み展開（プレースホルダー）
export interface OtherDeptExpansionInput extends EmailBaseInput {
  useCase: 'other-dept-expansion';
  existingDept?: string;
}

export type EmailGenerateInput =
  | DirectAppointmentInput
  | SecretaryAppointmentInput
  | BusinessCardFollowupInput
  | OtherDeptExpansionInput;

export interface EmailGenerateOutput {
  subject: string;
  body: string;
  useCase: EmailUseCase;
  generatedAt: string;
}

export interface EmailHistoryItem {
  id: string;
  companyName: string;
  useCase: EmailUseCase;
  subject: string;
  body: string;
  generatedAt: string;
}
