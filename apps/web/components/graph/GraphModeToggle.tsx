// apps/web/components/graph/GraphModeToggle.tsx
'use client';

import type { GraphMode } from './use-graph-simulation';

interface GraphModeToggleProps {
  mode: GraphMode;
  onChange: (mode: GraphMode) => void;
}

const MODES: { value: GraphMode; label: string }[] = [
  { value: 'single',  label: '單中心' },
  { value: 'multi',   label: '多中心' },
  { value: 'cluster', label: '團體' },
];

export function GraphModeToggle({ mode, onChange }: GraphModeToggleProps) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-1 bg-[#111119]/90 backdrop-blur rounded-lg p-1 text-xs font-medium border border-[#1e1e2e]">
      {MODES.map(m => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            mode === m.value
              ? 'bg-[#7c6cf0] text-white'
              : 'text-[#7a7a99] hover:text-[#e8e8f4]'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
