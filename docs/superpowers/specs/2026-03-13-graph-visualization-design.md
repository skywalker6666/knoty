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

Defined in `packages/shared/src/types.ts`:

```typescript
interface GraphNode {
  id: string;
  display_name: string;
  avatar_emoji: string;
  circles: string[];
}

interface GraphEdge {
  id: string;
  person_a: string;       // UUID; DB guarantees person_a < person_b
  person_b: string;
  closeness: number;      // 1–5
  label: string | null;
  direction: 'mutual' | 'a_to_b' | 'b_to_a';
}
```

`graph/page.tsx` injects a synthetic `me` node into the nodes array and passes `currentUserId` so `GraphCanvas` can identify the ego node.

```typescript
interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentUserId: string;
}
```

---

## Simulation Hook (`use-graph-simulation.ts`)

```typescript
interface SimNode extends GraphNode {
  x: number;
  y: number;
  fx?: number;  // set during drag; cleared on drag end
  fy?: number;
}

function useGraphSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  centerIds: string[],    // ['me'] for single-center; ['me', nodeId] for multi
  mode: 'single' | 'multi' | 'cluster',
  width: number,
  height: number,
): SimNode[]
```

### D3 Force Configuration

| Force | Config |
|-------|--------|
| `forceLink` | strength = `closeness / 5 * 0.8`; higher closeness = stronger pull |
| `forceManyBody` | strength = −300 (repulsion) |
| `forceCollide` | radius = 32 (prevents emoji overlap) |
| `forceCenter` | cluster mode only; pulls graph center to viewport center |
| Center nodes | `fx/fy` pinned to viewport center; released in cluster mode |

Simulation starts in `useEffect`, stops on unmount. Each tick updates `SimNode[]` state causing SVG re-render.

---

## Interactions

| Gesture | Behaviour |
|---------|-----------|
| Tap node | Select → highlight connected edges, fade unrelated nodes (opacity 30%), open bottom panel |
| Tap empty area | Deselect → restore all opacities, close panel |
| Long-press node (500ms) | Multi-center mode: add node to `centerIds`, restart simulation |
| Drag node | Set `fx/fy` to pin; release on pointer-up to return to simulation |
| Pinch zoom | Scale SVG `viewBox` via pointer events |
| Mode toggle | Reset `centerIds` to default for mode, restart simulation |

### Bottom Panel Content

- Node: avatar emoji + display name + closeness badge + relationship label
- Edges list: all relationships this person has, sorted by closeness
- Risk hint: closeness ≤ 2 edges flagged with warning colour

---

## Visual Design

Carried over from `KnotyGraphV3.jsx`:

```typescript
const CLOSENESS_STYLE = {
  5: { label: '超熟',   color: '#7c6cf0', strokeWidth: 3,   dash: '' },
  4: { label: '不錯',   color: '#2dd4c0', strokeWidth: 2.5, dash: '' },
  3: { label: '普通',   color: '#3a3a55', strokeWidth: 1.5, dash: '5,5' },
  2: { label: '不太熟', color: '#f0c040', strokeWidth: 1.5, dash: '3,5' },
  1: { label: '有嫌隙', color: '#e05545', strokeWidth: 2,   dash: '2,4' },
}

const CIRCLE_COLOR = {
  '社團': '#7c6cf0',
  '宿舍': '#2dd4c0',
  '班上': '#ff6b8a',
  '打工': '#f0c040',
}
```

Node size: ego = 28r, center = 26r, regular = 22r. Center nodes get pulse animation ring.

---

## Sprint 0 Validation Criteria

- [ ] 30 nodes render and simulate on Android mid-range device at >30fps
- [ ] Tap / drag / pinch interactions responsive (<100ms feedback)
- [ ] Real Supabase data displayed correctly (persons + relationships)
- [ ] All 3 modes switch without crash

---

## Future Migration Path (Approach 3)

When refactoring to a clean TypeScript rewrite:
1. Replace `use-graph-simulation.ts` with a pure D3 implementation (no KnotyGraphV3 code)
2. Rewrite `GraphNode.tsx` and `GraphEdge.tsx` with strict TypeScript from scratch
3. `GraphCanvas.tsx` interface (`GraphCanvasProps`) stays the same — no changes to `page.tsx`
