# 健康助手 UX 精打磨 — 多 Agent 并行执行

> 本 Prompt 包含 10 个优化任务，分 3 个优先级。
> 建议每个 Part 单独 commit，Part A 最优先。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 技术栈与约束
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- React 18 + TypeScript strict + Vite + Tailwind
- `noUnusedLocals: true`, `noUnusedParameters: true`
- 不允许在 render/useMemo 中使用 `Date.now()` 或 `new Date()`
- setState 在 useEffect 内需 `window.setTimeout(() => setState(...), 0)`
- 每个 commit message 末尾加：`Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`
- `npm run build`（即 `tsc -b && vite build`）必须 0 error 才能 commit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Part A · 紧急修复（影响核心体验）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### A1. 回访系统：增加删除 / 永久忽略 / 暂时跳过

**问题**：测试产生的回访记录无法删除，持续弹出影响体验。
当前 FollowUpReminder 的 X 按钮只是 `setDismissed(true)`
（内存级隐藏），刷新页面又会弹出。

**涉及文件**：
- `src/lib/symptomTracking.ts` — 已有 `deleteTrackingEntry()` 但未被调用
- `src/lib/followUpRecords.ts` — 结构化 follow-up 记录，无删除 UI
- `src/components/FollowUpReminder.tsx` — 弹窗组件
- `src/types/index.ts` — `SymptomTrackingEntry` 类型

**修改方案**：

1. **FollowUpReminder.tsx** 增加三个操作：

```tsx
// 在现有的 "已经好多了 / 没什么变化 / 更严重了" 按钮上方，加一行操作栏：
<div className="flex items-center justify-between mb-2 text-xs text-slate-400">
  <span>👋 上次问诊回访</span>
  <div className="flex gap-2">
    <button onClick={handleSkip} className="hover:text-slate-600">
      稍后再问
    </button>
    <button onClick={handleIgnore} className="hover:text-amber-600">
      不再提醒
    </button>
    <button onClick={handleDelete} className="hover:text-red-500">
      删除记录
    </button>
  </div>
</div>
```

2. **实现三种处理**：

```typescript
// 稍后再问 — 把 followUpStatus 设为 'snoozed'，24h 后再弹
const handleSkip = () => {
  if (!entry) return;
  snoozeFollowUp(entry.id); // 新函数
  animateOut();
};

// 不再提醒 — 把 followUpStatus 设为 'dismissed'，永不再弹
const handleIgnore = () => {
  if (!entry) return;
  updateFollowUpStatus(entry.id, 'dismissed'); // 新 status
  animateOut();
};

// 删除记录 — 从 localStorage 彻底删除
const handleDelete = () => {
  if (!entry) return;
  deleteTrackingEntry(entry.id); // 已存在但未被调用
  animateOut();
};
```

3. **symptomTracking.ts** 新增 `snoozeFollowUp` 函数：

```typescript
export function snoozeFollowUp(entryId: string): void {
  const entries = loadEntries();
  const entry = entries.find(e => e.id === entryId);
  if (entry) {
    // 把 timestamp 往后推 24h，让 getPendingFollowUp 延迟触发
    entry.timestamp = Date.now();
    persistEntries(entries);
  }
}
```

4. **getPendingFollowUp** 过滤掉 `dismissed` 状态：

```typescript
export function getPendingFollowUp(): SymptomTrackingEntry | null {
  const entries = loadEntries();
  const now = Date.now();
  const FOLLOW_UP_DELAY = 48 * 60 * 60 * 1000;
  return entries.find(
    (e) => e.followUpStatus === 'pending' && now - e.timestamp >= FOLLOW_UP_DELAY
  ) ?? null;
}
```

5. **types/index.ts** — 扩展 `FollowUpStatus`：

当前是 `'pending' | 'better' | 'same' | 'worse'`
改为 `'pending' | 'better' | 'same' | 'worse' | 'dismissed' | 'snoozed'`

6. **（可选）在"记录"页面显示回访历史列表**，每条可删除：

在工作区/记录页面如果有显示 tracking entries 的地方，
给每条加一个删除按钮调用 `deleteTrackingEntry(id)`。

**commit**: `feat(followup): add delete, snooze, and dismiss for follow-ups`

---

### A2. 模型路由优化：确保选择真正生效

**问题**：
- `ChatInput.tsx` 第 658 行 `onChange={() => {}}` 是**空函数**，
  用户选择模型后虽然存了 localStorage，但当前组件不会触发重渲染，
  按钮显示可能不会立即更新。
- 模型选择的真正生效依赖下次 sendMessage 时 aiClient 读 localStorage，
  但用户无法看到"已切换"的即时反馈。

**涉及文件**：
- `src/components/ChatInput.tsx` — 第 655-659 行
- `src/components/ModelSelector.tsx` — onChange callback
- `src/App.tsx` — 传递 modelTier / modelReason 的地方

**修改方案**：

1. **ChatInput.tsx** 增加 `onModelChange` prop：

```tsx
interface ChatInputProps {
  // ... 现有 props
  onModelChange?: (tier: ModelTier) => void;
}
```

2. 将 ModelSelector 的 onChange 连接到真实回调：

```tsx
<ModelSelector
  currentTier={modelTier}
  currentReason={modelReason}
  onChange={(tier) => onModelChange?.(tier)}
/>
```

3. **App.tsx** 中传递回调，触发状态更新：

```tsx
const [manualModelTier, setManualModelTier] = useState<ModelTier | null>(null);

// 在 ChatInput 渲染处
<ChatInput
  ...
  onModelChange={(tier) => {
    setManualModelTier(tier);
    // 可选：显示一个短暂的 toast 确认
  }}
/>
```

4. **（关键）添加切换确认反馈**：

用户选择模型后，在 ModelSelector 按钮旁短暂显示 "✓ 已切换" 的 toast，
1.5 秒后消失。这给用户明确的反馈。

```tsx
// ModelSelector 内部
const [justSwitched, setJustSwitched] = useState(false);

const handleSelect = (tier: ModelTier) => {
  setPreference(tier);
  setUserModelPreference(tier);
  onChange(tier);
  setOpen(false);
  setJustSwitched(true);
  window.setTimeout(() => setJustSwitched(false), 1500);
};

// 按钮旁显示
{justSwitched && (
  <span className="text-xs text-emerald-500 animate-fade-in">✓</span>
)}
```

**commit**: `fix(model): wire up model selection feedback + real onChange`

---

### A3. 天气系统确认

**现状**：
- `api/weather.ts` serverless function 支持 3 种认证策略（自定义 Host + header、legacy URL key、标准 host + header）
- `useWeather.ts` 调用 `/api/weather?location=...`（不带 key，key 在服务端读取）
- `vercel.json` 已移除 rewrite（由 serverless function 直接处理）
- 用户需要在 Vercel 配置 `QWEATHER_API_HOST` 环境变量

**检查清单**：

1. 确认 `api/weather.ts` 中读取的环境变量名：
   - `process.env.VITE_QWEATHER_KEY` — 注意！Vercel serverless function 
     的环境变量**不需要** `VITE_` 前缀也能读到（但如果用户配的是 `VITE_QWEATHER_KEY`
     则代码需要读这个全名）
   - `process.env.QWEATHER_API_HOST` — 新增的自定义 Host

2. 确认 `useWeather.ts` 不再发送 key 到前端 URL — ✅ 已移除

3. **WeatherBar / InfoBar 也需要检查**：
   - `src/components/WeatherBar.tsx` 的 InfoBar 组件接收 `weather` prop
   - 如果 weather 数据来源是 useChat 内部的 weatherData（而非 useWeather hook），
     可能存在双重获取天气的问题
   - 在 App.tsx 搜索 `mergedWeatherData` 确认天气数据源优先级

4. **如果天气仍然 403**：
   - 在 `api/weather.ts` 添加更详细的错误日志：
   ```typescript
   // 每个 strategy 的 catch 里加
   console.log(`[weather] Strategy ${n} failed:`, resp?.status, data?.code);
   ```
   - 这样在 Vercel Function Logs 里能看到具体哪步失败

**commit**: `fix(weather): improve error logging in serverless function`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Part B · UX 优化（用户体验改善）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### B1. StatusStrip 纯展示化 — 移除地图跳转

**问题**：用户点击状态栏的位置/天气信息，期望只是看信息，
但 WeatherBar/InfoBar 的 `onOpenMap` 把整个条做成了按钮，
点击跳转到疫情地图页面，让用户困惑。

**涉及文件**：
- `src/components/StatusStrip.tsx` — `onOpenMap` 已是 dead code（`_onOpenMap`）✅
- `src/components/WeatherBar.tsx` — InfoBar 的 `onOpenMap` 还在用！
- `src/App.tsx` — 传递 `onOpenMap={handleOpenMap}` 到 InfoBar

**修改方案**：

1. **WeatherBar.tsx** — InfoBar 移除点击跳转：

```tsx
// 修改前（第 78-86 行）
const Container = onOpenMap ? 'button' : 'div'
// ...
onClick: onOpenMap,

// 修改后 — 直接用 div，不可点击
export function InfoBar({ weather, profileCity, chronicConditions }: InfoBarProps) {
  // 移除 onOpenMap prop
  return (
    <div className="...">
      {/* 天气信息纯展示 */}
    </div>
  );
}
```

2. **App.tsx** — 移除传递给 InfoBar 的 onOpenMap：

```tsx
// 修改前
<InfoBar
  weather={mergedWeatherData}
  profileCity={localCity}
  chronicConditions={workspace.profile.chronicConditions}
  onOpenMap={handleOpenMap}  // ← 删除这行
/>
```

3. **StatusStrip.tsx** — 清理 `_onOpenMap` dead prop：

```tsx
// 移除接口定义中的 onOpenMap
interface StatusStripProps {
  weatherText?: string;
  checkedIn?: boolean;
  pendingFollowUps?: number;
  locationText?: string;
  // onOpenMap 删除
  onRetryLocation?: () => void;
}
```

4. 同时检查所有传 `onOpenMap` 到 StatusStrip 的调用方，清理掉。

**commit**: `refactor(ui): make status bar and weather display-only`

---

### B2. "健康趋势" 重命名为 "疾控动态"

**问题**：用户看到"健康趋势"以为是个人健康趋势图表，
但实际是社区/疾控的疫情监控看板（EpidemicDashboard）。

**涉及文件**：
- `src/components/Header.tsx` — 第 114 行 `"健康趋势"`
- `src/components/EpidemicDashboard.tsx` — 第 739 行 `"本地健康趋势参考"`
- `src/components/B2BDashboard.tsx` — 多处 `"健康趋势"`
- `src/components/ResultCard.tsx` — 第 1370 行、1377 行
- `src/App.tsx` — 第 762 行 document.title

**修改方案**：

全局替换，用以下映射：

| 位置 | 旧文案 | 新文案 |
|------|--------|--------|
| Header 按钮 | 健康趋势 | 疾控动态 |
| EpidemicDashboard 标题 | {city} · 本地健康趋势参考 | {city} · 本地疾控动态 |
| App.tsx document.title | 健康地图 | 疾控动态 |
| ResultCard 底部 | 用于个人健康趋势追踪和本地社区预警参考 | 用于本地社区疾控预警参考 |
| ResultCard 链接 | 查看社区疾病预警地图 → | 查看疾控动态 → |

B2BDashboard 里的"健康趋势"保持不变（那是面向企业的，语境不同）。

**注意**：Header 的图标从 `Activity`（心电图样式）改为 `BarChart3` 或 `TrendingUp`，
更贴合"疾控数据"语义而非"个人健康"。

```tsx
import { TrendingUp } from 'lucide-react';
// ...
<TrendingUp size={14} />
<span className="hidden sm:inline">疾控动态</span>
```

**commit**: `refactor(naming): rename "健康趋势" to "疾控动态"`

---

### B3. 就诊卡与导出报告入口优化

**结论**：两者不重复（就诊卡是快速浏览，报告是给医生的 PDF），
但入口不够清晰。

**问题**：
- VisitSummaryCard 在哪触发？用户可能找不到
- ReportExport 藏在 ResultCard 的 "报告" tab 里，用户要点两次才看到

**修改方案**：

1. ResultCard 的 `activeTab` 默认值从 `null` 改为 `'evidence'`：

```tsx
// ResultCard.tsx 第 366 行
// 修改前
const [activeTab, setActiveTab] = useState<TabId | null>(null);
// 修改后
const [activeTab, setActiveTab] = useState<TabId | null>('evidence');
```

2. 在 ResultCard Layer 1（始终可见的顶部区域）增加快捷操作：

```tsx
// 在行动建议 CTA 下方加：
<div className="flex gap-2 mt-3">
  <button onClick={() => setActiveTab('report')} 
    className="text-xs text-blue-500 hover:underline">
    📄 导出就诊报告
  </button>
  <button onClick={() => setShowVisitSummary(true)} 
    className="text-xs text-blue-500 hover:underline">
    📋 查看就诊摘要
  </button>
</div>
```

**commit**: `feat(result): default to evidence tab + quick action links`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Part C · 代码质量（技术债务）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### C1. WelcomeScreen 反模式修复

**问题**：`WelcomeScreen.tsx` 第 133-146 行在 render 中用 `if` 
直接检查 state 并调用 setState，这是 React 反模式。

```tsx
// 当前代码（反模式）
const [prevPopulation, setPrevPopulation] = useState(currentPopulation);
if (prevPopulation !== currentPopulation) {
  setPrevPopulation(currentPopulation);
  setSmartSuggestions(generateSmartSuggestions(...));
}
```

**修改**：
```tsx
// 改用 useEffect
useEffect(() => {
  setSmartSuggestions(generateSmartSuggestions(...));
}, [currentPopulation]);
// 删除 prevPopulation state
```

### C2. 清理未使用代码

1. **WelcomeScreen.tsx** — 9 个 underscore 前缀的 unused props：
   找到这些 prop，如果确实没被调用，从接口定义中删除，
   同时更新所有调用方不再传递这些 props。

2. **StatusStrip.tsx** — 删除 `onOpenMap` 从接口和参数

3. **ResultCard.tsx** — 检查 `findDrugByName`、`ExternalLink` 是否真的未使用

4. **App.tsx** — 检查 `saveAppointment` import

**commit**: `chore: clean up unused props and imports`

### C3. 性能优化（可选，低优先级）

1. **html2canvas + jspdf** (~80KB) 只在导出报告时用，应该 lazy import：

```tsx
// ReportExport.tsx
const handleExport = async () => {
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF } = await import('jspdf');
  // ... 现有逻辑
};
```

2. **chart.js** (~50KB) 只在 workspace 用，确认已经 lazy loaded

3. **ChatBubble streaming** — 18+ setTimeout/sec 的逐字动画可改用
   CSS animation 或降低频率

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 执行顺序
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
1. A1 回访删除/忽略  → commit + push
2. A2 模型选择反馈   → commit + push
3. B1 状态栏纯展示   → commit + push
4. B2 重命名疾控动态  → commit + push
5. B3 ResultCard默认tab → commit + push
6. C1+C2 代码清理    → commit + push
7. A3 天气日志增强   → commit + push
8. C3 性能优化（可选）→ commit + push
```

每步完成后 `npm run build` 验证 0 error。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 验收标准
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ 回访弹窗有"稍后再问""不再提醒""删除记录"三个操作
□ 关闭回访后刷新不再重复弹出（除非选了"稍后再问"）
□ 模型选择后按钮显示即时更新 + 短暂 ✓ 确认
□ 状态栏（天气/位置）点击无反应（纯展示）
□ Header 按钮文案改为"疾控动态"
□ ResultCard 默认展开"证据"tab
□ 就诊结果页有"导出报告"和"查看摘要"快捷链接
□ `npm run build` 0 error
□ 无新增的 unused variable/import 警告
