import { useState, useCallback } from 'react';
import { chatStream } from '../lib/aiClient';
import { searchSymptomKB } from '../lib/symptomKB';
import { loadSkills } from '../lib/skillLoader';
import type { Message, DiagnosisResult } from '../types';

const OUTPUT_FORMAT = `
【输出格式】
判断完成时，先用1-2句话解释判断依据，然后在回复末尾附上以下 JSON 块，格式严格如下：
\`\`\`json
{
  "level": "green或yellow或orange或red",
  "reason": "判断依据，1-2句话",
  "action": "具体行动建议，1句话",
  "departments": ["推荐科室1", "推荐科室2"],
  "disclaimer": "本建议基于您提供的信息，仅供参考，不构成医疗诊断。请根据实际情况就医。"
}
\`\`\`

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
      const skillPrompt = loadSkills(text.trim()) + OUTPUT_FORMAT;
      const systemContent = kbResults.length > 0
        ? `${skillPrompt}\n\n【参考医学知识】\n${JSON.stringify(kbResults, null, 2)}`
        : skillPrompt;

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
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: fullContent,
              timestamp: new Date(),
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

  return { messages, isLoading, streamingContent, diagnosisResult, isSearchingKB, sendMessage, resetChat };
}
