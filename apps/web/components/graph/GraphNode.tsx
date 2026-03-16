// apps/web/components/graph/GraphNode.tsx
'use client';

import { useRef } from 'react';
import type { GraphNode } from '@knoty/shared';

const CIRCLE_COLOR: Record<string, string> = {
  '社團': '#7c6cf0',
  '宿舍': '#2dd4c0',
  '班上': '#ff6b8a',
  '打工': '#f0c040',
};

const CENTER_COLORS = ['#7c6cf0', '#ff6b8a', '#2dd4c0'];

interface GraphNodeProps {
  node: GraphNode;
  isMe: boolean;
  /** -1 = not a center; 0/1/2 = center index (determines colour) */
  centerIndex: number;
  /** node is selected or directly connected to selected */
  isActive: boolean;
  /** node has no relation to currently selected */
  isFaded: boolean;
  onTap: (id: string) => void;
  onLongPress: (id: string) => void;
  onDragStart: (id: string, event: React.PointerEvent<SVGGElement>) => void;
}

export function GraphNodeComponent({
  node,
  isMe,
  centerIndex,
  isActive,
  isFaded,
  onTap,
  onLongPress,
  onDragStart,
}: GraphNodeProps) {
  const isCenter = centerIndex >= 0;
  const r = isMe ? 28 : isCenter ? 26 : 22;
  const circleColor = isCenter
    ? (CENTER_COLORS[centerIndex] ?? '#7c6cf0')
    : (CIRCLE_COLOR[node.circles[0] ?? ''] ?? '#3a3a55');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didDragRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>) => {
    didDragRef.current = false;
    // Notify parent so it can start tracking pointer for drag
    onDragStart(node.id, e);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onLongPress(node.id);
    }, 500);
  };

  const handlePointerUp = () => {
    if (timerRef.current && !didDragRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      onTap(node.id);
    }
  };

  const handlePointerLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <g
      transform={`translate(${node.x ?? 0},${node.y ?? 0})`}
      style={{ cursor: 'pointer' }}
      opacity={isFaded ? 0.2 : 1}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {isCenter && (
        <circle r={r + 8} fill="none" stroke={circleColor} strokeWidth={2} opacity={0.5}>
          <animate
            attributeName="r"
            values={`${r + 6};${r + 12};${r + 6}`}
            dur="2.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.15;0.5"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      <circle
        r={r}
        fill="#111119"
        stroke={isCenter ? circleColor : (isActive ? '#3a3a55' : '#1e1e2e')}
        strokeWidth={isCenter ? 2.5 : 1.2}
      />
      <text
        y={1}
        textAnchor="middle"
        fontSize={isMe ? 20 : 15}
        dominantBaseline="central"
      >
        {node.avatarEmoji ?? '🙂'}
      </text>
      <text
        y={r + 14}
        textAnchor="middle"
        fill={isCenter || isActive ? '#e8e8f4' : '#7a7a99'}
        fontSize={10}
        fontWeight={isCenter ? 700 : 400}
        fontFamily="'Noto Sans TC', sans-serif"
      >
        {node.displayName}
      </text>
      {!isMe && !isCenter && node.circles[0] && (
        <text
          y={r + 26}
          textAnchor="middle"
          fill={CIRCLE_COLOR[node.circles[0]] ?? '#7a7a99'}
          fontSize={8}
          fontFamily="'Noto Sans TC', sans-serif"
          opacity={0.6}
        >
          {node.circles[0]}
        </text>
      )}
      {isCenter && !isMe && (
        <>
          <rect x={-12} y={-r - 14} width={24} height={14} rx={7} fill={circleColor} opacity={0.25} />
          <text
            y={-r - 5}
            textAnchor="middle"
            fill={circleColor}
            fontSize={8}
            fontFamily="'Noto Sans TC', sans-serif"
          >
            中心
          </text>
        </>
      )}
    </g>
  );
}
