import React, { useState, useMemo } from 'react';
import { Building2, TrendingUp, TrendingDown, Minus, Users, Shield, BarChart3 } from 'lucide-react';
import { getOrganization, createOrganization, getEnterpriseDashboardData, PRICING_TIERS, type Organization } from '../lib/enterpriseData';

const RISK_COLORS: Record<string, string> = {
  green: 'bg-emerald-500', yellow: 'bg-amber-500', orange: 'bg-orange-500', red: 'bg-red-500',
};

const TREND_ICONS: Record<string, React.ReactNode> = {
  up: <TrendingUp size={12} className="text-red-500" />,
  down: <TrendingDown size={12} className="text-emerald-500" />,
  stable: <Minus size={12} className="text-slate-400" />,
};

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

interface B2BDashboardProps {
  onBack: () => void;
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <p className="text-[11px] text-emerald-700">{text}</p>
    </div>
  );
}

export function B2BDashboard({ onBack }: B2BDashboardProps) {
  const [org, setOrg] = useState<Organization | null>(() => getOrganization());
  const [orgNameInput, setOrgNameInput] = useState('');
  const [partnerNameInput, setPartnerNameInput] = useState('');
  const [partnerContactInput, setPartnerContactInput] = useState('');
  const [partnerSubmitted, setPartnerSubmitted] = useState(() => {
    return !!localStorage.getItem('partner_application');
  });

  const data = useMemo(() => {
    if (!org) return null;
    return getEnterpriseDashboardData(org.name);
  }, [org]);

  const handleCreate = () => {
    if (!orgNameInput.trim()) return;
    const newOrg = createOrganization(orgNameInput.trim());
    setOrg(newOrg);
  };

  if (!org) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <button onClick={onBack} className="text-sm text-blue-600 mb-6">← 返回首页</button>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Building2 size={40} className="mx-auto text-blue-600 mb-3" />
            <h1 className="text-xl font-bold text-slate-800">企业健康看板</h1>
            <p className="text-sm text-slate-500 mt-2">了解员工匿名健康趋势，及时发现群体性风险</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
            <p className="text-sm font-semibold text-slate-800 mb-3">创建企业账号</p>
            <input
              value={orgNameInput}
              onChange={e => setOrgNameInput(e.target.value)}
              placeholder="企业/组织名称"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none mb-3"
            />
            <button onClick={handleCreate} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              创建并开始体验
            </button>
          </div>

          <div className="mt-8">
            <p className="text-sm font-semibold text-slate-800 mb-4 text-center">定价方案</p>
            <div className="grid gap-3">
              {PRICING_TIERS.map(tier => (
                <div key={tier.name} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-800">{tier.name}</p>
                    <div>
                      <span className="text-base font-bold text-blue-600">{tier.price}</span>
                      <span className="text-[11px] text-slate-400 ml-1">{tier.limit}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tier.features.map(f => (
                      <span key={f} className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-4 py-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">社区卫生中心合作</p>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed mb-3">
              面向基层卫生机构提供辖区居民匿名健康趋势数据，支持街道/社区精度，助力公共卫生决策。
            </p>
            <div className="space-y-2 mb-3">
              <FeatureItem text="街道级疾病趋势热力图" />
              <FeatureItem text="辖区高风险人群占比分析" />
              <FeatureItem text="季节性疾病预警推送" />
              <FeatureItem text="官方背书展示增加用户信任" />
            </div>
            <div className="rounded-lg bg-white/80 px-3 py-2.5">
              <p className="text-[11px] text-slate-600 mb-2">合作申请</p>
              <input
                value={partnerNameInput}
                onChange={e => setPartnerNameInput(e.target.value)}
                placeholder="卫生中心/机构名称"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none mb-2"
              />
              <input
                value={partnerContactInput}
                onChange={e => setPartnerContactInput(e.target.value)}
                placeholder="联系方式（手机/邮箱）"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none mb-2"
              />
              <button
                onClick={() => {
                  if (partnerNameInput.trim() && partnerContactInput.trim()) {
                    localStorage.setItem('partner_application', JSON.stringify({
                      name: partnerNameInput, contact: partnerContactInput, status: 'pending', appliedAt: new Date().toISOString()
                    }));
                    setPartnerSubmitted(true);
                  }
                }}
                className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                {partnerSubmitted ? '✓ 已提交，我们会尽快联系' : '提交合作申请'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxTrend = Math.max(...data.weeklyTrend, 1);
  const totalRisk = Object.values(data.riskDistribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-sm text-blue-600">← 返回</button>
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            <p className="text-sm font-semibold text-slate-800">{data.orgName}</p>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] text-blue-600">
            邀请码: {org.inviteCode}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-white border border-slate-200 px-3 py-3 text-center">
            <Users size={16} className="mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold text-slate-800">{data.totalReports}</p>
            <p className="text-[10px] text-slate-400">总上报</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 px-3 py-3 text-center">
            <TrendingUp size={16} className="mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold text-slate-800">+{data.weeklyChange}%</p>
            <p className="text-[10px] text-slate-400">周环比</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 px-3 py-3 text-center">
            <Shield size={16} className="mx-auto text-emerald-500 mb-1" />
            <p className="text-lg font-bold text-slate-800">{data.riskDistribution.green}%</p>
            <p className="text-[10px] text-slate-400">低风险占比</p>
          </div>
        </div>

        {/* Risk bar */}
        <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 mb-4">
          <p className="text-[11px] font-medium text-slate-600 mb-2">风险分布</p>
          <div className="flex h-3 rounded-full overflow-hidden">
            {Object.entries(data.riskDistribution).map(([level, pct]) => (
              <div key={level} className={`${RISK_COLORS[level] || 'bg-slate-300'}`} style={{ width: `${(pct / totalRisk) * 100}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {Object.entries(data.riskDistribution).map(([level, pct]) => (
              <span key={level} className="text-[9px] text-slate-400">{pct}%</span>
            ))}
          </div>
        </div>

        {/* Top symptoms */}
        <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 mb-4">
          <p className="text-[11px] font-medium text-slate-600 mb-2">Top 症状</p>
          <div className="space-y-2">
            {data.topSymptoms.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 w-4">{i + 1}</span>
                <span className="flex-1 text-xs text-slate-700">{s.name}</span>
                <span className="text-xs font-medium text-slate-800">{s.count}</span>
                {TREND_ICONS[s.trend]}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly trend */}
        <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-blue-500" />
            <p className="text-[11px] font-medium text-slate-600">本周趋势</p>
          </div>
          <div className="flex items-end gap-2 h-20">
            {data.weeklyTrend.map((val, i) => (
              <div key={DAY_LABELS[i]} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-400">{val}</span>
                <div className="w-full rounded-t bg-blue-400" style={{ height: `${(val / maxTrend) * 100}%` }} />
                <span className="text-[9px] text-slate-400">{DAY_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
          <p className="text-[11px] font-medium text-slate-600 mb-3">升级方案</p>
          <div className="space-y-2">
            {PRICING_TIERS.map(tier => (
              <div key={tier.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-xs font-medium text-slate-700">{tier.name}</span>
                <span className="text-xs font-bold text-blue-600">{tier.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Community Health Center Partnership */}
        <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-4 py-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">社区卫生中心合作</p>
          </div>
          <p className="text-xs text-emerald-700 leading-relaxed mb-3">
            面向基层卫生机构提供辖区居民匿名健康趋势数据，支持街道/社区精度，助力公共卫生决策。
          </p>
          <div className="space-y-2 mb-3">
            <FeatureItem text="街道级疾病趋势热力图" />
            <FeatureItem text="辖区高风险人群占比分析" />
            <FeatureItem text="季节性疾病预警推送" />
            <FeatureItem text="官方背书展示增加用户信任" />
          </div>
          <div className="rounded-lg bg-white/80 px-3 py-2.5">
            <p className="text-[11px] text-slate-600 mb-2">合作申请</p>
            <input
              value={partnerNameInput}
              onChange={e => setPartnerNameInput(e.target.value)}
              placeholder="卫生中心/机构名称"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none mb-2"
            />
            <input
              value={partnerContactInput}
              onChange={e => setPartnerContactInput(e.target.value)}
              placeholder="联系方式（手机/邮箱）"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none mb-2"
            />
            <button
              onClick={() => {
                if (partnerNameInput.trim() && partnerContactInput.trim()) {
                  localStorage.setItem('partner_application', JSON.stringify({
                    name: partnerNameInput, contact: partnerContactInput, status: 'pending', appliedAt: new Date().toISOString()
                  }));
                  setPartnerSubmitted(true);
                }
              }}
              className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              {partnerSubmitted ? '✓ 已提交，我们会尽快联系' : '提交合作申请'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
