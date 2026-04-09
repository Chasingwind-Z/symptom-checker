import { loadSkills } from '../lib/skillLoader';
import { getHistoryContextForAI, detectFamilyCrossInfection } from '../lib/symptomTracking';
import { getMedicineBoxSummary } from '../lib/familyMedicineBox';
import { getMetricsSummaryForAI, getMetricsTrendSummary } from '../lib/healthMetrics';
import { SEASONAL_SYMPTOM_PATTERNS } from '../lib/symptomKB';
import type { AgentBadge, AgentId, AgentRoute, AgentStep, SymptomInfo } from '../types';
import { careNavigatorAgent } from './careNavigatorAgent';
import { evidenceAgent } from './evidenceAgent';
import { memoryAgent } from './memoryAgent';
import { publicHealthAgent } from './publicHealthAgent';
import { triageAgent } from './triageAgent';
import type { AgentPromptContext, SpecialistAgentDefinition } from './types';
import { AI_VISION_ENABLED } from '../lib/aiCapabilities';

const AGENT_REGISTRY: Record<AgentId, SpecialistAgentDefinition> = {
  orchestrator: {
    id: 'orchestrator',
    label: '总协调',
    shortLabel: '总控',
    tone: 'slate',
    focus: '统筹路由与统一输出',
    allowedTools: [],
    buildPrompt: () =>
      `你是“健康助手”的【Orchestrator Agent / 总协调 Agent】。

职责：
- 判断本轮是继续问诊、补证据、就医导航、公共卫生解释还是回访记忆
- 激活最合适的专职 Agent，并把它们的意见整合成一条统一的中文回复
- 不暴露内部推理链，不要让回复像“系统演示稿”

【协调原则】
1. 全程中文优先、语气谨慎、医学保守
2. 能继续问诊时保持简洁，一次只推进一个关键问题
3. 如果信息已经足够，直接给出清晰的分级与下一步动作
4. 如涉及工具结果，要把它们自然融入解释与建议中`,
  },
  triage: triageAgent,
  evidence: evidenceAgent,
  careNavigator: careNavigatorAgent,
  publicHealth: publicHealthAgent,
  memory: memoryAgent,
};

const ROUTE_ORDER: AgentId[] = [
  'orchestrator',
  'triage',
  'evidence',
  'careNavigator',
  'publicHealth',
  'memory',
];

const FOLLOW_UP_RESPONSES = ['明显好转', '略有好转', '没有变化', '更严重了'] as const;

function formatAttachmentSize(sizeBytes: number): string {
  const sizeInMb = sizeBytes / (1024 * 1024);
  return sizeInMb >= 1
    ? `${sizeInMb.toFixed(1)} MB`
    : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

interface AgentScorecard {
  triage: number;
  evidence: number;
  careNavigator: number;
  publicHealth: number;
  memory: number;
}

export interface AgentOrchestrationPlan {
  route: AgentRoute;
  systemPrompt: string;
  allowedToolNames: string[];
  preferredToolName?: string;
}

function toBadge(agentId: AgentId): AgentBadge {
  const agent = AGENT_REGISTRY[agentId];
  return {
    id: agent.id,
    label: agent.label,
    shortLabel: agent.shortLabel,
    tone: agent.tone,
  };
}

function sanitizeSnippet(text: string, length = 18): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, length);
}

function scoreRoute(context: AgentPromptContext): AgentScorecard {
  const { userText, diagnosisResult, kbResults, messages, pendingFollowUpSummary } = context;
  const hasKnowledge = (context.knowledgeSearch?.documents.length ?? 0) > 0;
  const scores: AgentScorecard = {
    triage: 2,
    evidence: 0,
    careNavigator: 0,
    publicHealth: 0,
    memory: 0,
  };

  const hasSymptoms =
    /(疼|痛|发烧|发热|咳|头晕|头痛|恶心|腹泻|胸闷|气短|呼吸|喉咙|流鼻涕|不舒服|症状|难受|过敏|出血|乏力)/.test(
      userText
    ) || kbResults.length > 0;
  const asksEvidence =
    /(依据|证据|来源|为什么|判断|最新|官方|研究|资讯|新闻|天气|下雨|降温|雾霾|能不能出门)/.test(
      userText
    );
  const asksCare =
    /(医院|挂号|挂什么科|哪家|附近|去哪看|急诊|门诊|导航|路线|药房|现在要不要去)/.test(
      userText
    );
  const asksPublicHealth =
    /(疫情|流感|高发|风险区|传播|趋势|预警|病例|社区|疾控|卫健委|区域风险)/.test(
      userText
    );
  const asksMemory =
    /(上次|之前|回访|记录|历史|家里老人|孩子|家人|既往|慢病|又来了|再次|继续看看)/.test(
      userText
    );
  const isFollowUpReply = FOLLOW_UP_RESPONSES.includes(
    userText as (typeof FOLLOW_UP_RESPONSES)[number]
  );

  if (hasSymptoms) scores.triage += 4;
  if (!diagnosisResult) scores.triage += 2;
  if (messages.length <= 2) scores.triage += 1;
  if (isFollowUpReply) scores.triage += 2;

  if (asksEvidence) scores.evidence += 4;
  if (kbResults.length > 0) scores.evidence += 1;
  if (hasKnowledge) scores.evidence += 1;
  if (diagnosisResult) scores.evidence += 1;

  if (asksCare) scores.careNavigator += 5;
  if (diagnosisResult && diagnosisResult.level !== 'green') scores.careNavigator += 1;

  if (asksPublicHealth) scores.publicHealth += 5;

  if (messages.length > 0 || diagnosisResult || pendingFollowUpSummary) scores.memory += 2;
  if (asksMemory) scores.memory += 3;
  if (isFollowUpReply) scores.memory += 4;
  if (context.memoryContext?.recentCases?.length) scores.memory += 2;
  if (context.memoryContext?.profile?.medicalNotes || context.memoryContext?.profile?.birthYear) {
    scores.memory += 1;
  }

  return scores;
}

function choosePrimaryAgent(scores: AgentScorecard): AgentId {
  const ranked: Array<[Exclude<AgentId, 'orchestrator'>, number]> = [
    ['triage', scores.triage],
    ['evidence', scores.evidence],
    ['careNavigator', scores.careNavigator],
    ['publicHealth', scores.publicHealth],
    ['memory', scores.memory],
  ];
  ranked.sort((a, b) => b[1] - a[1]);

  return ranked[0]?.[0] ?? 'triage';
}

function buildReasoning(primaryAgent: AgentId, context: AgentPromptContext): string {
  if (primaryAgent === 'careNavigator') {
    return '用户更关注“现在该去哪里看、挂什么科”，需要把分诊结果转成可执行的就医方案。';
  }

  if (primaryAgent === 'publicHealth') {
    return '本轮重点是区域流行趋势与风险解释，需要公共卫生视角辅助判断。';
  }

  if (primaryAgent === 'evidence') {
    return '用户在追问判断依据或最新背景信息，需要补充证据与来源说明。';
  }

  if (primaryAgent === 'memory') {
    return context.pendingFollowUpSummary
      ? '这是一次回访/延续对话，需要先衔接上次记录，再决定是否升级分诊。'
      : '已有历史线索较多，需先利用记忆上下文避免重复问诊。';
  }

  const symptomHint = context.kbResults[0]?.name
    ? `已命中“${context.kbResults[0].name}”等症状线索`
    : '本轮仍处于标准问诊分诊阶段';
  const knowledgeHint = context.knowledgeSearch?.documents[0]?.document.title;
  return `${symptomHint}${knowledgeHint ? `，并检索到“${knowledgeHint}”等医学指引` : ''}，优先由分诊 Agent 主导，必要时联动证据和记忆模块。`;
}

function buildSteps(primaryAgent: AgentId, activeIds: AgentId[]): AgentStep[] {
  return activeIds
    .filter((agentId) => agentId !== 'orchestrator')
    .map((agentId) => ({
      id: agentId,
      label: AGENT_REGISTRY[agentId].label,
      focus: AGENT_REGISTRY[agentId].focus,
      status: agentId === primaryAgent ? 'lead' : 'active',
    }));
}

function choosePreferredToolName(
  context: AgentPromptContext,
  primaryAgent: AgentId,
  allowedToolNames: string[]
): string | undefined {
  const userText = context.userText;
  const candidates = [
    /(天气|下雨|降温|高温|雾霾|出门|路上)/.test(userText) ? 'get_weather' : undefined,
    /(医院|挂号|挂什么科|附近|急诊|门诊|去哪看|哪家医院)/.test(userText)
      ? 'search_hospitals'
      : undefined,
    /(依据|证据|来源|最新|官方|通报|新闻|研究|资讯)/.test(userText)
      ? 'search_web'
      : undefined,
    /(疫情|流感|高发|风险区|传播|感染趋势|社区)/.test(userText)
      ? 'get_epidemic_snapshot'
      : undefined,
    primaryAgent === 'triage' ||
    context.kbResults.length > 0 ||
    (context.knowledgeSearch?.documents.length ?? 0) > 0
      ? 'search_symptom_knowledge'
      : undefined,
  ].filter((item): item is string => Boolean(item));

  return candidates.find((item) => allowedToolNames.includes(item));
}

function buildContextNotes(context: AgentPromptContext): string[] {
  const notes: string[] = [];
  const additionalSkills = loadSkills(context.userText);
  const profile = context.memoryContext?.profile;
  const consultationMode = context.memoryContext?.consultationMode;
  const recentCases = context.memoryContext?.recentCases?.slice(0, 3) ?? [];

  if ((context.attachments?.length ?? 0) > 0) {
    notes.push(
      `【图片补充信息】\n用户本轮上传了 ${context.attachments!.length} 张图片（常见于皮疹、伤口、药盒或检查报告）。${
        AI_VISION_ENABLED
          ? '当前模型可接收图片，请先说明你能直接看到的异常或可读文字，再明确哪些结论仍不能仅凭图片确认。'
          : '当前 AI 环境不具备图片像素识别能力，图片未以视觉方式传入，下方仅为文件元数据。请主动引导用户用文字描述图片内容（部位、颜色、范围、持续时间等），不要依赖图片信息做分诊判断。'
      } 回复中需要明确“不能仅凭图片做诊断”。\n${context.attachments!
        .map(
          (item, index) =>
            `- 图片 ${index + 1}：${item.name}（${item.mimeType}，${formatAttachmentSize(
              item.sizeBytes
            )}）`
        )
        .join('\n')}`
    );

    const reportKeywords = ['报告', '化验', '检查', '体检', '血常规', '尿常规', '肝功能', '肾功能', '血糖', '血脂', 'CT', 'B超', '心电图'];
    const isLikelyReport = reportKeywords.some(kw => context.userText.includes(kw));
    if (isLikelyReport) {
      notes.push(`【报告解读模式已激活】\n用户上传了疑似医学检查报告的图片，请按照体检报告解读格式输出结构化分析。优先识别异常指标并用通俗语言解释，不做确定性诊断。`);
    }
  }

  if (additionalSkills) {
    notes.push(`【专项分诊补充规则】\n${additionalSkills}`);
  }

  if (profile) {
    const profileItems: string[] = [];

    if (profile.displayName) profileItems.push(`称呼：${profile.displayName}`);
    if (profile.birthYear) {
      profileItems.push(`年龄约 ${Math.max(0, new Date().getFullYear() - profile.birthYear)} 岁`);
    }
    if (profile.gender) profileItems.push(`性别：${profile.gender}`);
    if (profile.city) profileItems.push(`常驻城市：${profile.city}`);
    if (profile.medicalNotes) profileItems.push(`重点病史/备注：${profile.medicalNotes}`);

    if (profileItems.length > 0) {
      notes.push(
        `【用户健康档案 - 已知信息，严禁重复追问】\n${profileItems.join('；')}。\n⚠️ 以上所有信息视为已确认，问诊中绝对不允许再次询问这些内容（包括年龄、性别、基础疾病、过敏史、现用药等）。如果档案已提供年龄和疾病信息，问诊第3轮应直接跳过。`
      );
    }
  }

  if (consultationMode) {
    const guardianModeExtras: Record<string, string> = {
      child: `\n【当前模式：儿童守护】
用户咨询的是14岁以下儿童的症状。
- 发烧超过38.5°C直接建议就医，不建议居家观察
- 优先推荐儿童医院或有儿科的医院
- 不提及成人用药
- 追问时关注：年龄（月龄）、接种疫苗情况
- 风险等级整体上调一级`,
      elderly: `\n【当前模式：老人守护】
用户咨询的是60岁以上老年人的症状。
- 风险等级整体上调一级
- 重点追问：是否独居、有无慢性病、有无人陪同
- 对胸闷、头晕、乏力保持更高警惕
- 行动建议中强调需要家人陪同就医`,
      chronic: `\n【当前模式：慢病守护】
用户有慢性基础疾病（高血压/糖尿病/心脏病等）。
- 风险等级整体上调一级
- 追问时关注：当前用药情况、症状与慢性病的关联
- 提醒可能的药物相互作用风险
- 行动建议优先推荐有专科的医院`,
    };
    const extra = guardianModeExtras[consultationMode.id as string] ?? '';
    notes.push(
      `【当前咨询模式】\n已选择：${consultationMode.label}${
        consultationMode.subtitle ? `（${consultationMode.subtitle}）` : ''
      }。${consultationMode.promptNote}\n注意：如果用户只是选择了模式但还没给出具体症状，不要假设已经知道病情，先请对方描述这次最主要的不适。${extra}`
    );

    if (consultationMode.id === 'chronic') {
      const trend = getMetricsTrendSummary();
      if (trend) {
        notes.push(`【用户近期健康指标趋势】\n${trend}\n请在问诊时结合这些数据，当症状可能与指标变化相关时主动提及。`);
      }
    }
  }

  if (recentCases.length > 0) {
    notes.push(
      `【近期历史问诊】\n${recentCases
        .map(
          (item) =>
            `- ${sanitizeSnippet(item.chiefComplaint, 32)} · ${item.triageLevel}${
              item.departments.length > 0 ? ` · ${item.departments.join('、')}` : ''
            }`
        )
        .join('\n')}\n如果用户提到“上次/之前/又来了”，请先利用这些上下文衔接，不要重复从零开始问诊。`
    );
  }

  const trackingContext = getHistoryContextForAI();
  if (trackingContext) {
    notes.push(`【症状追踪记录】\n${trackingContext}\n注意：如果用户之前的症状已好转，不要再追问相关问题。如果状态为"更严重了"，优先关注加重原因。`);
  }

  if (context.kbResults.length > 0) {
    notes.push(
      `【本地症状线索】\n疑似相关症状：${context.kbResults
        .map((item: SymptomInfo) => item.name)
        .join('、')}。如需细节，请优先调用 search_symptom_knowledge，而不是直接猜测。`
    );
  }

  if ((context.knowledgeSearch?.documents.length ?? 0) > 0) {
    const snippets = context.knowledgeSearch!.documents
      .slice(0, 3)
      .map((item) => `- ${item.document.title}：${item.snippet}`)
      .join('\n');
    const populationHint = context.knowledgeSearch?.focusPopulation
      ? `（重点人群：${context.knowledgeSearch.focusPopulation}）`
      : '';

    notes.push(
      `【医学知识混合检索结果】${populationHint}\n${snippets}\n这些内容来自本地结构化医学指引；当前以关键词扩展 + chunk 混合召回为主，可直接融入解释与建议。`
    );
  }

  // Read recent checkins for AI context
  try {
    const raw = localStorage.getItem('daily_checkins');
    if (raw) {
      const checkins = JSON.parse(raw) as Array<{ energy: number; sleepHours: number; hasDiscomfort: boolean; date: string }>;
      const recent = checkins.slice(-3);
      const lowEnergy = recent.filter(c => c.energy <= 2).length;
      const poorSleep = recent.filter(c => c.sleepHours < 6).length;
      if (lowEnergy >= 2 || poorSleep >= 2) {
        notes.push(`【健康打卡异常】近期精力偏低${lowEnergy}次/睡眠不足${poorSleep}次，问诊时请关注疲劳/睡眠相关问题。`);
      }
    }
  } catch {}

  const crossInfection = detectFamilyCrossInfection();
  if (crossInfection) {
    notes.push(
      `【家庭交叉感染预警】\n${crossInfection.alertText}\n近期相关症状：${crossInfection.recentSymptoms.join('、')}。\n请在分诊时考虑交叉感染可能性，主动提醒用户注意家庭内隔离措施。`
    );
  }

  const medicineBoxSummary = getMedicineBoxSummary();
  if (medicineBoxSummary) {
    notes.push(
      `【家庭药箱】\n家中现有：${medicineBoxSummary}。\n问诊时可主动告知用户家中已有哪些药可以使用，避免重复购买。`
    );
  }

  if (context.ragResults && !context.ragResults.empty) {
    const ragContext = context.ragResults.chunks.map((chunk, i) =>
      `[来源${i + 1}] ${chunk.title} (${chunk.sourceType}${chunk.reviewStatus === 'pending_medical_review' ? ', 待审核' : ''})\n${chunk.content}`
    ).join('\n\n');

    notes.push(`【知识库检索结果】\n${ragContext}\n\n请基于以上知识库内容回答，如需引用请标注来源编号[来源N]。`);
  } else if (context.ragResults?.empty) {
    notes.push(`【知识库提示】知识库未覆盖用户当前问题，请基于你的医学知识谨慎回答，并明确告知用户"知识库未覆盖此问题，以下回答仅供参考"。`);
  }

  const metricsSummary = getMetricsSummaryForAI();
  if (metricsSummary) {
    notes.push(
      `【用户健康指标记录】\n${metricsSummary}\n注意：这些是用户自测数据，如有异常趋势请在分诊中提及，并建议就医进一步检查。`
    );
  }

  if (context.locationData) {
    notes.push(
      `【可用位置上下文】\n若需要天气或医院工具，可直接使用当前经纬度：lat=${context.locationData.lat.toFixed(
        2
      )}, lon=${context.locationData.lon.toFixed(2)}。`
    );
  }

  if (context.diagnosisResult) {
    notes.push(
      `【最近一次分诊结果】\n风险等级：${context.diagnosisResult.level}；建议科室：${context.diagnosisResult.departments.join(
        '、'
      )}。如用户继续追问医院、天气或风险变化，可结合工具给出更具体建议。`
    );
  }

  // Time context for decision language (called from event handler context, not render)
  const hour = new Date().getHours();
  const isNightTime = hour >= 20 || hour < 7;
  if (isNightTime) {
    notes.push(`【当前为夜间${hour}点】照料者可能焦虑，结论必须明确"今晚"还是"明天"。夜间green级别应明确说"今晚不用去"。`);
  } else {
    notes.push(`【当前为白天${hour}点】正常门诊时间段，可以建议"今天去"或"明天去"。`);
  }

  const month = new Date().getMonth();
  const seasonal = SEASONAL_SYMPTOM_PATTERNS[month];
  if (seasonal) {
    notes.push(`【季节性提醒】${seasonal.context}。高发关键词：${seasonal.keywords.join('、')}。`);
  }

  return notes;
}

export function createAgentOrchestration(context: AgentPromptContext): AgentOrchestrationPlan {
  const scores = scoreRoute(context);
  const primaryAgent = choosePrimaryAgent(scores);
  const activeSet = new Set<AgentId>(['orchestrator', 'triage']);

  if (scores.evidence > 0 || primaryAgent === 'evidence' || context.kbResults.length > 0) {
    activeSet.add('evidence');
  }
  if (scores.careNavigator > 0 || primaryAgent === 'careNavigator') {
    activeSet.add('careNavigator');
  }
  if (scores.publicHealth > 0 || primaryAgent === 'publicHealth') {
    activeSet.add('publicHealth');
  }
  if (scores.memory > 0 || primaryAgent === 'memory') {
    activeSet.add('memory');
  }

  const activeIds = ROUTE_ORDER.filter((agentId) => activeSet.has(agentId));
  const allowedToolNames = Array.from(
    new Set(activeIds.flatMap((agentId) => AGENT_REGISTRY[agentId].allowedTools))
  );
  const reasoning = buildReasoning(primaryAgent, context);
  const helperLabels = activeIds
    .filter((agentId) => !['orchestrator', primaryAgent].includes(agentId))
    .map((agentId) => AGENT_REGISTRY[agentId].label);
  const summary = helperLabels.length
    ? `总协调已切换到${AGENT_REGISTRY[primaryAgent].label}主导，并联动${helperLabels.join('、')}。`
    : `总协调已切换到${AGENT_REGISTRY[primaryAgent].label}主导。`;

  const route: AgentRoute = {
    primary: toBadge(primaryAgent),
    activeAgents: activeIds.map(toBadge),
    summary,
    reasoning,
    steps: buildSteps(primaryAgent, activeIds),
  };

  const specialistPrompts = activeIds
    .map((agentId) => `【${AGENT_REGISTRY[agentId].label} 指令】\n${AGENT_REGISTRY[agentId].buildPrompt(context)}`)
    .join('\n\n');

  const contextNotes = buildContextNotes(context);
  const currentTask =
    context.userText.trim() && context.userText.length > 2
      ? `当前用户消息：“${sanitizeSnippet(context.userText, 48)}”`
      : '当前任务：继续上一轮问诊或回访。';

  const systemPrompt = [
    `你正在以“健康助手”多 Agent 产品形态对外服务用户。请把多个专职 Agent 的意见整合成一次自然、可信、中文优先的回复。`,
    `【绝对禁止】\n- 禁止在同一条回复中提问两个问题\n- 禁止重复询问用户已经回答过的任何信息\n- 用户选择快捷回答后，视为明确回答，不得要求澄清\n- 基础问诊4轮内完成；用户继续追问时可自由延伸对话，不设上限\n- 天气工具在第一条消息时已自动调用，后续不要再问用户「您在哪个城市」`,
    `【本轮路由】\n- 主责 Agent：${AGENT_REGISTRY[primaryAgent].label}\n- 激活协作 Agent：${activeIds
      .map((agentId) => AGENT_REGISTRY[agentId].label)
      .join('、')}\n- 路由原因：${reasoning}`,
    `【产品要求】\n- 回复保持医疗谨慎，不做确定性诊断\n- 不要暴露内部推理链，但可以自然体现“已结合分诊/证据/导航/公共卫生/记忆信息”\n- 优先保证安全性与可执行性\n- 与现有前端兼容：问诊阶段保留 suggestions JSON，结论阶段保留 diagnosis JSON 结构`,
    currentTask,
    ...contextNotes,
    specialistPrompts,
  ].join('\n\n');

  return {
    route,
    systemPrompt,
    allowedToolNames,
    preferredToolName: choosePreferredToolName(context, primaryAgent, allowedToolNames),
  };
}
