# Graph Visualization Design

**Date:** 2026-03-13
**Sprint:** 0 → 1
**Status:** Approved

---

## Overview

Implement the D3.js force-directed graph visualization for the `/graph` route in `apps/web`. Migrates the existing `KnotyGraphV3.jsx` prototype to a TypeScript Next.js Client Component, replacing the static radial layout with `d3-force` simulation, and connecting to real Supabase data.

The architecture intentionally isolates the simulation logic in a single hook (`use-graph-simulation.ts`) to facilitate a future clean-room TypeScript rewrite (Approach 3).

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout engine | D3 force-directed simulation | Sprint 0 PoC goal: validate >30fps on Android mid-range |
| Rendering | SVG (migrated from prototype) | Consistent with existing prototype; revisit Canvas if perf fails |
| Modes | Single-center, Multi-center, Cluster (all 3) | All 3 buttons already in header |
| Interactions | Full (tap, long-press, drag, pinch zoom, panel) | From KnotyGraphV3 |
| Data flow | Server Component → props → Client Component | No extra API round trip; page already fetches data |
| Zoom | `d3-zoom` | Handles pointer event conflicts with drag; standard D3 pattern |
| Implementation base | Port KnotyGraphV3 + replace layout with d3-force | Lowest risk; validated UI reused |

---

## File Structure

```
apps/web/
├── app/graph/
│   └── page.tsx                    # Server Component — fetches persons + relationships, passes as props
└── components/graph/
    ├── GraphCanvas.tsx             # Client Component — SVG render loop
    ├── GraphNode.tsx               # SVG node element
    ├── GraphEdge.tsx               # SVG edge element
    ├── GraphPanel.tsx              # Bottom detail panel (slide-up)
    ├── GraphModeToggle.tsx         # Mode switcher (single / multi / cluster)
    └── use-graph-simulation.ts     # Hook — encapsulates all d3-force logic (isolation layer)
```

---

## Data Types

Use existing types from `packages/shared/src/types.ts` — do **not** redefine:

```typescript
import type { GraphNode, GraphEdge } from '@knoty/shared';
```

`GraphNode` already includes D3 simulation fields (`x?`, `y?`, `vx?`, `vy?`, `fx?`, `fy?`).
`GraphEdge` uses `source: string | GraphNode` and `target: string | GraphNode` (D3-compatible).
`SimNode` is **not needed** — use `GraphNode` directly throughout.

### DB → Type Mapping (in `page.tsx`)

Supabase returns snake_case columns. Map before passing as props:

```typescript
// persons query result → GraphNode[]
const nodes: GraphNode[] = (persons ?? []).map(p => ({
  id: p.id,
  displayName: p.display_name,
  avatarEmoji: p.avatar_emoji ?? undefined,
  circles: p.circles ?? [],
  tags: p.tags ?? [],
}));

// relationships query result → GraphEdge[]
const edges: GraphEdge[] = (relationships ?? []).map(r => ({
  id: r.id,
  source: r.person_a,   // D3 resolves string IDs to node refs during simulation init
  target: r.person_b,
  closeness: r.closeness,
  direction: r.direction,
  label: r.label ?? undefined,
}));
```

Inject a synthetic `me` node for the current user before passing:

```typescript
const meNode: GraphNode = {
  id: currentUserId,
  displayName: '我',
  avatarEmoji: '🧑',
  circles: [],
  tags: [],
};
nodes.unshift(meNode);
```

### `GraphCanvasProps`

```typescript
interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentUserId: string;
}
```

### Sprint 0 Auth Note

`page.tsx` currently uses `createAdminClient()` with a hardcoded UID — this is a Sprint 0 placeholder only. Sprint 1 must replace with `createServerClient()` reading the user session from cookies, so RLS applies correctly per CLAUDE.md.

---

## Simulation Hook (`use-graph-simulation.ts`)

The isolation layer. All `d3-force` imports live here. No D3 imports in any other graph component.

```typescript
function useGraphSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  centerIds: string[],    // ['currentUserId'] for single; ['currentUserId', nodeId] for multi; [] for cluster
  mode: 'single' | 'multi' | 'cluster',
  width: number,
  height: number,
): { nodes: GraphNode[], edges: GraphEdge[] }
```

Returns the same arrays mutated in-place by D3 (standard D3 pattern). After each simulation tick, `GraphCanvas` reads `node.x`, `node.y` and `(edge.source as GraphNode).x` etc.

### D3 Force Configuration

| Force | Config |
|-------|--------|
| `forceLink` | `id = d => d.id`; strength = `closeness / 5 * 0.8`; higher closeness = stronger pull |
| `forceManyBody` | strength = −300 (repulsion) |
| `forceCollide` | radius = 32 (prevents emoji overlap) |
| `forceCenter` | **Cluster mode only** — pulls the whole graph toward viewport center (no pinned nodes) |
| Center nodes (single/multi) | `fx = width/2`, `fy = height/2` for ego; for multi, secondary center pinned at offset. `forceCenter` not used. |

In cluster mode: release all `fx`/`fy` and apply `forceCenter` so the graph floats as a natural layout.
In single/multi mode: pin center node(s) via `fx`/`fy`; no `forceCenter` needed.

Simulation starts in `useEffect`, stops on unmount (`simulation.stop()`).

---

## Interactions

| Gesture | Behaviour |
|---------|-----------|
| Tap node | Select → highlight connected edges, fade unrelated nodes (opacity 30%), open bottom panel |
| Tap empty area | Deselect → restore all opacities, close panel |
| Long-press node (500ms) | Add to `centerIds` (max 3; show toast "最多 3 個中心節點" if exceeded). Long-press again to remove. |
| Drag node | D3 drag handler: set `fx/fy` on drag start/move; set `fx = null, fy = null` on drag end |
| Pinch zoom / scroll zoom | `d3-zoom` applied to the SVG `<g>` wrapper; handles pointer event conflicts with drag |
| Mode toggle | Reset `centerIds` to `[currentUserId]` (single), `[currentUserId]` (multi, user then long-presses), `[]` (cluster). Restart simulation. |

### Multi-Center Cap

Max 3 center nodes (matches KnotyGraphV3 prototype, line 380–383):
- Long-pressing when 3 centers active → toast "最多 3 個中心節點" for 1.5s, no change
- Long-pressing an existing center → removes it from `centerIds`

### Bottom Panel Content

- Node: `avatarEmoji` + `displayName` + closeness badge + relationship `label`
- Edges list: all relationships this person has, sorted by closeness descending
- Risk hint: edges with `closeness ≤ 2` flagged with danger colour (`#e05545`)

---

## Visual Design

Carried over directly from `KnotyGraphV3.jsx`:

```typescript
const CLOSENESS_STYLE: Record<Closeness, { label: string; color: string; strokeWidth: number; dash: string }> = {
  5: { label: '超熟',   color: '#7c6cf0', strokeWidth: 3,   dash: '' },
  4: { label: '不錯',   color: '#2dd4c0', strokeWidth: 2.5, dash: '' },
  3: { label: '普通',   color: '#3a3a55', strokeWidth: 1.5, dash: '5,5' },
  2: { label: '不太熟', color: '#f0c040', strokeWidth: 1.5, dash: '3,5' },
  1: { label: '有嫌隙', color: '#e05545', strokeWidth: 2,   dash: '2,4' },
};

const CIRCLE_COLOR: Record<string, string> = {
  '社團': '#7c6cf0',
  '宿舍': '#2dd4c0',
  '班上': '#ff6b8a',
  '打工': '#f0c040',
};
```

Node radii: ego = 28, center node = 26, regular = 22. Center nodes get SVG pulse animation ring.

---

## Error & Empty State Handling

`page.tsx` must handle Supabase fetch errors (network failure, RLS rejection):
- On error: pass `nodes=[]` and `edges=[]` to `GraphCanvas`
- `GraphCanvas` with 0 nodes renders an empty-state message ("還沒有人際關係資料")

All async operations in `page.tsx` follow CLAUDE.md: try-catch with error logging; never expose raw Supabase errors to the client.

---

## Sprint 0 Validation Criteria

- [ ] 30 nodes render and simulate on Android mid-range device at >30fps
- [ ] Tap / drag / pinch interactions responsive (<100ms feedback)
- [ ] Real Supabase data displayed correctly (persons + relationships)
- [ ] All 3 modes switch without crash
- [ ] TypeScript strict mode: zero `any`, zero type errors

---

## Future Migration Path (Approach 3)

The `use-graph-simulation.ts` hook is the **deletion boundary** for the future clean rewrite:

1. Delete `use-graph-simulation.ts` and rewrite from scratch with pure D3 + strict TypeScript
2. Rewrite `GraphNode.tsx`, `GraphEdge.tsx`, `GraphCanvas.tsx` — the internal rendering logic changes
3. `GraphCanvasProps` interface stays the same — **no changes to `page.tsx`**

`GraphCanvasProps` is the stable contract between the Server Component and the graph implementation. Everything below that interface can be replaced without touching data fetching.
