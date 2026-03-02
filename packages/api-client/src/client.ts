import {
  createBrowserClient as supabaseBrowser,
  createServerClient as supabaseServer,
  type CookieOptions,
} from '@supabase/ssr';

const getEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
};

/**
 * For Next.js Client Components and React Native.
 * Creates a new Supabase client on every call — safe to call inside components.
 */
export function createBrowserClient() {
  return supabaseBrowser(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'),
  );
}

/**
 * Cookie store interface for Next.js Server Components / API Routes.
 * Uses getAll/setAll — required by @supabase/ssr ≥ 0.5 (replaces deprecated get/set/remove).
 *
 * Usage (Server Component):
 *   import { cookies } from 'next/headers';
 *   const store = await cookies();
 *   const supabase = createServerClient({
 *     getAll: () => store.getAll(),
 *     setAll: (cs) => cs.forEach(({ name, value, options }) => store.set(name, value, options)),
 *   });
 */
export interface CookieStore {
  getAll(): { name: string; value: string }[];
  setAll(cookies: { name: string; value: string; options: CookieOptions }[]): void;
}

/**
 * For Next.js Server Components and API Routes.
 * Reads/writes auth cookies via the provided cookie store.
 */
export function createServerClient(cookieStore: CookieStore) {
  return supabaseServer(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'),
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cs: { name: string; value: string; options: CookieOptions }[]) {
          cookieStore.setAll(cs);
        },
      },
    },
  );
}
