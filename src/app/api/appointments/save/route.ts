import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const openaiApiKey = process.env.OPENAI_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company_name, industry, revenue, employees, memo } = body;

    if (!company_name) {
      return NextResponse.json({ error: '企業名は必須です' }, { status: 400 });
    }

    // Supabaseが設定されていない場合はモックモード
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('Mock mode: Saving appointment for', company_name);
      return NextResponse.json({
        success: true,
        message: 'アポ取得を記録しました（モックモード）',
        data: {
          id: `mock-${Date.now()}`,
          company_name,
          industry,
          revenue,
          employees,
          memo,
          date: new Date().toISOString().split('T')[0],
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Embeddingを生成（OpenAI APIが設定されている場合）
    let embedding: number[] | null = null;
    if (openaiApiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiApiKey });

        // 企業情報を文字列化してembedding生成
        const companyText = `
          企業名: ${company_name}
          業界: ${industry || '不明'}
          売上規模: ${revenue || '不明'}
          従業員数: ${employees || '不明'}
          メモ: ${memo || ''}
        `.trim();

        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: companyText,
        });

        embedding = embeddingResponse.data[0].embedding;
      } catch (embError) {
        console.error('Embedding generation failed:', embError);
      }
    }

    // データベースに保存
    const { data, error } = await supabase
      .from('appointment_successes')
      .insert({
        company_name,
        industry: industry || null,
        revenue: revenue || null,
        employees: employees || null,
        date: new Date().toISOString().split('T')[0],
        memo: memo || null,
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'データベース保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'アポ取得を記録しました',
      data,
    });

  } catch (error) {
    console.error('Save appointment error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
