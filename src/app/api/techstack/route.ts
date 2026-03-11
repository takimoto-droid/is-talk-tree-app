import { NextResponse } from 'next/server';

interface TechItem {
  name: string;
  category: string;
  description?: string;
}

interface BuiltWithResponse {
  Results?: Array<{
    Result?: {
      Paths?: Array<{
        Technologies?: Array<{
          Name: string;
          Tag?: string;
          Categories?: string[];
          Description?: string;
        }>;
      }>;
    };
    Meta?: {
      Vertical?: string;
      CompanyName?: string;
    };
  }>;
  groups?: Array<{
    name: string;
    categories?: Array<{
      name: string;
      live?: number;
    }>;
  }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'ドメインが必要です' }, { status: 400 });
  }

  const apiKey = process.env.BUILTWITH_API_KEY;

  if (!apiKey) {
    // APIキーがない場合はモックデータを返す
    console.log('BuiltWith API key not configured, returning mock data');
    return NextResponse.json({
      technologies: getMockTechStack(domain),
      source: 'mock',
      message: 'BuiltWith APIキーが設定されていません。環境変数BUILTWITH_API_KEYを設定してください。',
    });
  }

  try {
    const techStack = await fetchBuiltWithData(domain, apiKey);
    return NextResponse.json({
      technologies: techStack,
      source: 'builtwith',
    });
  } catch (error) {
    console.error('BuiltWith API error:', error);
    return NextResponse.json({
      technologies: getMockTechStack(domain),
      source: 'fallback',
      message: 'BuiltWith APIの取得に失敗しました。',
    });
  }
}

async function fetchBuiltWithData(domain: string, apiKey: string): Promise<TechItem[]> {
  // BuiltWith Free API endpoint
  const url = `https://api.builtwith.com/free1/api.json?KEY=${apiKey}&LOOKUP=${encodeURIComponent(domain)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  });

  if (!response.ok) {
    throw new Error(`BuiltWith API error: ${response.status}`);
  }

  const data: BuiltWithResponse = await response.json();
  const technologies: TechItem[] = [];

  // Free APIの場合はグループ情報のみ
  if (data.groups) {
    for (const group of data.groups) {
      if (group.categories) {
        for (const category of group.categories) {
          if (category.live && category.live > 0) {
            technologies.push({
              name: category.name,
              category: group.name,
            });
          }
        }
      }
    }
  }

  // Domain APIの場合は詳細なテクノロジー情報
  if (data.Results && data.Results[0]?.Result?.Paths) {
    for (const path of data.Results[0].Result.Paths) {
      if (path.Technologies) {
        for (const tech of path.Technologies) {
          technologies.push({
            name: tech.Name,
            category: tech.Categories?.[0] || tech.Tag || 'その他',
            description: tech.Description,
          });
        }
      }
    }
  }

  return technologies;
}

function getMockTechStack(domain: string): TechItem[] {
  // 一般的な企業サイトで使われそうな技術をモック
  const commonTech: TechItem[] = [
    { name: 'Google Analytics', category: 'Analytics' },
    { name: 'Google Tag Manager', category: 'Tag Manager' },
    { name: 'WordPress', category: 'CMS' },
  ];

  // ドメインに基づいて追加のモックデータ
  if (domain.includes('salesforce') || domain.includes('crm')) {
    commonTech.push({ name: 'Salesforce', category: 'CRM' });
  }
  if (domain.includes('aws') || domain.includes('amazon')) {
    commonTech.push({ name: 'Amazon Web Services', category: 'Cloud' });
  }

  return commonTech;
}
