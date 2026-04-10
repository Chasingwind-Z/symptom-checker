/**
 * One-click seed script — runs all ETL pipelines
 * Usage: npx tsx scripts/seed-all.ts
 */

import './seed-curated';
import './etl-medlineplus';
import './etl-cdc';

console.log('\n=== SEED COMPLETE ===');
console.log('Run the above JSON lines through Supabase import to populate knowledge_chunks.');
