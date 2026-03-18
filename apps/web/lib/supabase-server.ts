import { cookies } from 'next/headers';
import { createServerClient } from '@knoty/api-client';

/**
 * Creates a Supabase client for API Routes and Server Components.
 * Uses @supabase/ssr cookie store so auth.uid() resolves correctly via RLS.
 * Always use this instead of createAdminClient() — the admin client bypasses RLS.
 */
export async function createRouteClient() {
  const cookieStore = await cookies();
  return createServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cs) =>
      cs.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options),
      ),
  });
}

/**
 * Auth check helper for API routes.
 * Returns the authenticated user or null.
 */
export async function getAuthUser(supabase: Awaited<ReturnType<typeof createRouteClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
