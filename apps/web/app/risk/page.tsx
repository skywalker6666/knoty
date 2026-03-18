import { createRouteClient, getAuthUser } from '@/lib/supabase-server';
import { RiskAnalyzer } from '@/components/risk-analyzer';

export default async function RiskPage() {
  const supabase = await createRouteClient();
  const user = await getAuthUser(supabase);
  if (!user) return null; // middleware handles redirect, this is a fallback

  const { data: persons } = await supabase
    .from('persons')
    .select('id, display_name, avatar_emoji')
    .eq('user_id', user.id)
    .order('display_name');

  return (
    <main className="flex-1 pb-20">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-zinc-100 px-4 py-3">
        <h1 className="text-lg font-bold text-zinc-800">🔍 風險查詢</h1>
      </header>
      <RiskAnalyzer persons={persons ?? []} />
    </main>
  );
}
