# 迭代日志

## Phase 2: RAG 知识库

### P2-W1: pgvector 基础设施 + 自策展核心层
- knowledge_chunks 表 + HNSW 索引 + match RPC
- 50 条原创照料者决策卡片（5 个场景）
- seed 脚本 + 检索服务 stub

### P2-W2: 英文公共域 ETL
- MedlinePlus NLM 28 条 + CDC 16 条
- 严格排除 A.D.A.M./ASHP 内容
- docs/data-sources.md 法律合规文档

### P2-W3: 检索集成 + 引用 UI
- retrieve.ts Supabase RPC + text search + 本地降级
- CitationCard 组件（来源徽章 + 审核状态）
- ChatBubble 引用展示
- orchestrator RAG context 注入

### P2-W4: 可信度透明化
- README 知识库章节
- DisclaimerView 免责声明页
- GitHub issue 模板
- 医学审核日志
