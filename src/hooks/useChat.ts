import { useState, useCallback, useEffect } from 'react';
import { chatStream } from '../lib/aiClient';
import { searchSymptomKB } from '../lib/symptomKB';
import { loadSkills } from '../lib/skillLoader';
import { requestGeolocation, fetchWeather } from '../lib/geolocation';
import type { Message, DiagnosisResult } from '../types';
import type { WeatherData, LocationData } from '../lib/geolocation';

const SYSTEM_PROMPT = `你是"健康助手"，一个专业的医疗预检分诊 AI。

【核心规则 - 必须严格遵守】
1. 每次回复只问一个问题，绝对不允许在同一条回复中问两个问题
2. 已经问过并得到回答的信息，绝对不允许再次询问
3. 用户选择了快捷回答后，视为已明确回答，直接基于该答案继续
4. 最多进行4轮追问，第4轮结束后必须给出分级结论
5. 每次回复末尾必须提供 suggestions 数组，包含3-4个适合当前问题的快捷回答选项

【问诊流程】
第1轮：询问症状持续时间（如果用户没提的话）
第2轮：询问症状严重程度或最关键的伴随症状
第3轮：询问年龄或基础疾病（老人/儿童/慢性病患者需特殊处理）
第4轮：如果信息充足直接给结论，不足则问最后一个关键问题后给结论

【已知信息追踪】
在每次回复中，你需要在内部追踪哪些信息已经收集：
- 症状类型：用户第一条消息已告知，不要再问
- 持续时间：一旦用户回答过，不要再问
- 严重程度：一旦用户回答过，不要再问
- 伴随症状：一旦用户回答过，不要再问
- 年龄/基础疾病：一旦用户回答过，不要再问

【快捷回答生成规则】
你的每条追问消息末尾，必须附加以下格式的 JSON：
{"suggestions": ["选项1", "选项2", "选项3", "选项4"]}

suggestions 必须根据你刚问的问题量身定制：
- 问持续时间 → ["刚刚开始", "1天以内", "2-3天", "超过一周"]
- 问严重程度 → ["轻微，还能正常活动", "中等，有些难受", "比较严重", "非常严重"]
- 问伴随症状（发烧）→ ["只有发烧", "发烧+咳嗽", "发烧+头痛", "发烧+全身酸痛"]
- 问伴随症状（头痛）→ ["只有头痛", "头痛+恶心", "头痛+发烧", "头痛+眩晕"]
- 问是否有基础疾病 → ["没有基础疾病", "有高血压", "有糖尿病", "有心脏病"]
- 问年龄段 → ["18岁以下", "18-40岁", "40-60岁", "60岁以上"]
- 问是否好转 → ["明显好转", "略有好转", "没有变化", "更严重了"]

【输出格式】
追问阶段（未得出结论时），回复格式：
一句话表示理解用户上一条回答（不超过15字）+ 换行 +
一个追问问题（不超过30字）+ 换行 +
{"suggestions": [...]}

结论阶段（信息足够时），回复格式：
1-2句话总结判断依据 + 换行 +
\`\`\`json
{
  "level": "green|yellow|orange|red",
  "reason": "判断依据，1-2句话",
  "action": "具体行动建议",
  "departments": ["推荐科室"],
  "disclaimer": "本建议仅供参考，不构成医疗诊断"
}
\`\`\`

【分级标准】
green：轻微症状，无危险信号，可居家观察
yellow：症状持续或中等，建议48小时内就医
orange：症状较重或有高危因素，建议今日就医
red：紧急情况，立即急诊或拨打120

【危险信号→直接 red】
胸痛、严重呼吸困难、意识改变、突发剧烈头痛、
偏瘫/言语不清、大量出血、严重过敏反应

【重要限制】
不诊断具体疾病。不推荐具体药物或剂量。红色等级语气必须明确紧迫。`;

function extractDiagnosis(content: string): DiagnosisResult | null {
  const match = content.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed.level && parsed.reason && parsed.action && parsed.departments) {
      return parsed as DiagnosisResult;
    }
    return null;
  } catch {
    return null;
  }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isSearchingKB, setIsSearchingKB] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    const initWeather = async () => {
      try {
        const loc = await requestGeolocation();
        setLocationData(loc);
        const weather = await fetchWeather(loc.lat, loc.lon);
        if (weather) setWeatherData(weather);
      } catch (e) {
        console.warn('[WeatherBar] 定位失败，尝试使用默认位置:', e);
        // 定位失败时使用 IP 大致位置或默认北京坐标
        try {
          const weather = await fetchWeather(39.92, 116.41);
          if (weather) setWeatherData(weather);
        } catch {
          // 天气获取也失败，静默不显示
        }
      }
    };
    initWeather();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isLoading || !text.trim()) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent('');
      setIsSearchingKB(true);
      setTimeout(() => setIsSearchingKB(false), 800);

      const kbResults = searchSymptomKB(text.trim());
      const additionalSkills = loadSkills(text.trim());
      let systemContent = SYSTEM_PROMPT;
      if (additionalSkills) {
        systemContent += '\n\n' + additionalSkills;
      }
      if (kbResults.length > 0) {
        systemContent += `\n\n【参考医学知识】\n${JSON.stringify(kbResults, null, 2)}`;
      }

      const history = [
        { role: 'system' as const, content: systemContent },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: text.trim() },
      ];

      let fullContent = '';

      try {
        await chatStream(
          history,
          (chunk) => {
            fullContent += chunk;
            setStreamingContent(fullContent);
          },
          () => {
            // Parse suggestions
            let suggestions: string[] | undefined;
            const suggestionsMatch = fullContent.match(
              /\{"suggestions":\s*(\[[\s\S]*?\])\}/
            );
            if (suggestionsMatch) {
              try {
                suggestions = JSON.parse(suggestionsMatch[1]);
              } catch { /* ignore parse errors */ }
            }

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: fullContent,
              timestamp: new Date(),
              suggestions,
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingContent('');
            setIsLoading(false);

            const result = extractDiagnosis(fullContent);
            if (result) {
              setDiagnosisResult(result);
            }
          }
        );
      } catch (err) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '抱歉，连接出现问题，请稍后重试。',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setStreamingContent('');
        setIsLoading(false);
        console.error('Chat error:', err);
      }
    },
    [messages, isLoading]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setStreamingContent('');
    setDiagnosisResult(null);
  }, []);

  return { messages, isLoading, streamingContent, diagnosisResult, isSearchingKB, weatherData, locationData, sendMessage, resetChat };
}
