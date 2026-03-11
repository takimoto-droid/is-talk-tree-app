import * as XLSX from 'xlsx';
import { ProjectConfig, CaseStudy, ObjectionHandler } from '@/types';

export function parseProjectExcel(file: ArrayBuffer): ProjectConfig {
  const workbook = XLSX.read(file, { type: 'array' });

  // 製品情報シート
  const productSheet = workbook.Sheets['製品情報'] || workbook.Sheets[workbook.SheetNames[0]];
  const productData = XLSX.utils.sheet_to_json<string[]>(productSheet, { header: 1 }) as string[][];

  // 導入事例シート
  const caseSheet = workbook.Sheets['導入事例'] || workbook.Sheets[workbook.SheetNames[1]];
  const caseData = caseSheet ? XLSX.utils.sheet_to_json<Record<string, string>>(caseSheet) : [];

  // 反論対応シート
  const objectionSheet = workbook.Sheets['反論対応'] || workbook.Sheets[workbook.SheetNames[2]];
  const objectionData = objectionSheet ? XLSX.utils.sheet_to_json<Record<string, string>>(objectionSheet) : [];

  // 製品情報をパース
  const productInfo = parseProductInfo(productData);

  // 導入事例をパース
  const caseStudies = parseCaseStudies(caseData);

  // 反論対応をパース
  const objectionHandlers = parseObjectionHandlers(objectionData);

  return {
    ...productInfo,
    caseStudies,
    objectionHandlers: objectionHandlers.length > 0 ? objectionHandlers : getDefaultObjectionHandlers(productInfo.productName),
  };
}

function parseProductInfo(data: string[][]): Omit<ProjectConfig, 'caseStudies' | 'objectionHandlers'> {
  const getValue = (key: string): string => {
    const row = data.find(r => r[0] === key);
    return row ? (row[1] || '') : '';
  };

  const getArrayValue = (key: string): string[] => {
    const value = getValue(key);
    return value ? value.split(/[,、\n]/).map(s => s.trim()).filter(Boolean) : [];
  };

  return {
    productName: getValue('製品名') || getValue('サービス名') || 'サービス',
    productNameKana: getValue('製品名（カナ）') || getValue('読み方'),
    companyName: getValue('会社名') || getValue('企業名') || '弊社',
    headquarters: getValue('本社所在地') || getValue('本社'),
    productDescription: getValue('製品説明') || getValue('サービス説明') || '',
    keyFeatures: getArrayValue('主な機能') || getArrayValue('特徴'),
    targetIndustries: getArrayValue('対象業界') || getArrayValue('ターゲット業界'),
    meetingDuration: getValue('商談時間') || '1時間',
    meetingAgenda: getArrayValue('商談アジェンダ') || getArrayValue('アジェンダ'),
    searchKeywords: getArrayValue('検索キーワード') || getArrayValue('ニュースキーワード'),
  };
}

function parseCaseStudies(data: Record<string, string>[]): CaseStudy[] {
  return data.map((row, idx) => ({
    id: 'case-' + (idx + 1),
    companyName: row['企業名'] || row['会社名'] || row['導入企業'] || '',
    industry: row['業界'] || row['業種'] || 'その他',
    subIndustry: row['サブ業界'] || row['業界詳細'],
    challenge: row['課題'] || row['導入前の課題'] || '',
    solution: row['ソリューション'] || row['導入内容'] || row['解決策'] || '',
    result: row['成果'] || row['効果'] || row['導入効果'] || '',
    quote: row['お客様の声'] || row['コメント'],
    url: row['URL'] || row['事例URL'] || row['リンク'] || '',
  })).filter(c => c.companyName && c.challenge);
}

function parseObjectionHandlers(data: Record<string, string>[]): ObjectionHandler[] {
  const typeMap: Record<string, 'busy' | 'budget' | 'timing' | 'competitor' | 'authority'> = {
    '忙しい': 'busy',
    '今忙しい': 'busy',
    '予算': 'budget',
    '予算がない': 'budget',
    'タイミング': 'timing',
    'タイミングが悪い': 'timing',
    '他社': 'competitor',
    '他社検討中': 'competitor',
    '決裁権': 'authority',
    '決裁権がない': 'authority',
  };

  return data.map(row => {
    const label = row['反論タイプ'] || row['パターン'] || row['ラベル'] || '';
    return {
      type: typeMap[label] || 'busy',
      label: label,
      response: row['切り返しトーク'] || row['対応トーク'] || row['回答'] || '',
      followUp: row['フォローアップ'] || row['追加トーク'] || '',
    };
  }).filter(o => o.label && o.response);
}

function getDefaultObjectionHandlers(productName: string): ObjectionHandler[] {
  return [
    {
      type: 'busy',
      label: '今忙しい',
      response: 'お忙しいところ恐れ入ります。実は、お忙しい企業様ほど、' + productName + 'による業務効率化の効果を実感いただいております。',
      followUp: '30秒だけお時間いただけますでしょうか？',
    },
    {
      type: 'budget',
      label: '予算がない',
      response: '予算についてのご懸念、よく伺います。' + productName + 'は導入により平均してコスト削減効果があり、多くの企業様でROIを実感されています。',
      followUp: '御社の現状の課題をお聞かせいただければ、どの程度の効果が見込めるかご説明できます。',
    },
    {
      type: 'timing',
      label: 'タイミングが悪い',
      response: 'タイミングについてですね。実は、来期の予算策定時期こそ、検討に最適なタイミングです。',
      followUp: '今のうちに情報収集していただくことで、いざ検討される際にスムーズに進められます。',
    },
    {
      type: 'competitor',
      label: '他社検討中',
      response: '他社様もご検討中とのこと、比較検討は重要ですね。' + productName + 'は多くの企業様で高い評価をいただいております。',
      followUp: '比較検討の材料として、他社様との違いを整理した資料をお送りできればと思います。',
    },
    {
      type: 'authority',
      label: '決裁権がない',
      response: 'ご担当者様のお立場でのご検討、ありがとうございます。むしろ現場の方からボトムアップでご検討いただくケースも多いです。',
      followUp: '上長の方へのご説明用に、ROI試算や導入事例をまとめた資料をご用意できます。',
    },
  ];
}

// サンプルExcelテンプレートのダウンロード用
export function generateTemplateExcel(): Blob {
  const workbook = XLSX.utils.book_new();

  // 製品情報シート
  const productData = [
    ['項目', '値'],
    ['製品名', 'DOMO'],
    ['製品名（カナ）', 'ドーモ'],
    ['会社名', 'DOMO株式会社'],
    ['本社所在地', 'アメリカ ユタ州'],
    ['製品説明', 'データ活用クラウドプラットフォーム'],
    ['主な機能', 'データ連携、ダッシュボード、レポート自動化、リアルタイム分析'],
    ['対象業界', '製造、金融、小売、IT、通信'],
    ['商談時間', '1時間'],
    ['商談アジェンダ', '製品紹介（15分）、デモ（30分）、質疑応答（15分）'],
    ['検索キーワード', 'システム導入、DX、データ分析、BI、ダッシュボード'],
  ];
  const productSheet = XLSX.utils.aoa_to_sheet(productData);
  productSheet['!cols'] = [{ wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, productSheet, '製品情報');

  // 導入事例シート
  const caseData = [
    ['企業名', '業界', '課題', '成果', 'URL'],
    ['パナソニック', '製造', '複数の事業部門にまたがるデータの統合と可視化が困難だった', 'データドリブンな意思決定が可能になり、レポート作成時間を80%削減', 'https://www.domo.com/jp/customers/panasonic'],
    ['KDDI', '通信', '膨大な顧客データと通信データの分析に時間がかかっていた', '顧客行動の即時把握が可能になり、解約率を15%改善', 'https://www.domo.com/jp/customers/kddi'],
    ['ソフトバンク', '通信', '多角化した事業のKPI管理が複雑化していた', '経営会議の準備時間を90%削減、リアルタイム経営を実現', 'https://www.domo.com/jp/customers/softbank'],
  ];
  const caseSheet = XLSX.utils.aoa_to_sheet(caseData);
  caseSheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 40 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(workbook, caseSheet, '導入事例');

  // 反論対応シート
  const objectionData = [
    ['反論タイプ', '切り返しトーク', 'フォローアップ'],
    ['今忙しい', 'お忙しいところ恐れ入ります。実は、お忙しい企業様ほど、業務効率化の効果を実感いただいております。', '30秒だけお時間いただけますでしょうか？'],
    ['予算がない', '予算についてのご懸念、よく伺います。導入により平均して年間数千万円のコスト削減効果があります。', '御社の現状の課題をお聞かせいただければ、コスト削減シミュレーションをご提示できます。'],
    ['タイミングが悪い', 'タイミングについてですね。実は、来期の予算策定時期こそ、検討に最適なタイミングです。', '今のうちに情報収集していただくことで、スムーズに進められます。'],
    ['他社検討中', '他社様もご検討中とのこと、比較検討は重要ですね。', '比較検討の材料として、他社様との違いを整理した資料をお送りできます。'],
    ['決裁権がない', 'ご担当者様のお立場でのご検討、ありがとうございます。現場からのボトムアップも多いです。', '上長の方へのご説明用資料をご用意できます。'],
  ];
  const objectionSheet = XLSX.utils.aoa_to_sheet(objectionData);
  objectionSheet['!cols'] = [{ wch: 15 }, { wch: 60 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, objectionSheet, '反論対応');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// デフォルトのDOMO設定
export function getDefaultProjectConfig(): ProjectConfig {
  return {
    productName: 'DOMO',
    productNameKana: 'ドーモ',
    companyName: 'DOMO株式会社',
    headquarters: 'アメリカ ユタ州',
    productDescription: 'データ活用クラウドプラットフォーム',
    keyFeatures: ['データ連携', 'ダッシュボード', 'レポート自動化', 'リアルタイム分析'],
    targetIndustries: ['製造', '金融', '小売', 'IT', '通信'],
    meetingDuration: '1時間',
    meetingAgenda: ['製品紹介（15分）', 'デモ（30分）', '質疑応答（15分）'],
    searchKeywords: ['システム導入', 'DX', 'データ分析', 'BI', 'ダッシュボード'],
    caseStudies: [],
    objectionHandlers: getDefaultObjectionHandlers('DOMO'),
  };
}
