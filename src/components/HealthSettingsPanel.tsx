import { useState, type ComponentType } from 'react';
import {
  CheckCircle2,
  LocateFixed,
  LocateOff,
  MapPin,
  PanelLeft,
  PanelLeftClose,
  RotateCcw,
  Rows3,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react';
import {
  DEFAULT_EXPERIENCE_SETTINGS,
  type ChatDensityPreference,
  type DesktopSidebarMode,
  type ExperienceSettings,
  type LocationPreference,
  type OfficialSourcePreference,
} from '../lib/experienceSettings';
import { parseHealthCSV } from '../lib/dataImport';
import { saveMetric } from '../lib/healthMetrics';

interface HealthSettingsPanelProps {
  settings: ExperienceSettings;
  currentCity?: string | null;
  conversationCount: number;
  pendingFollowUpCount: number;
  sessionEmail?: string | null;
  onDesktopSidebarModeChange: (value: DesktopSidebarMode) => void;
  onLocationPreferenceChange: (value: LocationPreference) => void;
  onOfficialSourcePreferenceChange: (value: OfficialSourcePreference) => void;
  onChatDensityChange: (value: ChatDensityPreference) => void;
  onReset: () => void;
}

interface SettingOption<T extends string> {
  value: T;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

interface SettingGroupProps<T extends string> {
  eyebrow: string;
  title: string;
  description: string;
  value: T;
  options: SettingOption<T>[];
  onChange: (value: T) => void;
}

const desktopSidebarOptions: SettingOption<DesktopSidebarMode>[] = [
  {
    value: 'expanded',
    label: '完整侧栏',
    description: '保留所有入口与最近会话，适合经常在多个工作区之间切换。',
    icon: PanelLeft,
  },
  {
    value: 'collapsed',
    label: '图标栏',
    description: '桌面端默认收起为窄栏，让首页和聊天区更宽、更干净。',
    icon: PanelLeftClose,
    badge: '默认',
  },
];

const locationPreferenceOptions: SettingOption<LocationPreference>[] = [
  {
    value: 'device',
    label: '实时定位优先',
    description: '完成分诊后优先找附近医院；若失败，再回退到通用医院建议。',
    icon: LocateFixed,
    badge: '默认',
  },
  {
    value: 'profile',
    label: '档案城市',
    description: '不请求精准定位，改用健康档案中的城市强化本地入口和提醒。',
    icon: MapPin,
  },
  {
    value: 'none',
    label: '不使用位置',
    description: '隐藏本地提醒，改为更中性的医院与国家级公开资料对照。',
    icon: LocateOff,
  },
];

const officialSourceOptions: SettingOption<OfficialSourcePreference>[] = [
  {
    value: 'official-first',
    label: '优先官方',
    description: '把卫健委、疾控和本地公共来源提前显示，适合先核对正式建议。',
    icon: ShieldCheck,
  },
  {
    value: 'balanced',
    label: '平衡展示',
    description: '保留官方对照，同时展示联网检索到的公开资料摘录。',
    icon: SlidersHorizontal,
    badge: '默认',
  },
  {
    value: 'brief',
    label: '精简对照',
    description: '只保留最值得先看的 1–2 条权威卡片，减少结果页信息量。',
    icon: CheckCircle2,
  },
];

const chatDensityOptions: SettingOption<ChatDensityPreference>[] = [
  {
    value: 'comfortable',
    label: '舒展阅读',
    description: '保留当前留白和标准气泡间距，连续阅读更轻松。',
    icon: Rows3,
    badge: '默认',
  },
  {
    value: 'compact',
    label: '紧凑排版',
    description: '收紧聊天区间距和卡片留白，回看长对话时更省滚动。',
    icon: SlidersHorizontal,
  },
];

function SettingGroup<T extends string>({
  eyebrow,
  title,
  description,
  value,
  options,
  onChange,
}: SettingGroupProps<T>) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4">
      <div className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.08em] text-slate-500">{eyebrow}</p>
        <h3 className="mt-2 text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isActive = value === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                isActive
                  ? 'border-blue-300 bg-blue-50/90 shadow-[0_12px_28px_rgba(59,130,246,0.10)]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`rounded-xl p-2 ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{option.label}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {option.badge && (
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">
                          {option.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                          当前
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-500">{option.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function HealthSettingsPanel({
  settings,
  currentCity,
  conversationCount,
  pendingFollowUpCount,
  sessionEmail,
  onDesktopSidebarModeChange,
  onLocationPreferenceChange,
  onOfficialSourcePreferenceChange,
  onChatDensityChange,
  onReset,
}: HealthSettingsPanelProps) {
  const normalizedCity = currentCity?.trim();
  const hasCurrentCity = Boolean(normalizedCity && normalizedCity !== '中国大陆');
  const isSignedIn = Boolean(sessionEmail);
  const isDefaultSettings =
    settings.desktopSidebarMode === DEFAULT_EXPERIENCE_SETTINGS.desktopSidebarMode &&
    settings.locationPreference === DEFAULT_EXPERIENCE_SETTINGS.locationPreference &&
    settings.officialSourcePreference === DEFAULT_EXPERIENCE_SETTINGS.officialSourcePreference &&
    settings.chatDensity === DEFAULT_EXPERIENCE_SETTINGS.chatDensity;

  const [alertSubscribed, setAlertSubscribed] = useState(() => {
    return localStorage.getItem('epidemic_alert_subscribed') === 'true';
  });

  const [importResult, setImportResult] = useState<string | null>(null);

  const sidebarSummary =
    settings.desktopSidebarMode === 'collapsed'
      ? '桌面端已收起为图标栏，聊天区会获得更宽的横向空间。'
      : '桌面端保留完整侧栏，最近会话、推荐卡和状态信息始终可见。';

  const locationSummary =
    settings.locationPreference === 'device'
      ? hasCurrentCity
        ? `附近医院会优先按实时定位查找，官方资料仍会用档案城市「${normalizedCity}」补足本地入口。`
        : '附近医院会优先按实时定位查找；若没有档案城市，本地官方入口会退回更通用的公开资料。'
      : settings.locationPreference === 'profile'
        ? hasCurrentCity
          ? `已改为使用档案城市「${normalizedCity}」，不会请求精准定位。`
          : '已切换到档案城市模式；建议先补充城市，才能更稳定地看到本地入口。'
        : '已关闭位置偏好，本地提醒会隐藏，结果页改为更中性的医院与官方资料参考。';

  const officialSourceSummary =
    settings.officialSourcePreference === 'official-first'
      ? '结果页会把权威来源提前展示，并增加更多本地 / 国家级对照条目。'
      : settings.officialSourcePreference === 'brief'
        ? '结果页只保留精简的权威资料卡，减少外部公开摘录的干扰。'
        : '结果页会同时保留权威资料卡与联网公开摘录，方便综合对照。';

  const layoutSummary =
    settings.chatDensity === 'compact'
      ? '聊天区会收紧气泡和卡片间距，更适合长对话回看。'
      : '聊天区保持更宽松的留白，适合逐条阅读医生式解释。';

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Settings2 size={14} />
              偏好设置
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">按自己的使用习惯调整问诊体验</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              这些偏好只保存在当前浏览器，会立即影响桌面侧栏、本地资源、权威资料展示和聊天排版，不会改动健康档案或既有会话内容。
            </p>
          </div>

          <button
            type="button"
            onClick={onReset}
            disabled={isDefaultSettings}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw size={14} />
            恢复默认
          </button>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="grid gap-4">
            <SettingGroup
              eyebrow="桌面布局"
              title="桌面侧栏模式"
              description="决定桌面端是否一直展开最近线程、推荐卡和工作区入口。"
              value={settings.desktopSidebarMode}
              options={desktopSidebarOptions}
              onChange={onDesktopSidebarModeChange}
            />
            <SettingGroup
              eyebrow="本地资源"
              title="位置使用方式"
              description="控制医院推荐和本地提醒是优先用实时定位、档案城市，还是完全不带位置。"
              value={settings.locationPreference}
              options={locationPreferenceOptions}
              onChange={onLocationPreferenceChange}
            />
            <SettingGroup
              eyebrow="权威资料"
              title="结果页信息偏好"
              description="根据你的阅读习惯，调整官方资料和外部公开摘录在分诊结果中的比重。"
              value={settings.officialSourcePreference}
              options={officialSourceOptions}
              onChange={onOfficialSourcePreferenceChange}
            />
            <SettingGroup
              eyebrow="聊天排版"
              title="对话阅读密度"
              description="让主聊天区更舒展，或在长线程里改成更紧凑的浏览方式。"
              value={settings.chatDensity}
              options={chatDensityOptions}
              onChange={onChatDensityChange}
            />

            <div className="mt-4 rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">疾病预警订阅</p>
                  <p className="text-xs text-slate-500 mt-0.5">本地区疾病趋势异常时提醒</p>
                </div>
                <button
                  onClick={() => {
                    const next = !alertSubscribed;
                    setAlertSubscribed(next);
                    localStorage.setItem('epidemic_alert_subscribed', String(next));
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    alertSubscribed ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    alertSubscribed ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-sm font-medium text-slate-800 mb-1">导入健康数据</p>
              <p className="text-xs text-slate-500 mb-2">支持华为健康/Apple Health导出的CSV文件</p>
              <label className="block">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      const metrics = parseHealthCSV(text);
                      if (metrics.length > 0) {
                        for (const m of metrics) {
                          saveMetric({
                            type: m.type,
                            valuePrimary: m.valuePrimary,
                            valueSecondary: m.valueSecondary,
                            recordedAt: m.recordedAt,
                          });
                        }
                        setImportResult(`成功导入 ${metrics.length} 条记录`);
                      } else {
                        setImportResult('未识别到有效数据，请检查CSV格式');
                      }
                    } catch {
                      setImportResult('文件读取失败，请重试');
                    }
                  }}
                />
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 cursor-pointer hover:bg-slate-50">
                  📁 选择CSV文件
                </span>
              </label>
              {importResult && (
                <p className="mt-2 text-xs text-emerald-600">{importResult}</p>
              )}
            </div>
          </div>

          <aside className="space-y-3">
            <section className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4">
              <p className="text-xs font-medium tracking-[0.08em] text-slate-500">当前生效</p>
              <div className="mt-3 space-y-3">
                {[
                  {
                    id: 'sidebar',
                    title: '桌面侧栏',
                    summary: sidebarSummary,
                    icon: PanelLeft,
                  },
                  {
                    id: 'location',
                    title: '本地资源',
                    summary: locationSummary,
                    icon: LocateFixed,
                  },
                  {
                    id: 'sources',
                    title: '权威资料',
                    summary: officialSourceSummary,
                    icon: ShieldCheck,
                  },
                  {
                    id: 'chat',
                    title: '聊天排版',
                    summary: layoutSummary,
                    icon: Rows3,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                          <Icon size={15} />
                        </div>
                        <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{item.summary}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 px-4 py-4">
              <p className="text-xs font-medium tracking-[0.08em] text-slate-500">当前账号与数据</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/80 bg-white/90 px-3 py-3">
                  <p className="text-sm font-semibold text-slate-900">{conversationCount} 段历史会话</p>
                  <p className="mt-1 text-[13px] text-slate-500">
                    {pendingFollowUpCount > 0
                      ? `还有 ${pendingFollowUpCount} 项待跟进，可结合侧栏和记录中心继续处理。`
                      : '当前没有待跟进项目，可按自己的节奏继续问诊。'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/90 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                      <UserRound size={15} />
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                      {isSignedIn ? '已连接云端账号' : '当前为游客模式'}
                    </p>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                    {isSignedIn
                      ? '偏好和工作区展示会保存在本机浏览器，问诊记录仍按现有同步方式继续管理。'
                      : '这些偏好同样会保存在本机，后续登录后也不会覆盖你已有的问诊内容。'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">
                      {hasCurrentCity ? `档案城市 · ${normalizedCity}` : '尚未填写档案城市'}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">
                      即时生效
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}
