import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  if (!code) {
    return NextResponse.redirect(new URL('/login', siteUrl));
  }

  const supabase = await createRouteClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth', siteUrl));
  }

  // Check if new user (no persons yet)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', siteUrl));
  }

  const { count } = await supabase
    .from('persons')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // count is null on DB error — treat as returning user to avoid redirect loop
  const destination = count === 0 ? '/onboarding' : '/';
  return NextResponse.redirect(new URL(destination, siteUrl));
}
