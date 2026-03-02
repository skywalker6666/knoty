export default function RiskPage() {
  return (
    <main className="flex-1 pb-20">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-zinc-100 px-4 py-3">
        <h1 className="text-lg font-bold text-zinc-800">🔍 風險查詢</h1>
      </header>

      <div className="px-4 pt-6 space-y-4">
        {/* 查詢輸入區 */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            我想跟⋯⋯
          </p>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-200 text-left text-zinc-400 text-sm">
            <span>👤</span>
            <span>選擇要聊天的對象（A）</span>
          </button>

          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pt-1">
            聊到⋯⋯
          </p>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-200 text-left text-zinc-400 text-sm">
            <span>👤</span>
            <span>選擇要聊到的人（C）</span>
          </button>

          <button className="w-full py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm mt-1 opacity-40 cursor-not-allowed">
            分析關係風險
          </button>
        </div>

        {/* 空白提示 */}
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center space-y-2">
          <p className="text-3xl">🕵️</p>
          <p className="text-sm font-medium text-zinc-600">選好兩個人後，</p>
          <p className="text-sm text-zinc-400">AI 會分析他們之間的關係路徑</p>
          <p className="text-xs text-zinc-300 mt-2">Sprint 1 實作</p>
        </div>
      </div>
    </main>
  );
}
