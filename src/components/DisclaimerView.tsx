import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface DisclaimerViewProps {
  onBack: () => void;
}

export function DisclaimerView({ onBack }: DisclaimerViewProps) {
  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-blue-600 mb-6">
          <ArrowLeft size={14} /> 返回
        </button>

        <div className="flex items-center gap-3 mb-6">
          <ShieldAlert size={24} className="text-amber-500" />
          <h1 className="text-xl font-bold text-slate-800">使用须知与免责声明</h1>
        </div>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <Section title="产品定位">
            <p>健康助手是一个<strong>辅助决策工具</strong>，帮助照料者（父母、子女、家属）在家人出现健康问题时做出初步判断：严不严重、需不需要去医院、去哪个科室。</p>
            <p className="mt-2"><strong>本产品不是医疗诊断工具</strong>，不能替代医生面诊、检查和处方。</p>
          </Section>

          <Section title="紧急情况">
            <p>出现以下情况时，<strong>请立即拨打 120 或前往最近急诊</strong>，不要等待 AI 回答：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>胸痛、严重呼吸困难</li>
              <li>意识丧失、抽搐</li>
              <li>突发偏瘫、言语不清（中风信号）</li>
              <li>大量出血</li>
              <li>严重过敏反应（喉头水肿、呼吸困难）</li>
              <li>3个月以下婴儿任何发热</li>
            </ul>
          </Section>

          <Section title="知识库说明">
            <p>AI 回答基于三层知识库：自策展决策卡片（中文）、MedlinePlus NLM 公共域内容（英文）、CDC 公共域内容（英文）。</p>
            <p className="mt-2">自策展层当前全部处于<strong>「待医学审核」</strong>状态，表示内容由开发者基于公共方法论编写，尚未经过执业医师逐条审核。AI 回答和引用卡片均会标注此状态。</p>
            <p className="mt-2">知识库<strong>不覆盖</strong>：肿瘤治疗、罕见病、精神科诊断、妊娠用药、急救操作流程。遇到这些问题时，AI 会明确告知知识库未覆盖。</p>
          </Section>

          <Section title="数据隐私">
            <p>未登录时，所有数据保存在本设备浏览器中，不会上传到服务器。</p>
            <p className="mt-2">登录后，健康档案和问诊记录同步到 Supabase 云端，仅本人可访问。</p>
            <p className="mt-2">匿名上报功能（用于公共卫生趋势）不包含任何个人身份信息。</p>
          </Section>

          <Section title="已知局限">
            <ul className="list-disc pl-5 space-y-1">
              <li>AI 基于文字描述做判断，无法替代体格检查和实验室检查</li>
              <li>图片辅助分析能力有限，不能仅凭图片下结论</li>
              <li>知识库可能未涵盖最新医学进展</li>
              <li>不同地区的医疗资源和就医流程可能不同</li>
            </ul>
          </Section>

          <Section title="反馈与纠错">
            <p>如果您发现 AI 回答存在医学错误，请通过以下方式反馈：</p>
            <p className="mt-2">
              <a href="https://github.com/Chasingwind-Z/symptom-checker/issues/new?template=medical-error.md" 
                 target="_blank" rel="noopener noreferrer"
                 className="text-blue-600 hover:underline">
                提交医学错误报告 →
              </a>
            </p>
          </Section>
        </div>

        <p className="text-xs text-slate-400 mt-2">人体图：医学插图风格原创设计</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-2">{title}</h2>
      {children}
    </div>
  );
}
