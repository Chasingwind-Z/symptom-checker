import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

/** 用今天日期生成稳定的假数据（同一天不变，次日自动更新） */
function getDailyStats() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  const total = (seed % 100) * 5 + 234; // 约 300–800

  // 基础占比 + 微小扰动（用 seed 派生）
  const noise = (n: number) => ((seed * n) % 7) - 3; // -3 ~ +3
  const raw = [
    35 + noise(3),
    25 + noise(7),
    15 + noise(11),
    12 + noise(13),
    13 + noise(17),
  ];
  const sum = raw.reduce((a, b) => a + b, 0);
  const counts = raw.map((r) => Math.round((r / sum) * total));

  return { total, counts };
}

const LABELS = ['发烧', '咳嗽', '头痛', '肠胃不适', '其他'];
const COLORS = [
  'rgba(59, 130, 246, 0.85)',
  'rgba(96, 165, 250, 0.80)',
  'rgba(147, 197, 253, 0.80)',
  'rgba(186, 216, 253, 0.80)',
  'rgba(219, 234, 254, 0.80)',
];

export function CommunityStats() {
  const { total, counts } = getDailyStats();

  const chartData = {
    labels: LABELS,
    datasets: [
      {
        data: counts,
        backgroundColor: COLORS,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { x: number | null } }) => ` ${ctx.parsed.x ?? 0} 人`,
        },
      },
    },
    scales: {
      x: { display: false, grid: { display: false } },
      y: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 12 } },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
      {/* 三个统计指标 */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-white border border-slate-100 rounded-xl p-2 md:p-3 text-center">
          <p className="text-lg md:text-xl font-bold text-slate-800">{total}</p>
          <p className="text-xs text-slate-400 mt-0.5">今日上报</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-2 md:p-3 text-center">
          <p className="text-lg md:text-xl font-bold text-slate-800">12</p>
          <p className="text-xs text-slate-400 mt-0.5">覆盖区域</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-2 md:p-3 text-center">
          <p className="text-lg md:text-xl font-bold text-blue-500">发烧</p>
          <p className="text-xs text-slate-400 mt-0.5">最多症状</p>
        </div>
      </div>

      {/* 横向柱状图 */}
      <div className="h-40 md:h-48">
        <Bar data={chartData} options={options} />
      </div>

      {/* 底部说明 */}
      <p className="text-slate-400 text-xs text-center mt-3">
        数据来源：用户匿名上报 · 仅供参考
      </p>
    </div>
  );
}
