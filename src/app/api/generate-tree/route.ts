import { NextResponse } from 'next/server';
import { generateTalkTree } from '@/lib/treeGenerator';
import { GenerateTreeRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const body: GenerateTreeRequest = await request.json();
    const { companyName } = body;

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json(
        { error: '会社名を入力してください' },
        { status: 400 }
      );
    }

    // トークツリーを生成
    const result = generateTalkTree(companyName);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating talk tree:', error);
    return NextResponse.json(
      { error: 'トークツリーの生成に失敗しました' },
      { status: 500 }
    );
  }
}
