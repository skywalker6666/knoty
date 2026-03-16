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
