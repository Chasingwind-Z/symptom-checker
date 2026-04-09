import { useState } from 'react';
import {
  Bell,
  BellOff,
  Settings2,
} from 'lucide-react';
import { parseHealthCSV } from '../lib/dataImport';
import { saveMetric } from '../lib/healthMetrics';

interface HealthSettingsPanelProps {
  currentCity?: string | null;
  conversationCount: number;
  pendingFollowUpCount: number;
  sessionEmail?: string | null;
}

export function HealthSettingsPanel(
  _props: HealthSettingsPanelProps,
) {

  const [alertSubscribed, setAlertSubscribed] = useState(() => {
    return localStorage.getItem('epidemic_alert_subscribed') === 'true';
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('push_notifications_enabled') === 'true';
  });

  const [importResult, setImportResult] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            <Settings2 size={14} />
            偏好设置
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-900">个人偏好</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            管理通知、预警订阅和健康数据导入，所有设置只保存在当前浏览器，不会改动健康档案或既有会话内容。
          </p>
        </div>

        <div className="mt-4 grid gap-4">
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`rounded-xl p-2 ${notificationsEnabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">通知权限</p>
                    <p className="text-xs text-slate-500 mt-0.5">开启后可收到随访提醒和预警推送</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = !notificationsEnabled;
                    setNotificationsEnabled(next);
                    localStorage.setItem('push_notifications_enabled', String(next));
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    notificationsEnabled ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">疾病预警订阅</p>
                  <p className="text-xs text-slate-500 mt-0.5">本地区疾病趋势异常时提醒</p>
                </div>
                <button
                  onClick={() => {
                    const next = !alertSubscribed;
                    setAlertSubscribed(next);
                    localStorage.setItem('epidemic_alert_subscribed', String(next));
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    alertSubscribed ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    alertSubscribed ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-sm font-medium text-slate-800 mb-1">导入健康数据</p>
              <p className="text-xs text-slate-500 mb-2">支持华为健康/Apple Health导出的CSV文件</p>
              <label className="block">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      const metrics = parseHealthCSV(text);
                      if (metrics.length > 0) {
                        for (const m of metrics) {
                          saveMetric({
                            type: m.type,
                            valuePrimary: m.valuePrimary,
                            valueSecondary: m.valueSecondary,
                            recordedAt: m.recordedAt,
                          });
                        }
                        setImportResult(`成功导入 ${metrics.length} 条记录`);
                      } else {
                        setImportResult('未识别到有效数据，请检查CSV格式');
                      }
                    } catch {
                      setImportResult('文件读取失败，请重试');
                    }
                  }}
                />
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 cursor-pointer hover:bg-slate-50">
                  📁 选择CSV文件
                </span>
              </label>
              {importResult && (
                <p className="mt-2 text-xs text-emerald-600">{importResult}</p>
              )}
            </div>
        </div>
      </section>
    </div>
  );
}
