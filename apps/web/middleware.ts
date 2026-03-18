import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@knoty/api-client';

// All /api/* routes handle their own auth and return JSON 401 — do NOT redirect them.
// Only redirect browser navigations (non-API routes).
const PUBLIC_PATHS = ['/login', '/auth/callback', '/api/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // createServerClient with cookie read/write for session refresh
  const supabase = createServerClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cs) =>
      cs.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options),
      ),
  });

  // Refresh session (required by @supabase/ssr)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
