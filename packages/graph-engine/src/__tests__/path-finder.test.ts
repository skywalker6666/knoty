import { describe, it, expect } from 'vitest';
import { normalizeEdge, buildAdjacencyList } from '../path-finder';
import type { Relationship } from '@knoty/shared';

// UUIDs sorted so A < B lexicographically
const UUID_A = '00000000-0000-0000-0000-000000000001';
const UUID_B = '00000000-0000-0000-0000-000000000002';
const UUID_C = '00000000-0000-0000-0000-000000000003';

describe('normalizeEdge', () => {
  it('returns as-is when from < to', () => {
    const result = normalizeEdge(UUID_A, UUID_B, 'mutual');
    expect(result).toEqual({ personA: UUID_A, personB: UUID_B, direction: 'mutual' });
  });

  it('swaps IDs when from > to', () => {
    const result = normalizeEdge(UUID_B, UUID_A, 'mutual');
    expect(result).toEqual({ personA: UUID_A, personB: UUID_B, direction: 'mutual' });
  });

  it('flips a_to_b to b_to_a when IDs are swapped', () => {
    const result = normalizeEdge(UUID_B, UUID_A, 'a_to_b');
    expect(result).toEqual({ personA: UUID_A, personB: UUID_B, direction: 'b_to_a' });
  });

  it('flips b_to_a to a_to_b when IDs are swapped', () => {
    const result = normalizeEdge(UUID_B, UUID_A, 'b_to_a');
    expect(result).toEqual({ personA: UUID_A, personB: UUID_B, direction: 'a_to_b' });
  });

  it('defaults direction to mutual', () => {
    const result = normalizeEdge(UUID_A, UUID_B);
    expect(result.direction).toBe('mutual');
  });
});

describe('buildAdjacencyList', () => {
  const rel: Relationship = {
    id: 'r1',
    userId: 'user1',
    personA: UUID_A,
    personB: UUID_B,
    closeness: 4,
    direction: 'a_to_b',
    createdAt: '',
    updatedAt: '',
  };

  it('creates entries for both persons', () => {
    const map = buildAdjacencyList([rel]);
    expect(map.has(UUID_A)).toBe(true);
    expect(map.has(UUID_B)).toBe(true);
  });

  it('A neighbours include B with original direction', () => {
    const map = buildAdjacencyList([rel]);
    const aNeighbours = map.get(UUID_A)!;
    expect(aNeighbours).toHaveLength(1);
    expect(aNeighbours[0]).toMatchObject({ personId: UUID_B, closeness: 4, direction: 'a_to_b' });
  });

  it('B neighbours include A with flipped direction', () => {
    const map = buildAdjacencyList([rel]);
    const bNeighbours = map.get(UUID_B)!;
    expect(bNeighbours).toHaveLength(1);
    expect(bNeighbours[0]).toMatchObject({ personId: UUID_A, closeness: 4, direction: 'b_to_a' });
  });

  it('aggregates multiple relationships correctly', () => {
    const rel2: Relationship = {
      id: 'r2', userId: 'user1',
      personA: UUID_A, personB: UUID_C,
      closeness: 2, direction: 'mutual',
      createdAt: '', updatedAt: '',
    };
    const map = buildAdjacencyList([rel, rel2]);
    expect(map.get(UUID_A)).toHaveLength(2);
    expect(map.get(UUID_B)).toHaveLength(1);
    expect(map.get(UUID_C)).toHaveLength(1);
  });
});
