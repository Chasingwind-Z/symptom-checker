const ORG_KEY = 'enterprise_org';
const INVITE_CODE_LENGTH = 6;

export interface Organization {
  id: string;
  name: string;
  inviteCode: string;
  plan: 'free' | 'basic' | 'enterprise';
  memberCount: number;
  createdAt: string;
}

export function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 2 + INVITE_CODE_LENGTH).toUpperCase();
}

export function createOrganization(name: string): Organization {
  const org: Organization = {
    id: `org_${Math.random().toString(36).slice(2, 9)}`,
    name,
    inviteCode: generateInviteCode(),
    plan: 'free',
    memberCount: 1,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(ORG_KEY, JSON.stringify(org));
  return org;
}

export function getOrganization(): Organization | null {
  try {
    const raw = localStorage.getItem(ORG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function joinOrganization(inviteCode: string): boolean {
  const org = getOrganization();
  if (org && org.inviteCode === inviteCode) return true;
  localStorage.setItem('enterprise_member_code', inviteCode);
  return true;
}

export interface EnterpriseDashboardData {
  orgName: string;
  totalReports: number;
  weeklyChange: number;
  topSymptoms: { name: string; count: number; trend: 'up' | 'down' | 'stable' }[];
  riskDistribution: Record<string, number>;
  weeklyTrend: number[];
}

export function getEnterpriseDashboardData(orgName: string): EnterpriseDashboardData {
  return {
    orgName,
    totalReports: 127,
    weeklyChange: 12,
    topSymptoms: [
      { name: '上呼吸道感染', count: 34, trend: 'up' },
      { name: '颈椎/腰椎不适', count: 28, trend: 'stable' },
      { name: '睡眠问题', count: 22, trend: 'up' },
      { name: '胃肠不适', count: 18, trend: 'down' },
      { name: '眼疲劳', count: 15, trend: 'stable' },
    ],
    riskDistribution: { green: 68, yellow: 24, orange: 6, red: 2 },
    weeklyTrend: [15, 18, 22, 19, 25, 28, 20],
  };
}

export const PRICING_TIERS = [
  { name: '免费版', price: '¥0', limit: '50人以下', features: ['基础健康看板', '匿名聚合数据', '周报导出'] },
  { name: '基础版', price: '¥199/月', limit: '50-500人', features: ['全部免费版功能', '症状趋势分析', '部门维度筛选', '预警推送'] },
  { name: '企业版', price: '联系商务', limit: '500人以上', features: ['全部基础版功能', '专属客户经理', 'API接入', '定制报告'] },
];
