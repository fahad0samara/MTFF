import React, { useState } from 'react';
import { FiscalAccountYear } from '../../types/fiscal';

interface StressTestTornadoChartProps {
  baselineFiscal: FiscalAccountYear[];
  currencySymbol: string;
}

interface TornadoShock {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  category: 'macro' | 'fiscal' | 'external' | 'contingent';
  lowDelta: number; // impact of favorable case (% of GDP on 2030 debt)
  highDelta: number; // impact of adverse case (% of GDP on 2030 debt)
  description: string;
}

export const StressTestTornadoChart: React.FC<StressTestTornadoChartProps> = ({
  baselineFiscal,
  currencySymbol,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredShockId, setHoveredShockId] = useState<string | null>(null);

  const base2030 = baselineFiscal.find((f) => f.year === 2030) || baselineFiscal[baselineFiscal.length - 1];
  const baselineDebt2030 = base2030.debtToGdp;

  const shocks: TornadoShock[] = [
    {
      id: 'combined_macro',
      nameArabic: 'صدمة الاقتصاد الكلي والمالية المركبة (Combined Shock)',
      nameEnglish: 'Combined Macro-Fiscal Shock (Growth -1.5%, Rates +200bps, Deficit +1.5%)',
      category: 'macro',
      lowDelta: -3.8,
      highDelta: 14.5,
      description: 'سيناريو الإجهاد الأقصى المعتمد لدى صندوق النقد: اجتماع تباطؤ النمو، رفع تكلفة الاقتراض، واتساع عجز الميزانية معاً.',
    },
    {
      id: 'contingent_liability',
      nameArabic: 'تحقق التزامات طارئة سيادية (Contingent Liabilities)',
      nameEnglish: '10% of GDP Contingent Liability Absorption (SOEs / Banking)',
      category: 'contingent',
      lowDelta: 0.0,
      highDelta: 10.2,
      description: 'تحمل الخزانة العامة لالتزامات ديون الشركات المملوكة للدولة أو ضمانات إعادة رسملة النظام المصرفي.',
    },
    {
      id: 'interest_rate',
      nameArabic: 'صدمة أسعار الفائدة وتكاليف الاقتراض (Interest Rate Hike)',
      nameEnglish: 'Persistent 200 bps Rate Hike on Sovereign Yields',
      category: 'macro',
      lowDelta: -2.4,
      highDelta: 7.8,
      description: 'ارتفاع معدلات الفائدة المرجعية العالمية والمحلية بمقدار 200 نقطة أساس طوال أفق التوقع حتى 2030م.',
    },
    {
      id: 'growth_shock',
      nameArabic: 'تباطؤ نمو الناتج المحلي الإجمالي (Growth Slowdown)',
      nameEnglish: 'Real GDP Growth Shock (-1.5% below baseline for 2 years)',
      category: 'macro',
      lowDelta: -4.1,
      highDelta: 6.9,
      description: 'انخفاض معدل نمو الناتج الحقيقي بمقدار 1.5 نقطة مئوية، مما يقلص الإيرادات الضريبية ويرفع نسبة الدين تلقائياً.',
    },
    {
      id: 'primary_balance',
      nameArabic: 'انزلاق الرصيد الأولي والإنفاق العام (Fiscal Slippage)',
      nameEnglish: 'Primary Balance Deterioration (-1.5% of GDP annually)',
      category: 'fiscal',
      lowDelta: -5.0,
      highDelta: 6.4,
      description: 'تأخر تنفيذ إصلاحات ضبط النفقات أو انخفاض الإيرادات غير النفطية بما يوسع العجز السنوي بنسبة 1.5% من الناتج.',
    },
    {
      id: 'fx_depreciation',
      nameArabic: 'صدمة انخفاض سعر الصرف (FX Depreciation Shock)',
      nameEnglish: '30% Local Currency Depreciation on External Debt',
      category: 'external',
      lowDelta: -1.2,
      highDelta: 5.6,
      description: 'انخفاض سعر صرف العملة المحلية بنسبة 30% مما يرفع القيمة المحاسبية وأعباء سداد الديون المقومة بالعملات الأجنبية.',
    },
  ];

  const filteredShocks =
    selectedCategory === 'all' ? shocks : shocks.filter((s) => s.category === selectedCategory);

  // SVG dimensions
  const width = 760;
  const rowHeight = 44;
  const height = filteredShocks.length * rowHeight + 90;
  const padding = { top: 30, right: 140, bottom: 40, left: 240 };
  const chartWidth = width - padding.left - padding.right;

  // X scale ranges from max negative to max positive delta
  const maxAbsDelta = 16.0;
  const getX = (delta: number) => {
    return padding.left + ((delta + maxAbsDelta) / (2 * maxAbsDelta)) * chartWidth;
  };

  const zeroX = getX(0);

  const activeShock = hoveredShockId ? shocks.find((s) => s.id === hoveredShockId) : shocks[0];

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
            <h3 className="text-sm font-bold text-slate-900">
              مخطط الإعصار لحساسية الديون (Stress-Testing Tornado Diagram)
            </h3>
            <span className="text-[11px] font-mono text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded font-bold">
              IMF DSA Stress Testing Sensitivity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            مقارنة حساسية نسبة الدين العام إلى الناتج بحلول عام 2030م تحت مختلف سيناريوهات الصدمات المعيارية؛ مرتبة تنازلياً حسب درجة الأثر ومستوى المخاطر.
          </p>
        </div>

        {/* Baseline Reference Tag */}
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
          <span className="text-slate-500 font-sans">خط الأساس 2030م:</span>
          <span className="font-bold text-slate-900">{baselineDebt2030}% من الناتج</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-500 font-medium ml-1">تصفية نوع الصدمة:</span>
        {[
          { id: 'all', label: 'كافة الصدمات (6)' },
          { id: 'macro', label: 'صدمات الاقتصاد الكلي' },
          { id: 'fiscal', label: 'صدمات السياسة المالية' },
          { id: 'external', label: 'صدمات الصرف والخارجية' },
          { id: 'contingent', label: 'الالتزامات الطارئة' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tornado SVG */}
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-xs font-mono select-none">
          {/* Vertical Grid lines */}
          {[-15, -10, -5, 0, 5, 10, 15].map((val) => {
            const x = getX(val);
            return (
              <g key={val}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke={val === 0 ? '#334155' : '#f1f5f9'}
                  strokeWidth={val === 0 ? 1.5 : 1}
                  strokeDasharray={val === 0 ? 'none' : '3,3'}
                />
                <text
                  x={x}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px]"
                >
                  {val === 0 ? 'الأساس (0)' : val > 0 ? `+${val}%` : `${val}%`}
                </text>
              </g>
            );
          })}

          {/* Tornado Bars */}
          {filteredShocks.map((shock, idx) => {
            const y = padding.top + idx * rowHeight + 10;
            const isHovered = hoveredShockId === shock.id;

            const leftX = getX(shock.lowDelta);
            const rightX = getX(shock.highDelta);
            const barHeight = 22;

            return (
              <g
                key={shock.id}
                onMouseEnter={() => setHoveredShockId(shock.id)}
                onMouseLeave={() => setHoveredShockId(null)}
                className="cursor-pointer"
              >
                {/* Background Highlight */}
                {isHovered && (
                  <rect
                    x={0}
                    y={y - 4}
                    width={width}
                    height={rowHeight}
                    fill="#f8fafc"
                    rx={4}
                  />
                )}

                {/* Left Label (Arabic Shock Name) */}
                <text
                  x={padding.left - 12}
                  y={y + 14}
                  textAnchor="end"
                  className={`text-[11px] font-sans ${isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-700 font-medium'}`}
                >
                  {shock.nameArabic}
                </text>

                {/* Favorable Wing (Green - left of zero) */}
                {shock.lowDelta < 0 && (
                  <rect
                    x={leftX}
                    y={y}
                    width={zeroX - leftX}
                    height={barHeight}
                    fill="#10b981"
                    opacity={isHovered ? 1 : 0.85}
                    rx={2}
                  />
                )}

                {/* Adverse Wing (Rose - right of zero) */}
                {shock.highDelta > 0 && (
                  <rect
                    x={zeroX}
                    y={y}
                    width={rightX - zeroX}
                    height={barHeight}
                    fill="#e11d48"
                    opacity={isHovered ? 1 : 0.85}
                    rx={2}
                  />
                )}

                {/* Favorable Delta Label */}
                {shock.lowDelta < 0 && (
                  <text
                    x={leftX - 6}
                    y={y + 15}
                    textAnchor="end"
                    className="text-[10px] font-mono font-bold fill-emerald-800"
                  >
                    {shock.lowDelta}%
                  </text>
                )}

                {/* Adverse Delta Label & 2030 Debt Value */}
                <text
                  x={rightX + 6}
                  y={y + 15}
                  textAnchor="start"
                  className="text-[10px] font-mono font-bold fill-rose-800"
                >
                  +{shock.highDelta}% ({Number((baselineDebt2030 + shock.highDelta).toFixed(1))}%)
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Details */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#10b981] rounded-xs"></span>
            <span className="text-slate-700">السيناريو الإيجابي (تراجع الدين)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#e11d48] rounded-xs"></span>
            <span className="text-slate-700">السيناريو المعاكس المجهد (ارتفاع الدين)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-0.5 h-3 bg-[#334155]"></span>
            <span className="text-slate-700 font-bold">خط الأساس (Baseline)</span>
          </div>
        </div>

        {activeShock && (
          <p className="text-[11px] text-slate-600 max-w-xl">
            <strong className="text-slate-800">{activeShock.nameArabic}: </strong>
            {activeShock.description}
          </p>
        )}
      </div>
    </div>
  );
};
