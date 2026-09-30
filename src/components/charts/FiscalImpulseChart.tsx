import React, { useState } from 'react';
import { FiscalAccountYear, MacroIndicators } from '../../types/fiscal';
import { SovereignCountryProfile } from '../../data/realSovereignData';

interface FiscalImpulseChartProps {
  country: SovereignCountryProfile;
  fiscalData: FiscalAccountYear[];
  macroData: MacroIndicators[];
}

export const FiscalImpulseChart: React.FC<FiscalImpulseChartProps> = ({
  country,
  fiscalData,
  macroData,
}) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Compute Cyclically Adjusted Primary Balance (CAPB) and Fiscal Impulse
  // Potential GDP growth assumption (structural growth rate): approx 2.0% for USA/GBR/DEU/JPN, 3.5% for KSA, 4.0% for EGY
  const potentialGrowth = country.id === 'KSA' ? 3.5 : country.id === 'EGY' ? 4.2 : country.id === 'JPN' ? 0.9 : 2.0;

  // Revenue elasticity to output gap: approx 1.0; Expenditure elasticity approx 0.1
  const budgetSensitivity = 0.45; // semi-elasticity of budget balance to output gap

  const series = fiscalData.map((f, idx) => {
    const m = macroData.find((macro) => macro.year === f.year) || macroData[idx] || macroData[0];
    
    // Output gap estimate (actual real growth relative to potential)
    const growthGap = m.realGdpGrowth - potentialGrowth;
    // Cumulative output gap approximation (%)
    const outputGap = Number((growthGap * 0.8).toFixed(1));

    // Cyclical component of the budget balance = sensitivity * outputGap
    const cyclicalComponent = Number((budgetSensitivity * outputGap).toFixed(2));

    // Structural / Cyclically Adjusted Primary Balance (CAPB):
    // CAPB = Primary Balance - Cyclical Component
    const headlinePb = f.primaryBalancePercentGdp;
    const capb = Number((headlinePb - cyclicalComponent).toFixed(2));

    // Fiscal Impulse = - (CAPB_t - CAPB_{t-1})
    // Positive impulse = Fiscal expansion / stimulus; Negative impulse = Fiscal contraction / consolidation
    const prevF = idx > 0 ? fiscalData[idx - 1] : f;
    const prevM = idx > 0 ? macroData[idx - 1] : m;
    const prevOutputGap = idx > 0 ? (prevM.realGdpGrowth - potentialGrowth) * 0.8 : 0;
    const prevCapb = idx > 0 ? prevF.primaryBalancePercentGdp - (budgetSensitivity * prevOutputGap) : capb;
    const fiscalImpulse = Number((- (capb - prevCapb)).toFixed(2));

    const stance =
      fiscalImpulse > 0.5 ? 'expansionary' : fiscalImpulse < -0.5 ? 'contractionary' : 'neutral';

    return {
      year: f.year,
      headlinePb,
      capb,
      cyclicalComponent,
      outputGap,
      fiscalImpulse,
      stance,
      overallBalanceGdp: f.overallBalancePercentGdp,
    };
  });

  // SVG Chart Dimensions
  const width = 760;
  const height = 280;
  const padding = { top: 30, right: 35, bottom: 45, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minYear = Math.min(...series.map((s) => s.year));
  const maxYear = Math.max(...series.map((s) => s.year));

  const allVals = series.flatMap((s) => [s.headlinePb, s.capb, s.fiscalImpulse]);
  const minVal = Math.min(-8, Math.floor(Math.min(...allVals) - 1));
  const maxVal = Math.max(6, Math.ceil(Math.max(...allVals) + 1));

  const getX = (year: number) => {
    return padding.left + ((year - minYear) / (maxYear - minYear)) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
  };

  const zeroY = getY(0);

  const headlinePoints = series.map((s) => `${getX(s.year)},${getY(s.headlinePb)}`).join(' L ');
  const capbPoints = series.map((s) => `${getX(s.year)},${getY(s.capb)}`).join(' L ');

  // Y axis ticks
  const yTicks: number[] = [];
  const step = Math.ceil((maxVal - minVal) / 5);
  for (let v = minVal; v <= maxVal; v += step) {
    yTicks.push(v);
  }

  const activeHovered = hoveredYear ? series.find((s) => s.year === hoveredYear) : series[series.length - 1];

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
            <h3 className="text-sm font-bold text-slate-900">
              الرصيد المالي الهيكلي والدافع المالي (Cyclically Adjusted Primary Balance & Fiscal Stance)
            </h3>
            <span className="text-[11px] font-mono text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded font-bold">
              معايير صندوق النقد والبنك الدولي (Structural Fiscal Policy)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            استبعاد أثر الدورة الاقتصادية والتقلبات الظرفية لعزل الموقف الحقيقي للسياسة المالية: تحديد ما إذا كانت السياسة توسعية تحفيزية أم انكماشية تقشفية.
          </p>
        </div>

        {/* Stance Indicator for Latest Year */}
        {activeHovered && (
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <span className="text-slate-500 font-sans">الموقف المالي ({activeHovered.year}):</span>
            <span
              className={`font-bold font-sans ${
                activeHovered.stance === 'expansionary'
                  ? 'text-amber-700'
                  : activeHovered.stance === 'contractionary'
                  ? 'text-emerald-700'
                  : 'text-slate-700'
              }`}
            >
              {activeHovered.stance === 'expansionary'
                ? 'توسعي تحفيزي (Expansionary)'
                : activeHovered.stance === 'contractionary'
                ? 'انضباطي تثبيتي (Consolidation)'
                : 'محايد (Neutral Stance)'}
            </span>
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-xs font-mono select-none">
          {/* Zero Line and Grid */}
          {yTicks.map((yVal) => (
            <g key={yVal}>
              <line
                x1={padding.left}
                y1={getY(yVal)}
                x2={width - padding.right}
                y2={getY(yVal)}
                stroke={yVal === 0 ? '#475569' : '#f1f5f9'}
                strokeWidth={yVal === 0 ? 1.5 : 1}
                strokeDasharray={yVal === 0 ? 'none' : '3,3'}
              />
              <text
                x={padding.left - 8}
                y={getY(yVal) + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {yVal > 0 ? `+${yVal}%` : `${yVal}%`}
              </text>
            </g>
          ))}

          {/* Fiscal Impulse Bars (underneath lines) */}
          {series.map((s) => {
            const x = getX(s.year);
            const barWidth = 20;
            const barHeight = Math.abs(getY(s.fiscalImpulse) - zeroY);
            const barY = s.fiscalImpulse > 0 ? getY(s.fiscalImpulse) : zeroY;
            const isHovered = hoveredYear === s.year;

            return (
              <g
                key={s.year}
                onMouseEnter={() => setHoveredYear(s.year)}
                onMouseLeave={() => setHoveredYear(null)}
                className="cursor-pointer"
              >
                <rect
                  x={x - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={Math.max(2, barHeight)}
                  fill={s.fiscalImpulse > 0 ? '#fbbf24' : '#34d399'}
                  opacity={isHovered ? 0.9 : 0.6}
                  rx={2}
                />
              </g>
            );
          })}

          {/* Line 1: Headline Primary Balance (Dashed Slate) */}
          <path
            d={`M ${headlinePoints}`}
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
            strokeDasharray="4,3"
          />

          {/* Line 2: Structural / CAPB (Solid Blue) */}
          <path
            d={`M ${capbPoints}`}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
          />

          {/* Data Points */}
          {series.map((s) => {
            const x = getX(s.year);
            const yCapb = getY(s.capb);
            const isHovered = hoveredYear === s.year;

            return (
              <g
                key={s.year}
                onMouseEnter={() => setHoveredYear(s.year)}
                onMouseLeave={() => setHoveredYear(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={x}
                  cy={yCapb}
                  r={isHovered ? 6 : 4}
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${
                    isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {s.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Details */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#0284c7]"></span>
            <span className="text-slate-800 font-bold">الرصيد الأولي الهيكلي المعدل دورياً (CAPB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-[#64748b]"></span>
            <span className="text-slate-600">الرصيد الأولي الفعلي للميزانية</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#fbbf24] rounded-xs opacity-75"></span>
            <span className="text-slate-600">دافع مالي توسعي (Stimulus)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#34d399] rounded-xs opacity-75"></span>
            <span className="text-slate-600">دافع مالي انضباطي (Consolidation)</span>
          </div>
        </div>

        {activeHovered && (
          <div className="flex items-center gap-3 font-mono text-xs bg-slate-50 px-3 py-1 rounded border border-slate-200">
            <span>سنة {activeHovered.year}:</span>
            <span className="text-cyan-800 font-bold">CAPB: {activeHovered.capb}%</span>
            <span>الدافع المالي: {activeHovered.fiscalImpulse > 0 ? `+${activeHovered.fiscalImpulse}%` : `${activeHovered.fiscalImpulse}%`}</span>
            <span className="text-slate-500">فجوة الناتج: {activeHovered.outputGap}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
