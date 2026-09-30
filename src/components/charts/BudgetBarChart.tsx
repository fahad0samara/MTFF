import React, { useState } from 'react';
import { FiscalAccountYear } from '../../types/fiscal';

interface BudgetBarChartProps {
  fiscalData: FiscalAccountYear[];
  currencySymbol?: string;
}

export const BudgetBarChart: React.FC<BudgetBarChartProps> = ({
  fiscalData,
  currencySymbol = 'مليار',
}) => {
  const [activeMode, setActiveMode] = useState<'totals' | 'breakdown'>('totals');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 800;
  const height = 330;
  const padding = { top: 25, right: 35, bottom: 45, left: 65 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const rawMax = Math.max(
    ...fiscalData.map((d) => Math.max(d.totalRevenue, d.totalExpenditure)),
    10
  );
  // Adaptive ceiling calculation
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const ceiling = Math.ceil((rawMax * 1.12) / (magnitude / 2)) * (magnitude / 2);

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / ceiling) * chartHeight;
  };

  const barGroupWidth = chartWidth / fiscalData.length;
  const singleBarWidth = Math.min(24, barGroupWidth * 0.35);

  const yTicks = [
    0,
    Math.round(ceiling * 0.25),
    Math.round(ceiling * 0.5),
    Math.round(ceiling * 0.75),
    Math.round(ceiling),
  ];
  const hoveredData = hoveredIndex !== null ? fiscalData[hoveredIndex] : null;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-md p-5 shadow-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>تطور الميزانية العامة والإيرادات والنفقات (2022 - 2030)</span>
            <span className="font-mono text-xs text-slate-500 font-normal">
              [المسار المالي متوسط الأجل MTFF]
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            مقارنة الإيرادات العامة الإجمالية مقابل النفقات وتطور الفائض / العجز المالي.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded border border-slate-200 text-xs">
          <button
            onClick={() => setActiveMode('totals')}
            className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer ${
              activeMode === 'totals'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الإجمالي (إيرادات vs نفقات)
          </button>
          <button
            onClick={() => setActiveMode('breakdown')}
            className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer ${
              activeMode === 'breakdown'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            التفكيك الهيكلي (نفطي / غير نفطي)
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-4 text-xs text-slate-600 mb-3 pb-2 border-b border-slate-100">
        {activeMode === 'totals' ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#006C35] inline-block"></span>
              <span>إجمالي الإيرادات العامة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#1e3a8a] inline-block"></span>
              <span>إجمالي النفقات المعتمدة</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#006C35] inline-block"></span>
              <span>إيرادات نفطية</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#0d9488] inline-block"></span>
              <span>إيرادات ضريبية غير نفطية</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#334155] inline-block"></span>
              <span>أجور وتعويضات العاملين</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#4338ca] inline-block"></span>
              <span>إنفاق استثماري رأسمالي (Capex)</span>
            </div>
          </>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '600px' }}
        >
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
                {tick}
              </text>
            </g>
          ))}

          {fiscalData.map((d, idx) => {
            const groupCenterX = padding.left + idx * barGroupWidth + barGroupWidth / 2;
            const revBarX = groupCenterX - singleBarWidth - 2;
            const expBarX = groupCenterX + 2;
            const isHovered = hoveredIndex === idx;

            const revHeight = (d.totalRevenue / ceiling) * chartHeight;
            const expHeight = (d.totalExpenditure / ceiling) * chartHeight;

            const oilHeight = (d.oilRevenue / ceiling) * chartHeight;
            const taxHeight = (d.taxRevenue / ceiling) * chartHeight;
            const nonTaxHeight = (d.nonTaxRevenue / ceiling) * chartHeight;

            const wageHeight = (d.wagesAndSalaries / ceiling) * chartHeight;
            const capexHeight = (d.capitalExpenditure / ceiling) * chartHeight;
            const otherExpHeight = Math.max(0, expHeight - wageHeight - capexHeight);

            return (
              <g
                key={d.year}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <rect
                  x={padding.left + idx * barGroupWidth + 4}
                  y={padding.top}
                  width={barGroupWidth - 8}
                  height={chartHeight}
                  fill={isHovered ? 'rgba(241, 245, 249, 0.8)' : 'transparent'}
                />

                {activeMode === 'totals' ? (
                  <>
                    <rect
                      x={revBarX}
                      y={getY(d.totalRevenue)}
                      width={singleBarWidth}
                      height={revHeight}
                      fill="#006C35"
                    />
                    <rect
                      x={expBarX}
                      y={getY(d.totalExpenditure)}
                      width={singleBarWidth}
                      height={expHeight}
                      fill="#1e3a8a"
                    />
                  </>
                ) : (
                  <>
                    <rect
                      x={revBarX}
                      y={getY(d.oilRevenue)}
                      width={singleBarWidth}
                      height={oilHeight}
                      fill="#006C35"
                    />
                    <rect
                      x={revBarX}
                      y={getY(d.oilRevenue + d.taxRevenue)}
                      width={singleBarWidth}
                      height={taxHeight}
                      fill="#0d9488"
                    />
                    <rect
                      x={revBarX}
                      y={getY(d.totalRevenue)}
                      width={singleBarWidth}
                      height={nonTaxHeight}
                      fill="#14b8a6"
                    />

                    <rect
                      x={expBarX}
                      y={getY(d.wagesAndSalaries)}
                      width={singleBarWidth}
                      height={wageHeight}
                      fill="#334155"
                    />
                    <rect
                      x={expBarX}
                      y={getY(d.wagesAndSalaries + d.capitalExpenditure)}
                      width={singleBarWidth}
                      height={capexHeight}
                      fill="#4338ca"
                    />
                    <rect
                      x={expBarX}
                      y={getY(d.totalExpenditure)}
                      width={singleBarWidth}
                      height={otherExpHeight}
                      fill="#64748b"
                    />
                  </>
                )}

                <text
                  x={groupCenterX}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className={`text-[11px] font-mono tabular-nums ${
                    isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-600'
                  }`}
                >
                  {d.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredData && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-slate-500 block text-[11px]">السنة المالية:</span>
            <span className="font-mono font-bold text-slate-900">{hoveredData.year}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">الإيرادات:</span>
            <span className="font-mono font-bold text-[#006C35]">{hoveredData.totalRevenue} {currencySymbol}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">النفقات:</span>
            <span className="font-mono font-bold text-[#1e3a8a]">{hoveredData.totalExpenditure} {currencySymbol}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">الرصيد المالي:</span>
            <span
              className={`font-mono font-bold ${
                hoveredData.overallBalance >= 0 ? 'text-[#006C35]' : 'text-red-700'
              }`}
            >
              {hoveredData.overallBalance >= 0 ? '+' : ''}{hoveredData.overallBalance} ({hoveredData.overallBalancePercentGdp}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
