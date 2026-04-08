import type { MetricType } from './healthMetrics';

export interface ImportedMetric {
  type: MetricType;
  valuePrimary: number;
  valueSecondary?: number;
  recordedAt: string;
}

export function parseHealthCSV(csvText: string): ImportedMetric[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const metrics: ImportedMetric[] = [];

  for (let i = 1; i < lines.length && i < 500; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < 2) continue;

    try {
      if (header.includes('systolic') || header.includes('收缩压')) {
        const primary = parseFloat(cols[0]);
        const secondary = parseFloat(cols[1]);
        if (!Number.isFinite(primary)) continue;
        metrics.push({
          type: 'blood_pressure',
          valuePrimary: primary,
          valueSecondary: Number.isFinite(secondary) ? secondary : undefined,
          recordedAt: cols[2] || new Date().toISOString(),
        });
      } else if (header.includes('glucose') || header.includes('血糖')) {
        const primary = parseFloat(cols[0]);
        if (!Number.isFinite(primary)) continue;
        metrics.push({
          type: 'blood_sugar',
          valuePrimary: primary,
          recordedAt: cols[1] || new Date().toISOString(),
        });
      } else if (header.includes('heart') || header.includes('心率')) {
        const primary = parseFloat(cols[0]);
        if (!Number.isFinite(primary)) continue;
        metrics.push({
          type: 'heart_rate',
          valuePrimary: primary,
          recordedAt: cols[1] || new Date().toISOString(),
        });
      }
    } catch {
      // skip malformed rows
    }
  }

  return metrics;
}

export function getImportSummary(metrics: ImportedMetric[]): string {
  const counts: Record<string, number> = {};
  for (const m of metrics) {
    counts[m.type] = (counts[m.type] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([type, count]) => `${type}: ${count}条`)
    .join('、');
}
