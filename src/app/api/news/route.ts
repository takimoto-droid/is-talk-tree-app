import { NextResponse } from 'next/server';

interface NewsItem {
  title: string;
  source: string;
  date: string;
  summary: string;
  relevance: 'high' | 'medium' | 'low';
  url: string;
}

interface GDELTArticle {
  url: string;
  title: string;
  seendate: string;
  socialimage?: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyName = searchParams.get('company');

  if (!companyName) {
    return NextResponse.json({ error: '会社名が必要です' }, { status: 400 });
  }

  try {
    const news = await fetchDXNews(companyName);
    return NextResponse.json({ news });
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json({ error: 'ニュース取得に失敗しました' }, { status: 500 });
  }
}

async function fetchDXNews(companyName: string): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];
  const seenUrls = new Set<string>();

  // GDELT APIで検索するキーワード（優先度順）
  const searchQueries = [
    `${companyName} システム 導入`,
    `${companyName} DX デジタル`,
    `${companyName} データ`,
    `${companyName}`,
  ];

  for (const query of searchQueries) {
    try {
      const news = await fetchGDELTNews(query);

      for (const item of news) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          const relevance = calculateRelevance(item.title);
          allNews.push({ ...item, relevance });
        }
      }
    } catch (error) {
      console.error('GDELT fetch error for query:', query, error);
    }

    // API制限を避けるため少し待機
    await new Promise(resolve => setTimeout(resolve, 200));

    // 十分な記事が取得できたら終了
    if (allNews.length >= 5) break;
  }

  // 関連度順にソート
  allNews.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.relevance] - order[b.relevance];
  });

  // GDELTで取得できなかった場合はGoogle Newsにフォールバック
  if (allNews.length === 0) {
    console.log('GDELT returned no results, falling back to Google News');
    return await fetchGoogleNewsResults(companyName);
  }

  return allNews.slice(0, 5);
}

async function fetchGDELTNews(query: string): Promise<Omit<NewsItem, 'relevance'>[]> {
  // GDELT DOC 2.0 API
  const encodedQuery = encodeURIComponent(query);
  const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodedQuery}&mode=artlist&maxrecords=10&format=json&sourcelang:japanese&sourcecountry:japan`;

  try {
    const response = await fetch(gdeltUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error('GDELT API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.articles || !Array.isArray(data.articles)) {
      return [];
    }

    return data.articles.map((article: GDELTArticle) => ({
      title: article.title || '',
      source: extractSourceName(article.domain),
      date: formatGDELTDate(article.seendate),
      summary: article.title || '',
      url: article.url,
    }));
  } catch (error) {
    console.error('GDELT fetch error:', error);
    return [];
  }
}

function extractSourceName(domain: string): string {
  if (!domain) return '';
  // ドメインからソース名を抽出（例: www.nikkei.com → nikkei.com）
  return domain.replace(/^www\./, '');
}

function formatGDELTDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    // GDELT format: YYYYMMDDTHHmmssZ
    const year = dateStr.substring(0, 4);
    const month = parseInt(dateStr.substring(4, 6), 10);
    const day = parseInt(dateStr.substring(6, 8), 10);
    return `${year}年${month}月${day}日`;
  } catch {
    return dateStr;
  }
}

// Google Newsへのフォールバック
async function fetchGoogleNewsResults(companyName: string): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];
  const seenUrls = new Set<string>();

  const searchQueries = [
    `${companyName} DX デジタル`,
    `${companyName} システム 導入`,
  ];

  for (const query of searchQueries) {
    const news = await fetchGoogleNews(query);

    for (const item of news) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        const relevance = calculateRelevance(item.title);
        allNews.push({ ...item, relevance });
      }
    }
  }

  allNews.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.relevance] - order[b.relevance];
  });

  return allNews.slice(0, 5);
}

function calculateRelevance(title: string): 'high' | 'medium' | 'low' {
  const titleLower = title.toLowerCase();
  let score = 0;

  // 最優先: システム/ツール導入関連（+5点）
  const toolKeywords = [
    '導入', '採用', '活用開始', '運用開始', '稼働',
    'システム', 'ツール', 'プラットフォーム', 'ソリューション',
    'bi', 'ダッシュボード', 'crm', 'erp', 'saas',
    'データ分析', 'データ収集', 'データ基盤', 'データ連携',
    '可視化', '自動化', '効率化',
  ];

  for (const kw of toolKeywords) {
    if (titleLower.includes(kw.toLowerCase())) {
      score += 5;
    }
  }

  // 高優先: DX/デジタル関連（+3点）
  const dxKeywords = [
    'dx', 'デジタル', 'デジタルトランスフォーメーション',
    'ai', '人工知能', '機械学習',
    'クラウド', 'aws', 'azure', 'gcp',
  ];

  for (const kw of dxKeywords) {
    if (titleLower.includes(kw.toLowerCase())) {
      score += 3;
    }
  }

  // 中優先: 経営/戦略関連（+2点）
  const businessKeywords = [
    '中期経営計画', '経営戦略', '事業戦略',
    'it戦略', 'it投資', 'デジタル戦略',
    '業務改革', '働き方改革',
  ];

  for (const kw of businessKeywords) {
    if (titleLower.includes(kw.toLowerCase())) {
      score += 2;
    }
  }

  // 低優先: 一般IT関連（+1点）
  const generalKeywords = [
    'it', 'テクノロジー', 'イノベーション',
    'サービス', 'ソフトウェア',
  ];

  for (const kw of generalKeywords) {
    if (titleLower.includes(kw.toLowerCase())) {
      score += 1;
    }
  }

  // スコアに基づいて関連度を決定
  if (score >= 8) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

async function fetchGoogleNews(query: string): Promise<Omit<NewsItem, 'relevance'>[]> {
  const encodedQuery = encodeURIComponent(query);
  const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=ja&gl=JP&ceid=JP:ja`;

  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseRSS(xml);
  } catch (error) {
    console.error('Google News fetch error:', error);
    return [];
  }
}

function parseRSS(xml: string): Omit<NewsItem, 'relevance'>[] {
  const items: Omit<NewsItem, 'relevance'>[] = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);

  if (!itemMatches) return items;

  for (const itemXml of itemMatches.slice(0, 3)) {
    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                       itemXml.match(/<title>(.*?)<\/title>/);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/) ||
                        itemXml.match(/<source[^>]*><!\[CDATA\[(.*?)\]\]><\/source>/);

    if (titleMatch && linkMatch) {
      const rawTitle = titleMatch[1];
      const titleParts = rawTitle.split(' - ');
      const title = titleParts.slice(0, -1).join(' - ') || rawTitle;
      const sourceName = sourceMatch ? sourceMatch[1] : (titleParts[titleParts.length - 1] || '');

      const pubDate = pubDateMatch ? pubDateMatch[1] : '';
      const formattedDate = formatDate(pubDate);

      items.push({
        title: cleanText(title),
        source: cleanText(sourceName),
        date: formattedDate,
        summary: cleanText(title),
        url: linkMatch[1],
      });
    }
  }

  return items;
}

function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  } catch {
    return dateStr;
  }
}
