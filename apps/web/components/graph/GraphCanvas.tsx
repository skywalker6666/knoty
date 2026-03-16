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
