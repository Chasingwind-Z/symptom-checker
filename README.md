# 健康助手 - AI 症状自查分级就诊系统

[![Live Demo](https://img.shields.io/badge/Live%20Demo-在线体验-blue?style=for-the-badge)](https://symptom-checker-ahvsmkovl-chasingwinds-projects.vercel.app/)
[![GitHub Stars](https://img.shields.io/github/stars/Chasingwind-Z/symptom-checker?style=for-the-badge)](https://github.com/Chasingwind-Z/symptom-checker)

> 描述症状，AI 帮你判断是否需要就医，推荐附近医院

## 在线体验

无需本地部署，直接访问：
👉 https://symptom-checker-ahvsmkovl-chasingwinds-projects.vercel.app/

## 功能演示

🔗 **在线体验：** https://symptom-checker-ahvsmkovl-chasingwinds-projects.vercel.app/

> 体验时请使用 Chrome 或 Safari 浏览器，支持语音输入功能

（GIF 演示录屏后添加）

## 核心功能

- AI 多轮对话问诊，像医生一样逐步追问
- 绿/黄/橙/红四级风险分级，配套行动清单
- 动态 Skill 系统：自动识别老人/儿童场景加载专科协议
- 本地医学知识库 RAG 增强，20种常见症状结构化知识
- 高德地图医院定位，一键导航
- 语音输入，手机场景无需打字
- 问诊报告 PDF 导出，可带去医院给医生参考
- 社区症状匿名上报与分布可视化

## 技术栈

- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- 小米 MiMo API（兼容 OpenAI 格式，可一键切换模型）
- 高德地图 JS API 2.0
- Web Speech API（语音输入）
- jsPDF（报告导出）
- Chart.js（数据可视化）

## 本地运行

```bash
git clone https://github.com/Chasingwind-Z/symptom-checker.git
cd symptom-checker
npm install
cp .env.example .env
# 在 .env 中填入你的 API key
npm run dev
```

浏览器打开 http://localhost:5173

## 环境变量

```
VITE_AI_BASE_URL=    # AI API 地址
VITE_AI_MODEL=       # 模型名称
VITE_AI_API_KEY=     # AI API Key
VITE_AMAP_JS_KEY=    # 高德地图 Web 端 Key
```

## 架构说明

### Skill 系统

`src/prompts/` 下有四个 Skill 文件，根据对话内容动态加载注入 System Prompt：

- `base_triage.md`：基础分诊规则
- `elderly_protocol.md`：老年人专科协议
- `pediatric_protocol.md`：儿科协议
- `emergency_flags.md`：危险信号清单

### 知识库增强

`src/lib/symptomKB.ts` 内置 20 种症状的结构化知识，每次问诊自动检索匹配，将专业知识注入 AI 上下文。

## 后续规划

- [ ] 图片输入（皮疹/伤口拍照识别）
- [ ] 接入真实医院 POI 搜索
- [ ] 购药数据社区疾病趋势分析
- [ ] Next.js 迁移（API Key 安全隔离）
- [ ] 用户历史问诊记录

## 免责声明

本工具由 AI 生成建议，仅供参考，不构成医疗诊断。请根据实际情况遵医嘱就医。
