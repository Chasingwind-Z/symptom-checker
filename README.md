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
| 健康空间 | 支持游客模式、本地保存、健康档案维护、历史会话查看与继续问诊 |
| 账号体系 | Supabase 邮箱密码登录 + Magic Link 登录，登录后可同步档案与问诊记录 |
| 附近医院 | 基于高德地图检索医院与路线，按分诊结果给出就诊方向参考 |
| 健康地图 | 支持多城市区域热力视图、热点摘要、官方公开资料卡与趋势联动 |
| 官方资料 | 使用更具体的权威来源页面链接，而非泛首页链接，减少“跳空页”体验 |
| 工具与检索 | 支持天气、医院、知识库、官方资料与联网检索降级策略 |
| 终端体验 | 支持语音输入、图片辅助上下文、PWA 安装与移动端使用 |

---

## 产品结构

### 1. 问诊

- 用户描述症状后，AI 进入结构化追问
- 回答过程中提供与当前问题匹配的快捷回答词条
- 信息充分后输出正式 JSON 结论与行动建议

### 2. 健康空间

- 游客可直接使用，数据保存在当前浏览器
- 登录后可同步健康档案、历史会话与问诊摘要
- 支持加载可编辑的参考档案，快速查看个性化推荐效果

### 3. 健康地图

- 根据城市切换展示区域热度与重点症状
- 地图不可用时自动切换到趋势参考视图，不会白屏
- 结合官方公开资料卡与热点摘要，降低“黑盒感”

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
| `VITE_AMAP_JS_KEY` | 地图功能建议配置 | 高德地图 Web Key |
| `VITE_TAVILY_API_KEY` | 可选 | 联网检索增强；未配置时自动退回内置官方资料 |

---

## Supabase 接入说明

### Auth

1. 打开 `Authentication -> Providers -> Email`
2. 同时启用：
   - **Email + Password**
   - **Magic Link**
3. 在 `URL Configuration` 中加入：
   - `http://localhost:5173`
   - 你的线上域名

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

## 下一阶段路线图

1. **药品推荐升级**  
   建立 OTC/处方药分层、禁忌校验、儿童/老人/孕期提示与药物相互作用提醒。

2. **更权威的健康热点地图**  
   继续增强按城市定位的公卫看板，引入更多官方机构页面、发热门诊/疾控公开信息与更清晰的来源分层。

3. **更丰富的疫情与趋势数据**  
   在真实用户量不足时，采用“官方公开资料 + 区域天气 + 合成匿名冷启动样本”的方式稳定展示；用户规模提升后再逐步过渡到真实匿名聚合趋势。

4. **个性化检索与推荐**  
   基于年龄、慢病、过敏、历史问诊与地理位置，做更贴近个人情况的检索排序、复诊提醒与内容推荐。

5. **更完整的用户体系**  
   继续补充家庭成员管理、长期健康档案、问诊报告归档与医生协作分享能力。

---

## 免责声明

本项目用于 **医疗预检 / 风险提示 / 信息辅助**，**不构成正式医疗诊断**。  
如出现胸痛、严重呼吸困难、意识改变、突发剧烈头痛、大量出血等危险信号，请立即线下就医或拨打急救电话。
