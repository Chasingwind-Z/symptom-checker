# 健康助手

<div align="center">

[![在线体验](https://img.shields.io/badge/在线体验-健康助手-2563EB?style=for-the-badge)](https://symptom-checker-ahvsmkovl-chasingwinds-projects.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Data-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

面向中文场景的 **AI 医疗预检与公共健康辅助平台**。  
通过多轮追问、动态快捷回答、风险分级、附近医院导航、官方资料对照、健康档案与历史会话，帮助用户更快判断下一步行动。

</div>

---

## 在线体验

**地址：** https://symptom-checker-ahvsmkovl-chasingwinds-projects.vercel.app/

推荐使用 **Chrome / Edge / Safari**，可获得更完整的语音输入、地图与 PWA 安装体验。

---

## 当前能力

| 模块 | 已实现能力 |
| --- | --- |
| AI 分诊对话 | 一次只问一个问题；最多 4 轮追问；已回答信息不重复询问；快捷回答由 AI 动态生成 |
| 风险结论 | 输出 `green / yellow / orange / red` 四级分诊结果、判断依据、行动建议与推荐科室 |
| 产品壳层 | 桌面端采用可收回左侧工作台，支持最近问诊、搜索记录、健康档案、记录中心、设置与用药建议一处切换，并增加壳层异常兜底与次级面板按需加载 |
| 个性化用药参考 | 基于年龄、慢病、过敏史与现用药，对 OTC / 家庭处理方向做更保守的筛选与提醒 |
| 健康空间 | 支持游客模式、本地保存、健康档案 dashboard、家庭档案、健康时间线、本周 / 本月摘要、统一搜索与继续问诊 |
| 账号体系 | Supabase 邮箱密码登录 + Magic Link 登录，登录后可同步档案与问诊记录 |
| 附近医院 | 基于高德地图检索医院与路线，按分诊结果给出就诊方向参考 |
| 健康地图 | 支持多城市区域热力视图、热点摘要、定位识别后的本地片区建议，以及“官方公开资料 / 趋势参考 / 匿名信号”分层展示 |
| 官方资料 | 使用更具体的权威来源页面链接，而非泛首页链接，减少“跳空页”体验 |
| 工具与检索 | 支持天气、医院、知识库、官方资料与联网检索降级策略；知识检索当前为 chunk/关键词混合召回，embedding 字段已预留但并非纯向量 RAG |
| 导出与分享 | 支持就诊报告 PDF 导出、健康档案 PDF 导出与近期健康摘要分享 |
| 终端体验 | 支持语音输入、最多 3 张图片辅助说明、PWA 安装、离线 / 恢复提示、错误边界兜底与移动端使用 |

---

## 产品结构

### 1. 问诊

- 用户描述症状后，AI 进入结构化追问
- 回答过程中提供与当前问题匹配的快捷回答词条
- 信息充分后输出正式 JSON 结论与行动建议

### 2. 健康空间

- 游客可直接使用，数据保存在当前浏览器
- 登录后可同步健康档案、历史会话与问诊摘要
- 桌面端通过左侧工作台快速切换记录、档案、搜索和用药建议
- 健康档案页已升级为 dashboard：包含基础资料、完整度引导、家庭档案、健康时间线、本周 / 本月摘要
- 新增“偏好设置”：可切换桌面侧栏模式、位置使用方式、官方资料展示偏好和聊天排版密度
- 支持导出健康档案 PDF、分享近期摘要，以及打开附近药房入口
- 支持载入可编辑的常见场景资料，快速感受个性化推荐效果

### 3. 健康地图

- 根据城市切换展示区域热度与重点症状
- 默认会优先尝试识别支持城市，并提示更近的同城片区；也可退回到档案城市或手动选城
- 地图不可用时自动切换到趋势参考视图，不会白屏
- 结合更接近原始页面的官方资料卡、分层数据说明与热点摘要，降低“黑盒感”

---

## 本地运行

```bash
git clone https://github.com/Chasingwind-Z/symptom-checker.git
cd symptom-checker
npm install
```

复制 `.env.example` 为 `.env`，至少补齐下列配置后运行：

```bash
npm run dev
```

常用命令：

```bash
npm run build
npm run lint -- --quiet
```

---

## 环境变量

| 变量 | 是否必需 | 说明 |
| --- | --- | --- |
| `VITE_AI_BASE_URL` | 建议配置 | AI 接口地址 |
| `VITE_AI_API_KEY` | 建议配置 | AI 接口 Key |
| `VITE_AI_MODEL` | 建议配置 | 模型名 |
| `VITE_GATEWAY_PROVIDER` | 可选 | 网关策略，常见值：`auto` / `supabase` |
| `VITE_SUPABASE_URL` | 云端同步必需 | Supabase 项目地址 |
| `VITE_SUPABASE_ANON_KEY` | 云端同步必需 | Supabase 前端匿名公钥 |
| `VITE_SITE_URL` | 生产环境强烈建议 | 邮件跳回的根域名，如 `https://your-app.vercel.app/`；须与 Supabase 控制台 Allowed Redirect URLs 一致 |
| `VITE_AMAP_JS_KEY` | 地图功能建议配置 | 高德地图 Web Key |
| `VITE_TAVILY_API_KEY` | 可选 | 联网检索增强；未配置时自动退回内置官方资料 |

---

## Supabase 接入说明

### Auth

1. 打开 `Authentication → Providers → Email`
2. 同时启用：
   - **Email + Password**
   - **Magic Link**
3. 打开 `Authentication → URL Configuration`，配置以下两项：

   **Site URL**（邮件默认跳回地址，每个项目只能填一个）：
   ```
   https://your-app.vercel.app
   ```
   本地开发期间可临时设为 `http://localhost:5173`，上线前务必改回生产域名。

   **Allowed Redirect URLs**（白名单，支持多条，支持通配符）：
   ```
   http://localhost:5173/
   https://your-app.vercel.app/
   ```
   > ⚠️ 列表中的每条 URL 必须与 `VITE_SITE_URL`（或当前 `window.location.origin + "/"`）**完全匹配**，否则 Supabase 会拒绝跳转。
   > 如果使用了 Vercel 预览分支，可添加 `https://*.vercel.app/` 通配符条目。

4. 在 `.env`（或 Vercel / 宿主平台的环境变量）中设置：
   ```
   VITE_SITE_URL=https://your-app.vercel.app/
   ```
   设置后，登录对话框会在邮件等待界面明确显示链接将跳回的地址，便于用户排查域名不对齐问题。

### 数据与函数

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
supabase functions deploy agent-orchestrator
supabase functions deploy official-source-fetch
supabase functions deploy knowledge-sync
```

---

## 关键目录

| 路径 | 作用 |
| --- | --- |
| `src/hooks/useChat.ts` | 聊天主流程、流式回复、动态 suggestions、诊断结果解析 |
| `src/components/ChatBubble.tsx` | 聊天气泡与快捷回答渲染 |
| `src/components/CloudSyncCard.tsx` | 账号、同步状态与健康档案 |
| `src/components/ConversationHistoryPanel.tsx` | 历史会话列表与继续对话入口 |
| `src/components/EpidemicDashboard.tsx` | 多城市健康地图、热点面板与官方资料区 |
| `src/lib/officialSources.ts` | 官方资料来源、卡片数据与链接策略 |
| `src/lib/healthData.ts` | 本地 / 云端的档案、病例与会话持久化 |
| `src/lib/supabase.ts` | Supabase 客户端与认证能力 |

---

## 发布准备

1. **启动性能更稳**  
   地图与用药建议等较重面板改为按需加载，减少首次进入时的等待感。

2. **壳层异常可兜底**  
   应用外壳已接入错误边界，尽量避免用户遇到整页白屏。

3. **离线 / 恢复反馈更清楚**  
   网络断开时会明确提示哪些能力受限，恢复后也会提醒用户可重新刷新同步状态。

4. **PWA / SEO 基础已补齐**  
   `manifest`、`robots.txt`、`sitemap.xml`、Open Graph 与 `noscript` 提示均已补齐，便于安装与分享预览。

---

## 免责声明

本项目用于 **医疗预检 / 风险提示 / 信息辅助**，**不构成正式医疗诊断**。  
如出现胸痛、严重呼吸困难、意识改变、突发剧烈头痛、大量出血等危险信号，请立即线下就医或拨打急救电话。
