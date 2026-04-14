# 健康助手 深度优化 Round 2 — 多 Agent 并行执行

> 本 Prompt 包含 6 大模块（A-F），建议按字母顺序依次 commit。
> 每个模块内的子任务可由不同 agent 并行完成。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 技术栈与约束（必读）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- React 18 + TypeScript strict + Vite + Tailwind + Supabase
- `noUnusedLocals: true`, `noUnusedParameters: true`
- 不允许在 render/useMemo 中使用 `Date.now()` 或 `new Date()`
- setState 在 useEffect 内需 `window.setTimeout(() => setState(...), 0)`
- 每个 commit 末尾加：`Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`
- `npm run build`（即 `tsc -b && vite build`）必须 0 error 才能 commit
- AI API：MiMo（api.xiaomimimo.com），OpenAI 兼容格式，支持 function calling
- 已有 5 个 agent tool：search_symptom_knowledge, get_weather, search_hospitals, get_epidemic_snapshot, search_web

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## A · 疾控地图数据引擎：14天/30天真实差异化数据
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 问题
EpidemicDashboard 的 7/14/30 天切换按钮虽然改变了趋势图的数据点数量，
但区域卡片的风险数据始终不变，14 天和 30 天不会呈现更长周期的趋势规律。

### 根因
`src/lib/epidemicDataEngine.ts` 第 863 行 `getDistrictRiskData()` 
用 `getDaySeed()` 只基于"当天日期"生成数据，不接受 timeRange 参数。
`EpidemicDashboard.tsx` 第 142 行 `filteredDistrictData` 只按症状类型过滤，
完全不传 timeRange 给数据引擎。

### 修改方案

**1. 扩展 `getDistrictRiskData()` 接受 timeRange 参数：**

```typescript
// epidemicDataEngine.ts
export function getDistrictRiskData(
  city: string,
  timeRange: 7 | 14 | 30 = 7  // 新增参数
): DistrictRiskData[] {
  // 用 timeRange 影响数据生成逻辑
}
```

**2. 为每个 timeRange 生成有差异的数据：**

核心思路：短周期数据波动大（急性事件），长周期数据趋势性更强：

```typescript
function generateDistrictData(
  districtName: string, 
  baseRisk: number, 
  cityProfile: CitySignalProfile,
  timeRange: 7 | 14 | 30
): DistrictRiskData {
  const seed = getDaySeed();
  
  // 7天：当日快照，波动大
  // 14天：滑动平均，趋势更稳
  // 30天：长期基线，显示季节性
  const smoothingFactor = timeRange === 7 ? 1.0 : timeRange === 14 ? 0.7 : 0.4;
  
  // 风险分数 = 基线 * 季节系数 * 波动因子 * 平滑系数
  const volatility = (hashCode(`${districtName}-${seed}`) % 30) * smoothingFactor;
  const seasonalBias = getSeasonalBias(cityProfile, timeRange);
  const riskScore = Math.min(100, Math.max(0, 
    baseRisk + seasonalBias + volatility
  ));
  
  // 趋势：7天可能↑↓剧烈，30天更多是 stable
  const trend = timeRange === 30 
    ? (riskScore > baseRisk + 5 ? 'up' : riskScore < baseRisk - 5 ? 'down' : 'stable')
    : randomTrend(seed, districtName);
  
  // 30天模式下突出季节性症状
  const topSymptoms = timeRange === 30
    ? getSeasonalTopSymptoms(cityProfile)
    : getRandomTopSymptoms(cityProfile, seed, districtName);
    
  return { district: districtName, riskScore, trend, topSymptoms, ... };
}
```

**3. EpidemicDashboard 传递 timeRange：**

```tsx
// EpidemicDashboard.tsx
const districtData = useMemo(
  () => getDistrictRiskData(currentCity, timeRange),
  [currentCity, timeRange]  // ← 添加 timeRange 依赖
);
```

**4. 趋势图也要反映不同周期特征：**

```typescript
// dailyTrend 生成逻辑改进
const dailyTrend = useMemo(() => {
  const result: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = timeRange - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    
    // 不同 timeRange 的数据基线和波动幅度不同
    const baseLine = timeRange === 7 ? 30 : timeRange === 14 ? 25 : 20;
    const amplitude = timeRange === 7 ? 25 : timeRange === 14 ? 15 : 10;
    // 用更好的 hash 函数代替简单取模
    const seed = hashDay(d);
    const noise = (seed % amplitude);
    // 30天模式加入周期性波动（模拟周末效应）
    const weekendBoost = timeRange === 30 && (d.getDay() === 0 || d.getDay() === 6) ? 5 : 0;
    result.push({ label, count: baseLine + noise + weekendBoost });
  }
  return result;
}, [timeRange]);
```

**5. （进阶）从 Supabase RPC 获取真实趋势数据：**

已有 `get_symptom_trends(p_city text)` RPC，
当 Supabase 已配置时优先使用真实数据，降级到 demo 数据：

```typescript
async function fetchTrendData(city: string, timeRange: 7 | 14 | 30) {
  const client = getSupabaseClient();
  if (client) {
    const { data } = await client.rpc('get_symptom_trends', { p_city: city });
    if (data?.length > 0) return filterByRange(data, timeRange);
  }
  return generateDemoTrend(city, timeRange); // 降级到本地 demo
}
```

**commit**: `feat(epidemic): differentiate 7/14/30-day data with trend smoothing`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## B · 联网搜索优化：自动 + 手动 + 输入框集成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 现状
- `search_web` tool 定义在 `src/lib/agentTools.ts` 第 104-117 行
- `evidenceAgent.ts` 的 allowedTools 包含 `search_web`
- AI 可自动决定调用（通过 function calling），但用户无法主动触发
- Tavily API Key 配在 `VITE_TAVILY_API_KEY`

### 问题
1. 用户不知道 AI 是否正在联网搜索（无可见指示器）
2. 用户无法主动要求"帮我搜一下最新信息"
3. 搜索结果展示不够直观

### 修改方案

**B1. 输入框增加"联网搜索"快捷按钮：**

在 `ChatInput.tsx` 的图片上传按钮旁边添加搜索按钮：

```tsx
// ChatInput.tsx — 在 ImagePlus 按钮旁
{!isConsulting && (
  <button
    type="button"
    onClick={() => {
      // 在用户消息前加上 [联网搜索] 标记
      const prefix = '🔍 ';
      updateDraft((prev) => prev.startsWith(prefix) ? prev : prefix + prev);
    }}
    className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center 
      rounded-2xl border border-slate-200 bg-white text-slate-500 
      hover:border-blue-200 hover:text-blue-600 transition-all"
    title="联网搜索最新信息"
  >
    <Globe size={18} />
  </button>
)}
```

**B2. 在 useChat / aiClient 中检测搜索标记：**

```typescript
// useChat.ts — sendMessage 里
const wantsWebSearch = userText.startsWith('🔍') || 
  userText.includes('搜索') || userText.includes('最新');

// 如果用户主动要求搜索，强制 tool_choice 为 search_web
if (wantsWebSearch) {
  options.toolChoice = { type: 'function', function: { name: 'search_web' } };
}
```

**B3. 搜索状态指示器：**

在聊天气泡中显示搜索进度：

```tsx
// ChatBubble.tsx — streaming 状态下
{activeToolCalls?.some(tc => tc.name === 'search_web') && (
  <div className="flex items-center gap-2 text-xs text-blue-500 mb-2">
    <Globe size={14} className="animate-pulse" />
    <span>正在联网搜索最新信息...</span>
  </div>
)}
```

当前已有 `SearchIntelligencePanel.tsx` 展示搜索结果，
确认它在 ResultCard 的 evidence tab 中正确渲染。

**B4. 搜索结果优化 — 显示来源域名标签：**

```tsx
// SearchIntelligencePanel.tsx — 每个结果添加可信度标签
{result.url.includes('nhc.gov.cn') && (
  <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
    🏛️ 国家卫健委
  </span>
)}
{result.url.includes('who.int') && (
  <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
    🌐 WHO
  </span>
)}
```

**commit**: `feat(search): add manual web search button + status indicator`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## C · 用户中心完善：头像 + 昵称 + 个人信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 现状
- `ProfileDraft` 有 displayName, city, birthYear, gender, medicalNotes 等字段
- `CloudSyncCard.tsx` 第 370 行有昵称编辑
- 但没有独立的用户中心页面，也没有头像上传
- Supabase profiles 表有 display_name, city, birth_year, gender, medical_notes

### 修改方案

**C1. 创建 `src/components/UserProfilePage.tsx`：**

```tsx
export function UserProfilePage({ profile, onSave, onClose }: Props) {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* 头像区域 */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 
            flex items-center justify-center text-white text-2xl font-bold">
            {profile.displayName?.[0] || '👤'}
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full 
            bg-white shadow border border-slate-200 flex items-center justify-center">
            <Camera size={14} className="text-slate-500" />
          </button>
        </div>
        <p className="mt-3 text-lg font-semibold text-slate-800">
          {profile.displayName || '未设置昵称'}
        </p>
        <p className="text-sm text-slate-400">{profile.city || '未设置城市'}</p>
      </div>

      {/* 基本信息卡片 */}
      <Section title="基本信息">
        <Field label="昵称" value={draft.displayName} onChange={...} placeholder="如：张三" />
        <Field label="所在城市" value={draft.city} onChange={...} placeholder="如：苏州" />
        <Field label="出生年份" type="number" value={draft.birthYear} onChange={...} />
        <Field label="性别" type="select" options={['', '男', '女', '其他']} />
      </Section>

      {/* 健康档案卡片 */}
      <Section title="健康档案">
        <Field label="慢性疾病" value={draft.chronicConditions} multiline 
          placeholder="如：高血压、糖尿病" />
        <Field label="过敏信息" value={draft.allergies} multiline 
          placeholder="如：青霉素过敏" />
        <Field label="当前用药" value={draft.currentMedications} multiline 
          placeholder="如：阿司匹林每日一片" />
        <Field label="其他备注" value={draft.medicalNotes} multiline />
      </Section>

      {/* 照护重点 */}
      <Section title="照护重点">
        <div className="flex flex-wrap gap-2">
          {['自己', '孩子', '老人', '慢性病人'].map(focus => (
            <ChipToggle key={focus} label={focus} 
              selected={draft.careFocus.includes(focus)} 
              onToggle={() => toggleCareFocus(focus)} />
          ))}
        </div>
      </Section>

      {/* 保存按钮 */}
      <button onClick={handleSave} className="w-full mt-6 ...">
        保存修改
      </button>
    </div>
  );
}
```

**C2. 头像方案（不上传服务器）：**

用首字母 + 渐变背景色作为默认头像，
另外支持从预设图案中选择（不需要真正上传图片文件）：

```typescript
// 6 种预设渐变色
const AVATAR_GRADIENTS = [
  'from-blue-400 to-cyan-500',
  'from-purple-400 to-pink-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-500',
  'from-indigo-400 to-blue-500',
];

// 存储在 ProfileDraft 中：新增 avatarGradient?: number 字段
```

**C3. 在 MobileBottomNav "我的" tab 接入用户中心：**

```tsx
// App.tsx — 在 workspace 页面判断是否显示 UserProfilePage
{currentPage === 'workspace' && workspaceSection === 'profile' && (
  <UserProfilePage 
    profile={workspace.profile}
    onSave={handleSaveProfile}
    onClose={() => setWorkspaceSection('overview')}
  />
)}
```

**C4. Supabase 同步（如果已登录）：**

保存时检测 isCloudConfigured，如果是则同步到 Supabase profiles 表。
已有 `syncProfileToCloud()` 函数可复用。

**commit**: `feat(profile): user center page with avatar + info editing`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## D · 医学知识库更新与维护
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 现状
- 知识库约 400+ chunks（86 curated + 211 MedlinePlus + 106 CDC）
- ETL 脚本在 `scripts/` 目录（seed-curated, etl-medlineplus, etl-cdc）
- 所有内容为英文 MedlinePlus / CDC，有 zh_summary 字段
- 最后 source_date 硬编码为 '2026-04-09'
- 版本管理：version / superseded_by / is_active 字段

### 修改方案

**D1. 新增中文医学知识源 ETL：**

创建 `scripts/etl-chinese-medical.ts`：

```typescript
// 中文公开医学知识源（均为公开信息，无版权问题）：
// 1. 国家卫健委疾病科普 — http://www.nhc.gov.cn/
// 2. 中国疾控中心 — https://www.chinacdc.cn/
// 3. 丁香医生百科（公开摘要部分）

// ETL 流程：
// - 预提取关键疾病/症状的科普内容（手动整理为 markdown 文件）
// - 放入 data/chinese-medical/ 目录
// - 解析为 knowledge chunks
// - 上传到 Supabase knowledge_chunks 表
```

**D2. 创建 30 张高频中文知识卡：**

在 `data/curated/` 新增中文卡片文件，覆盖以下高频场景：

```
# 高频症状（中国就诊 Top 10）
1. 感冒发烧（成人/儿童分别）
2. 咳嗽（急性/慢性）
3. 腹泻（感染性/功能性）
4. 头痛（紧张型/偏头痛/危险信号）
5. 腰痛/颈痛
6. 过敏反应（食物/药物/季节性）
7. 皮疹（荨麻疹/湿疹/手足口）
8. 高血压管理
9. 糖尿病管理
10. 焦虑/失眠

# 季节性（当前季节优先）
11. 春季花粉过敏
12. 夏季中暑/食物中毒
13. 秋冬流感预防
14. 手足口病（幼儿园高发期）

# 紧急情况
15. 胸痛鉴别
16. 脑卒中识别（FAST 法则）
17. 儿童高热惊厥处理
18. 异物卡喉海姆立克法
```

卡片格式遵循现有 `data/curated/` 的 frontmatter + 正文结构。

**D3. 知识库版本更新脚本：**

```bash
# 添加 npm script
"scripts": {
  "kb:seed": "npx tsx scripts/seed-all.ts",
  "kb:update": "npx tsx scripts/seed-curated.ts --update",
  "kb:status": "npx tsx scripts/show-knowledge-history.ts"
}
```

**D4. 知识库状态可视化（可选）：**

在用户中心或设置页面增加知识库状态显示：

```tsx
<div className="text-xs text-slate-400">
  📚 知识库：{totalChunks} 条 · 
  最后更新：{lastUpdateDate} ·
  来源：本地精选 + MedlinePlus + CDC
</div>
```

**commit**: `feat(knowledge): add 30 Chinese medical cards + ETL improvements`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## E · 多 Agent 协作可视化（让用户看到过程）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 现状
- 5 个 specialist agent（triage, evidence, careNavigator, publicHealth, memory）
- 1 个 orchestrator 做路由
- 用户完全看不到后台哪些 agent 在工作

### 修改方案

**E1. Agent 工作指示器：**

在 ChatBubble streaming 状态中添加 agent 标识：

```tsx
// 当 AI 正在 streaming 时，显示当前 agent
{isStreaming && currentAgent && (
  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
    {currentAgent === 'triage' && '🏥 分诊评估中...'}
    {currentAgent === 'evidence' && '📚 检索医学证据...'}
    {currentAgent === 'careNavigator' && '🗺️ 查找就医路径...'}
    {currentAgent === 'publicHealth' && '📊 分析公共卫生数据...'}
    {currentAgent === 'memory' && '🧠 回顾历史记录...'}
  </div>
)}
```

**E2. Tool 调用可视化：**

已有 `activeToolCalls` 状态，但 UI 展示不够。改进：

```tsx
// ChatBubble.tsx — tool 执行时
{activeToolCalls?.map(tc => (
  <div key={tc.id} className="flex items-center gap-2 text-xs 
    bg-slate-50 rounded-lg px-3 py-1.5 mb-1.5">
    {tc.name === 'search_symptom_knowledge' && '📖 查询知识库...'}
    {tc.name === 'search_web' && '🌐 联网搜索...'}
    {tc.name === 'search_hospitals' && '🏥 搜索附近医院...'}
    {tc.name === 'get_weather' && '🌤️ 获取天气...'}
    {tc.name === 'get_epidemic_snapshot' && '📊 获取疫情快照...'}
    {tc.status === 'running' && <Loader2 size={12} className="animate-spin" />}
    {tc.status === 'done' && <Check size={12} className="text-green-500" />}
  </div>
))}
```

**E3. 诊断结果中标注参与的 agent：**

在 ResultCard 底部显示：

```tsx
<div className="flex items-center gap-2 text-xs text-slate-400 mt-4">
  <span>本次诊断由以下模块协作完成：</span>
  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">分诊</span>
  <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600">证据</span>
  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">导诊</span>
</div>
```

**commit**: `feat(agents): visualize multi-agent workflow during consultation`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## F · 附加优化（技术质量提升）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### F1. 无障碍 (Accessibility) 基础补全

扫描以下组件，确保所有交互元素有 `aria-label`：

```bash
# 需要检查的文件
src/components/ChatInput.tsx      # 多个按钮
src/components/SuggestionCards.tsx # 建议卡片按钮
src/components/ResultCard.tsx     # 诊断结果
src/components/ModelSelector.tsx  # 模型选择下拉
src/components/BodyPartSelector.tsx # 身体部位选择
```

至少补齐：
- 所有 `<button>` 没有文字内容的需要 `aria-label`
- `<select>` 需要对应的 `<label>` 或 `aria-label`
- 模态对话框需要 `role="dialog"` 和 `aria-modal="true"`

### F2. Lazy Import 重型依赖

```typescript
// ReportExport.tsx — html2canvas + jspdf (~80KB)
const handleExport = async () => {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  // ... 现有逻辑
};

// 确认 chart.js 已经 lazy loaded（在 WorkspaceView 或 HealthMetrics 中）
```

### F3. 错误边界补全

给关键路由级组件加 ErrorBoundary：

```tsx
// App.tsx — 包裹 LazyResultCard, LazyEpidemicDashboard 等
<ErrorBoundary fallback={<div className="p-4 text-center text-red-500">加载失败，请刷新</div>}>
  <LazyResultCard ... />
</ErrorBoundary>
```

### F4. WelcomeScreen 反模式修复

```tsx
// 当前（反模式）— WelcomeScreen.tsx 第 133-146 行
const [prevPopulation, setPrevPopulation] = useState(currentPopulation);
if (prevPopulation !== currentPopulation) {
  setPrevPopulation(currentPopulation);
  setSmartSuggestions(generateSmartSuggestions(...));
}

// 修改为
useEffect(() => {
  setSmartSuggestions(generateSmartSuggestions(...));
}, [currentPopulation]);
// 删除 prevPopulation state
```

### F5. Dead Code 清理

```bash
# 检查并清理
grep -rn '_onOpenMap\|_onStartConsultation\|_onToggleMap' src/components/
# WelcomeScreen.tsx 9 个 unused props
# StatusStrip.tsx onOpenMap dead prop
# ResultCard.tsx findDrugByName/ExternalLink unused imports
```

**commit**: `chore: accessibility, lazy imports, error boundaries, dead code cleanup`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 多 Agent 并行建议
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

建议用以下 agent 分工：

| Agent | 负责模块 | 预计工作量 |
|-------|---------|-----------|
| Agent 1 | A（疾控数据引擎）| 中 — epidemicDataEngine.ts 重构 |
| Agent 2 | B（联网搜索）| 小 — ChatInput + useChat 改动 |
| Agent 3 | C（用户中心）| 大 — 新组件 + Supabase 同步 |
| Agent 4 | D（知识库）| 中 — 30 张卡片 + ETL 脚本 |
| Agent 5 | E（Agent 可视化）| 小 — ChatBubble + ResultCard UI |
| Agent 6 | F（技术质量）| 中 — 全局扫描 + 修复 |

**依赖关系**：
- B 依赖 A（无） → 可并行
- C 依赖 D（无） → 可并行
- E 依赖 B（联网搜索 UI 部分） → E 在 B 之后
- F 独立 → 最后执行

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 执行顺序
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Phase 1（并行）: A + B + C + D
Phase 2（依赖 Phase 1）: E
Phase 3（最后）: F
```

每步完成后 `npm run build` 验证 0 error。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 验收标准
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### A · 疾控数据
□ 切换 7/14/30 天后，区域卡片的风险分数发生变化
□ 30 天模式下趋势图波动更平滑
□ 14 天模式介于 7 天和 30 天之间

### B · 联网搜索
□ 输入框有 🌐 按钮，点击后在文本前加 🔍 前缀
□ AI streaming 时显示"正在联网搜索..."指示
□ 搜索结果带来源标签（国家卫健委/WHO 等）
□ 不配 TAVILY_API_KEY 时搜索按钮隐藏或禁用

### C · 用户中心
□ "我的" tab 进入后有头像 + 昵称 + 信息编辑页
□ 头像为首字母 + 渐变色（可选择 6 种渐变）
□ 修改后保存到 localStorage（登录则同步 Supabase）

### D · 知识库
□ `data/curated/` 新增中文知识卡片文件
□ `npm run kb:seed` 能导入新卡片
□ 总 chunk 数 > 430

### E · Agent 可视化
□ AI 回复时显示"📚 检索医学证据"等状态
□ Tool 调用有 spinner → ✓ 动画
□ 诊断结果底部显示参与模块标签

### F · 技术质量
□ html2canvas/jspdf 改为 dynamic import
□ WelcomeScreen 反模式修复
□ 关键组件包 ErrorBoundary
□ `npm run build` 0 error + 无新增 unused variable 警告
