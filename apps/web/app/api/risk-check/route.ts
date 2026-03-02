import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@knoty/api-client';

const RequestSchema = z.object({
  from_id: z.string().uuid(),
  to_id:   z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const body: unknown = await req.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const { from_id, to_id } = parsed.data;

  if (from_id === to_id) {
    return NextResponse.json(
      { error: '請選擇兩個不同的人', code: 'SAME_PERSON' },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('find_relationship_paths', {
      p_from_id:   from_id,
      p_to_id:     to_id,
      p_max_depth: 3,
    });

    if (error) throw error;

    return NextResponse.json({
      paths:     data ?? [],
      pathCount: (data ?? []).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: message, code: 'DB_ERROR' },
      { status: 500 },
    );
  }
}
