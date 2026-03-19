import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// テーブル作成用SQL（参考）
/*
-- アポ成功企業テーブル
CREATE TABLE IF NOT EXISTS appointment_successes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  industry TEXT,
  revenue TEXT,
  employees TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  memo TEXT,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- pgvector拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- 類似検索用インデックス
CREATE INDEX IF NOT EXISTS idx_appointment_embedding ON appointment_successes
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
*/
