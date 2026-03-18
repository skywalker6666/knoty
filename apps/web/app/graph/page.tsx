// apps/web/app/graph/page.tsx
import type { GraphNode, GraphEdge } from '@knoty/shared';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { createRouteClient, getAuthUser } from '@/lib/supabase-server';

export default async function GraphPage() {
  const supabase = await createRouteClient();
  const user = await getAuthUser(supabase);
  if (!user) return null; // middleware handles redirect, this is a fallback

  try {
    const [personsResult, relationshipsResult] = await Promise.all([
      supabase
        .from('persons')
        .select('id, display_name, avatar_emoji, circles, tags')
        .eq('user_id', user.id),
      supabase
        .from('relationships')
        .select('id, person_a, person_b, closeness, label, direction, context')
        .eq('user_id', user.id),
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
      id: user.id,
      displayName: '我',
      avatarEmoji: '🧑',
      circles: [],
      tags: [],
    };
    // Prepend only if not already in the DB (in case user saved themselves)
    if (!nodes.some(n => n.id === user.id)) {
      nodes.unshift(meNode);
    }

    return (
      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] pb-20">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          currentUserId={user.id}
        />
      </main>
    );
  } catch (err) {
    console.error('[GraphPage] fetch error:', err);
    return (
      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] pb-20">
        <GraphCanvas nodes={[]} edges={[]} currentUserId={user.id} />
      </main>
    );
  }
}
