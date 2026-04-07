import { useRef, useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import type { DiagnosisResult, Message } from '../types'

interface Props {
  result: DiagnosisResult
  messages: Message[]
}

const LEVEL_LABEL: Record<string, string> = {
  green: '低风险 · 可居家观察',
  yellow: '中风险 · 建议尽快就诊',
  orange: '较高风险 · 建议今日就医',
  red: '紧急 · 立即前往急诊',
}

const LEVEL_COLOR: Record<string, string> = {
  green: '#10B981',
  yellow: '#F59E0B',
  orange: '#F97316',
  red: '#EF4444',
}

const LEVEL_BG: Record<string, string> = {
  green: 'linear-gradient(135deg, #059669 0%, #10B981 60%, #34D399 100%)',
  yellow: 'linear-gradient(135deg, #D97706 0%, #F59E0B 60%, #FCD34D 100%)',
  orange: 'linear-gradient(135deg, #EA580C 0%, #F97316 60%, #FB923C 100%)',
  red: 'linear-gradient(135deg, #DC2626 0%, #EF4444 60%, #F87171 100%)',
}

const LEVEL_ICON: Record<string, string> = {
  green: '✅',
  yellow: '⏰',
  orange: '⚠️',
  red: '🚨',
}

export function ReportExport({ result, messages }: Props) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const generatePDF = async () => {
    if (!reportRef.current) return
    setLoading(true)
    setErrorMessage(null)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F8FAFC',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW
      const imgH = (canvas.height * imgW) / canvas.width
      if (imgH <= pageH) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH)
      } else {
        let offsetY = 0
        while (offsetY < imgH) {
          if (offsetY > 0) pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, -offsetY, imgW, imgH)
          offsetY += pageH
        }
      }
      const now = new Date()
      pdf.save(`问诊报告_${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}.pdf`)
    } catch {
      setErrorMessage(
        typeof navigator !== 'undefined' && navigator.onLine === false
          ? '当前网络不可用，导出组件尚未完成加载，请恢复连接后再试。'
          : '导出报告失败，请稍后重试。'
      )
    } finally {
      setLoading(false)
    }
  }

  const color = LEVEL_COLOR[result.level]
  const now = new Date()
  const userMessages = messages.filter((m) => m.role === 'user').slice(0, 5)

  return (
    <>
      {/* 隐藏报告模板 */}
      <div
        ref={reportRef}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '794px',
          background: '#F8FAFC',
          fontFamily: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {/* ── Header ── */}
        <div style={{ background: LEVEL_BG[result.level], padding: '36px 40px 28px', position: 'relative', overflow: 'hidden' }}>
          {/* 装饰圆 */}
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: '-50px', right: '80px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🏥
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>健康助手</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '1px' }}>AI 智能问诊报告</div>
            </div>
          </div>

          {/* 风险等级大卡 */}
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '14px', padding: '16px 20px', display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>{LEVEL_ICON[result.level]}</span>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginBottom: '2px' }}>综合风险评估</div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>{LEVEL_LABEL[result.level]}</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>
            报告生成时间：{now.toLocaleString('zh-CN')}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '28px 40px' }}>
          {/* 免责声明 */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 16px', fontSize: '12px', color: '#92400E', marginBottom: '28px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
            <span>本报告由 AI 辅助生成，仅供参考，不构成医疗诊断。实际情况请以医生面诊为准。</span>
          </div>

          {/* 两列信息卡 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <InfoCard title="判断依据" icon="🔍" color={color} content={result.reason} />
            <InfoCard title="就医建议" icon="💊" color={color} content={result.action} />
          </div>

          {/* 推荐科室 */}
          <SectionBlock title="推荐就诊科室" icon="🏷️" color={color}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {result.departments.map((d) => (
                <span
                  key={d}
                  style={{
                    background: color + '12',
                    border: `1px solid ${color}30`,
                    borderRadius: '999px',
                    padding: '5px 14px',
                    fontSize: '13px',
                    color,
                    fontWeight: 600,
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </SectionBlock>

          {/* 问诊摘要 */}
          <SectionBlock title="问诊对话摘要" icon="💬" color={color}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {userMessages.map((msg, i) => (
                <div
                  key={msg.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: color,
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    {i + 1}
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{msg.content}</p>
                </div>
              ))}
            </div>
          </SectionBlock>

          {/* Footer */}
          <div
            style={{
              marginTop: '24px',
              borderTop: '1px solid #E2E8F0',
              paddingTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>健康助手 · AI 症状自查分级就诊系统</span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>{result.disclaimer.slice(0, 30)}…</span>
          </div>
        </div>
      </div>

      {/* 导出按钮 */}
      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={generatePDF}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl px-6 py-3.5 w-full flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {loading ? '生成中...' : '📋 生成就诊报告 · 带去医院给医生看'}
        </button>
        {errorMessage && <p className="max-w-xs text-center text-xs text-amber-600">{errorMessage}</p>}
      </div>
    </>
  )
}

function InfoCard({ title, icon, color, content }: { title: string; icon: string; color: string; content: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.8 }}>{content}</p>
    </div>
  )
}

function SectionBlock({ title, icon, children }: { title: string; icon: string; color?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '15px' }}>{icon}</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{title}</span>
        <div style={{ flex: 1, height: '1px', background: '#E2E8F0', marginLeft: '4px' }} />
      </div>
      {children}
    </div>
  )
}
