/**
 * Show version history for a knowledge chunk by source_ref
 * Usage: npx tsx scripts/show-knowledge-history.ts "source_ref_value"
 */

const sourceRef = process.argv[2];
if (!sourceRef) {
  console.log('Usage: npx tsx scripts/show-knowledge-history.ts <source_ref>');
  process.exit(1);
}

console.log(`Looking up versions for: ${sourceRef}`);
console.log('Note: This requires Supabase connection. Run against your Supabase instance.');
console.log(`
  SELECT id, title, version, is_active, review_status, created_at, superseded_by
  FROM knowledge_chunks
  WHERE source_ref = '${sourceRef}'
  ORDER BY version DESC;
`);
