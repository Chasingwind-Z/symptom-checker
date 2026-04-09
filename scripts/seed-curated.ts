// This script reads curated markdown files and inserts them into Supabase
// Run with: npx tsx scripts/seed-curated.ts

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CURATED_DIR = join(__dirname, '..', 'data', 'curated');

interface Card {
  title: string;
  content: string;
  population: string;
  source_type: string;
  source_ref: string;
  source_date: string;
  review_status: string;
}

function parseMarkdown(filePath: string): Card[] {
  const raw = readFileSync(filePath, 'utf-8');
  const cards: Card[] = [];

  // Normalize line endings
  const text = raw.replace(/\r\n/g, '\n');

  // Parse frontmatter
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
  const fm: Record<string, string> = {};
  if (fmMatch) {
    for (const line of fmMatch[1].split('\n')) {
      const [key, ...val] = line.split(':');
      if (key && val.length) fm[key.trim()] = val.join(':').trim().replace(/^["']|["']$/g, '');
    }
  }

  // Parse cards (split by ## 卡片)
  const sections = text.split(/## 卡片\d+/).slice(1);
  for (const section of sections) {
    const titleMatch = section.match(/\*\*标题\*\*:\s*(.+)/);
    const contentMatch = section.match(/\*\*内容\*\*:\s*\n([\s\S]*?)(?=\n## |\n---|\n\*\*标题|$)/);
    if (titleMatch && contentMatch) {
      cards.push({
        title: titleMatch[1].trim(),
        content: contentMatch[1].trim(),
        population: fm.population || 'general',
        source_type: fm.source_type || 'curated',
        source_ref: fm.source_ref || '',
        source_date: fm.source_date || '2026-04-09',
        review_status: fm.review_status || 'pending_medical_review',
      });
    }
  }
  return cards;
}

async function main() {
  const files = readdirSync(CURATED_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} curated files`);

  let totalCards = 0;
  for (const file of files) {
    const cards = parseMarkdown(join(CURATED_DIR, file));
    console.log(`  ${file}: ${cards.length} cards`);
    totalCards += cards.length;

    // Output as JSON for manual Supabase import
    for (const card of cards) {
      console.log(JSON.stringify(card));
    }
  }
  console.log(`\nTotal: ${totalCards} cards`);
}

main().catch(console.error);
