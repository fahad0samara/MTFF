import React, { useState } from 'react';
import { FiscalAccountYear, MacroIndicators } from '../../types/fiscal';
import { SovereignCountryProfile } from '../../data/realSovereignData';

interface DebtDynamicsDecompositionChartProps {
  country: SovereignCountryProfile;
  fiscalData: FiscalAccountYear[];
  macroData: MacroIndicators[];
}

interface DecompositionYear {
  year: number;
  initialDebt: number;
  finalDebt: number;
  netChange: number;
  growthContribution: number; // - (g / (1 + g)) * d_{t-1}
  interestContribution: number; // + (r / (1 + g)) * d_{t-1}
  primaryBalanceContribution: number; // - pb_t (surplus reduces debt, deficit increases debt)
  exchangeRateContribution: number; // valuation effect on foreign debt
  residualContribution: number; // stock-flow adjustment
}

export const DebtDynamicsDecompositionChart: React.FC<DebtDynamicsDecompositionChartProps> = ({
  country,
  fiscalData,
  macroData,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<'annual' | 'cumulative'>('annual');
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Compute IMF debt dynamics decomposition for each year t relative to t-1
  const decomposition: DecompositionYear[] = [];

  for (let i = 1; i < fiscalData.length; i++) {
    const prevF = fiscalData[i - 1];
    const currF = fiscalData[i];
    const currM = macroData.find((m) => m.year === currF.year) || macroData[i] || macroData[0];

    const d_prev = prevF.debtToGdp;
    const d_curr = currF.debtToGdp;
    const netChange = Number((d_curr - d_prev).toFixed(2));

    const g = currM.realGdpGrowth / 100;
    const pi = currM.inflationRate / 100;
    const nominalG = (1 + g) * (1 + pi) - 1;

    // Real interest rate: effective borrowing rate minus inflation
    const r = (currM.interestRateEffective - currM.inflationRate) / 100;

    // Growth contribution to debt ratio change (negative if growing): - (g / (1 + g)) * d_prev
    const growthContrib = Number((- (g / (1 + g)) * d_prev).toFixed(2));

    // Interest rate contribution (positive): + (r / (1 + g)) * d_prev
    const interestContrib = Number(((r / (1 + g)) * d_prev).toFixed(2));

    // Primary deficit contribution: primary deficit adds to debt, surplus subtracts
    // primaryBalancePercentGdp: positive = surplus, negative = deficit
    const pbContrib = Number((- currF.primaryBalancePercentGdp).toFixed(2));

    // Foreign currency exchange rate valuation effect on external debt share
    const extShare = currF.nominalDebt > 0 ? currF.debtExternal / currF.nominalDebt : 0.25;
    const fxDeprec = currM.exchangeRate && macroData[i - 1]?.exchangeRate
      ? (currM.exchangeRate - macroData[i - 1].exchangeRate) / macroData[i - 1].exchangeRate
      : 0;
    const fxContrib = Number((extShare * fxDeprec * d_prev).toFixed(2));

    // Residual / Stock-flow adjustment (debt assumption, privatization, cash buffer changes)
    const residual = Number((netChange - (growthContrib + interestContrib + pbContrib + fxContrib)).toFixed(2));

    decomposition.push({
      year: currF.year,
      initialDebt: d_prev,
      finalDebt: d_curr,
      netChange,
      growthContribution: growthContrib,
      interestContribution: interestContrib,
      primaryBalanceContribution: pbContrib,
      exchangeRateContribution: fxContrib,
      residualContribution: residual,
    });
  }

  // Cumulative horizon sum (from 2023 to 2030)
  const cumulativeGrowth = Number(decomposition.reduce((acc, d) => acc + d.growthContribution, 0).toFixed(1));
  const cumulativeInterest = Number(decomposition.reduce((acc, d) => acc + d.interestContribution, 0).toFixed(1));
  const cumulativePb = Number(decomposition.reduce((acc, d) => acc + d.primaryBalanceContribution, 0).toFixed(1));
  const cumulativeFx = Number(decomposition.reduce((acc, d) => acc + d.exchangeRateContribution, 0).toFixed(1));
  const cumulativeResidual = Number(decomposition.reduce((acc, d) => acc + d.residualContribution, 0).toFixed(1));
  const cumulativeNetChange = Number(decomposition.reduce((acc, d) => acc + d.netChange, 0).toFixed(1));

  // SVG dimensions for chart
  const width = 800;
  const height = 320;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max for scale
  const allContribs = decomposition.flatMap((d) => [
    d.growthContribution,
    d.interestContribution,
    d.primaryBalanceContribution,
    d.netChange,
  ]);
  const minVal = Math.min(-10, Math.floor(Math.min(...allContribs) - 2));
  const maxVal = Math.max(10, Math.ceil(Math.max(...allContribs) + 2));

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
  };

  const zeroY = getY(0);

  const slotWidth = chartWidth / decomposition.length;
  const barWidth = Math.min(22, slotWidth * 0.2);

  // Y axis ticks
  const yTicks: number[] = [];
  const step = Math.ceil((maxVal - minVal) / 6);
  for (let v = minVal; v <= maxVal; v += step) {
    yTicks.push(v);
  }

  const activeHoveredData = hoveredYear
    ? decomposition.find((d) => d.year === hoveredYear)
    : decomposition[decomposition.length - 1];

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
      {/* Header and Toggle */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <h3 className="text-sm font-bold text-slate-900">
              تفكيك ديناميكية الدين العام (IMF Debt Dynamics Decomposition)
            </h3>
            <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-bold">
              معادلة صندوق النقد الدولي الرسمية
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            تحليل العوامل الدافعة لتغير نسبة الدين إلى الناتج المحلي الإجمالي سنوياً وتراكمياً: مساهمة النمو الاقتصادي، أثر سعر الفائدة الحقيقي (كرة الثلج)، العجز/الفائض الأولي، وتقلبات الصرف.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
          <button
            onClick={() => setSelectedHorizon('annual')}
            className={`px-3 py-1 font-semibold rounded cursor-pointer transition-colors ${
              selectedHorizon === 'annual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            التفكيك السنوي (Annual Drivers)
          </button>
          <button
            onClick={() => setSelectedHorizon('cumulative')}
            className={`px-3 py-1 font-semibold rounded cursor-pointer transition-colors ${
              selectedHorizon === 'cumulative'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الأثر التراكمي (2023 - 2030)
          </button>
        </div>
      </div>

      {/* Cumulative Overview KPI Tiles if cumulative mode */}
      {selectedHorizon === 'cumulative' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-md border border-slate-200">
          <div className="p-3 bg-white border border-slate-200 rounded">
            <span className="text-[11px] text-slate-500 block mb-1">صافي التغير الإجمالي</span>
            <span className={`text-xl font-bold font-mono tabular-nums ${cumulativeNetChange <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {cumulativeNetChange > 0 ? `+${cumulativeNetChange}%` : `${cumulativeNetChange}%`}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">من الناتج خلال الفترة</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded">
            <span className="text-[11px] text-slate-500 block mb-1">مساهمة النمو الحقيقي (g)</span>
            <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
              {cumulativeGrowth}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">تخفيف تلقائي للمديونية</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded">
            <span className="text-[11px] text-slate-500 block mb-1">مساهمة الفائدة الحقيقية (r)</span>
            <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">
              +{cumulativeInterest}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">عبء تراكم الفوائد</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded">
            <span className="text-[11px] text-slate-500 block mb-1">أثر الرصيد الأولي (pb)</span>
            <span className={`text-xl font-bold font-mono tabular-nums ${cumulativePb <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {cumulativePb > 0 ? `+${cumulativePb}%` : `${cumulativePb}%`}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              {cumulativePb <= 0 ? 'فائض مخفض للدين' : 'عجز ممول بالاستدانة'}
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded">
            <span className="text-[11px] text-slate-500 block mb-1">الصرف وتعديلات التدفق</span>
            <span className="text-xl font-bold font-mono text-slate-700 tabular-nums">
              {(cumulativeFx + cumulativeResidual) >= 0 ? `+${(cumulativeFx + cumulativeResidual).toFixed(1)}%` : `${(cumulativeFx + cumulativeResidual).toFixed(1)}%`}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">فروق العملة والاحتياطيات</span>
          </div>
        </div>
      ) : null}

      {/* Main Interactive Chart */}
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-xs font-mono select-none">
          {/* Grid lines */}
          {yTicks.map((yVal) => (
            <g key={yVal}>
              <line
                x1={padding.left}
                y1={getY(yVal)}
                x2={width - padding.right}
                y2={getY(yVal)}
                stroke={yVal === 0 ? '#475569' : '#e2e8f0'}
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

          {/* Grouped Bars for each year */}
          {decomposition.map((d, idx) => {
            const slotCenter = padding.left + (idx + 0.5) * slotWidth;
            const isHovered = hoveredYear === d.year;

            // Bar 1: Real Growth (Green - negative contribution)
            const gHeight = Math.abs(getY(d.growthContribution) - zeroY);
            const gY = d.growthContribution < 0 ? zeroY : getY(d.growthContribution);

            // Bar 2: Real Interest (Red - positive contribution)
            const iHeight = Math.abs(getY(d.interestContribution) - zeroY);
            const iY = d.interestContribution < 0 ? zeroY : getY(d.interestContribution);

            // Bar 3: Primary Balance (Purple/Blue)
            const pbHeight = Math.abs(getY(d.primaryBalanceContribution) - zeroY);
            const pbY = d.primaryBalanceContribution < 0 ? zeroY : getY(d.primaryBalanceContribution);

            // Dot: Net Change
            const netY = getY(d.netChange);

            return (
              <g
                key={d.year}
                onMouseEnter={() => setHoveredYear(d.year)}
                onMouseLeave={() => setHoveredYear(null)}
                className="cursor-pointer"
              >
                {/* Background hover highlight */}
                {isHovered && (
                  <rect
                    x={slotCenter - slotWidth / 2}
                    y={padding.top}
                    width={slotWidth}
                    height={chartHeight}
                    fill="#f1f5f9"
                    opacity="0.7"
                    rx={3}
                  />
                )}

                {/* Bar 1: Growth */}
                <rect
                  x={slotCenter - barWidth * 1.6}
                  y={gY}
                  width={barWidth}
                  height={Math.max(2, gHeight)}
                  fill="#059669"
                  opacity={isHovered ? 1 : 0.85}
                  rx={2}
                />

                {/* Bar 2: Interest */}
                <rect
                  x={slotCenter - barWidth * 0.5}
                  y={iY}
                  width={barWidth}
                  height={Math.max(2, iHeight)}
                  fill="#dc2626"
                  opacity={isHovered ? 1 : 0.85}
                  rx={2}
                />

                {/* Bar 3: Primary Balance */}
                <rect
                  x={slotCenter + barWidth * 0.6}
                  y={pbY}
                  width={barWidth}
                  height={Math.max(2, pbHeight)}
                  fill={d.primaryBalanceContribution < 0 ? '#10b981' : '#f59e0b'}
                  opacity={isHovered ? 1 : 0.85}
                  rx={2}
                />

                {/* Net Change Marker Dot */}
                <circle
                  cx={slotCenter}
                  cy={netY}
                  r={isHovered ? 6 : 4.5}
                  fill="#1e1b4b"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Year Label */}
                <text
                  x={slotCenter}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className={`text-[11px] font-mono ${isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-600'}`}
                >
                  {d.year}
                </text>

                {/* Net change label on top of dot */}
                <text
                  x={slotCenter}
                  y={netY - 8}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-bold ${d.netChange <= 0 ? 'fill-emerald-800' : 'fill-slate-900'}`}
                >
                  {d.netChange > 0 ? `+${d.netChange}%` : `${d.netChange}%`}
                </text>
              </g>
            );
          })}

          {/* Connect Net Change Dots with a line */}
          <path
            d={decomposition.map((d, i) => `${i === 0 ? 'M' : 'L'} ${padding.left + (i + 0.5) * slotWidth} ${getY(d.netChange)}`).join(' ')}
            fill="none"
            stroke="#1e1b4b"
            strokeWidth="2"
            strokeDasharray="4,2"
          />
        </svg>
      </div>

      {/* Legend & Active Details Inspection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#059669] rounded-xs"></span>
            <span className="text-slate-700">مساهمة النمو الحقيقي (g) [يخفض الدين]</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#dc2626] rounded-xs"></span>
            <span className="text-slate-700">مساهمة الفائدة الحقيقية (r) [يرفع الدين]</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#f59e0b] rounded-xs"></span>
            <span className="text-slate-700">مساهمة العجز الأولي (pb)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1e1b4b]"></span>
            <span className="text-slate-700 font-bold">صافي التغير السنوي (Δd)</span>
          </div>
        </div>

        {activeHoveredData && (
          <div className="flex items-center gap-3 font-mono text-xs bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <span className="font-bold text-slate-800">بيانات سنة {activeHoveredData.year}:</span>
            <span className="text-emerald-700">النمو: {activeHoveredData.growthContribution}%</span>
            <span className="text-rose-700">الفائدة: +{activeHoveredData.interestContribution}%</span>
            <span className="text-amber-800">الرصيد: {activeHoveredData.primaryBalanceContribution}%</span>
            <span className="font-bold text-slate-900">الصافي: {activeHoveredData.netChange}%</span>
          </div>
        )}
      </div>

      {/* Mathematical Methodology Callout */}
      <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 leading-relaxed font-sans">
        <span className="font-bold text-slate-800 block mb-0.5">
          صيغة صندوق النقد الدولي لتفكيك تغير نسبة الدين:
        </span>
        <code className="font-mono text-[11px] text-slate-900 block" dir="ltr">
          Δd_t = [ - g_t / (1 + g_t) ] · d_{'{t-1}'} + [ r_t / (1 + g_t) ] · d_{'{t-1}'} - pb_t + sfa_t
        </code>
      </div>
    </div>
  );
};
