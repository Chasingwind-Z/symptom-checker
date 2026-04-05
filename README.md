# 健康助手 Beta · AI 医疗预检与公共健康感知平台

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-在线体验-blue?style=for-the-badge)](https://symptom-checker-ahvsmkovl-chasingwinds-projects.vercel.app/)
[![GitHub Stars](https://img.shields.io/github/stars/Chasingwind-Z/symptom-checker?style=for-the-badge)](https://github.com/Chasingwind-Z/symptom-checker)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud%20Ready-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

> 一个更接近真实落地产品、而不是单纯 Demo 的黑客松项目：  
> **AI 多轮分诊 + 实时 Function Calling + 官方信源对照 + 附近医院导航 + 健康档案云同步 + 公共健康趋势看板**

---

## 在线体验

**地址：** https://symptom-checker-ahvsmkovl-chasingwinds-projects.vercel.app/

推荐使用 **Chrome / Edge / Safari** 体验语音输入、PWA 安装与地图相关能力。

---

## 这个项目现在已经实现了什么

| 模块 | 当前状态 | 说明 |
| --- | --- | --- |
| AI 分诊对话 | ✅ 已完成 | 一轮一问、最多 4 轮追问、动态快捷回答、防重复询问 |
| 风险分级 | ✅ 已完成 | `green / yellow / orange / red` 四级结论与行动建议 |
| 实时 Function Calling | ✅ 已完成 | 会按需调用天气、医院、知识库、疫情与联网检索工具 |
| RAG 检索 | ✅ 已完成 | 支持 query expansion、chunk 级混合召回、证据片段展示 |
| 官方信源对照 | ✅ 已完成 | 支持内置兜底、最近缓存、云端同步状态标识 |
| 地图与医院导航 | ✅ 已完成 | 高德地图检索附近医院，可快速查看路线与建议科室 |
| 云端能力 | ✅ 基础可用 | Supabase Magic Link 登录、健康档案、问诊记录、Edge Functions 脚手架 |
| 多模态入口 | ✅ 已完成 | 支持上传 1 张图片作为辅助上下文，但不会冒充“纯视觉诊断” |
| PWA | ✅ 已完成 | 可安装到桌面 / 手机主屏，具备基础离线壳能力 |
| 疫控看板 | ✅ 已完成 | 可信来源对照、热点区域、趋势参考与就医建议联动 |

---

## 适合比赛演示的亮点

1. **不是普通聊天机器人**：会主动追问，并把用户答案串成可解释的风险结论。  
2. **不是“空口建议”**：结果页会展示命中的知识片段、官方资料和医院去向。  
3. **不是一次性 Demo**：已经具备 Supabase 登录、记录、云端同步与 Edge Functions 的真实产品底座。  
4. **不是只会说**：支持地图、天气、公共健康参考、随访和图片辅助输入。

---

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS
- **AI**：OpenAI 兼容接口 / MiMo 风格网关 + Function Calling
- **地图**：高德地图 JS API + POI 搜索
- **云端**：Supabase Auth + Postgres + Edge Functions
- **检索**：Local-first RAG + Supabase cloud-ready / vector-ready 结构
- **体验层**：Web Speech API、PWA、动态图表

---

## 本地运行

```bash
git clone https://github.com/Chasingwind-Z/symptom-checker.git
cd symptom-checker
npm install
cp .env.example .env
npm run dev
```

浏览器打开：`http://localhost:5173`

生产 / 评审演示时，建议把：
- `VITE_GATEWAY_PROVIDER` 设为 `auto` 或 `supabase`
- AI 与官方数据检索的密钥放到 `supabase/functions/*` 的 secrets 中

---

## 你的 Supabase 项目可直接怎么接

当前你给出的项目信息已经足够完成**前端接入**：

```bash
supabase login
supabase link --project-ref opxffcwacjucqyzfqgwo
supabase db push
supabase functions deploy agent-orchestrator
supabase functions deploy official-source-fetch
supabase functions deploy knowledge-sync
```

`.env` / `.env.example` 推荐至少包含：

```bash
VITE_GATEWAY_PROVIDER=auto
VITE_SUPABASE_URL=https://opxffcwacjucqyzfqgwo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_fzZZxoN6Dg6hxJy557ZHgQ_rBUL6gav
VITE_ENABLE_CLOUD_KNOWLEDGE=true
```

### 你还需要手动补的几项

1. **Supabase Auth**
   - 打开 `Authentication -> Providers -> Email`
   - 启用 Magic Link
   - 在 `URL Configuration` 加上：
     - `http://localhost:5173`
     - 你的线上部署地址

2. **Edge Function secrets**
   - `AI_BASE_URL`
   - `AI_API_KEY`
   - `AI_MODEL`
   - `TAVILY_API_KEY`（可选，但建议配，官方信源同步会更强）
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `KNOWLEDGE_SYNC_TOKEN`

3. **数据库层**
   - 只有在你需要直连 Postgres / 手动执行 SQL 时，才需要 `connection string` 里的数据库密码
   - 正常前端 + Edge Functions 接入，不一定非要先用直连串

---

## 架构说明

### 1. Chat / Agent 层

- `src/hooks/useChat.ts`：统一处理聊天流、建议词、函数调用、结果生成
- `src/lib/aiClient.ts`：模型调用与 tool loop
- `src/lib/agentTools.ts`：天气 / 医院 / 知识 / 疫情 / 联网检索工具注册中心
- `src/agents/*`：产品侧“分诊 / 证据 / 导航 / 公卫 / 记忆”协同路由层

### 2. RAG / 官方信源层

- `src/lib/medicalKnowledge.ts`：seeded 中文医学知识与 chunk 级混合检索
- `src/lib/medicalKnowledgeRepository.ts`：云端知识表读取、缓存、vector-ready 状态识别
- `src/lib/officialSources.ts`：官方来源聚合、同步状态、fallback/缓存策略
- `src/components/OfficialSourceComparison.tsx`：展示“云端同步 / 最近缓存 / 内置兜底”

### 3. Supabase / 产品化层

- `src/lib/supabase.ts`：客户端初始化与 Auth
- `src/lib/healthData.ts`：档案、历史、病例的本地 / 云端持久化
- `supabase/migrations/*`：核心表、知识库表与后续向量升级位
- `supabase/functions/*`：AI 代理、官方检索、知识同步的服务端网关

---

## 本轮已经补齐的产品化能力

- 首页去掉了“演示模式”重感 UI，整体更像真实 Beta
- 地图与疫情看板重新排版，解决大面积留白问题
- 聊天系统支持 AI 动态生成快捷回答 chips
- 官方信源卡增加了同步状态、缓存说明与兜底策略
- Supabase 邮箱 Magic Link 登录与云端档案中心已打通
- 图片上传与 PWA 安装已加入，适合手机场景演示
- RAG 从简单知识命中升级到 **Hybrid / Vector-ready** 模式

---

## 现在还没完全做完的点

这些不是“不能用”，而是如果你要继续往正式产品推进，建议下一阶段补：

- **真实视觉理解后端**：目前图片是辅助上下文，不是稳定视觉诊断链路
- **更完整的定时官方数据采集**：现在已支持云端同步与缓存，但还不是全自动调度平台
- **真 embedding / pgvector 在线检索**：目前已 vector-ready，下一步是持续回填 embedding 并上 RPC 排序
- **更深的用户增长闭环**：随访问卷、复诊提醒、家庭成员管理、机构后台

---

## 后续扩展方向

1. **视觉问诊升级**：接入皮疹 / 咽喉 / 化验单 OCR 与结构化识别  
2. **真实公共健康信号**：对接百度指数、药店销量、发热门诊公开数据  
3. **医生/医院协作**：导诊单、复诊单、报告分享、绿色通道  
4. **B 端版本**：给学校、社区、企业医务室做轻量健康预检入口  
5. **更强 RAG**：接入 pgvector、reranker、多源指南版本控制  

---

## 免责声明

本项目用于**医疗预检 / 风险提示 / 信息辅助**，**不构成正式医疗诊断**。  
如果出现胸痛、严重呼吸困难、意识改变、突发剧烈头痛、大量出血等危险信号，请立即线下就医或拨打急救电话。
