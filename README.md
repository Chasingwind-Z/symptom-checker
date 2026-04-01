# AI 症状自查分级就诊系统

基于 React + TypeScript + Vite 构建的 AI 症状自查应用，集成小米 MiMo 大模型和高德地图。

## 功能

- AI 多轮对话问诊，输出红/橙/黄/绿四级风险评估
- 根据用户真实位置搜索附近医院（高德 POI）
- 点击医院卡片查看高德地图定位
- 症状知识库、行动清单、匿名上报

## 快速启动

```bash
# 1. 克隆项目
git clone https://github.com/Chasingwind-Z/symptom-checker.git
cd symptom-checker

# 2. 安装依赖
npm install

# 3. 配置环境变量（已内置可用的 key，直接复制即可）
cp .env.example .env

# 4. 启动开发服务器
npm run dev
```

浏览器打开 http://localhost:5173 即可使用。

## 技术栈

- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- 小米 MiMo API（兼容 OpenAI 格式）
- 高德地图 JS API 2.0 + Web 服务 API
