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

### P3-A: 问诊反死循环修复
- quickTriage 紧急度预分诊
- 追问上限 RED=0/YELLOW=3/GREEN=5
- System prompt 重写

### P3-B: 知识库扩容
- MedlinePlus 211条, CDC 106条, 总计367条

### P4: 小修三件
- 检索显示优化（隐藏条数）
- 会话 rename（三点菜单）
- 装饰 tag 清理

### P5: 侧边栏统一 + debug 清理
- ConversationMenu 三点菜单
- sanitizeForDisplay 过滤 prompt 泄露
- 免责统一 + placeholder 精简

### P6: 全站冗余审计
- 买药入口合并（3→1）
- Debug 泄露清理
- 净删 116 行

### P7: 侧边栏呼出 + 终检
- 汉堡菜单 overlay 侧边栏
- 全流程终检
