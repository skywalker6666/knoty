// apps/web/components/graph/GraphEdge.tsx
'use client';

import type { Closeness, GraphEdge, GraphNode } from '@knoty/shared';

const CLOSENESS_STYLE: Record<Closeness, {
  label: string; color: string; strokeWidth: number; dash: string;
}> = {
  5: { label: '超熟',   color: '#7c6cf0', strokeWidth: 3,   dash: '' },
  4: { label: '不錯',   color: '#2dd4c0', strokeWidth: 2.5, dash: '' },
  3: { label: '普通',   color: '#3a3a55', strokeWidth: 1.5, dash: '5,5' },
  2: { label: '不太熟', color: '#f0c040', strokeWidth: 1.5, dash: '3,5' },
  1: { label: '有嫌隙', color: '#e05545', strokeWidth: 2,   dash: '2,4' },
};

interface GraphEdgeProps {
  edge: GraphEdge;
  /** false = fade to near-invisible (no selected neighbour) */
  isVisible: boolean;
  /** show inline label only when node is selected */
  showLabel: boolean;
}

export function GraphEdgeComponent({ edge, isVisible, showLabel }: GraphEdgeProps) {
  // After D3 sim init, source/target are resolved to node objects
  const source = edge.source as GraphNode;
  const target = edge.target as GraphNode;
  const x1 = source.x ?? 0;
  const y1 = source.y ?? 0;
  const x2 = target.x ?? 0;
  const y2 = target.y ?? 0;

  const style = CLOSENESS_STYLE[edge.closeness];

  return (
    <g opacity={isVisible ? 0.9 : 0.08}>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={style.color}
        strokeWidth={isVisible ? style.strokeWidth : 0.8}
        strokeDasharray={style.dash}
        strokeLinecap="round"
      />
      {isVisible && showLabel && edge.label && (() => {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const tw = edge.label.length * 9 + 10;
        return (
          <g>
            <rect
              x={mx - tw / 2} y={my - 18}
              width={tw} height={16} rx={8}
              fill="#111119" stroke={style.color} strokeWidth={0.7} opacity={0.95}
            />
            <text
              x={mx} y={my - 8}
              textAnchor="middle" dominantBaseline="central"
              fill={style.color} fontSize={9}
              fontFamily="'Noto Sans TC', sans-serif"
            >
              {edge.label}
            </text>
          </g>
        );
      })()}
    </g>
  );
}
