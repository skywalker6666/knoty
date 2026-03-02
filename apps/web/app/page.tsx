// ─── 圈子設定（顏色對應 CLAUDE.md：社團/班上/宿舍/打工）────────────────────
const CIRCLES = [
  {
    id: '1',
    name: '社團',
    emoji: '🎭',
    personCount: 12,
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
  },
  {
    id: '2',
    name: '班上',
    emoji: '📚',
    personCount: 28,
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  {
    id: '3',
    name: '宿舍',
    emoji: '🏠',
    personCount: 5,
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  {
    id: '4',
    name: '打工',
    emoji: '💼',
    personCount: 8,
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
] as const;

// ─── 事件 feed（mock，之後換成 Supabase 查詢）────────────────────────────────
// event_type 對應 DB CHECK constraint：conflict|favor|betrayal|reconcile|milestone|note
const MOCK_EVENTS = [
  {
    id: '1',
    emoji: '🤝',
    typeLabel: '幫助',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    cardBg: 'bg-emerald-50',
    cardBorder: 'border-emerald-100',
    person: '學姐',
    description: '在期末報告幫我補了一個大缺口，救了整組的分數',
    impact: 3,
    timeAgo: '2 小時前',
  },
  {
    id: '2',
    emoji: '⚔️',
    typeLabel: '衝突',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    cardBg: 'bg-red-50',
    cardBorder: 'border-red-100',
    person: '同學甲',
    description: '社課討論時意見分歧，當著大家面槓上了，有點尷尬',
    impact: -2,
    timeAgo: '昨天',
  },
  {
    id: '3',
    emoji: '🏆',
    typeLabel: '里程碑',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    cardBg: 'bg-amber-50',
    cardBorder: 'border-amber-100',
    person: '學長',
    description: '一起帶社團新生營，整體合作很順暢，互相補位',
    impact: 2,
    timeAgo: '3 天前',
  },
  {
    id: '4',
    emoji: '📝',
    typeLabel: '備忘',
    badgeBg: 'bg-zinc-100',
    badgeText: 'text-zinc-600',
    cardBg: 'bg-white',
    cardBorder: 'border-zinc-100',
    person: '室友',
    description: '今天回家很晚，有點悶悶的，記得找個時機關心一下',
    impact: 0,
    timeAgo: '5 天前',
  },
] as const;

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
export default function HomePage() {
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
            {CIRCLES.map((circle) => (
              <button
                key={circle.id}
                className={`flex-none flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border ${circle.bg} ${circle.border} min-w-[80px] active:scale-95 transition-transform`}
              >
                <span className="text-2xl leading-none">{circle.emoji}</span>
                <span className={`text-sm font-semibold ${circle.text}`}>
                  {circle.name}
                </span>
                <span className="text-xs text-zinc-400 tabular-nums">
                  {circle.personCount} 人
                </span>
              </button>
            ))}

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
            {MOCK_EVENTS.map((event) => (
              <div
                key={event.id}
                className={`rounded-2xl border p-4 ${event.cardBg} ${event.cardBorder}`}
              >
                <div className="flex items-start gap-3">
                  {/* 事件 emoji */}
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                    {event.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* 頂行：人名 + 類型標籤 + impact + 時間 */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-zinc-800">
                        {event.person}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${event.badgeBg} ${event.badgeText}`}
                      >
                        {event.typeLabel}
                      </span>
                      <ImpactBadge impact={event.impact} />
                      <span className="text-xs text-zinc-400 ml-auto">
                        {event.timeAgo}
                      </span>
                    </div>

                    {/* 事件描述 */}
                    <p className="text-sm text-zinc-600 leading-snug line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 空白狀態提示（實際有資料後隱藏）── */}
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center">
          <p className="text-zinc-400 text-sm leading-relaxed">
            💡 連接 Supabase 後，這裡會顯示你的真實人際動態
          </p>
        </div>

      </div>
    </main>
  );
}
