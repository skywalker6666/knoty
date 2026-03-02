import { createAdminClient } from '@knoty/api-client';

export default async function GraphPage() {
  const HARDCODED_UID = 'd52cc5d3-f761-43aa-8575-8dd2cf60fe99';
  const supabase = createAdminClient();

  const [{ data: persons }, { data: relationships }] = await Promise.all([
    supabase
      .from('persons')
      .select('id, display_name, avatar_emoji, circles')
      .eq('user_id', HARDCODED_UID),
    supabase
      .from('relationships')
      .select('id, person_a, person_b, closeness, label, direction')
      .eq('user_id', HARDCODED_UID),
  ]);

  const nodeCount = persons?.length ?? 0;
  const edgeCount = relationships?.length ?? 0;

  return (
    <main className="flex-1 pb-20">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-zinc-800">🕸️ 圖譜探索</h1>
        {/* 模式切換 */}
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 text-xs font-medium">
          <button className="px-2.5 py-1 bg-white rounded-md shadow-sm text-zinc-700">
            單中心
          </button>
          <button className="px-2.5 py-1 text-zinc-400">
            多中心
          </button>
          <button className="px-2.5 py-1 text-zinc-400">
            團體
          </button>
        </div>
      </header>

      {/* Sprint 0 DB 驗證統計 */}
      <div className="mx-4 mt-3 p-3 rounded-xl bg-violet-50 border border-violet-100 flex items-center gap-6">
        <div className="text-center flex-1">
          <div className="text-2xl font-bold text-violet-700">{nodeCount}</div>
          <div className="text-xs text-zinc-500">人物節點</div>
        </div>
        <div className="w-px h-8 bg-violet-200" />
        <div className="text-center flex-1">
          <div className="text-2xl font-bold text-violet-700">{edgeCount}</div>
          <div className="text-xs text-zinc-500">關係邊</div>
        </div>
        <div className="w-px h-8 bg-violet-200" />
        <div className="text-center flex-1">
          <div className="text-xs text-zinc-400">D3 圖譜</div>
          <div className="text-xs text-violet-600 font-medium">Sprint 1</div>
        </div>
      </div>

      {/* 節點列表 — Sprint 1 換成 D3 canvas */}
      <div className="mx-4 mt-4 space-y-2 pb-4">
        {(persons ?? []).map((p: {
          id: string; display_name: string; avatar_emoji: string; circles: string[];
        }) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-100">
            <span className="text-xl">{p.avatar_emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-800">{p.display_name}</div>
              <div className="text-xs text-zinc-400">{(p.circles ?? []).join('・')}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
