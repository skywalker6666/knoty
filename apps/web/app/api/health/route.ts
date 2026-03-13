import { createBrowserClient } from '@knoty/api-client';
import { NextResponse } from 'next/server';

// GET /api/health
// 測試 Supabase 連線：查詢 circle_templates（系統模板不需要登入）
export async function GET() {
  try {
    const supabase = createBrowserClient();

    const { data, error, count } = await supabase
      .from('circle_templates')
      .select('id, name, is_system', { count: 'exact' })
      .eq('is_system', true)
      .limit(10);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, hint: error.hint ?? null },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      supabase: 'connected',
      systemTemplates: count,
      sample: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error && err.cause instanceof Error
      ? err.cause.message
      : String((err as { cause?: unknown } | null)?.cause ?? '');
    return NextResponse.json(
      { ok: false, error: message, cause },
      { status: 500 },
    );
  }
}
