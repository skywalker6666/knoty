'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createBrowserClient } from '@knoty/api-client';

function LoginForm() {
  const supabase = createBrowserClient();
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl">🔗</div>
        <h1 className="text-2xl font-bold text-violet-700">Knoty</h1>
        <p className="text-sm text-zinc-500">理清人際，避開地雷</p>
      </div>

      {authError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          登入失敗，請再試一次。
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-100 p-6">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: { brand: '#7c3aed', brandAccent: '#6d28d9' },
                radii: { borderRadiusButton: '0.75rem', inputBorderRadius: '0.75rem' },
              },
            },
          }}
          providers={['google']}
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`}
          localization={{
            variables: {
              sign_in: {
                email_label: '電子郵件',
                password_label: '密碼',
                button_label: '登入',
                social_provider_text: '使用 {{provider}} 登入',
              },
              sign_up: {
                email_label: '電子郵件',
                password_label: '密碼',
                button_label: '建立帳號',
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <Suspense fallback={<div className="text-sm text-zinc-400">載入中...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
