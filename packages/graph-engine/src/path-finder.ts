import type { Relationship, RelationDirection, Closeness } from '@knoty/shared';

function flipDirection(dir: RelationDirection): RelationDirection {
  if (dir === 'a_to_b') return 'b_to_a';
  if (dir === 'b_to_a') return 'a_to_b';
  return 'mutual';
}

// ── normalizeEdge ─────────────────────────────────────────────────────────────

export interface NormalizedEdge {
  personA: string;         // guaranteed < personB (matches DB CHECK constraint)
  personB: string;
  direction: RelationDirection;
}

/**
 * Ensures personA < personB, matching the DB CHECK(person_a < person_b) constraint.
 * Flips direction semantics when IDs are swapped.
 *
 * Call this before every INSERT into the relationships table.
 */
export function normalizeEdge(
  from: string,
  to: string,
  direction: RelationDirection = 'mutual',
): NormalizedEdge {
  if (from < to) {
    return { personA: from, personB: to, direction };
  }
  return { personA: to, personB: from, direction: flipDirection(direction) };
}

// ── buildAdjacencyList ────────────────────────────────────────────────────────

export interface Neighbour {
  personId: string;
  closeness: Closeness;
  direction: RelationDirection;
  context?: string;
}

/**
 * Builds a bidirectional adjacency list from a flat relationship array.
 * Used for client-side graph operations (D3 layout, local path preview).
 * Server-side path finding uses find_relationship_paths() SQL function.
 */
export function buildAdjacencyList(
  relationships: Relationship[],
): Map<string, Neighbour[]> {
  const map = new Map<string, Neighbour[]>();

  for (const rel of relationships) {
    // personA → personB
    if (!map.has(rel.personA)) map.set(rel.personA, []);
    map.get(rel.personA)!.push({
      personId:  rel.personB,
      closeness: rel.closeness,
      direction: rel.direction,
      context:   rel.context,
    });

    // personB → personA (flip direction for reverse traversal)
    if (!map.has(rel.personB)) map.set(rel.personB, []);
    map.get(rel.personB)!.push({
      personId:  rel.personA,
      closeness: rel.closeness,
      direction: flipDirection(rel.direction),
      context:   rel.context,
    });
  }

  return map;
}
