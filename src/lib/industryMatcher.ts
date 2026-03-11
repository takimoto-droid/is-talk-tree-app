import { CaseStudy, IndustryCategory } from '@/types';
import { caseStudies, industryKeywords } from '@/data/caseStudies';

// 会社名から業界を推定
export function estimateIndustry(companyName: string): IndustryCategory {
  const name = companyName.toLowerCase();

  // 業界キーワードでマッチング
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    for (const keyword of keywords) {
      if (name.includes(keyword.toLowerCase())) {
        return industry as IndustryCategory;
      }
    }
  }

  // 会社名の特徴でマッチング
  if (name.includes('銀行') || name.includes('証券') || name.includes('保険') || name.includes('ファイナンス')) {
    return '金融・保険';
  }
  if (name.includes('電機') || name.includes('工業') || name.includes('製作所') || name.includes('自動車') || name.includes('モーター')) {
    return '製造・エレクトロニクス';
  }
  if (name.includes('ストア') || name.includes('マート') || name.includes('百貨店') || name.includes('小売')) {
    return '小売・流通';
  }
  if (name.includes('コンサル') || name.includes('総研') || name.includes('研究所')) {
    return 'コンサルティング';
  }
  if (name.includes('メディア') || name.includes('放送') || name.includes('広告') || name.includes('出版')) {
    return 'メディア・エンターテイメント';
  }
  if (name.includes('テクノロジー') || name.includes('システム') || name.includes('ソフト') || name.includes('データ')) {
    return '通信・IT';
  }

  return 'その他';
}

// 業界に基づいて類似事例を取得
export function getMatchedCases(industry: IndustryCategory, limit: number = 3): CaseStudy[] {
  // 同じ業界の事例を優先
  const sameindustryCases = caseStudies.filter(c => c.industry === industry);

  if (sameindustryCases.length >= limit) {
    return sameindustryCases.slice(0, limit);
  }

  // 足りない場合は他の業界から補完
  const otherCases = caseStudies.filter(c => c.industry !== industry);
  const additionalCases = otherCases.slice(0, limit - sameindustryCases.length);

  return [...sameindustryCases, ...additionalCases];
}

// 業界に最も関連性の高い事例を1つ取得
export function getBestMatchCase(industry: IndustryCategory): CaseStudy {
  const matchedCases = caseStudies.filter(c => c.industry === industry);

  if (matchedCases.length > 0) {
    // ランダムに1つ選択（実際のアプリでは関連性スコアで選択）
    return matchedCases[Math.floor(Math.random() * matchedCases.length)];
  }

  // マッチする事例がない場合はランダムに選択
  return caseStudies[Math.floor(Math.random() * caseStudies.length)];
}

// 業界名を日本語で取得
export function getIndustryLabel(industry: IndustryCategory): string {
  const labels: Record<IndustryCategory, string> = {
    '通信・IT': '通信・IT業界',
    '製造・エレクトロニクス': '製造・エレクトロニクス業界',
    '金融・保険': '金融・保険業界',
    '小売・流通': '小売・流通業界',
    'コンサルティング': 'コンサルティング業界',
    'メディア・エンターテイメント': 'メディア・エンターテイメント業界',
    'その他': '業界',
  };
  return labels[industry] || '業界';
}
