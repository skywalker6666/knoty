export default function GraphPage() {
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

      {/* 圖譜畫布佔位 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-8 pb-4 gap-6">
        <div className="w-full aspect-square max-w-sm bg-white rounded-3xl border border-zinc-100 flex flex-col items-center justify-center gap-3 text-zinc-300">
          {/* 示意圖 */}
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="18" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2"/>
            <text x="60" y="65" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="600">我</text>
            {/* 連線 */}
            <line x1="60" y1="42" x2="60" y2="18" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 2"/>
            <line x1="75" y1="53" x2="95" y2="38" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 2"/>
            <line x1="75" y1="68" x2="95" y2="83" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 2"/>
            <line x1="60" y1="78" x2="60" y2="102" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 2"/>
            <line x1="45" y1="68" x2="25" y2="83" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 2"/>
            <line x1="45" y1="53" x2="25" y2="38" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 2"/>
            {/* 外圍節點 */}
            <circle cx="60" cy="12" r="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5"/>
            <circle cx="100" cy="32" r="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5"/>
            <circle cx="100" cy="88" r="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5"/>
            <circle cx="60" cy="108" r="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5"/>
            <circle cx="20" cy="88" r="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5"/>
            <circle cx="20" cy="32" r="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5"/>
          </svg>
          <p className="text-sm text-zinc-400">D3.js 力導向圖譜</p>
        </div>

        <div className="w-full rounded-2xl border border-dashed border-zinc-200 bg-white p-5 space-y-2 text-center">
          <p className="text-sm font-medium text-zinc-600">Sprint 0 驗證目標</p>
          <p className="text-xs text-zinc-400">30 個節點在 Android 中低階機 &gt; 30fps</p>
          <p className="text-xs text-zinc-300">Sprint 1 實作（參考 demo/KnotyGraphV3.jsx）</p>
        </div>
      </div>
    </main>
  );
}
