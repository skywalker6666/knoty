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
