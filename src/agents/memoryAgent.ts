import type { SpecialistAgentDefinition } from './types';

export const memoryAgent: SpecialistAgentDefinition = {
  id: 'memory',
  label: '健康记忆',
  shortLabel: '记忆',
  tone: 'rose',
  focus: '利用既往对话和回访信息避免重复追问',
  allowedTools: [],
  buildPrompt: (context) => {
    const profile = context.memoryContext?.profile;
    const currentYear = new Date().getFullYear();
    const profileNotes: string[] = [];

    if (profile?.displayName) {
      profileNotes.push(`称呼：${profile.displayName}`);
    }
    if (profile?.birthYear) {
      profileNotes.push(`年龄约 ${Math.max(0, currentYear - profile.birthYear)} 岁`);
    }
    if (profile?.gender) {
      profileNotes.push(`性别：${profile.gender}`);
    }
    if (profile?.city) {
      profileNotes.push(`常驻城市：${profile.city}`);
    }
    if (profile?.medicalNotes) {
      profileNotes.push(`重点病史/备注：${profile.medicalNotes}`);
    }

    const recentCaseNotes =
      context.memoryContext?.recentCases
        ?.slice(0, 3)
        .map(
          (item) =>
            `- ${item.createdAt.slice(5, 16).replace('T', ' ')} · ${item.chiefComplaint} · ${item.triageLevel}${
              item.departments.length > 0 ? ` · ${item.departments.join('、')}` : ''
            }`
        )
        .join('\n') ?? '';

    const recentUserNotes = context.messages
      .filter((message) => message.role === 'user')
      .slice(-3)
      .map((message) => `- ${message.content}`)
      .join('\n');

    const diagnosisNote = context.diagnosisResult
      ? `最近一次分诊：${context.diagnosisResult.level}，建议科室：${context.diagnosisResult.departments.join('、')}。`
      : '暂无既往分诊结果。';

    const followUpNote = context.pendingFollowUpSummary
      ? `待回访摘要：${context.pendingFollowUpSummary}。`
      : '当前没有待回访提醒。';

    return `你是【用户记忆助手】。

职责：
- 记住用户已经说过的信息，避免重复追问
- 如果用户在做回访，要先对比“上次情况”和“这次变化”
- 对老人、儿童、慢病、家属代问等场景，优先保留上下文连续性

【已知历史摘要】
${diagnosisNote}
${followUpNote}
${profileNotes.length > 0 ? `用户档案：${profileNotes.join('；')}。` : '用户档案暂未完善。'}
${recentCaseNotes ? `近期历史病例：\n${recentCaseNotes}` : '暂无已保存的历史病例摘要。'}
${recentUserNotes ? `最近用户表述：\n${recentUserNotes}` : '最近暂无更多历史表述。'}`;
  },
};
