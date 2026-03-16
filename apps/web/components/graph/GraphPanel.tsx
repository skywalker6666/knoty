// apps/web/components/graph/GraphPanel.tsx
'use client';

import { useMemo } from 'react';
import type { Closeness, GraphEdge, GraphNode } from '@knoty/shared';

const CLOSENESS_LABEL: Record<Closeness, { tag: string; color: string }> = {
  5: { tag: '超熟',   color: '#7c6cf0' },
  4: { tag: '不錯',   color: '#2dd4c0' },
  3: { tag: '普通',   color: '#3a3a55' },
  2: { tag: '不太熟', color: '#f0c040' },
  1: { tag: '有嫌隙', color: '#e05545' },
};

interface GraphPanelProps {
  node: GraphNode;
  /** All simulation edges (post D3-resolution, source/target are node objects) */
  edges: GraphEdge[];
  allNodes: GraphNode[];
  onClose: () => void;
}

export function GraphPanel({ node, edges, allNodes, onClose }: GraphPanelProps) {
  const nodeMap = useMemo(() => new Map(allNodes.map(n => [n.id, n])), [allNodes]);

  // Find edges involving this node
  const relatedEdges = edges.filter(e => {
    const srcId = typeof e.source === 'string' ? e.source : e.source.id;
    const tgtId = typeof e.target === 'string' ? e.target : e.target.id;
    return srcId === node.id || tgtId === node.id;
  }).sort((a, b) => b.closeness - a.closeness);

  // Highest-closeness edge involving this node (shown in header badge)
  const primaryEdge = relatedEdges[0];
  const primaryStyle = primaryEdge ? CLOSENESS_LABEL[primaryEdge.closeness] : null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-10 rounded-t-2xl border-t border-[#1e1e2e] bg-[#111119] px-4 pt-4 pb-6"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{node.avatarEmoji ?? '🙂'}</span>
          <div>
            <span className="text-sm font-semibold text-[#e8e8f4]">{node.displayName}</span>
            {primaryStyle && (
              <span
                className="ml-2 text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ background: primaryStyle.color + '20', color: primaryStyle.color }}
              >
                {primaryEdge.label ? `${primaryStyle.tag} · ${primaryEdge.label}` : primaryStyle.tag}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="border border-[#1e1e2e] text-[#7a7a99] text-xs px-2 py-1 rounded-md bg-transparent"
        >
          ✕
        </button>
      </div>

      {/* Relationship chips */}
      {relatedEdges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {relatedEdges.map(edge => {
            const srcId = typeof edge.source === 'string' ? edge.source : edge.source.id;
            const tgtId = typeof edge.target === 'string' ? edge.target : edge.target.id;
            const otherId = srcId === node.id ? tgtId : srcId;
            const other = nodeMap.get(otherId);
            if (!other) return null;
            const s = CLOSENESS_LABEL[edge.closeness] ?? CLOSENESS_LABEL[3];
            const isRisk = edge.closeness <= 2;
            return (
              <span
                key={edge.id}
                className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                style={{
                  background: s.color + '18',
                  color: s.color,
                  border: `1px solid ${s.color}40`,
                }}
              >
                {isRisk && <span>⚠️</span>}
                {other.avatarEmoji ?? '🙂'} {other.displayName}
                <span className="opacity-60">· {s.tag}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
