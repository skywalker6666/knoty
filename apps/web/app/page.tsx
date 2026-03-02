import { createAdminClient } from '@knoty/api-client';

// ─── Sprint 0 hardcoded user ─────────────────────────────────────────────────
const HARDCODED_UID = 'd52cc5d3-f761-43aa-8575-8dd2cf60fe99';

// ─── 圈子樣式 mapping ────────────────────────────────────────────────────────
const CIRCLE_STYLES: Record<string, {
  emoji: string; bg: string; text: string; border: string;
}> = {
  '社團':  { emoji: '🎭', bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  '班上':  { emoji: '📚', bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200'   },
  '宿舍':  { emoji: '🏠', bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200'  },
  '打工':  { emoji: '💼', bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200'},
  '朋友圈':{ emoji: '🤝', bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-200'   },
};
const DEFAULT_CIRCLE_STYLE = { emoji: '⭕', bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-200' };

// ─── 事件樣式 mapping ────────────────────────────────────────────────────────
const EVENT_STYLE: Record<string, {
  emoji: string; typeLabel: string;
  badgeBg: string; badgeText: string;
  cardBg: string; cardBorder: string;
}> = {
  favor:     { emoji: '🤝', typeLabel: '幫助',   badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', cardBg: 'bg-emerald-50', cardBorder: 'border-emerald-100' },
  conflict:  { emoji: '⚔️', typeLabel: '衝突',   badgeBg: 'bg-red-100',     badgeText: 'text-red-700',     cardBg: 'bg-red-50',     cardBorder: 'border-red-100'     },
  betrayal:  { emoji: '🗡️', typeLabel: '背刺',   badgeBg: 'bg-orange-100',  badgeText: 'text-orange-700',  cardBg: 'bg-orange-50',  cardBorder: 'border-orange-100'  },
  reconcile: { emoji: '🕊️', typeLabel: '和解',   badgeBg: 'bg-sky-100',     badgeText: 'text-sky-700',     cardBg: 'bg-sky-50',     cardBorder: 'border-sky-100'     },
  milestone: { emoji: '🏆', typeLabel: '里程碑', badgeBg: 'bg-amber-100',   badgeText: 'text-amber-700',   cardBg: 'bg-amber-50',   cardBorder: 'border-amber-100'   },
  note:      { emoji: '📝', typeLabel: '備忘',   badgeBg: 'bg-zinc-100',    badgeText: 'text-zinc-600',    cardBg: 'bg-white',      cardBorder: 'border-zinc-100'    },
};

// ─── 時間相對顯示 ────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  return `${days} 天前`;
}

// ─── Impact 顯示（-3..+3）───────────────────────────────────────────────────
function ImpactBadge({ impact }: { impact: number }) {
  if (impact === 0) return null;
  const positive = impact > 0;
  return (
    <span
      className={`text-xs font-bold tabular-nums ${
        positive ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      {positive ? `+${impact}` : impact}
    </span>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const supabase = createAdminClient();

  // Task 2: Aggregate circles from persons
  const { data: persons } = await supabase
    .from('persons')
    .select('circles')
    .eq('user_id', HARDCODED_UID);

  const circleCountMap = new Map<string, number>();
  for (const p of persons ?? []) {
    for (const c of (p.circles as string[]) ?? []) {
      circleCountMap.set(c, (circleCountMap.get(c) ?? 0) + 1);
    }
  }

  // Task 3: Fetch latest 5 events
  const { data: events } = await supabase
    .from('events')
    .select('id, event_type, description, impact, occurred_at, involved_persons')
    .eq('user_id', HARDCODED_UID)
    .order('occurred_at', { ascending: false })
    .limit(5);

  // Batch-fetch person names for all involved persons
  const allPersonIds = [...new Set(
    (events ?? []).flatMap((e: { involved_persons: string[] }) => e.involved_persons),
  )];

  const { data: involvedPersons } = allPersonIds.length > 0
    ? await supabase
        .from('persons')
        .select('id, display_name')
        .in('id', allPersonIds)
    : { data: [] as { id: string; display_name: string }[] };

  const personNameMap = new Map(
    (involvedPersons ?? []).map((p: { id: string; display_name: string }) => [p.id, p.display_name]),
  );

  return (
    // pb-20：為固定底部 Tab Bar 留空間
    <main className="flex-1 pb-20">

      {/* ── 頂部 header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-2xl leading-none">🔗</span>
          <span className="text-lg font-bold tracking-tight text-violet-700">Knoty</span>
        </div>
        {/* 未登入狀態 placeholder */}
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm text-violet-600 font-semibold">
          我
        </div>
      </header>

      <div className="px-4 pt-5 space-y-6">

        {/* ── 我的圈子 ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
              我的圈子
            </h2>
            <button className="text-xs text-violet-600 font-medium">
              管理
            </button>
          </div>

          {/* 橫向捲動圈子卡片 */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {[...circleCountMap.entries()].map(([name, count]) => {
              const style = CIRCLE_STYLES[name] ?? DEFAULT_CIRCLE_STYLE;
              return (
                <button
                  key={name}
                  className={`flex-none flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border ${style.bg} ${style.border} min-w-[80px] active:scale-95 transition-transform`}
                >
                  <span className="text-2xl leading-none">{style.emoji}</span>
                  <span className={`text-sm font-semibold ${style.text}`}>{name}</span>
                  <span className="text-xs text-zinc-400 tabular-nums">{count} 人</span>
                </button>
              );
            })}

            {/* 新增圈子 */}
            <button className="flex-none flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border border-dashed border-zinc-200 bg-white min-w-[80px] text-zinc-400 active:scale-95 transition-transform">
              <span className="text-2xl leading-none">＋</span>
              <span className="text-sm font-medium">新增</span>
            </button>
          </div>
        </section>

        {/* ── 最近動態 ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
              最近動態
            </h2>
            <button className="text-xs text-violet-600 font-medium">
              查看全部
            </button>
          </div>

          <div className="space-y-3">
            {(events ?? []).map((event: {
              id: string; event_type: string; description: string;
              impact: number; occurred_at: string; involved_persons: string[];
            }) => {
              const style = EVENT_STYLE[event.event_type] ?? EVENT_STYLE['note'];
              const names = event.involved_persons
                .map((id: string) => personNameMap.get(id) ?? '某人')
                .join('、');
              return (
                <div key={event.id} className={`rounded-2xl border p-4 ${style.cardBg} ${style.cardBorder}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                      {style.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-zinc-800">{names}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${style.badgeBg} ${style.badgeText}`}>
                          {style.typeLabel}
                        </span>
                        <ImpactBadge impact={event.impact} />
                        <span className="text-xs text-zinc-400 ml-auto">
                          {timeAgo(event.occurred_at)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 leading-snug line-clamp-2">{event.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
