import * as XLSX from 'xlsx';
import { ProjectConfig, CaseStudy, ObjectionHandler } from '@/types';

export function parseProjectExcel(file: ArrayBuffer): ProjectConfig {
  try {
    const workbook = XLSX.read(file, { type: 'array' });

    // 製品情報シート
    const productSheet = workbook.Sheets['製品情報'] || workbook.Sheets[workbook.SheetNames[0]];
    const productData = productSheet ? XLSX.utils.sheet_to_json<string[]>(productSheet, { header: 1 }) as string[][] : [];

    // 導入事例シート（特殊形式に対応）
    const caseSheet = workbook.Sheets['導入事例'] || workbook.Sheets[workbook.SheetNames[1]];
    const caseRawData = caseSheet ? XLSX.utils.sheet_to_json<string[]>(caseSheet, { header: 1 }) as (string | null)[][] : [];

    // 反論対応シート
    const objectionSheet = workbook.Sheets['反論対応'] || workbook.Sheets[workbook.SheetNames[2]];
    const objectionData = objectionSheet ? XLSX.utils.sheet_to_json<Record<string, string>>(objectionSheet) : [];

    // 製品情報をパース
    const productInfo = parseProductInfo(productData);

    // 導入事例シートから追加情報を抽出
    const caseSheetInfo = parseCaseSheetInfo(caseRawData);

    // 導入事例をパース（新形式対応）
    const caseStudies = parseCaseStudiesNewFormat(caseRawData, caseSheetInfo.mainFeatures);

    // 反論対応をパース
    const objectionHandlers = parseObjectionHandlers(objectionData);

    return {
      ...productInfo,
      productDescription: caseSheetInfo.domoIntro || productInfo.productDescription,
      keyFeatures: caseSheetInfo.mainFeatures ? [caseSheetInfo.mainFeatures] : productInfo.keyFeatures,
      caseStudies,
      objectionHandlers: objectionHandlers.length > 0 ? objectionHandlers : getDefaultObjectionHandlers(productInfo.productName),
      // 追加の情報
      competitiveDiff: caseSheetInfo.competitiveDiff,
    } as ProjectConfig;
  } catch (error) {
    console.error('Excel parsing error:', error);
    // エラー時はデフォルト設定を返す
    return getDefaultProjectConfig();
  }
}

// 導入事例シートから紹介文、主な特徴、競合差別化を抽出
function parseCaseSheetInfo(data: (string | null)[][]): {
  domoIntro: string;
  mainFeatures: string;
  competitiveDiff: string;
} {
  let domoIntro = '';
  let mainFeatures = '';
  let competitiveDiff = '';

  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const firstCell = String(row[0] || '');

    // DOMO紹介文の次の行
    if (firstCell === 'Domo紹介文' && data[i + 1]) {
      domoIntro = String(data[i + 1][0] || '');
    }
    // 主な特徴の次の行
    if (firstCell === '主な特徴' && data[i + 1]) {
      mainFeatures = String(data[i + 1][0] || '');
    }
    // 競合ツールとの差別化の次の行
    if (firstCell === '競合ツールとの差別化' && data[i + 1]) {
      competitiveDiff = String(data[i + 1][0] || '');
    }
  }

  return { domoIntro, mainFeatures, competitiveDiff };
}

// 新形式の導入事例をパース（業界, 企業名, 具体 の形式）
function parseCaseStudiesNewFormat(data: (string | null)[][], mainFeatures: string): CaseStudy[] {
  const cases: CaseStudy[] = [];
  let currentIndustry = '';

  // ヘッダー行を探す
  let startRow = 0;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && row[0] && String(row[0]).includes('導入事例') && String(row[1]) === '企業名') {
      startRow = i + 1;
      break;
    }
  }

  // 導入事例をパース
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    // 業界（nullの場合は前の業界を継承）
    if (row[0]) {
      currentIndustry = String(row[0]);
    }

    // 企業名
    const companyName = row[1] ? String(row[1]) : '';
    if (!companyName) continue;

    // 具体的な内容
    const details = row[2] ? String(row[2]) : '';

    cases.push({
      id: 'case-' + (cases.length + 1),
      companyName: companyName,
      industry: currentIndustry,
      challenge: details,
      solution: '',
      result: details,
      url: '',
      mainFeatures: mainFeatures,
    });
  }

  return cases;
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
    // 新しいフィールド
    companyFeatures: row['会社特徴'] || row['企業特徴'] || row['特徴'] || '',
    mainFeatures: row['主な特徴'] || row['製品特徴'] || row['機能特徴'] || '',
    competitors: row['競合'] || row['競合他社'] || row['競合製品'] || '',
  })).filter(c => c.companyName);
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
    ['企業名', '業界', '課題', '成果', '会社特徴', '主な特徴', '競合', 'URL'],
    ['パナソニック', '製造', '複数の事業部門にまたがるデータの統合と可視化が困難だった', 'データドリブンな意思決定が可能になり、レポート作成時間を80%削減', '総合電機メーカーとしてグローバル展開', 'データ連携1000種類以上、リアルタイム可視化', 'Tableau, Power BI', 'https://www.domo.com/jp/customers/panasonic'],
    ['KDDI', '通信', '膨大な顧客データと通信データの分析に時間がかかっていた', '顧客行動の即時把握が可能になり、解約率を15%改善', '携帯通信事業を中心に多角化経営', '大量データ処理、モバイル対応ダッシュボード', 'Salesforce, SAP', 'https://www.domo.com/jp/customers/kddi'],
    ['ソフトバンク', '通信', '多角化した事業のKPI管理が複雑化していた', '経営会議の準備時間を90%削減、リアルタイム経営を実現', 'IT・通信・投資など多角的事業展開', '全社KPI一元管理、アラート機能', 'Microsoft Power BI', 'https://www.domo.com/jp/customers/softbank'],
  ];
  const caseSheet = XLSX.utils.aoa_to_sheet(caseData);
  caseSheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 40 }, { wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 50 }];
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
