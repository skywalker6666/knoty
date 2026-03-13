import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@knoty/api-client';

// Sprint 0: no auth yet — hardcoded test user UID.
// Replace with session.user.id once Supabase Auth is wired up.
const HARDCODED_UID = 'd52cc5d3-f761-43aa-8575-8dd2cf60fe99';

// z.string().uuid() in Zod v4 enforces strict RFC 4122 version/variant bits.
// Seed data uses non-RFC-4122 UUIDs (e.g. b0000001-...), so we validate
// format only. These IDs come from the DB, so format check is sufficient.
const uuidFormat = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
);
const RequestSchema = z.object({
  from_id: uuidFormat,
  to_id:   uuidFormat,
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
      p_user_id:   HARDCODED_UID,  // Sprint 0: admin client has no session → auth.uid() = NULL
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
