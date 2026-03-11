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
  industry?: IndustryCategory;
  estimatedIndustry?: IndustryCategory;
  news?: NewsItem[];
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
