# Graph Visualization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement a D3.js force-directed interactive graph visualization for `/graph` in `apps/web`, connecting to real Supabase data.

**Architecture:** `graph/page.tsx` (Server Component) fetches persons + relationships, maps DB snake_case to typed `GraphNode[]`/`GraphEdge[]`, and passes them as props to `<GraphCanvas>` (Client Component). All D3 force simulation logic is isolated in `use-graph-simulation.ts`; SVG rendering is split into focused components. Three modes: single-center, multi-center, cluster.

**Tech Stack:** Next.js App Router, TypeScript strict, D3 v7 (`d3-force`, `d3-zoom`, `d3-selection`), SVG rendering, `@knoty/shared` types.

---

## Chunk 1: Foundation — D3 install + page.tsx rewrite + GraphCanvas shell

### Task 1: Install D3

**Files:**
- Modify: `apps/web/package.json`

- [x] **Step 1: Install d3 and its types**

Run from repo root:
```bash
pnpm add d3 --filter web
pnpm add -D @types/d3 --filter web
```

- [x] **Step 2: Verify install**

Run:
```bash
pnpm typecheck --filter web
```
Expected: No errors (d3 types resolved)

- [x] **Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore: add d3 dependency to web app"
```

---

### Task 2: Rewrite `graph/page.tsx`

Replace the current skeleton with proper DB-to-type mapping, error handling, and `GraphCanvas` integration.

**Files:**
- Modify: `apps/web/app/graph/page.tsx`

- [x] **Step 1: Replace the file**

```tsx
// apps/web/app/graph/page.tsx
import { createAdminClient } from '@knoty/api-client';
import type { GraphNode, GraphEdge } from '@knoty/shared';
import { GraphCanvas } from '@/components/graph/GraphCanvas';

// Sprint 0 placeholder — replace with createServerClient() + session in Sprint 1
const HARDCODED_UID = 'd52cc5d3-f761-43aa-8575-8dd2cf60fe99';

export default async function GraphPage() {
  const supabase = createAdminClient();

  try {
    const [personsResult, relationshipsResult] = await Promise.all([
      supabase
        .from('persons')
        .select('id, display_name, avatar_emoji, circles, tags')
        .eq('user_id', HARDCODED_UID),
      supabase
        .from('relationships')
        .select('id, person_a, person_b, closeness, label, direction, context')
        .eq('user_id', HARDCODED_UID),
    ]);

    if (personsResult.error) throw personsResult.error;
    if (relationshipsResult.error) throw relationshipsResult.error;

    // Map DB snake_case → GraphNode (camelCase, per types.ts)
    const nodes: GraphNode[] = (personsResult.data ?? []).map(p => ({
      id: p.id,
      displayName: p.display_name,
      avatarEmoji: p.avatar_emoji ?? undefined,
      circles: (p.circles as string[]) ?? [],
      tags: (p.tags as string[]) ?? [],
    }));

    // Map DB snake_case → GraphEdge (source/target, per types.ts)
    const edges: GraphEdge[] = (relationshipsResult.data ?? []).map(r => ({
      id: r.id,
      source: r.person_a,   // D3 resolves string IDs to node refs during sim init
      target: r.person_b,
      closeness: r.closeness,
      direction: r.direction,
      label: r.label ?? undefined,
      context: r.context ?? undefined,
    }));

    // Inject synthetic "me" node as the ego centre
    const meNode: GraphNode = {
      id: HARDCODED_UID,
      displayName: '我',
      avatarEmoji: '🧑',
      circles: [],
      tags: [],
    };
    // Prepend only if not already in the DB (in case user saved themselves)
    if (!nodes.some(n => n.id === HARDCODED_UID)) {
      nodes.unshift(meNode);
    }

    return (
      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] pb-20">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          currentUserId={HARDCODED_UID}
        />
      </main>
    );
  } catch (err) {
    console.error('[GraphPage] fetch error:', err);
    return (
      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] pb-20">
        <GraphCanvas nodes={[]} edges={[]} currentUserId={HARDCODED_UID} />
      </main>
    );
  }
}
```

- [x] **Step 2: Typecheck**

```bash
pnpm typecheck --filter web
```
Expected: PASS (GraphCanvas not yet created → will error on import — that's OK, fix in next task)

---

### Task 3: GraphCanvas empty shell

Create a non-crashing `GraphCanvas` that accepts props and renders a placeholder, so `page.tsx` compiles.

**Files:**
- Create: `apps/web/components/graph/GraphCanvas.tsx`

- [x] **Step 1: Create the shell**

```tsx
// apps/web/components/graph/GraphCanvas.tsx
'use client';

import type { GraphNode, GraphEdge } from '@knoty/shared';

export interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentUserId: string;
}

export function GraphCanvas({ nodes, edges }: GraphCanvasProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#08080e]">
        <p className="text-zinc-400 text-sm">還沒有人際關係資料</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#08080e] flex items-center justify-center">
      <p className="text-zinc-400 text-sm">{nodes.length} 個節點 · {edges.length} 條邊（圖譜載入中）</p>
    </div>
  );
}
```

- [x] **Step 2: Typecheck**

```bash
pnpm typecheck --filter web
```
Expected: PASS — zero errors

- [x] **Step 3: Smoke test in browser**

```bash
pnpm dev --filter web
```
Open `http://localhost:3000/graph` — should see "N 個節點 · M 條邊（圖譜載入中）" or the empty state.

- [x] **Step 4: Commit**

```bash
git add apps/web/app/graph/page.tsx apps/web/components/graph/GraphCanvas.tsx
git commit -m "feat: rewrite graph/page.tsx with DB mapping, add GraphCanvas shell"
```

---

## Chunk 2: Force Simulation Hook

### Task 4: `use-graph-simulation.ts`

All D3 logic lives here. `GraphCanvas` and other components never import from `d3` directly.

**Files:**
- Create: `apps/web/components/graph/use-graph-simulation.ts`

- [x] **Step 1: Create the hook**

```ts
// apps/web/components/graph/use-graph-simulation.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceCenter,
} from 'd3';
import type { GraphNode, GraphEdge } from '@knoty/shared';

export type GraphMode = 'single' | 'multi' | 'cluster';

export interface SimulationResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Isolation layer: ALL d3-force logic lives here.
 * Returns D3-mutated node/edge arrays (positions added in-place).
 * centerIds: ['userId'] for single, ['userId', otherId, ...] for multi, [] for cluster.
 */
export function useGraphSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  centerIds: string[],
  mode: GraphMode,
  width: number,
  height: number,
): SimulationResult {
  // Internal tick drives re-renders of the host component on each simulation step
  const [, setTick] = useState(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);

  useEffect(() => {
    if (width === 0 || height === 0) return;

    // Clone to avoid mutating props; D3 writes x/y/vx/vy in-place
    const simNodes: GraphNode[] = nodes.map(n => ({ ...n }));
    const simEdges: GraphEdge[] = edges.map(e => ({ ...e }));

    nodesRef.current = simNodes;
    edgesRef.current = simEdges;

    // Pin center nodes (single / multi); release all in cluster mode
    const cx = width / 2;
    const cy = height / 2;
    const offsets = [
      { x: cx,       y: cy },
      { x: cx + 110, y: cy },
      { x: cx,       y: cy + 110 },
    ];
    for (const node of simNodes) {
      const idx = centerIds.indexOf(node.id);
      if (mode !== 'cluster' && idx >= 0) {
        node.fx = offsets[idx]?.x ?? cx;
        node.fy = offsets[idx]?.y ?? cy;
      } else {
        node.fx = null;
        node.fy = null;
      }
    }

    const sim = forceSimulation<GraphNode>(simNodes)
      .force(
        'link',
        forceLink<GraphNode, GraphEdge>(simEdges)
          .id(d => d.id)
          .distance(80)
          .strength(d => (d.closeness / 5) * 0.8),
      )
      .force('charge', forceManyBody<GraphNode>().strength(-300))
      .force('collide', forceCollide<GraphNode>(32))
      .on('tick', () => setTick(t => t + 1))
      .on('end', () => setTick(t => t + 1));

    if (mode === 'cluster') {
      sim.force('center', forceCenter(cx, cy));
    }

    return () => { sim.stop(); };

    // Intentionally re-runs when inputs change (new centerIds = new layout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Stringify arrays so React detects deep changes
    JSON.stringify(nodes.map(n => n.id)),
    JSON.stringify(edges.map(e => e.id)),
    JSON.stringify(centerIds),
    mode,
    width,
    height,
  ]);

  return { nodes: nodesRef.current, edges: edgesRef.current };
}
```

- [x] **Step 2: Typecheck**

```bash
pnpm typecheck --filter web
```
Expected: PASS

- [x] **Step 3: Commit**

```bash
git add apps/web/components/graph/use-graph-simulation.ts
git commit -m "feat: add useGraphSimulation hook (d3-force isolation layer)"
```

---

## Chunk 3: SVG Components

### Task 5: `GraphEdge.tsx`

Renders a single SVG edge between two simulation nodes.

**Files:**
- Create: `apps/web/components/graph/GraphEdge.tsx`

- [x] **Step 1: Create the component**

```tsx
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
```

- [x] **Step 2: Typecheck**

```bash
pnpm typecheck --filter web
```
Expected: PASS

---

### Task 6: `GraphNode.tsx`

Renders a single SVG node with emoji, name label, circle colour ring, and pulse animation for center nodes. Exposes `onTap` and `onLongPress` via pointer events.

**Files:**
- Create: `apps/web/components/graph/GraphNode.tsx`

- [x] **Step 1: Create the component**

```tsx
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
```

- [x] **Step 2: Typecheck**

```bash
pnpm typecheck --filter web
```
Expected: PASS

---

### Task 7: `GraphPanel.tsx`

Bottom slide-up panel showing selected node details and its relationships.

**Files:**
- Create: `apps/web/components/graph/GraphPanel.tsx`

- [x] **Step 1: Create the component**

```tsx
// apps/web/components/graph/GraphPanel.tsx
'use client';

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
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));

  // Find edges involving this node
  const relatedEdges = edges.filter(e => {
    const srcId = typeof e.source === 'string' ? e.source : e.source.id;
    const tgtId = typeof e.target === 'string' ? e.target : e.target.id;
    return srcId === node.id || tgtId === node.id;
  }).sort((a, b) => b.closeness - a.closeness);

  // Direct edge from me → this node (for closeness badge in header)
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
            {primaryStyle && primaryEdge.label && (
              <span
                className="ml-2 text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ background: primaryStyle.color + '20', color: primaryStyle.color }}
              >
                {primaryStyle.tag} · {primaryEdge.label}
              </span>
            )}
          </div>
        </div>
        <button
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
            const s = CLOSENESS_LABEL[edge.closeness];
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
```

- [x] **Step 2: Typecheck**

```bash
pnpm typecheck --filter web
```
Expected: PASS

---

### Task 8: `GraphModeToggle.tsx`

Three-button toggle: 單中心 / 多中心 / 團體.

**Files:**
- Create: `apps/web/components/graph/GraphModeToggle.tsx`

- [x] **Step 1: Create the component**

```tsx
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
```

- [x] **Step 2: Typecheck**

```bash
pnpm typecheck --filter web
```
Expected: PASS

- [x] **Step 3: Commit all SVG components**

```bash
git add apps/web/components/graph/GraphEdge.tsx
git add apps/web/components/graph/GraphNode.tsx
git add apps/web/components/graph/GraphPanel.tsx
git add apps/web/components/graph/GraphModeToggle.tsx
git commit -m "feat: add GraphEdge, GraphNode, GraphPanel, GraphModeToggle SVG components"
```

---

## Chunk 4: GraphCanvas — Assembly + Interactions

### Task 9: Full `GraphCanvas.tsx`

Wire simulation hook + SVG components together. Handle tap, long-press, drag, d3-zoom, mode switching, panel, toast.

**Files:**
- Modify: `apps/web/components/graph/GraphCanvas.tsx`

- [x] **Step 1: Replace GraphCanvas shell with full implementation**

```tsx
// apps/web/components/graph/GraphCanvas.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { select } from 'd3';
import { zoom as d3zoom, zoomIdentity, type ZoomTransform } from 'd3';
import type { GraphNode, GraphEdge } from '@knoty/shared';
import { useGraphSimulation, type GraphMode } from './use-graph-simulation';
import { GraphNodeComponent } from './GraphNode';
import { GraphEdgeComponent } from './GraphEdge';
import { GraphPanel } from './GraphPanel';
import { GraphModeToggle } from './GraphModeToggle';

export interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentUserId: string;
}

export function GraphCanvas({ nodes, edges, currentUserId }: GraphCanvasProps) {
  const [mode, setMode] = useState<GraphMode>('single');
  const [centerIds, setCenterIds] = useState<string[]>([currentUserId]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [toast, setToast] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Drag state
  const dragRef = useRef<{
    nodeId: string;
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setDimensions({ width: rect.width, height: rect.height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // d3-zoom on SVG viewport (scroll / pinch to zoom, drag on empty area to pan)
  useEffect(() => {
    if (!svgRef.current) return;
    const zoomBehavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4])
      // Don't intercept pointer events that start on a node (allow node drag)
      .filter(event => {
        if (event.type === 'wheel') return true;
        const target = event.target as Element;
        return !target.closest('g[data-node]');
      })
      .on('zoom', (event: { transform: ZoomTransform }) => {
        setTransform(event.transform);
      });

    const sel = select(svgRef.current);
    sel.call(zoomBehavior);
    return () => { sel.on('.zoom', null); };
  }, []);

  // tick is consumed internally by the hook (setTick triggers GraphCanvas re-renders)
  const { nodes: simNodes, edges: simEdges } = useGraphSimulation(
    nodes, edges, centerIds, mode, dimensions.width, dimensions.height,
  );

  // ── Interactions ─────────────────────────────────────────────────────────

  const handleTap = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  const handleLongPress = useCallback((id: string) => {
    // Clear stale drag ref — long-press and drag are mutually exclusive
    dragRef.current = null;
    if (mode !== 'multi') {
      setMode('multi');
      setCenterIds([currentUserId, id]);
      return;
    }
    setCenterIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) {
        setToast('最多 3 個中心節點');
        setTimeout(() => setToast(null), 1500);
        return prev;
      }
      return [...prev, id];
    });
  }, [mode, currentUserId]);

  const handleModeChange = useCallback((newMode: GraphMode) => {
    setMode(newMode);
    setSelectedId(null);
    if (newMode === 'single') setCenterIds([currentUserId]);
    if (newMode === 'multi')  setCenterIds([currentUserId]);
    if (newMode === 'cluster') setCenterIds([]);
  }, [currentUserId]);

  // Node drag — pointer events on SVG (not per-node d3-drag, avoids complexity)
  const handleDragStart = useCallback((
    nodeId: string,
    event: React.PointerEvent<SVGGElement>,
  ) => {
    event.stopPropagation();
    dragRef.current = {
      nodeId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    (event.currentTarget as SVGGElement).setPointerCapture(event.pointerId);
  }, []);

  const handleSvgPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;

    const node = simNodes.find(n => n.id === drag.nodeId);
    if (!node) return;
    // Convert screen coords → simulation coords (subtract SVG offset + zoom transform)
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    node.fx = (e.clientX - rect.left - transform.x) / transform.k;
    node.fy = (e.clientY - rect.top  - transform.y) / transform.k;
  }, [simNodes, transform]);

  const handleSvgPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    const { nodeId, moved } = dragRef.current;
    dragRef.current = null;
    if (!moved) return;
    // Release pin so simulation resumes control
    const node = simNodes.find(n => n.id === nodeId);
    if (node && !centerIds.includes(nodeId)) {
      node.fx = null;
      node.fy = null;
    }
  }, [simNodes, centerIds]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const connectedToSelected = new Set<string>();
  if (selectedId) {
    connectedToSelected.add(selectedId);
    for (const edge of simEdges) {
      const src = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const tgt = typeof edge.target === 'string' ? edge.target : edge.target.id;
      if (src === selectedId) connectedToSelected.add(tgt);
      if (tgt === selectedId) connectedToSelected.add(src);
    }
  }

  const selectedNode = selectedId
    ? (simNodes.find(n => n.id === selectedId) ?? null)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#08080e]">
        <p className="text-zinc-400 text-sm">還沒有人際關係資料</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-[#08080e]"
      style={{ touchAction: 'none' }}
    >
      <GraphModeToggle mode={mode} onChange={handleModeChange} />

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={() => setSelectedId(null)}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
      >
        <g transform={transform.toString()}>
          {/* Edges behind nodes */}
          {simEdges.map(edge => {
            const src = typeof edge.source === 'string' ? edge.source : edge.source.id;
            const tgt = typeof edge.target === 'string' ? edge.target : edge.target.id;
            const isVisible = !selectedId
              || (connectedToSelected.has(src) && connectedToSelected.has(tgt));
            return (
              <GraphEdgeComponent
                key={edge.id}
                edge={edge}
                isVisible={isVisible}
                showLabel={!!selectedId && isVisible}
              />
            );
          })}

          {/* Nodes */}
          {simNodes.map(node => {
            const centerIndex = centerIds.indexOf(node.id);
            const isActive = !selectedId || connectedToSelected.has(node.id);
            const isFaded = !!selectedId && !connectedToSelected.has(node.id);
            return (
              <g key={node.id} data-node={node.id}>
                <GraphNodeComponent
                  node={node}
                  isMe={node.id === currentUserId}
                  centerIndex={centerIndex}
                  isActive={isActive}
                  isFaded={isFaded}
                  onTap={handleTap}
                  onLongPress={handleLongPress}
                  onDragStart={handleDragStart}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {selectedNode && (
        <GraphPanel
          node={selectedNode}
          edges={simEdges}
          allNodes={simNodes}
          onClose={() => setSelectedId(null)}
        />
      )}

      {toast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 2: Typecheck**

```bash
pnpm typecheck --filter web
```
Expected: PASS — zero errors

- [x] **Step 3: Browser smoke test**

```bash
pnpm dev --filter web
```
Open `http://localhost:3000/graph`:
- Graph renders with nodes and edges
- Nodes animate into position (force simulation settling)
- Scroll to zoom in/out
- Tap a node → panel appears, unrelated nodes fade
- Tap empty area → panel closes
- Long-press a node → switches to multi-center mode
- Toggle 單中心 / 多中心 / 團體 buttons work

- [x] **Step 4: Commit**

```bash
git add apps/web/components/graph/GraphCanvas.tsx
git commit -m "feat: complete GraphCanvas with force simulation, all 3 modes, and interactions"
```

---

### Task 10: Final typecheck + cleanup

- [x] **Step 1: Full monorepo typecheck**

```bash
pnpm typecheck
```
Expected: PASS across all packages

- [x] **Step 2: Remove old header mode buttons from graph/page.tsx**

The header in the old `page.tsx` skeleton had hardcoded mode buttons. These are now rendered by `GraphModeToggle` inside `GraphCanvas`. Verify `page.tsx` no longer contains any mode toggle markup (it shouldn't after Task 2's rewrite — but double-check).

Open `apps/web/app/graph/page.tsx` and confirm it only contains the Server Component data fetch + `<GraphCanvas>` render. No header, no buttons.

- [x] **Step 3: Sprint 0 validation checklist**

Manually verify on device or browser devtools mobile emulation (Android mid-range = Moto G equivalent, ~360px wide):

- [x] 30 nodes render without layout breaking
- [x] Simulation settles smoothly (no jank during first ~2s)
- [x] Tap/long-press/drag all respond within 100ms
- [x] Pinch zoom (two-finger) works in mobile emulation
- [x] All 3 mode switches work without crash
- [x] TypeScript strict: zero `any`, zero errors (`pnpm typecheck` passes)

- [x] **Step 4: Final commit**

```bash
git add -p   # review staged changes
git commit -m "feat: complete Sprint 0 graph visualization PoC"
```
