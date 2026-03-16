// scripts/perf-test.ts
// PoC 3: Supabase CTE Latency Benchmark
// Run: pnpm perf (from repo root, after perf_seed.sql has been executed)

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env vars — try .env then .env.local (local takes precedence)
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });
config({ path: resolve(process.cwd(), 'apps/web/.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';

const PERF_USER_ID = 'f0000000-0000-0000-0000-000000000000';
const PASS_THRESHOLD_MS = 100;
const RUNS_PER_TEST = 5;

const PERSONS = {
  soduan_1:  'f0000001-0000-0000-0000-000000000001',
  soduan_2:  'f0000001-0000-0000-0000-000000000002',
  banshang_1:'f0000002-0000-0000-0000-000000000001',
  sushe_1:   'f0000003-0000-0000-0000-000000000001',
  isolated:  'f0000009-0000-0000-0000-000000000001',
} as const;

const TEST_CASES = [
  {
    name: 'same-circle direct (depth 1)',
    from: PERSONS.soduan_1,
    to:   PERSONS.soduan_2,
  },
  {
    name: 'cross-circle 2-hop',
    from: PERSONS.soduan_1,
    to:   PERSONS.banshang_1,
  },
  {
    name: 'cross-circle 3-hop (worst case)',
    from: PERSONS.soduan_1,
    to:   PERSONS.sushe_1,
  },
  {
    name: 'no path found',
    from: PERSONS.soduan_1,
    to:   PERSONS.isolated,
  },
];

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error(
      'Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and ' +
      'SUPABASE_SERVICE_ROLE_KEY are set in .env or .env.local'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Verify dataset exists before running
  const { count, error: countErr } = await supabase
    .from('persons')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', PERF_USER_ID);

  if (countErr) {
    console.error('Failed to connect to Supabase:', countErr.message);
    process.exit(1);
  }
  if (!count || count < 200) {
    console.error(
      `Dataset not found (${count ?? 0} persons). ` +
      'Run supabase/perf_seed.sql in the Supabase Dashboard first.'
    );
    process.exit(1);
  }

  console.log('\n[Knoty PoC 3] Supabase CTE Latency Benchmark');
  console.log('─'.repeat(45));
  console.log(`Dataset: ${count} nodes\n`);

  let passCount = 0;

  for (let t = 0; t < TEST_CASES.length; t++) {
    const tc = TEST_CASES[t];
    const runs: number[] = [];

    for (let r = 0; r < RUNS_PER_TEST; r++) {
      const start = performance.now();
      const { error } = await supabase.rpc('find_relationship_paths', {
        p_from_id:   tc.from,
        p_to_id:     tc.to,
        p_max_depth: 3,
        p_user_id:   PERF_USER_ID,
      });
      const elapsed = Math.round(performance.now() - start);

      if (error) {
        console.error(`Test ${t + 1} run ${r + 1} error:`, error.message);
        process.exit(1);
      }
      runs.push(elapsed);
    }

    const med = median(runs);
    const pass = med < PASS_THRESHOLD_MS;
    if (pass) passCount++;

    console.log(`Test ${t + 1}: ${tc.name}`);
    console.log(`  runs:   ${runs.map(r => r + 'ms').join('  ')}`);
    console.log(`  median: ${med}ms  ${pass ? '✅ PASS' : '❌ FAIL'}\n`);
  }

  console.log('─'.repeat(45));
  const allPass = passCount === TEST_CASES.length;
  console.log(
    `Overall: ${passCount}/${TEST_CASES.length} PASS  ` +
    (allPass ? '🎉 Sprint 0 PoC 3 VERIFIED' : '❌ NEEDS OPTIMIZATION')
  );
  console.log('');

  if (!allPass) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
