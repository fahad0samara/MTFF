import React, { useState, useMemo } from 'react';
import { DebtTranche } from '../../types/fiscal';
import { SovereignCountryProfile } from '../../data/realSovereignData';

interface DebtMaturityWallChartProps {
  tranches: DebtTranche[];
  currencySymbol: string;
  country: SovereignCountryProfile;
}

export const DebtMaturityWallChart: React.FC<DebtMaturityWallChartProps> = ({
  tranches,
  currencySymbol,
  country,
}) => {
  const [viewMode, setViewMode] = useState<'currency' | 'interest_type'>('currency');
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Group tranches by maturity year
  const maturityYears = Array.from(new Set(tranches.map((t) => t.maturityYear))).sort((a, b) => a - b);
  const minYear = Math.min(2025, ...maturityYears);
  const maxYear = Math.max(2035, ...maturityYears);

  // Construct complete continuous year range from minYear to maxYear
  const allYears: number[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    allYears.push(y);
  }

  const yearData = useMemo(() => {
    return allYears.map((yr) => {
      const yearTranches = tranches.filter((t) => t.maturityYear === yr);

      // By Currency: Domestic vs Foreign/USD
      const domestic = yearTranches
        .filter((t) => t.currency === country.currencyCode)
        .reduce((sum, t) => sum + t.amount, 0);
      const foreign = yearTranches
        .filter((t) => t.currency !== country.currencyCode)
        .reduce((sum, t) => sum + t.amount, 0);

      // By Rate Type: Fixed vs Floating
      const fixed = yearTranches
        .filter((t) => t.rateType.includes('ثابت') || t.rateType.includes('Fixed'))
        .reduce((sum, t) => sum + t.amount, 0);
      const floating = yearTranches
        .filter((t) => t.rateType.includes('متغير') || t.rateType.includes('Floating'))
        .reduce((sum, t) => sum + t.amount, 0);

      const total = domestic + foreign;

      return {
        year: yr,
        domestic,
        foreign,
        fixed,
        floating,
        total,
        count: yearTranches.length,
        tranches: yearTranches,
      };
    });
  }, [allYears, tranches, country.currencyCode]);

  // Quantitative Portfolio Metrics:
  // 1. Total Portfolio Amount
  const totalAmount = tranches.reduce((sum, t) => sum + t.amount, 0);

  // 2. Weighted Average Maturity (WAM in years)
  const currentYear = 2025;
  const wamYears = totalAmount > 0
    ? Number(
        (
          tranches.reduce((sum, t) => sum + Math.max(0.5, t.maturityYear - currentYear) * t.amount, 0) /
          totalAmount
        ).toFixed(2)
      )
    : 8.5;

  // 3. Macaulay Duration & Modified Duration estimate (assuming average yield)
  const avgYield = country.macroSeries[3]?.sovereignYield10Y || 4.2;
  const macaulayDuration = Number((wamYears * 0.88).toFixed(2));
  const modifiedDuration = Number((macaulayDuration / (1 + avgYield / 100)).toFixed(2));

  // 4. Peak Redemption Year (Refinancing Wall)
  const peakYearData = [...yearData].sort((a, b) => b.total - a.total)[0] || yearData[0];

  // SVG Chart Dimensions
  const width = 760;
  const height = 280;
  const padding = { top: 30, right: 35, bottom: 45, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxTotal = Math.max(50, Math.ceil(Math.max(...yearData.map((d) => d.total)) * 1.25));

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / maxTotal) * chartHeight;
  };

  const slotWidth = chartWidth / yearData.length;
  const barWidth = Math.max(12, Math.min(30, slotWidth * 0.7));

  const hoveredData = hoveredYear ? yearData.find((d) => d.year === hoveredYear) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
      {/* Header and Toggle */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <h3 className="text-sm font-bold text-slate-900">
              جدار استحقاقات الديون ومخاطر إعادة التمويل (Sovereign Debt Maturity Wall)
            </h3>
            <span className="text-[11px] font-mono text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-bold">
              إدارة الالتزامات والأصول (ALM)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            توزيع آجال استحقاق أصل الدين العام سنوياً؛ تحديد ذروة الاستحقاقات لتجنب اختناقات السيولة وإعادة التمويل في أوقات تشديد السياسة النقدية.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('currency')}
            className={`px-3 py-1 font-semibold rounded cursor-pointer transition-colors ${
              viewMode === 'currency'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            حسب العملة (محلي مقابل أجنبي)
          </button>
          <button
            onClick={() => setViewMode('interest_type')}
            className={`px-3 py-1 font-semibold rounded cursor-pointer transition-colors ${
              viewMode === 'interest_type'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            نوع الفائدة (ثابت مقابل متغير)
          </button>
        </div>
      </div>

      {/* Analytical KPI Cards for Portfolio Risk */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <span className="text-[11px] text-slate-500 block mb-1">
            متوسط أجل الاستحقاق المرجح (WAM)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {wamYears} سنة
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            مؤشر كفاية تمديد آجال المحفظة السيادية
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <span className="text-[11px] text-slate-500 block mb-1">
            مدة ماكولي المعدلة (Modified Duration)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {modifiedDuration} سنة
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            حساسية قيمة المحفظة لتغير 100 نقطة أساس
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <span className="text-[11px] text-slate-500 block mb-1">
            ذروة الاستحقاقات (Refinancing Peak)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-amber-900 tabular-nums">
              عام {peakYearData?.year}
            </span>
            <span className="text-xs font-mono text-slate-600">
              ({peakYearData?.total.toLocaleString()} {currencySymbol})
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            سنة التحدي الأكبر لعمليات تدوير الدين
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <span className="text-[11px] text-slate-500 block mb-1">
            إجمالي رصيد الشرائح المسجلة
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {totalAmount.toLocaleString()} {currencySymbol}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            عبر {tranches.length} إصدار مدرج في السجل
          </span>
        </div>
      </div>

      {/* SVG Stacked Bar Chart */}
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-xs font-mono select-none">
          {/* Y Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const val = Math.round(maxTotal * ratio);
            const y = getY(val);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px]"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Stacked Bars */}
          {yearData.map((d, idx) => {
            const slotCenter = padding.left + (idx + 0.5) * slotWidth;
            const isHovered = hoveredYear === d.year;
            const isPeak = d.year === peakYearData.year && d.total > 0;

            let bottomPart = 0;
            let topPart = 0;
            let bottomColor = '';
            let topColor = '';

            if (viewMode === 'currency') {
              bottomPart = d.domestic;
              topPart = d.foreign;
              bottomColor = '#0f766e'; // Teal - Domestic
              topColor = '#3b82f6'; // Blue - Foreign
            } else {
              bottomPart = d.fixed;
              topPart = d.floating;
              bottomColor = '#1e293b'; // Slate - Fixed
              topColor = '#f59e0b'; // Amber - Floating
            }

            const bottomHeight = (bottomPart / maxTotal) * chartHeight;
            const topHeight = (topPart / maxTotal) * chartHeight;

            const bottomY = padding.top + chartHeight - bottomHeight;
            const topY = bottomY - topHeight;

            return (
              <g
                key={d.year}
                onMouseEnter={() => setHoveredYear(d.year)}
                onMouseLeave={() => setHoveredYear(null)}
                className="cursor-pointer"
              >
                {/* Hover Background */}
                {isHovered && (
                  <rect
                    x={slotCenter - slotWidth / 2}
                    y={padding.top}
                    width={slotWidth}
                    height={chartHeight}
                    fill="#f8fafc"
                    rx={2}
                  />
                )}

                {/* Bottom Part Bar */}
                {bottomPart > 0 && (
                  <rect
                    x={slotCenter - barWidth / 2}
                    y={bottomY}
                    width={barWidth}
                    height={Math.max(2, bottomHeight)}
                    fill={bottomColor}
                    opacity={isHovered ? 1 : 0.9}
                    rx={topPart > 0 ? 0 : 2}
                  />
                )}

                {/* Top Part Bar */}
                {topPart > 0 && (
                  <rect
                    x={slotCenter - barWidth / 2}
                    y={topY}
                    width={barWidth}
                    height={Math.max(2, topHeight)}
                    fill={topColor}
                    opacity={isHovered ? 1 : 0.9}
                    rx={2}
                  />
                )}

                {/* Peak Indicator Callout if highest year */}
                {isPeak && (
                  <text
                    x={slotCenter}
                    y={topY - 14}
                    textAnchor="middle"
                    className="text-[9px] font-sans font-bold fill-amber-700"
                  >
                    ذروة السداد
                  </text>
                )}

                {/* Total Value on top of bar */}
                {d.total > 0 && (
                  <text
                    x={slotCenter}
                    y={topY - 4}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-slate-700"
                  >
                    {d.total.toFixed(0)}
                  </text>
                )}

                {/* X Axis Year Label */}
                <text
                  x={slotCenter}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${
                    isPeak
                      ? 'fill-amber-900 font-bold'
                      : isHovered
                      ? 'fill-slate-900 font-bold'
                      : 'fill-slate-600'
                  }`}
                >
                  {d.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Hover Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          {viewMode === 'currency' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#0f766e] rounded-xs"></span>
                <span className="text-slate-700">دين بالعملة المحلية ({country.currencyCode})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#3b82f6] rounded-xs"></span>
                <span className="text-slate-700">دين بالعملات الأجنبية (USD / EUR)</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#1e293b] rounded-xs"></span>
                <span className="text-slate-700">سعر فائدة ثابت (Fixed Rate)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#f59e0b] rounded-xs"></span>
                <span className="text-slate-700">سعر فائدة متغير (Floating Rate)</span>
              </div>
            </>
          )}
        </div>

        {hoveredData && hoveredData.total > 0 && (
          <div className="flex items-center gap-3 font-mono text-xs bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <span className="font-bold text-slate-800">استحقاقات عام {hoveredData.year}:</span>
            <span>الإجمالي: {hoveredData.total.toLocaleString()} {currencySymbol}</span>
            <span className="text-slate-500">({hoveredData.count} إصدار)</span>
          </div>
        )}
      </div>
    </div>
  );
};
