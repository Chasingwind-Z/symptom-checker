# 健康助手 · AI 症状自查与公共卫生预警平台

[![在线体验](https://img.shields.io/badge/🌐_在线体验-立即使用-blue?style=for-the-badge)](https://symptom-checker-git-main-chasingwinds-projects.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth+DB-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

> 描述症状 → AI 多轮追问 → 四级风险评估 → 就医行动计划 + 附近医院推荐 + 公共卫生预警

---

## 🌐 在线体验

**地址：** https://symptom-checker-git-main-chasingwinds-projects.vercel.app/

推荐使用 Chrome / Edge / Safari，支持语音输入与 PWA 安装到桌面。

---

## ✨ 核心功能

### 🩺 智能 AI 问诊
- 每次只问一个问题，不重复追问已知信息
- 四级风险分级：🟢 居家观察 / 🟡 尽快就诊 / 🟠 今日就医 / 🔴 立即急诊
- 动态快捷回答词条，由 AI 根据当前问题实时生成
- 支持语音输入和图片辅助说明

### 👥 守护模式
| 模式 | 适用场景 | AI 特殊处理 |
|------|---------|-----------|
| 本人 | 成年人自查 | 标准分诊流程 |
| 儿童守护 | 14岁以下 | 发烧阈值降低，推荐儿科，不推荐成人药 |
| 老人守护 | 60岁以上 | 风险等级上调，建议家人陪同就医 |
| 慢病守护 | 有基础疾病 | 追问用药史，检查药物相互作用 |

### 📋 就诊报告导出
AI 生成结构化就诊摘要（患者信息 + 主诉 + AI评估 + 推荐科室），
导出 PDF 可直接带去医院给医生参考。

### 💊 用药安全检查
自动检测推荐药品与用户现用药物的潜在相互作用，
高风险情况给出明确警告，避免用药风险。

### 📍 附近医院推荐
基于高德地图按分级结果推荐对应类型医院，
支持地图查看位置和一键导航前往。

### 📊 公共卫生预警大屏
区域疾病风险监测，展示各区域主要症状和购药行为趋势，
AI 自动生成预警分析报告。

### 🔄 症状连续追踪
跨会话记录症状历史，AI 下次问诊时自动参考历史记录，
48小时后智能推送回访提醒。

---

## 🏗️ 技术架构

```
用户界面（React 18 + TypeScript + Tailwind CSS）
         ↓
AI Agent 层（Function Calling + Skill 系统）
  ├── 症状知识库检索（本地 RAG）
  ├── 天气工具（和风天气 API）
  ├── 医院搜索工具（高德 POI API）
  ├── 用药安全检查（22条相互作用规则）
  └── 联网搜索（Tavily API）
         ↓
数据层（Supabase PostgreSQL + localStorage 降级）
  ├── 用户认证（Email + Magic Link）
  ├── 健康档案与家庭成员管理
  ├── 历史问诊记录
  └── 症状追踪时间线
```

---

## 🚀 本地运行

```bash
git clone https://github.com/Chasingwind-Z/symptom-checker.git
cd symptom-checker
npm install
cp .env.example .env
# 在 .env 中填入必要的 API Key
npm run dev
```

浏览器打开 http://localhost:5173

---

## ⚙️ 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `VITE_AI_BASE_URL` | ✅ | AI API 接口地址 |
| `VITE_AI_API_KEY` | ✅ | AI API Key |
| `VITE_AI_MODEL` | ✅ | 模型名称（如 deepseek-chat） |
| `VITE_SUPABASE_URL` | ✅ | Supabase 项目地址 |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase 前端公钥 |
| `VITE_AMAP_JS_KEY` | 推荐 | 高德地图 Web JS Key |
| `VITE_AMAP_WEB_KEY` | 推荐 | 高德 Web 服务 Key（POI 搜索） |
| `VITE_QWEATHER_KEY` | 推荐 | 和风天气 API Key |
| `VITE_TAVILY_API_KEY` | 可选 | 联网搜索增强 |

---

## 💡 商业模式

```
C 端用户（免费使用）
    ↓ 产生数据
平台数据层
    ├── 药品购买导流 → 联盟佣金（京东/美团）
    ├── 匿名症状数据聚合 → 区域疾病趋势报告 → 药企/疾控采购
    └── 医院导流合作 → 预约分成
```

---

## ⚠️ 免责声明

本项目用于医疗预检辅助，不构成医疗诊断。
出现胸痛、呼吸困难、意识改变等危险信号时，请立即就医或拨打 120。

---

## 📄 License

MIT © 2026 Chasingwind-Z