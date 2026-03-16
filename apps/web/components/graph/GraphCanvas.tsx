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
