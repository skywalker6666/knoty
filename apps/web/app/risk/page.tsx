import { createAdminClient } from '@knoty/api-client';
import { RiskAnalyzer } from '@/components/risk-analyzer';

const HARDCODED_UID = 'd52cc5d3-f761-43aa-8575-8dd2cf60fe99';

export default async function RiskPage() {
  const supabase = createAdminClient();
  const { data: persons } = await supabase
    .from('persons')
    .select('id, display_name, avatar_emoji')
    .eq('user_id', HARDCODED_UID)
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
