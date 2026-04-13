<div align="center">

# 🏥 健康助手 · Symptom Checker

[![在线体验](https://img.shields.io/badge/🌐_在线体验-立即使用-blue?style=for-the-badge)](https://symptom-checker-git-main-chasingwinds-projects.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![知识库](https://img.shields.io/badge/RAG_知识库-367条-orange?style=flat)]()
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)]()

**不说"建议就医"，说"今晚不需要去急诊，明天上午挂神经内科"。**

为照料者设计的健康决策助手——服务那些替别人做健康决策的人：
半夜被孩子发烧吵醒的父母、独居老人突然说话不清楚时焦虑的远方子女、帮慢病家属管药的照料者。

[**🔗 立即体验**](https://symptom-checker-git-main-chasingwinds-projects.vercel.app/) · [**📋 免责声明**](https://symptom-checker-git-main-chasingwinds-projects.vercel.app/) · [**🐛 反馈问题**](https://github.com/Chasingwind-Z/symptom-checker/issues)

</div>

---

## 💡 为什么做这个

市面上的 AI 健康工具有一个共同的问题：它们像医生一样说话——"建议就医""请咨询专业医生"。

但照料者需要的不是又一个让他去看医生的提醒，而是在去医院之前的那 **30 秒**里，有人帮他判断：

> **"现在到底严不严重、要不要今晚就去？"**

这个工具试图回答这个问题。

---

## ✨ 核心能力

### ⚡ 30 秒紧急分级

输入症状后，系统先做紧急度预判（红/黄/绿），决定追问策略：

| 紧急度 | 场景 | 追问上限 | 行为 |
|--------|------|----------|------|
| 🔴 **RED** | 抽搐/意识不清/大量出血 | **0 轮** | 直接给急诊建议 + 拨打 120 |
| 🟡 **YELLOW** | 发烧/呕吐/胸闷 | **≤ 3 轮** | 快速收集信息后给建议 |
| 🟢 **GREEN** | 鼻塞/轻微头痛 | **≤ 5 轮** | 充分了解后给居家方案 |

> 照料者不会被问 20 个问题后还拿不到答案。

### 🗣️ 照料者视角的决策语言

所有建议都面向"做决策的人"而不是"生病的人"：

| ❌ 不这样说 | ✅ 这样说 |
|-------------|----------|
| "建议就医" | "今晚不需要去急诊，明天上午挂神经内科" |
| "请咨询医生" | "如果 2 小时内持续呕吐，去最近医院急诊" |
| "注意休息" | "今晚量一次体温，超过 39℃ 或精神变差就去有儿科的急诊" |

### 👥 四种照料角色

| 角色 | 适用场景 | 特殊处理 |
|------|---------|----------|
| 👤 **我自己** | 成年人自查 | 标准分诊流程 |
| 👶 **孩子** | 14岁以下 | 发烧阈值降低，夜间特殊决策，推荐儿科 |
| 🧓 **家里老人** | 60岁以上 | 独居风险评估，家属行动指南，风险上调 |
| 💊 **慢病家属** | 有基础疾病 | 用药冲突检查，指标趋势分析 |

### 🎯 智能建议卡片

首页推荐的问题**不是写死的**——根据当前角色、时间、季节、历史记录**动态生成**：

- 🌙 夜间优先显示"孩子半夜发烧"
- 🌸 春季优先过敏相关问题
- 📊 有头痛历史的用户看到头痛相关排前
- 🔄 每次刷新都有变化（加权抽样）

---

## 🏗️ 技术架构

```
┌──────────────────────────────────────────────────┐
│                    用户界面                        │
│    React 18 + TypeScript + Tailwind + Vite        │
├──────────────────────────────────────────────────┤
│                  AI Agent 层                      │
│   Orchestrator → Triage Agent → Evidence Agent    │
│   quickTriage(RED/YELLOW/GREEN) → maxFollowups    │
├──────────────────────────────────────────────────┤
│                RAG 知识库检索                      │
│   BGE-M3 Embedding → pgvector cosine similarity  │
│   Population 强制过滤 → Top 5 → LLM Context      │
├──────────────────────────────────────────────────┤
│                  数据层                           │
│   Supabase PostgreSQL + pgvector + Edge Functions │
│   localStorage 降级 · 匿名上报 · 跨会话记忆       │
└──────────────────────────────────────────────────┘
```

---

## 📚 知识库

### 数据来源

| 层级 | 来源 | 条数 | 语言 | 许可证 |
|------|------|------|------|--------|
| 🇨🇳 自策展核心层 | 原创照料者决策卡片 | **50** | 中文 | 自有 |
| 🇺🇸 公共域补充层 | MedlinePlus (NLM) | **211** | 英文 | US Public Domain |
| 🇺🇸 公共域补充层 | CDC Health Topics | **106** | 英文 | US Public Domain |
| | **合计** | **367** | | |

### 检索流程

```
用户输入 → BGE-M3 embedding → pgvector cosine similarity (阈值 0.75)
    ↓
Population 强制过滤（儿童 query ≠ 成人内容）
    ↓
Top 5 chunks 注入 LLM context
    ↓
三级降级：Supabase RPC → text search → 本地匹配 → 空结果
```

### 覆盖范围

**✅ 覆盖**：儿童发烧、儿童咳嗽、老人胸闷气短、老人跌倒、慢病血压波动 + 200+ 常见疾病科普

**❌ 不覆盖**（AI 会明确说"知识库未覆盖"）：肿瘤治疗 · 罕见病 · 精神科诊断 · 妊娠用药 · 急救操作 · 手术方案

### ⚠️ 待医学审核

自策展层 50 条卡片标记为 `pending_medical_review`，尚未经过执业医师审核。UI 上每条引用都显示"待医学审核"标记。
其中 20 条高频卡片已标记为 `community_reviewed`（项目维护者自审），其余仍为 `pending_medical_review`。

👨‍⚕️ 如果你有医学背景，欢迎通过 [医学错误反馈模板](https://github.com/Chasingwind-Z/symptom-checker/issues/new?template=medical-error.md) 参与审核。

---

## 🔒 安全设计

| 机制 | 说明 |
|------|------|
| 🔒 人群隔离 | 儿童 query 只能命中 pediatric/general 内容 |
| 🎯 阈值兜底 | similarity < 0.75 返回空 + 明确告知 |
| 🚨 紧急通道 | RED 场景 0 追问 + 急诊建议 + 120 |
| 📑 引用展示 | CitationCard 显示来源、类型、日期 |
| ⚖️ 免责声明 | 独立页面 + 输入框常驻提示 |

---

## 📋 功能清单

<table>
<tr><td>

**🩺 问诊核心**
- 四角色问诊
- 紧急度三级分诊
- RAG 知识库 + 引用
- 智能建议卡片
- 问诊进度条
- 照料者决策语言

</td><td>

**📊 健康管理**
- 慢病指标记录
- 家庭交叉感染预警
- 复诊追踪
- 每日健康打卡
- 跨会话记忆
- 天气健康提醒

</td><td>

**🛠️ 工具与分享**
- 就诊准备卡
- 用药支持摘要
- 附近药房定位
- 照料者分享
- Web Push 通知
- 会话管理

</td></tr>
</table>

---

## 🚀 本地开发

```bash
git clone https://github.com/Chasingwind-Z/symptom-checker.git
cd symptom-checker
npm install
cp .env.example .env    # 填入 API Key
npm run dev             # http://localhost:5173
```

### 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `VITE_AI_BASE_URL` | ✅ | AI API 接口地址 |
| `VITE_AI_API_KEY` | ✅ | AI API Key |
| `VITE_AI_MODEL` | ✅ | 模型名称 |
| `VITE_SUPABASE_URL` | ✅ | Supabase 项目地址 |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase 前端公钥 |
| `VITE_AMAP_JS_KEY` | 推荐 | 高德地图 Key |
| `VITE_QWEATHER_KEY` | 推荐 | 和风天气 Key |
| `VITE_JD_UNION_ID` | 可选 | 京东联盟推广位 ID |
| `VITE_TAVILY_API_KEY` | 可选 | 联网搜索增强 |

### 知识库初始化

```bash
npx tsx scripts/seed-all.ts    # 需要 Supabase + pgvector
```

---

## ⚠️ 免责声明

本工具是**健康决策辅助工具**，不是医疗诊断系统。所有建议仅供参考，不替代医生诊断或处方。

**🔴 红色预警一定去急诊，不要等。**

知识库内容可能过时，自策展层尚未经过医学专业审核。详见 [免责声明页面](https://symptom-checker-git-main-chasingwinds-projects.vercel.app/)。

---

## 致谢

- 人体选择器采用医学插图风格设计

## 📄 License

MIT © 2026 [Chasingwind-Z](https://github.com/Chasingwind-Z)