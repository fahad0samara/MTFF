import React, { useState } from 'react';
import { FiscalAccountYear, FanChartBand } from '../../types/fiscal';

interface FanChartProps {
  baselineFiscal: FiscalAccountYear[];
  currentFiscal: FiscalAccountYear[];
  fanBands: FanChartBand[];
  scenarioName: string;
  isScenarioActive: boolean;
  debtAnchor?: number;
}

export const FanChart: React.FC<FanChartProps> = ({
  baselineFiscal,
  currentFiscal,
  fanBands,
  scenarioName,
  isScenarioActive,
  debtAnchor = 35.0,
}) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const width = 800;
  const height = 340;
  const padding = { top: 30, right: 35, bottom: 45, left: 65 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const years = baselineFiscal.map((d) => d.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const allValues = [
    ...fanBands.map((b) => b.p90),
    ...fanBands.map((b) => b.p10),
    ...currentFiscal.map((f) => f.debtToGdp),
    debtAnchor,
  ];
  const minY = Math.max(0, Math.floor(Math.min(...allValues) / 5) * 5 - 5);
  const maxY = Math.ceil(Math.max(...allValues) / 5) * 5 + 5;

  const getX = (year: number) => {
    return padding.left + ((year - minYear) / (maxYear - minYear)) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - minY) / (maxY - minY)) * chartHeight;
  };

  const generateAreaPath = (topKey: 'p90' | 'p75', bottomKey: 'p10' | 'p25') => {
    const forecastBands = fanBands.filter((b) => b.year >= 2024);
    if (forecastBands.length === 0) return '';

    const topPoints = forecastBands.map((b) => `${getX(b.year)},${getY(b[topKey])}`).join(' L ');
    const bottomPoints = forecastBands
      .slice()
      .reverse()
      .map((b) => `${getX(b.year)},${getY(b[bottomKey])}`)
      .join(' L ');

    return `M ${topPoints} L ${bottomPoints} Z`;
  };

  const generateLinePath = (data: { year: number; val: number }[]) => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.year)},${getY(d.val)}`).join(' ');
  };

  const baselinePoints = baselineFiscal.map((d) => ({ year: d.year, val: d.debtToGdp }));
  const currentPoints = currentFiscal.map((d) => ({ year: d.year, val: d.debtToGdp }));

  const yTicks: number[] = [];
  const tickStep = (maxY - minY) / 5;
  for (let i = 0; i <= 5; i++) {
    yTicks.push(Math.round(minY + i * tickStep));
  }

  const activeHoverData = hoveredYear
    ? {
        baseline: baselineFiscal.find((d) => d.year === hoveredYear),
        current: currentFiscal.find((d) => d.year === hoveredYear),
        fan: fanBands.find((b) => b.year === hoveredYear),
      }
    : null;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-md p-5 shadow-xs">
      {/* Title & Metadata */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>مخطط استدامة مسار الدين العام ونطاقات عدم اليقين (Fan Chart)</span>
            <span className="font-mono text-xs text-slate-500 font-normal">
              [نسبة الدين للناتج 2022 - 2030]
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            محاكاة تصادفية (Stochastic Simulation) لاحتمالات تشتت مسار الدين تحت تقلبات النمو وأسعار النفط.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-[#006C35] inline-block"></span>
            <span className="font-medium">المسار المرجعي الأساسي</span>
          </div>

          {isScenarioActive && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-amber-600 inline-block border-b border-dashed"></span>
              <span className="text-amber-800 font-semibold">السيناريو النشط</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-[#006C35]/25 inline-block"></span>
            <span>نطاق الثقة (25% - 75%)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-[#006C35]/10 inline-block"></span>
            <span>أقصى تشتت (10% - 90%)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0 border-b border-dashed border-red-600 inline-block"></span>
            <span className="text-red-700 font-medium">سقف الأمان ({debtAnchor}%)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '600px' }}
        >
          {/* Y Axis Grid Lines */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={getY(tick)}
                x2={width - padding.right}
                y2={getY(tick)}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={getY(tick) + 4}
                textAnchor="end"
                className="text-[11px] fill-slate-500 font-mono tabular-nums"
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Fiscal Debt Anchor Line */}
          <line
            x1={padding.left}
            y1={getY(debtAnchor)}
            x2={width - padding.right}
            y2={getY(debtAnchor)}
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={width - padding.right - 8}
            y={getY(debtAnchor) - 6}
            textAnchor="end"
            className="text-[10px] fill-red-700 font-bold"
          >
            السقف المعتمد ({debtAnchor}%)
          </text>

          {/* Separation between historical and forecast */}
          <line
            x1={getX(2024)}
            y1={padding.top}
            x2={getX(2024)}
            y2={height - padding.bottom}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text
            x={getX(2024) - 6}
            y={padding.top + 12}
            textAnchor="end"
            className="text-[10px] fill-slate-400 font-medium"
          >
            بيانات فعلية
          </text>
          <text
            x={getX(2024) + 6}
            y={padding.top + 12}
            textAnchor="start"
            className="text-[10px] fill-[#006C35] font-bold"
          >
            توقعات إطار المالية (MTFF)
          </text>

          {/* Shaded percentile bands */}
          <path d={generateAreaPath('p90', 'p10')} fill="#006C35" fillOpacity="0.08" />
          <path d={generateAreaPath('p75', 'p25')} fill="#006C35" fillOpacity="0.18" />

          {/* Baseline Debt Path Line */}
          <path
            d={generateLinePath(baselinePoints)}
            fill="none"
            stroke="#006C35"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current / Simulated Scenario Line if active */}
          {isScenarioActive && (
            <path
              d={generateLinePath(currentPoints)}
              fill="none"
              stroke="#d97706"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Data Points */}
          {years.map((year) => {
            const cx = getX(year);
            const bVal = baselinePoints.find((p) => p.year === year)?.val || 0;
            const cVal = currentPoints.find((p) => p.year === year)?.val || 0;
            const isHovered = hoveredYear === year;

            return (
              <g
                key={year}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredYear(year)}
                onMouseLeave={() => setHoveredYear(null)}
              >
                <rect
                  x={cx - 18}
                  y={padding.top}
                  width="36"
                  height={chartHeight}
                  fill="transparent"
                />

                {isHovered && (
                  <line
                    x1={cx}
                    y1={padding.top}
                    x2={cx}
                    y2={height - padding.bottom}
                    stroke="#64748b"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                <circle
                  cx={cx}
                  cy={getY(bVal)}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#ffffff"
                  stroke="#006C35"
                  strokeWidth="2"
                />

                {isScenarioActive && (
                  <circle
                    cx={cx}
                    cy={getY(cVal)}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#ffffff"
                    stroke="#d97706"
                    strokeWidth="2"
                  />
                )}

                <text
                  x={cx}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className={`text-[11px] font-mono tabular-nums ${
                    isHovered ? 'fill-[#006C35] font-bold' : 'fill-slate-600'
                  }`}
                >
                  {year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Detail Bar on Hover */}
      {activeHoverData && activeHoverData.current && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-slate-500 block text-[11px]">السنة المالية:</span>
            <span className="font-mono font-bold text-slate-900">
              {hoveredYear} {hoveredYear! <= 2024 ? '(فعلي)' : '(مستهدف)'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">نسبة الدين إلى الناتج:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {activeHoverData.current.debtToGdp}%
            </span>
            {isScenarioActive && (
              <span className="text-[10px] text-amber-700 block font-mono">
                الأساس: {activeHoverData.baseline?.debtToGdp}%
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">رصيد الدين الاسمي:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {activeHoverData.current.nominalDebt.toLocaleString()} مليار
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">الفارق عن سقف الأمان:</span>
            <span className="font-mono font-bold text-[#006C35]">
              +{(debtAnchor - activeHoverData.current.debtToGdp).toFixed(1)}% (حيز مالي آمن)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
