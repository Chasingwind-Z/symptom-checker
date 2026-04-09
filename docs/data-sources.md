# 知识库数据来源说明

## 数据层级

### 第一层：自策展核心层（curated）
- **内容**: 原创照料者决策卡片
- **数量**: 50+ 条
- **语言**: 中文
- **许可**: 原创内容，参考公共分级方法论
- **审核状态**: pending_medical_review
- **覆盖场景**: 儿童发热、儿童咳嗽、老年胸痛、老年跌倒、血压波动

### 第二层：MedlinePlus NLM 公共域（medlineplus）
- **来源**: https://medlineplus.gov/
- **作者**: 美国国家医学图书馆（NLM）
- **许可**: US Government Public Domain（仅 NLM 自产内容）
- **严格排除**: A.D.A.M. Inc. 和 ASHP 授权内容
- **数量**: 28+ 条
- **语言**: 英文原文
- **更新**: 每条记录保留 lastReviewed 日期
- **覆盖**: 儿童发热/咳嗽/腹泻/呕吐/皮疹/耳部感染/过敏/哮喘，老年跌倒/髋部骨折/谵妄/中风/晕厥/尿路感染，通用发热/心脏病发作/头痛/背痛/过敏/腹痛/皮肤病/睡眠障碍/流感/肺炎，慢性高血压/糖尿病/药物相互作用/心脏病
- **ETL 脚本**: `scripts/etl-medlineplus.ts`

### 第三层：CDC 公共域（cdc）
- **来源**: https://www.cdc.gov/
- **作者**: 美国疾病控制与预防中心（CDC）
- **许可**: US Government Public Domain
- **数量**: 16+ 条
- **语言**: 英文原文
- **覆盖**: 流感预防、手卫生、疫苗接种计划（儿童/成人）、热相关疾病、食品安全、跌倒预防、体力活动、糖尿病预防、高血压管理、抗生素耐药性、呼吸道病毒预防、心脏病预防、儿童意外伤害预防、中风识别、老年健康
- **ETL 脚本**: `scripts/etl-cdc.ts`

## 不使用的来源

| 来源 | 原因 |
|------|------|
| A.D.A.M. Inc. 内容 | MedlinePlus 中的第三方授权内容，非公共域 |
| ASHP 药物信息 | MedlinePlus 中的第三方授权内容，非公共域 |
| WHO 内容 | CC BY-NC-SA 许可，禁止商用 |
| UpToDate | 商业付费数据库 |
| 默沙东诊疗手册 | 商业出版内容 |
| DynaMed | 商业付费数据库 |
| 医脉通 / MedSci / 丁香园 | 聚合站，来源不明，版权风险 |
| 中华医学会出版社图书 | 版权保护 |

## 数据输出格式

所有 ETL 脚本输出 JSON Lines 格式，每行一个知识块（chunk），结构如下：

```json
{
  "title": "话题标题",
  "content": "正文内容",
  "population": "pediatric | geriatric | chronic | general",
  "source_type": "curated | medlineplus | cdc",
  "source_ref": "来源 URL",
  "source_date": "YYYY-MM-DD",
  "review_status": "pending_medical_review",
  "metadata": { "language": "en", "nlm_authored": true }
}
```

## 已知限制

- 自策展层全部为 `pending_medical_review` 状态，尚未经过持证医疗专业人员审核
- 英文公共域内容未翻译，AI 在回答时会自动翻译引用
- MedlinePlus 和 CDC 内容为静态提取，非实时同步
- 不覆盖：肿瘤治疗、罕见病、精神科诊断、妊娠用药、急救操作流程
- 所有内容仅供参考，不构成医疗诊断或治疗建议
