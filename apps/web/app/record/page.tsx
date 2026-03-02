export default function RecordPage() {
  return (
    <main className="flex-1 pb-20">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-zinc-100 px-4 py-3">
        <h1 className="text-lg font-bold text-zinc-800">➕ 快速記錄</h1>
      </header>

      <div className="px-4 pt-6 space-y-4">
        {/* 輸入框 */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            一句話記下來
          </p>
          <textarea
            className="w-full min-h-[120px] px-3 py-3 bg-zinc-50 rounded-xl border border-zinc-200 text-sm text-zinc-800 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
            placeholder="例：學姐今天幫我在報告評審補充了一個論點，救了全組的分數"
            disabled
          />
          <div className="flex items-center gap-2">
            <button className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm opacity-40 cursor-not-allowed">
              AI 解析並記錄
            </button>
          </div>
        </div>

        {/* 說明 */}
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 space-y-3">
          <p className="text-sm font-medium text-zinc-600">✨ 怎麼運作</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>① 輸入一句話描述發生的事</p>
            <p>② Gemini Flash 自動解析人物、事件類型、影響值</p>
            <p>③ 確認後存進圖譜</p>
          </div>
          <p className="text-xs text-zinc-300 pt-1">Sprint 1 實作</p>
        </div>
      </div>
    </main>
  );
}
