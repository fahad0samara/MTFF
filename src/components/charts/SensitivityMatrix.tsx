import React, { useState } from 'react';

interface SensitivityMatrixProps {
  baseGdpGrowth?: number;
  baseOilPrice?: number;
}

export const SensitivityMatrix: React.FC<SensitivityMatrixProps> = ({
  baseGdpGrowth = 3.8,
  baseOilPrice = 75,
}) => {
  const [metric, setMetric] = useState<'balance' | 'debt'>('balance');

  const oilPrices = [55, 65, 75, 85, 95];
  const growthRates = [1.5, 2.5, 3.8, 4.8, 6.0];

  const computeCell = (oil: number, growth: number) => {
    const oilDiff = oil - 75;
    const growthDiff = growth - 3.8;

    if (metric === 'balance') {
      const balance = -0.9 + (oilDiff / 10) * 1.6 + growthDiff * 0.45;
      return Number(balance.toFixed(1));
    } else {
      const debt = 28.5 - (oilDiff / 10) * 2.2 - growthDiff * 1.1;
      return Number(Math.max(16, debt).toFixed(1));
    }
  };

  const getCellBg = (val: number) => {
    if (metric === 'balance') {
      if (val >= 2.0) return 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
      if (val >= 0.0) return 'bg-emerald-50/60 text-emerald-800 border-emerald-200';
      if (val >= -1.5) return 'bg-slate-50 text-slate-800 border-slate-200';
      if (val >= -3.5) return 'bg-amber-50 text-amber-900 border-amber-300';
      return 'bg-red-50 text-red-900 border-red-300 font-bold';
    } else {
      if (val <= 24.0) return 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
      if (val <= 28.5) return 'bg-slate-50 text-slate-800 border-slate-200';
      if (val <= 33.0) return 'bg-amber-50 text-amber-900 border-amber-300';
      return 'bg-red-50 text-red-900 border-red-300 font-bold';
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-md p-5 shadow-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>مصفوفة تحليل الحساسية الثنائية (Two-Way Sensitivity Heatmap)</span>
            <span className="font-mono text-xs text-slate-500 font-normal">
              [أثر أسعار النفط ومعدل نمو الناتج]
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            جدول احتمالات استجابة التوازن المالي ونسبة الدين بتغير المتغيرين المحوريين.
          </p>
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded border border-slate-200 text-xs">
          <button
            onClick={() => setMetric('balance')}
            className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer ${
              metric === 'balance'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            رصيد الميزانية (% الناتج)
          </button>
          <button
            onClick={() => setMetric('debt')}
            className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer ${
              metric === 'debt'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            نسبة الدين العام (% الناتج)
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2.5 text-right font-semibold text-slate-700 bg-slate-100 border border-slate-200">
                سعر النفط \ نمو الناتج
              </th>
              {growthRates.map((g) => (
                <th
                  key={g}
                  className={`p-2.5 font-semibold bg-slate-100 border border-slate-200 font-mono ${
                    g === 3.8 ? 'text-[#006C35] font-bold bg-emerald-50/50' : 'text-slate-700'
                  }`}
                >
                  {g}% نمو
                  {g === 3.8 && <span className="block text-[10px] text-emerald-800 font-normal">(الأساس)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {oilPrices.map((oil) => (
              <tr key={oil}>
                <td
                  className={`p-2.5 text-right font-medium bg-slate-50 border border-slate-200 font-mono ${
                    oil === 75 ? 'text-[#006C35] font-bold bg-emerald-50/50' : 'text-slate-700'
                  }`}
                >
                  ${oil} / برميل
                  {oil === 75 && <span className="inline-block mr-1 text-[10px] text-emerald-800 font-normal">(الأساس)</span>}
                </td>

                {growthRates.map((growth) => {
                  const val = computeCell(oil, growth);
                  const isBaseline = oil === 75 && growth === 3.8;

                  return (
                    <td
                      key={growth}
                      className={`p-2.5 border font-mono tabular-nums transition-all ${getCellBg(
                        val
                      )} ${isBaseline ? 'ring-2 ring-[#006C35] ring-inset' : ''}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold">
                          {val > 0 && metric === 'balance' ? `+${val}` : val}%
                        </span>
                        {isBaseline && (
                          <span className="text-[9px] text-[#006C35] font-bold mt-0.5">النقطة المركزية</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-200 border border-emerald-400 inline-block"></span>
            فائض مالي مريح
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-slate-200 border border-slate-300 inline-block"></span>
            توازن معتدل
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-200 border border-amber-400 inline-block"></span>
            عجز معتاد
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-200 border border-red-400 inline-block"></span>
            عجز مرتفع
          </span>
        </div>
        <span className="font-mono text-slate-700">
          سعر النفط المحقق للتعادل المالي التقديري (Fiscal Breakeven): ~81$
        </span>
      </div>
    </div>
  );
};
