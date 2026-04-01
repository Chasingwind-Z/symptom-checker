import type { RiskLevel } from '../types';

interface RiskGaugeProps {
  level: RiskLevel;
}

// Gauge is a semicircle. We use a 200×110 viewBox.
// Arc goes from 180° (left) to 0° (right) along a circle of r=80, center (100, 100).
// We split the arc into 4 equal segments of 45° each.

const CX = 100;
const CY = 100;
const R = 78;
const STROKE = 14;

// Convert polar angle (degrees, 0=right, CCW) to SVG coords
function polar(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(rad),
    y: CY - R * Math.sin(rad),
  };
}

// Build an SVG arc path from startAngle to endAngle (degrees, CCW from right)
function arcPath(startDeg: number, endDeg: number) {
  const start = polar(startDeg);
  const end = polar(endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  // We go clockwise (sweep=0 because Y axis is flipped in SVG)
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

// 4 segments: 180°→135° (green), 135°→90° (yellow), 90°→45° (orange), 45°→0° (red)
const SEGMENTS = [
  { color: '#10b981', from: 180, to: 135 }, // green
  { color: '#f59e0b', from: 135, to: 90 },  // yellow
  { color: '#f97316', from: 90, to: 45 },   // orange
  { color: '#ef4444', from: 45, to: 0 },    // red
];

// Needle angle (midpoint of each segment)
const NEEDLE_ANGLES: Record<RiskLevel, number> = {
  green: 157.5,
  yellow: 112.5,
  orange: 67.5,
  red: 22.5,
};

const LABELS: Record<RiskLevel, string> = {
  green: '低风险',
  yellow: '中风险',
  orange: '较高风险',
  red: '紧急',
};

const LABEL_COLORS: Record<RiskLevel, string> = {
  green: '#059669',
  yellow: '#d97706',
  orange: '#ea580c',
  red: '#dc2626',
};

export function RiskGauge({ level }: RiskGaugeProps) {
  const needleAngle = NEEDLE_ANGLES[level];
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleTip = {
    x: CX + (R - 10) * Math.cos(needleRad),
    y: CY - (R - 10) * Math.sin(needleRad),
  };
  // Needle base: two points slightly offset perpendicular
  const baseRad = needleRad + Math.PI / 2;
  const baseW = 4;
  const base1 = { x: CX + baseW * Math.cos(baseRad), y: CY - baseW * Math.sin(baseRad) };
  const base2 = { x: CX - baseW * Math.cos(baseRad), y: CY + baseW * Math.sin(baseRad) };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" width="180" height="99" className="overflow-visible">
        {/* Background arc (grey track) */}
        <path
          d={arcPath(180, 0)}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={STROKE}
          strokeLinecap="butt"
        />

        {/* Colored segments */}
        {SEGMENTS.map((seg) => (
          <path
            key={seg.color}
            d={arcPath(seg.from, seg.to)}
            fill="none"
            stroke={seg.color}
            strokeWidth={STROKE}
            strokeLinecap="butt"
            opacity="0.85"
          />
        ))}

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`}
          fill={LABEL_COLORS[level]}
          opacity="0.9"
        />

        {/* Center pivot */}
        <circle cx={CX} cy={CY} r={6} fill={LABEL_COLORS[level]} />
        <circle cx={CX} cy={CY} r={3} fill="white" />

        {/* Level label */}
        <text
          x={CX}
          y={CY - 28}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill={LABEL_COLORS[level]}
        >
          {LABELS[level]}
        </text>

        {/* Scale labels */}
        <text x="14" y="106" fontSize="8" fill="#94a3b8" textAnchor="middle">低</text>
        <text x="100" y="22" fontSize="8" fill="#94a3b8" textAnchor="middle">中</text>
        <text x="186" y="106" fontSize="8" fill="#94a3b8" textAnchor="middle">高</text>
      </svg>
    </div>
  );
}
