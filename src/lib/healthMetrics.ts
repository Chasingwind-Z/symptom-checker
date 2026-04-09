import { getSupabaseClient } from './supabase';

const METRICS_KEY = 'health_metrics';

export type MetricType = 'blood_pressure' | 'blood_sugar' | 'heart_rate';

export interface HealthMetric {
  id: string;
  type: MetricType;
  valuePrimary: number; // systolic for BP, value for others
  valueSecondary?: number; // diastolic for BP
  mealContext?: 'fasting' | 'postmeal'; // for blood sugar
  recordedAt: string;
  note?: string;
}

export async function saveMetric(metric: Omit<HealthMetric, 'id'>): Promise<HealthMetric> {
  const items = getMetrics();
  const newMetric: HealthMetric = {
    ...metric,
    id: `metric_${Math.random().toString(36).slice(2, 9)}`,
  };
  items.push(newMetric);
  localStorage.setItem(METRICS_KEY, JSON.stringify(items.slice(-200)));

  // Cloud sync (fire and forget)
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        Promise.resolve(
          supabase.from('health_metrics_cloud').insert({
            user_id: user.id,
            type: metric.type,
            value_primary: metric.valuePrimary,
            value_secondary: metric.valueSecondary,
            meal_context: metric.mealContext,
            recorded_at: metric.recordedAt,
          })
        ).catch(() => {});
      }
    }
  } catch {
    // Ignore cloud sync failures
  }

  return newMetric;
}

export function getMetrics(type?: MetricType): HealthMetric[] {
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    const all: HealthMetric[] = raw ? JSON.parse(raw) : [];
    return type ? all.filter(m => m.type === type) : all;
  } catch {
    return [];
  }
}

export function getRecentMetrics(type: MetricType, count = 10): HealthMetric[] {
  return getMetrics(type).slice(-count);
}

export function getMetricsSummaryForAI(): string {
  const bp = getRecentMetrics('blood_pressure', 3);
  const sugar = getRecentMetrics('blood_sugar', 3);
  const parts: string[] = [];

  if (bp.length > 0) {
    const bpText = bp.map(m => `${m.valuePrimary}/${m.valueSecondary}`).join('、');
    parts.push(`近期血压：${bpText}`);
  }
  if (sugar.length > 0) {
    const sugarText = sugar.map(m => `${m.valuePrimary}${m.mealContext === 'fasting' ? '(空腹)' : '(餐后)'}`).join('、');
    parts.push(`近期血糖：${sugarText}`);
  }

  return parts.join('；');
}

export interface MetricAlert {
  type: MetricType;
  message: string;
  severity: 'warning' | 'danger';
}

export function checkMetricAlerts(): MetricAlert[] {
  const alerts: MetricAlert[] = [];

  const bp = getRecentMetrics('blood_pressure', 3);
  const highBPCount = bp.filter(m => m.valuePrimary >= 140 || (m.valueSecondary && m.valueSecondary >= 90)).length;
  if (highBPCount >= 3) {
    alerts.push({
      type: 'blood_pressure',
      message: '连续3次血压偏高（≥140/90），建议尽快就医',
      severity: 'danger',
    });
  } else if (highBPCount >= 2) {
    alerts.push({
      type: 'blood_pressure',
      message: '近期血压偏高，请继续监测',
      severity: 'warning',
    });
  }

  const sugar = getRecentMetrics('blood_sugar', 3);
  const highSugarCount = sugar.filter(m => m.mealContext === 'fasting' && m.valuePrimary >= 7.0).length;
  if (highSugarCount >= 2) {
    alerts.push({
      type: 'blood_sugar',
      message: '空腹血糖连续偏高（≥7.0），建议就医检查',
      severity: 'danger',
    });
  }

  return alerts;
}
