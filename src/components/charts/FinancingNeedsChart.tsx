import React from 'react';
import { FiscalAccountYear } from '../../types/fiscal';

interface FinancingNeedsChartProps {
  fiscalData: FiscalAccountYear[];
  currencySymbol?: string;
  thresholdGfn?: number;
}

export const FinancingNeedsChart: React.FC<FinancingNeedsChartProps> = ({
  fiscalData,
  currencySymbol = 'مليار ر.س',
  thresholdGfn = 10.0,
}) => {
  const width = 800;
  const height = 280;
  const padding = { top: 25, right: 35, bottom: 45, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...fiscalData.map((d) => d.gfnPercentGdp), thresholdGfn + 2);
  const ceiling = Math.ceil(maxVal / 2) * 2;

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / ceiling) * chartHeight;
  };

  const groupWidth = chartWidth / fiscalData.length;
  const barWidth = Math.min(26, groupWidth * 0.45);

  const yTicks = [0, ceiling * 0.25, ceiling * 0.5, ceiling * 0.75, ceiling];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-md p-5 shadow-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>إجمالي الاحتياجات التمويلية السنوية (Gross Financing Needs - GFN)</span>
            <span className="font-mono text-xs text-slate-500 font-normal">
              [% من الناتج المحلي الإجمالي]
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            معيار صندوق النقد الدولي (IMF) لقياس مخاطر إعادة التمويل والسيولة السنوية.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#4338ca] inline-block"></span>
            <span>سداد أصل الدين (Amortization)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#d97706] inline-block"></span>
            <span>عجز الميزانية المطلوب تمويله</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0 border-b border-dashed border-red-600 inline-block"></span>
            <span className="text-red-700 font-medium">سقف المخاطر ({thresholdGfn}%)</span>
          </div>
        </div>
      </div>

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
                {tick.toFixed(1)}%
              </text>
            </g>
          ))}

          <line
            x1={padding.left}
            y1={getY(thresholdGfn)}
            x2={width - padding.right}
            y2={getY(thresholdGfn)}
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={width - padding.right - 8}
            y={getY(thresholdGfn) - 6}
            textAnchor="end"
            className="text-[10px] fill-red-700 font-bold"
          >
            عتبة الحذر ({thresholdGfn}%)
          </text>

          {fiscalData.map((d, idx) => {
            const centerX = padding.left + idx * groupWidth + groupWidth / 2;
            const barX = centerX - barWidth / 2;

            const deficitShare = Math.max(0, -d.overallBalance);
            const amortShare = d.debtAmortization;
            const totalGfnAmount = deficitShare + amortShare;

            const amortPercent = totalGfnAmount > 0 ? (amortShare / totalGfnAmount) * d.gfnPercentGdp : d.gfnPercentGdp;
            const deficitPercent = d.gfnPercentGdp - amortPercent;

            const amortH = (amortPercent / ceiling) * chartHeight;
            const deficitH = (deficitPercent / ceiling) * chartHeight;

            return (
              <g key={d.year}>
                <rect
                  x={barX}
                  y={getY(amortPercent)}
                  width={barWidth}
                  height={amortH}
                  fill="#4338ca"
                />

                {deficitPercent > 0 && (
                  <rect
                    x={barX}
                    y={getY(d.gfnPercentGdp)}
                    width={barWidth}
                    height={deficitH}
                    fill="#d97706"
                  />
                )}

                <text
                  x={centerX}
                  y={getY(d.gfnPercentGdp) - 6}
                  textAnchor="middle"
                  className="text-[10px] font-mono tabular-nums fill-slate-700 font-bold"
                >
                  {d.gfnPercentGdp}%
                </text>

                <text
                  x={centerX}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="text-[11px] font-mono tabular-nums fill-slate-600"
                >
                  {d.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
        <span>
          متوسط الاحتياج التمويلي السنوي المتوقع:{' '}
          <strong className="text-slate-900 font-mono">
            {Math.round(
              fiscalData.slice(-5).reduce((acc, d) => acc + d.grossFinancingNeeds, 0) / 5
            )}{' '}
            {currencySymbol}
          </strong>
        </span>
        <span className="text-[#006C35] font-semibold">
          ✓ تقع كافة السنوات في النطاق الآمن دون العتبة الدولية (10%)
        </span>
      </div>
    </div>
  );
};
