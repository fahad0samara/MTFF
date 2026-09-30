import React from 'react';
import { DebtTranche } from '../../types/fiscal';

interface AmortizationScheduleChartProps {
  tranches: DebtTranche[];
  currencySymbol?: string;
}

export const AmortizationScheduleChart: React.FC<AmortizationScheduleChartProps> = ({
  tranches,
  currencySymbol = 'مليار',
}) => {
  const maturityMap: { [year: number]: { total: number; sukuk: number; bonds: number; tbills: number; other: number } } = {};
  
  for (let yr = 2025; yr <= 2035; yr++) {
    maturityMap[yr] = { total: 0, sukuk: 0, bonds: 0, tbills: 0, other: 0 };
  }

  tranches.forEach((t) => {
    const yr = t.maturityYear > 2035 ? 2035 : t.maturityYear;
    if (!maturityMap[yr]) {
      maturityMap[yr] = { total: 0, sukuk: 0, bonds: 0, tbills: 0, other: 0 };
    }
    maturityMap[yr].total += t.amount;
    if (t.type.includes('صكوك')) maturityMap[yr].sukuk += t.amount;
    else if (t.type.includes('سندات دولية') || t.type.includes('Eurobonds') || t.type.includes('Gilts') || t.type.includes('Bunds')) maturityMap[yr].bonds += t.amount;
    else if (t.type.includes('أذونات') || t.type.includes('T-Bills')) maturityMap[yr].tbills += t.amount;
    else maturityMap[yr].other += t.amount;
  });

  const years = Object.keys(maturityMap)
    .map(Number)
    .sort((a, b) => a - b);

  const rawMax = Math.max(...years.map((y) => maturityMap[y].total), 1);
  const magnitude = Math.pow(10, Math.max(1, Math.floor(Math.log10(rawMax))));
  const ceiling = Math.ceil((rawMax * 1.15) / (magnitude / 2)) * (magnitude / 2);

  const width = 800;
  const height = 280;
  const padding = { top: 25, right: 35, bottom: 45, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getY = (val: number) => padding.top + chartHeight - (val / ceiling) * chartHeight;
  const groupWidth = chartWidth / years.length;
  const barWidth = Math.min(26, groupWidth * 0.5);

  const yTicks = [0, ceiling * 0.25, ceiling * 0.5, ceiling * 0.75, ceiling];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-md p-5 shadow-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>جدول استحقاقات الدين العام وتوزيع آجال السداد (Maturity Profile)</span>
            <span className="font-mono text-xs text-slate-500 font-normal">[2025 - 2035+]</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            توزيع أصل الديون المستحقة حسب الأداة التمويلية لتفادي تركز استحقاقات السداد (Refinancing Peaks).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#006C35] inline-block"></span>
            <span>صكوك سيادية إسلامية</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#1e3a8a] inline-block"></span>
            <span>سندات يوروبوند دولية</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#d97706] inline-block"></span>
            <span>أذونات خزانة</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#64748b] inline-block"></span>
            <span>سندات تنمية وقروض</span>
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
                {tick}
              </text>
            </g>
          ))}

          {years.map((year, idx) => {
            const centerX = padding.left + idx * groupWidth + groupWidth / 2;
            const barX = centerX - barWidth / 2;
            const data = maturityMap[year];

            const sukukH = (data.sukuk / ceiling) * chartHeight;
            const bondsH = (data.bonds / ceiling) * chartHeight;
            const tbillsH = (data.tbills / ceiling) * chartHeight;
            const otherH = (data.other / ceiling) * chartHeight;

            let currentH = 0;

            return (
              <g key={year}>
                {data.sukuk > 0 && (
                  <rect
                    x={barX}
                    y={getY(currentH + data.sukuk)}
                    width={barWidth}
                    height={sukukH}
                    fill="#006C35"
                  />
                )}
                {data.bonds > 0 && (
                  <rect
                    x={barX}
                    y={getY(currentH + data.sukuk + data.bonds)}
                    width={barWidth}
                    height={bondsH}
                    fill="#1e3a8a"
                  />
                )}
                {data.tbills > 0 && (
                  <rect
                    x={barX}
                    y={getY(currentH + data.sukuk + data.bonds + data.tbills)}
                    width={barWidth}
                    height={tbillsH}
                    fill="#d97706"
                  />
                )}
                {data.other > 0 && (
                  <rect
                    x={barX}
                    y={getY(data.total)}
                    width={barWidth}
                    height={otherH}
                    fill="#64748b"
                  />
                )}

                {data.total > 0 && (
                  <text
                    x={centerX}
                    y={getY(data.total) - 6}
                    textAnchor="middle"
                    className="text-[10px] font-mono tabular-nums fill-slate-700 font-bold"
                  >
                    {data.total.toFixed(1)}
                  </text>
                )}

                <text
                  x={centerX}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="text-[11px] font-mono tabular-nums fill-slate-600"
                >
                  {year === 2035 ? '2035+' : year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
        <span>
          متوسط أجل الاستحقاق (ATM): <strong className="text-slate-900 font-mono">8.4 سنوات</strong> (يمنح حماية ضد مخاطر إعادة التمويل المفاجئة)
        </span>
        <span className="font-semibold text-slate-700">
          هيكل الفائدة: 82% ثابت · 18% متغير
        </span>
      </div>
    </div>
  );
};
