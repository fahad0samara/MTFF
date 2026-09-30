import React, { useState } from 'react';
import { FiscalAccountYear, MacroIndicators } from '../../types/fiscal';
import { SovereignCountryProfile } from '../../data/realSovereignData';

interface RGDifferentialChartProps {
  country: SovereignCountryProfile;
  fiscalData: FiscalAccountYear[];
  macroData: MacroIndicators[];
}

export const RGDifferentialChart: React.FC<RGDifferentialChartProps> = ({
  country,
  fiscalData,
  macroData,
}) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const series = fiscalData.map((f) => {
    const m = macroData.find((macro) => macro.year === f.year) || macroData[0];
    const realRate = Number((m.interestRateEffective - m.inflationRate).toFixed(2));
    const realGrowth = m.realGdpGrowth;
    const differential = Number((realRate - realGrowth).toFixed(2)); // (r - g)
    // Debt stabilizing primary balance: dspb = ((r - g) / (1 + g/100)) * debt_prev
    const dspb = Number((((realRate - realGrowth) / (1 + realGrowth / 100)) * (f.debtToGdp / 100) * 100).toFixed(2));
    const actualPb = f.primaryBalancePercentGdp;
    const stabilityMargin = Number((actualPb - dspb).toFixed(2));

    return {
      year: f.year,
      realRate,
      realGrowth,
      differential, // (r - g)
      dspb,
      actualPb,
      stabilityMargin,
      isFavorable: differential < 0,
      debtToGdp: f.debtToGdp,
    };
  });

  const width = 760;
  const height = 280;
  const padding = { top: 25, right: 35, bottom: 40, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minYear = Math.min(...series.map((s) => s.year));
  const maxYear = Math.max(...series.map((s) => s.year));

  const allRates = series.flatMap((s) => [s.realRate, s.realGrowth, s.differential]);
  const minVal = Math.min(-6, Math.floor(Math.min(...allRates) - 1));
  const maxVal = Math.max(6, Math.ceil(Math.max(...allRates) + 1));

  const getX = (year: number) => {
    return padding.left + ((year - minYear) / (maxYear - minYear)) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
  };

  const zeroY = getY(0);

  // Path generators
  const realRatePoints = series.map((s) => `${getX(s.year)},${getY(s.realRate)}`).join(' L ');
  const realGrowthPoints = series.map((s) => `${getX(s.year)},${getY(s.realGrowth)}`).join(' L ');
  const diffPoints = series.map((s) => `${getX(s.year)},${getY(s.differential)}`).join(' L ');

  // Y Axis ticks
  const yTicks: number[] = [];
  const step = Math.ceil((maxVal - minVal) / 5);
  for (let v = minVal; v <= maxVal; v += step) {
    yTicks.push(v);
  }

  const latest2025 = series.find((s) => s.year === 2025) || series[0];

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#006C35]"></span>
            <h3 className="text-sm font-bold text-slate-900">
              ديناميكية الفائدة والنمو (r - g) وأثر كرة الثلج (Snowball Effect)
            </h3>
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              IMF DSA Analytical Framework
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            مقارنة معدل الفائدة الحقيقي (r) بمعدل النمو الاقتصادي الحقيقي (g)؛ الفارق السلبي (r &lt; g) يدعم خفض الدين تلقائياً.
          </p>
        </div>

        {/* 2025 Status Pill */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-500 font-sans">فارق (r - g) في 2025:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded ${
              latest2025.differential < 0
                ? 'bg-emerald-100 text-emerald-900'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {latest2025.differential > 0 ? `+${latest2025.differential}%` : `${latest2025.differential}%`}
            <span className="font-sans text-[10px] mr-1">
              ({latest2025.differential < 0 ? 'داعم لخفض الدين' : 'ضاغط على الميزانية'})
            </span>
          </span>
        </div>
      </div>

      {/* Analytical Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded p-3 text-xs">
        <div>
          <span className="text-slate-500 block text-[11px]">معدل النمو الحقيقي للناتج (g):</span>
          <span className="text-base font-bold font-mono text-emerald-800">
            +{latest2025.realGrowth}%
          </span>
          <span className="text-[10px] text-slate-500 block">المحرك الأساسي لتوسيع القاعدة الضريبية</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">سعر الفائدة الحقيقي الفعلي (r):</span>
          <span className="text-base font-bold font-mono text-slate-900">
            {latest2025.realRate}%
          </span>
          <span className="text-[10px] text-slate-500 block">الفائدة الاسمية ناقصاً معدل التضخم</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">الرصيد الأولي المثبت للدين (DSPB):</span>
          <span className="text-base font-bold font-mono text-slate-900">
            {latest2025.dspb}%
          </span>
          <span className="text-[10px] text-emerald-800 block font-semibold">
            الفارق الفعلي: {latest2025.stabilityMargin >= 0 ? `+${latest2025.stabilityMargin}% فائض استقرار` : `${latest2025.stabilityMargin}% عجز`}
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto text-xs font-mono"
          style={{ minWidth: '600px' }}
        >
          {/* Zero baseline */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#94a3b8"
            strokeWidth={1.5}
          />
          <text
            x={padding.left - 8}
            y={zeroY + 3}
            textAnchor="end"
            className="fill-slate-700 text-[10px] font-bold"
          >
            0.0%
          </text>

          {/* Grid lines */}
          {yTicks.filter((t) => t !== 0).map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={getY(tick)}
                x2={width - padding.right}
                y2={getY(tick)}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <text
                x={padding.left - 8}
                y={getY(tick) + 3}
                textAnchor="end"
                className="fill-slate-500 text-[10px]"
              >
                {tick > 0 ? `+${tick}%` : `${tick}%`}
              </text>
            </g>
          ))}

          {/* X Axis Years */}
          {series.map((s) => (
            <g key={s.year}>
              <line
                x1={getX(s.year)}
                y1={padding.top}
                x2={getX(s.year)}
                y2={height - padding.bottom}
                stroke="#f1f5f9"
                strokeWidth={1}
              />
              <text
                x={getX(s.year)}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                className={`text-[11px] ${s.year <= 2024 ? 'fill-slate-800 font-bold' : 'fill-slate-500'}`}
              >
                {s.year}
              </text>
              {s.year === 2024 && (
                <text
                  x={getX(s.year)}
                  y={padding.top - 8}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px] font-sans"
                >
                  الحد الفاصل (مدقق / تقديري)
                </text>
              )}
            </g>
          ))}

          {/* Line 1: Real GDP Growth (g) - Emerald Green */}
          <path
            d={`M ${realGrowthPoints}`}
            fill="none"
            stroke="#059669"
            strokeWidth={2.5}
          />

          {/* Line 2: Real Interest Rate (r) - Dark Slate */}
          <path
            d={`M ${realRatePoints}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth={2}
            strokeDasharray="4,2"
          />

          {/* Line 3: Differential (r - g) - Indigo */}
          <path
            d={`M ${diffPoints}`}
            fill="none"
            stroke="#6366f1"
            strokeWidth={2.5}
          />

          {/* Data Points on (r - g) Line */}
          {series.map((s) => {
            const isHovered = hoveredYear === s.year;
            return (
              <g
                key={s.year}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredYear(s.year)}
                onMouseLeave={() => setHoveredYear(null)}
              >
                <circle
                  cx={getX(s.year)}
                  cy={getY(s.differential)}
                  r={isHovered ? 6 : 4}
                  fill={s.differential < 0 ? '#059669' : '#dc2626'}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <circle
                  cx={getX(s.year)}
                  cy={getY(s.realGrowth)}
                  r={3}
                  fill="#059669"
                />
                <circle
                  cx={getX(s.year)}
                  cy={getY(s.realRate)}
                  r={3}
                  fill="#1e293b"
                />

                {isHovered && (
                  <g>
                    <rect
                      x={getX(s.year) - 45}
                      y={getY(s.differential) - 30}
                      width={90}
                      height={22}
                      rx={4}
                      fill="#0f172a"
                    />
                    <text
                      x={getX(s.year)}
                      y={getY(s.differential) - 15}
                      textAnchor="middle"
                      className="fill-white text-[10px] font-bold"
                    >
                      (r - g): {s.differential}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Theoretical Equation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-5 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
            <span className="w-3 h-1 bg-[#059669] inline-block"></span>
            <span>معدل نمو الناتج الحقيقي (g)</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
            <span className="w-3 h-0.5 bg-slate-800 border-dashed inline-block"></span>
            <span>معدل الفائدة الحقيقي الفعلي (r)</span>
          </div>

          <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
            <span className="w-3 h-1 bg-[#6366f1] inline-block"></span>
            <span>فارق الفائدة والنمو (r - g)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-600 font-mono" dir="ltr">
          Δd = [(r - g) / (1 + g)] · d_{'{t-1}'} - pb
        </div>
      </div>
    </div>
  );
};
