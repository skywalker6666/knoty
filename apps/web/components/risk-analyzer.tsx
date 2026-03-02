'use client';

import { useState } from 'react';

interface Person {
  id: string;
  display_name: string;
  avatar_emoji: string;
}

interface PathResult {
  path: string[];
  depth: number;
}

interface RiskAnalyzerProps {
  persons: Person[];
}

export function RiskAnalyzer({ persons }: RiskAnalyzerProps) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId]     = useState('');
  const [result, setResult] = useState<PathResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function handleAnalyze() {
    if (!fromId || !toId) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/risk-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_id: fromId, to_id: toId }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const err = json as { error: string };
        setError(err.error ?? '查詢失敗');
      } else {
        const data = json as { paths: PathResult[]; pathCount: number };
        setResult(data.paths);
      }
    } catch {
      setError('網路錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-5 space-y-5">
      {/* 人物 A 選擇 */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
          我想跟⋯⋯
        </label>
        <select
          value={fromId}
          onChange={e => setFromId(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">選擇要聊天的對象（A）</option>
          {persons.map(p => (
            <option key={p.id} value={p.id}>
              {p.avatar_emoji} {p.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* 人物 C 選擇 */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
          聊到⋯⋯
        </label>
        <select
          value={toId}
          onChange={e => setToId(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">選擇要聊到的人（C）</option>
          {persons.filter(p => p.id !== fromId).map(p => (
            <option key={p.id} value={p.id}>
              {p.avatar_emoji} {p.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* 分析按鈕 */}
      <button
        onClick={handleAnalyze}
        disabled={!fromId || !toId || loading}
        className="w-full py-3.5 rounded-2xl bg-violet-600 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
      >
        {loading ? '分析中…' : '🔍 分析關係路徑'}
      </button>

      {/* 錯誤訊息 */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 查詢結果 */}
      {result !== null && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            找到 {result.length} 條關係路徑
          </p>
          {result.length === 0 ? (
            <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 text-sm text-zinc-500 text-center">
              這兩個人之間沒有關係路徑（3 度以內）
            </div>
          ) : (
            result.map((path, i) => (
              <div key={i} className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                <div className="text-xs text-violet-500 font-medium mb-1">
                  路徑 {i + 1}（{path.depth} 度）
                </div>
                <div className="text-sm text-zinc-700 font-mono">
                  {Array.isArray(path.path) ? path.path.join(' → ') : JSON.stringify(path)}
                </div>
              </div>
            ))
          )}
          <p className="text-xs text-zinc-400 text-center">
            Claude AI 風險分析 — Sprint 1 實作
          </p>
        </div>
      )}

      {/* 空白提示（未查詢時） */}
      {result === null && !error && (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center space-y-2">
          <p className="text-3xl">🕵️</p>
          <p className="text-sm font-medium text-zinc-600">選好兩個人後點分析，</p>
          <p className="text-sm text-zinc-400">查看他們之間的關係路徑</p>
        </div>
      )}
    </div>
  );
}
