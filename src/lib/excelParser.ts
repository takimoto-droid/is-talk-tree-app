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
    ['製品名', '（製品・サービス名を入力）'],
    ['製品名（カナ）', '（読み方を入力）'],
    ['会社名', '（御社名を入力）'],
    ['本社所在地', '（本社所在地を入力）'],
    ['製品説明', '（製品の簡単な説明を入力）'],
    ['対象業界', '製造、金融、小売、IT、通信'],
    ['商談時間', '1時間'],
    ['検索キーワード', 'システム導入、DX、データ分析'],
  ];
  const productSheet = XLSX.utils.aoa_to_sheet(productData);
  productSheet['!cols'] = [{ wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, productSheet, '製品情報');

  // 導入事例シート（新形式）
  const caseData = [
    ['製品紹介文'],
    ['（ここに製品・サービスの紹介文を入力してください）\n\n例：\n○○は、企業内に散在するあらゆるデータをリアルタイムで一元化し、\n全社員が即座に意思決定・行動できる環境を実現するプラットフォームです。\n20XX年に創業。現在、世界○○社以上が導入しています。'],
    ['主な特徴'],
    ['（製品の主な特徴を入力してください）\n\n例：\n① データ接続・統合\n・多数のコネクターを標準搭載\n・各種システムとノーコードで接続\n・リアルタイム同期により常に最新データを参照可能\n\n② ダッシュボード・可視化\n・ドラッグ＆ドロップで誰でも構築可能\n・PC・スマートフォン全デバイス対応\n\n③ アクション連携\n・異常値検知時の自動アラート通知\n・Slack・Teams・メールへの即時連携\n\n④ AI・高度分析\n・自然言語でデータに質問できるAI機能\n・予測分析・機械学習モデルの構築が可能\n\n⑤ セキュリティ\n・主要セキュリティ認証に対応\n・細粒度アクセス権限管理'],
    ['競合ツールとの差別化'],
    ['（競合製品との差別化ポイントを入力してください）\n\n例：\n・競合製品Aと比較して、データ接続の範囲と即時性において優位性がある\n・競合製品Bはデータの可視化には優れるが、別途ツールが必要になるケースが多い\n・本製品はワンプラットフォームで完結する設計\n・ノーコードでの構築が可能で現場担当者が自ら作成・改修できる'],
    [],
    ['導入事例 - 業界', '企業名', '具体'],
    [],
    ['通信・テクノロジー', '○○通信', 'DX推進の一環として導入。\nコスト削減を実現し、データの管理項目数は従来の4倍に拡大。'],
    ['', '△△テック', '自動化されたデータフロー機能を活用し、数百時間の手動作業を削減。'],
    ['製造・家電', '□□電機', 'SNS上の顧客の声を集約・分析。\nFAQ改善サイクルを加速し、顧客満足度向上。'],
    ['', '◇◇工業', '品質監査の工数を20時間から1分へ99.9%削減。'],
    ['金融', '○○銀行', '厳格なセキュリティ要件を満たしながら導入。\nCPA（顧客獲得単価）を16%低下させながら顧客の質も向上。'],
    ['小売・流通', '△△ストア', '店舗運営データを一元管理し迅速な意思決定を実現。'],
    ['物流', '□□ロジ', 'DX人材育成を開始。現場のExcel担当者をデータ活用人材に変革。'],
    ['ITサービス', '◇◇システム', '自社BI内製開発から切り替え、年間数千万円のコスト削減を実現。'],
    ['メディア・広告', '○○メディア', '広告データの処理時間を2〜3日から2〜3時間へ短縮。'],
    ['不動産・建設', '△△不動産', '資料請求から契約に至る購買サイクル全体をリアルタイムで把握。'],
    ['旅行・観光', '□□トラベル', '商材ごとに分散していたシステムとデータを一元化。売上機会の発掘につなげた。'],
    ['コンサルティング', '◇◇コンサル', '一人当たりの粗利生産性20%アップを実現。一部業務では最大90%の削減効果。'],
  ];
  const caseSheet = XLSX.utils.aoa_to_sheet(caseData);
  caseSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 80 }];
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
