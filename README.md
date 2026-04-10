# 健康助手 · Symptom Checker

> 不说"建议就医"，说"今晚不需要去急诊，明天上午挂神经内科"。

为照料者设计的健康决策助手——服务那些替别人做健康决策的人：半夜被孩子发烧吵醒的父母、独居老人突然说话不清楚时焦虑的远方子女、帮慢病家属管药的照料者。

🔗 **线上体验：[symptom-checker-git-main-chasingwinds-projects.vercel.app](https://symptom-checker-git-main-chasingwinds-projects.vercel.app/)**

---

## 为什么做这个

市面上的 AI 健康工具有一个共同的问题：它们像医生一样说话——"建议就医""请咨询专业医生"。但照料者需要的不是又一个让他去看医生的提醒，而是在去医院之前的那 30 秒里，有人帮他判断"现在到底严不严重、要不要今晚就去"。

这个工具试图回答这个问题。

---

## 核心能力

### 30 秒紧急分级

输入症状后，系统先做紧急度预判（红/黄/绿），决定追问策略：
- **红色**（抽搐/意识不清/大量出血）直接给急诊建议，**0 轮追问**
- **黄色**（发烧/呕吐/胸闷）最多追问 **3 轮**
- **绿色**（鼻塞/轻微头痛）最多 **5 轮**

照料者不会被问 20 个问题后还拿不到答案。

### 照料者视角的决策语言

所有建议都面向"做决策的人"而不是"生病的人"。不说"您需要休息"，说"今晚给孩子量一次体温，如果超过 39℃ 或精神明显变差，去最近有儿科的急诊"。每条建议都有具体的时间窗口、科室、行动步骤。

### 四种照料角色

首页让用户先选"为谁做判断"（我自己 / 孩子 / 老人 / 慢病家属），不同角色触发不同的追问策略、知识库检索范围和建议语言。孩子的问题永远拿不到成人剂量的内容。

### 智能建议卡片

首页推荐的问题不是写死的——会根据当前角色、时间（夜间优先显示"孩子半夜发烧"）、季节（春季优先过敏相关）、用户历史问诊记录动态调整，每次刷新都有变化。

---

## 技术架构

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS，Vercel 部署
- **后端**：Supabase（PostgreSQL + pgvector + Edge Functions），匿名上报 + 跨会话记忆
- **RAG 知识库**：367 条，两层架构：

| 层级 | 来源 | 条数 | 语言 | 许可证 |
|------|------|------|------|--------|
| 自策展核心层 | 原创照料者决策卡片 | 50 | 中文 | 自有 |
| 公共域补充层 | MedlinePlus (NLM) | 211 | 英文 | US Public Domain |
| 公共域补充层 | CDC Health Topics | 106 | 英文 | US Public Domain |

- **检索流程**：用户输入 → BGE-M3 embedding → pgvector cosine similarity（阈值 0.75）→ population 强制过滤 → top 5 chunks 注入 LLM context。三级降级：Supabase RPC → text search → 本地匹配 → 空结果（明确告知"知识库未覆盖"）
- **开发方式**：Claude Code vibe coding，约 50 波迭代

---

## 知识库说明

### 覆盖范围

自策展层覆盖 5 个核心场景，每个场景 10 条决策卡片（红/黄/绿分级 + 具体行动）：
- 儿童发烧
- 儿童咳嗽
- 老人胸闷气短
- 老人跌倒
- 慢病血压波动

MedlinePlus 和 CDC 层覆盖常见疾病的科普和家庭护理建议，作为 LLM 回答的参考背景。

### 不覆盖的范围

本知识库**不覆盖**以下场景，相关问题 AI 会明确说"知识库未覆盖"：
- 肿瘤治疗方案
- 罕见病诊断
- 精神科诊断与用药
- 妊娠期用药安全
- 急救操作流程（CPR 等）
- 手术方案选择

### 数据源合规

- **MedlinePlus** 仅使用 NLM 自产的 Health Topic 摘要（US public domain），严格排除 A.D.A.M. Medical Encyclopedia 和 ASHP 药品专论（第三方授权，不可再分发）
- **CDC** 内容为 US Government public domain
- **WHO** 内容因 CC BY-NC-SA 协议（非商用）未使用
- 中文自策展层参考了公开诊疗规范的分级方法和决策逻辑，但全部用原创语言重写，不直接复制任何指南原文

详见 [docs/data-sources.md](docs/data-sources.md)。

### ⚠️ 待医学审核

自策展层全部 50 条卡片当前标记为 `pending_medical_review`。这意味着这些内容尚未经过具有医学背景的专业人员审核。UI 上每条引用都会显示"待医学审核"标记。

如果你有医学背景并愿意参与审核，请通过 [医学错误反馈模板](https://github.com/Chasingwind-Z/symptom-checker/issues/new?template=medical-error.md) 提交意见。

审核日志见 [docs/medical-review-log.md](docs/medical-review-log.md)。

---

## 安全设计

- **人群隔离**：儿童 query 只能命中 pediatric 或 general 的知识条目，永远拿不到成人剂量内容
- **阈值兜底**：similarity < 0.75 时返回空结果，AI 明确说"知识库未覆盖此问题，以下为通用建议"
- **紧急快速通道**：RED 场景 0 轮追问直接给急诊建议 + 120 电话
- **引用强制展示**：每条 AI 建议下方都有 CitationCard 显示来源、类型、日期
- **免责声明**：独立 Disclaimer 页面 + 输入框底部常驻提示

---

## 功能清单

- 四角色问诊（我自己/孩子/老人/慢病家属）
- 紧急度三级分诊（RED/YELLOW/GREEN）
- RAG 知识库检索 + 引用展示
- 智能建议卡片（时间/季节/历史感知）
- 问诊进度条（3 步制）
- 会话管理（重命名/删除/三点菜单）
- 跨会话记忆
- 结果分级卡片（红/黄/绿）
- 就诊准备卡（科室+时间建议）
- 用药支持摘要
- 附近药房/门诊定位（高德地图）
- 家庭交叉感染预警
- 慢病指标记录 + 趋势解读
- 复诊追踪
- 每日健康打卡
- 天气健康提醒
- Supabase 匿名上报
- Web Push 通知
- 照料者分享（发给另一半/其他家属）

---

## 本地开发

```bash
git clone https://github.com/Chasingwind-Z/symptom-checker.git
cd symptom-checker
npm install
npm run dev
```

环境变量（`.env.local`）：

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AMAP_KEY=your_amap_key
```

知识库 seed（需要 Supabase 已配置 pgvector）：

```bash
npx ts-node scripts/seed-all.ts
```

---

## 免责声明

本工具是健康决策辅助工具，不是医疗诊断系统。所有建议仅供参考，不替代医生诊断或处方。红色预警一定去急诊，不要等。知识库内容可能过时，自策展层尚未经过医学专业审核。

详见 [免责声明页面](https://symptom-checker-git-main-chasingwinds-projects.vercel.app/)。

---

## 许可证

MIT