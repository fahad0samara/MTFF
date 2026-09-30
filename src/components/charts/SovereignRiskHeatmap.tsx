import React, { useState } from 'react';
import { FiscalAccountYear, MacroIndicators } from '../../types/fiscal';
import { SovereignCountryProfile } from '../../data/realSovereignData';

interface SovereignRiskHeatmapProps {
  country: SovereignCountryProfile;
  fiscalData: FiscalAccountYear[];
  macro: MacroIndicators;
}

interface RiskIndicator {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  pillarArabic: string;
  currentValue: number;
  unit: string;
  benchmarkLow: number;
  benchmarkHigh: number;
  isHigherBetter?: boolean;
  status: 'low' | 'moderate' | 'high';
  explanation: string;
}

export const SovereignRiskHeatmap: React.FC<SovereignRiskHeatmapProps> = ({
  country,
  fiscalData,
  macro,
}) => {
  const [selectedPillar, setSelectedPillar] = useState<string>('all');
  const [hoveredIndicator, setHoveredIndicator] = useState<RiskIndicator | null>(null);

  const latestFiscal = fiscalData.find((f) => f.year === 2025) || fiscalData[fiscalData.length - 1];

  // 1. Debt to GDP
  const debtToGdp = latestFiscal.debtToGdp;
  const debtStatus: 'low' | 'moderate' | 'high' =
    debtToGdp <= country.fiscalAnchorTarget ? 'low' : debtToGdp <= country.fiscalAnchorTarget * 1.25 ? 'moderate' : 'high';

  // 2. Gross Financing Needs
  const gfn = latestFiscal.gfnPercentGdp;
  const gfnStatus: 'low' | 'moderate' | 'high' =
    gfn <= country.gfnThreshold * 0.75 ? 'low' : gfn <= country.gfnThreshold ? 'moderate' : 'high';

  // 3. 10Y Sovereign Yield
  const yield10Y = macro.sovereignYield10Y;
  const yieldStatus: 'low' | 'moderate' | 'high' =
    yield10Y < 4.5 ? 'low' : yield10Y <= 7.0 ? 'moderate' : 'high';

  // 4. Foreign Currency Debt Share (%)
  const foreignShare = latestFiscal.nominalDebt > 0
    ? Number(((latestFiscal.debtExternal / latestFiscal.nominalDebt) * 100).toFixed(1))
    : 25.0;
  const foreignStatus: 'low' | 'moderate' | 'high' =
    foreignShare <= 25.0 ? 'low' : foreignShare <= 50.0 ? 'moderate' : 'high';

  // 5. Short Term Debt / Gross Financing Roll-over (< 1 Year)
  const shortTermShare = latestFiscal.grossFinancingNeeds > 0
    ? Number(((latestFiscal.debtAmortization / latestFiscal.nominalDebt) * 100).toFixed(1))
    : 10.0;
  const shortTermStatus: 'low' | 'moderate' | 'high' =
    shortTermShare <= 10.0 ? 'low' : shortTermShare <= 18.0 ? 'moderate' : 'high';

  // 6. Interest Payment / Total Revenue (%)
  const interestToRev = latestFiscal.totalRevenue > 0
    ? Number(((latestFiscal.debtInterest / latestFiscal.totalRevenue) * 100).toFixed(1))
    : 12.0;
  const interestStatus: 'low' | 'moderate' | 'high' =
    interestToRev <= 10.0 ? 'low' : interestToRev <= 18.0 ? 'moderate' : 'high';

  // 7. Primary Balance Gap relative to debt stabilizing
  const realRate = macro.interestRateEffective - macro.inflationRate;
  const dspb = ((realRate - macro.realGdpGrowth) / (1 + macro.realGdpGrowth / 100)) * (debtToGdp / 100) * 100;
  const pbGap = Number((latestFiscal.primaryBalancePercentGdp - dspb).toFixed(1));
  const pbStatus: 'low' | 'moderate' | 'high' =
    pbGap >= 0 ? 'low' : pbGap >= -2.0 ? 'moderate' : 'high';

  const indicators: RiskIndicator[] = [
    {
      id: 'debt_to_gdp',
      nameArabic: 'نسبة الدين إلى الناتج المحلي',
      nameEnglish: 'Public Debt to GDP Ratio',
      pillarArabic: 'حجم المديونية',
      currentValue: debtToGdp,
      unit: '%',
      benchmarkLow: country.fiscalAnchorTarget,
      benchmarkHigh: country.fiscalAnchorTarget * 1.25,
      status: debtStatus,
      explanation: `السقف المستهدف المعتمد لدى الدولة هو ${country.fiscalAnchorTarget}%. القيمة المحققة هي ${debtToGdp}%.`,
    },
    {
      id: 'gfn',
      nameArabic: 'الاحتياجات التمويلية الإجمالية (GFN)',
      nameEnglish: 'Gross Financing Needs % GDP',
      pillarArabic: 'مخاطر السيولة والتمديد',
      currentValue: gfn,
      unit: '% الناتج',
      benchmarkLow: country.gfnThreshold * 0.75,
      benchmarkHigh: country.gfnThreshold,
      status: gfnStatus,
      explanation: `مجموع عجز الميزانية وأقساط سداد الديون المستحقة خلال العام مقارنة بعتبة أمان صندوق النقد (${country.gfnThreshold}%).`,
    },
    {
      id: 'sovereign_yield',
      nameArabic: 'عائد السندات السيادية 10 سنوات',
      nameEnglish: '10-Year Benchmark Sovereign Yield',
      pillarArabic: 'مخاطر السوق وتكلفة التمويل',
      currentValue: yield10Y,
      unit: '%',
      benchmarkLow: 4.5,
      benchmarkHigh: 7.0,
      status: yieldStatus,
      explanation: 'تسعير السوق للمخاطر السيادية وتكلفة الاقتراض المرجعي طويل الأجل في أسواق السندات الرأسمالية.',
    },
    {
      id: 'fx_exposure',
      nameArabic: 'حصة الدين بالعملات الأجنبية',
      nameEnglish: 'Foreign Currency Debt Share',
      pillarArabic: 'مخاطر تقلبات الصرف',
      currentValue: foreignShare,
      unit: '% من إجمالي الدين',
      benchmarkLow: 25.0,
      benchmarkHigh: 50.0,
      status: foreignStatus,
      explanation: 'نسبة الديون المقومة بعملات أجنبية ومدى انكشاف الميزانية العامة على صدمات انخفاض سعر الصرف.',
    },
    {
      id: 'short_term_amort',
      nameArabic: 'مخاطر إعادة التمويل قصيرة الأجل',
      nameEnglish: 'Short-Term Amortization Burden',
      pillarArabic: 'مخاطر السيولة والتمديد',
      currentValue: shortTermShare,
      unit: '% من إجمالي الدين',
      benchmarkLow: 10.0,
      benchmarkHigh: 18.0,
      status: shortTermStatus,
      explanation: 'أصل الدين الواجب سداده أو تدويره خلال الـ 12 شهراً القادمة (جدار الاستحقاقات القريب).',
    },
    {
      id: 'interest_burden',
      nameArabic: 'عبء فوائد الدين من الإيرادات',
      nameEnglish: 'Interest Expense to Government Revenue',
      pillarArabic: 'المرونة والصلابة المالية',
      currentValue: interestToRev,
      unit: '%',
      benchmarkLow: 10.0,
      benchmarkHigh: 18.0,
      status: interestStatus,
      explanation: 'حصة الإيرادات العامة المخصصة لخدمة فوائد الدين؛ المؤشرات فوق 18% تقيد الإنفاق التنموي والاستثماري.',
    },
    {
      id: 'pb_gap',
      nameArabic: 'فجوة الرصيد الأولي المثبت للدين',
      nameEnglish: 'Debt-Stabilizing Primary Balance Gap',
      pillarArabic: 'استدامة المسار متوسط الأجل',
      currentValue: pbGap,
      unit: '% الناتج',
      benchmarkLow: 0.0,
      benchmarkHigh: -2.0,
      isHigherBetter: true,
      status: pbStatus,
      explanation: 'الفارق بين الرصيد الأولي الفعلي للميزانية والرصيد المطلوب رياضياً لتثبيت نسبة الدين دون زيادة.',
    },
  ];

  // Score calculation (0 to 100, where 0 = Lowest Risk, 100 = Highest Distress Risk)
  const riskScores = { low: 10, moderate: 45, high: 90 };
  const overallRiskScore = Math.round(
    indicators.reduce((acc, ind) => acc + riskScores[ind.status], 0) / indicators.length
  );

  const overallRating =
    overallRiskScore < 30 ? 'مخاطر منخفضة (Low Risk)' : overallRiskScore < 60 ? 'مخاطر متوسطة معتدلة (Moderate Risk)' : 'مخاطر مرتفعة تحت المراقبة (High Risk)';
  const overallColor =
    overallRiskScore < 30 ? 'text-emerald-700 bg-emerald-50 border-emerald-300' : overallRiskScore < 60 ? 'text-amber-800 bg-amber-50 border-amber-300' : 'text-rose-800 bg-rose-50 border-rose-300';

  const filteredIndicators =
    selectedPillar === 'all' ? indicators : indicators.filter((ind) => ind.pillarArabic === selectedPillar);

  const uniquePillars = ['all', ...Array.from(new Set(indicators.map((ind) => ind.pillarArabic)))];

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <h3 className="text-sm font-bold text-slate-900">
              مصفوفة الإنذار المبكر ومخاطر الديون السيادية (IMF Sovereign Vulnerability Heatmap)
            </h3>
            <span className="text-[11px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold">
              إطار MAC-DSA المعتمد
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            مصفوفة تقييم شاملة متعددة الأركان ترصد درجات الهشاشة المالية ومخاطر الصدمات الخارجية وفق معايير صندوق النقد الدولي الرسمية للدول ذات الوصول للأسواق المالية.
          </p>
        </div>

        {/* Composite Risk Gauge Badge */}
        <div className={`flex items-center gap-3 px-3 py-1.5 rounded-md border font-mono text-xs ${overallColor}`}>
          <span className="font-bold font-sans">التقييم السيادي الكلي:</span>
          <span className="text-sm font-bold">{overallRating}</span>
          <span className="text-slate-500 font-normal">({overallRiskScore} / 100)</span>
        </div>
      </div>

      {/* Pillar Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-500 font-medium ml-1">تصفية حسب ركن المخاطر:</span>
        {uniquePillars.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPillar(p)}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedPillar === p
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {p === 'all' ? 'كافة مؤشرات الهشاشة (7)' : p}
          </button>
        ))}
      </div>

      {/* Heatmap Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredIndicators.map((ind) => {
          const isLow = ind.status === 'low';
          const isMod = ind.status === 'moderate';
          const isHigh = ind.status === 'high';

          const cardBorder = isLow ? 'border-emerald-200 hover:border-emerald-300' : isMod ? 'border-amber-200 hover:border-amber-300' : 'border-rose-200 hover:border-rose-300';
          const badgeBg = isLow ? 'bg-emerald-100 text-emerald-800' : isMod ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-900';
          const statusText = isLow ? 'منخفض المخاطر (Safe)' : isMod ? 'مخاطر معتدلة (Watchlist)' : 'مرتفع المخاطر (Elevated)';
          const circleColor = isLow ? 'bg-emerald-500' : isMod ? 'bg-amber-500' : 'bg-rose-500';

          return (
            <div
              key={ind.id}
              onMouseEnter={() => setHoveredIndicator(ind)}
              onMouseLeave={() => setHoveredIndicator(null)}
              className={`p-3.5 rounded-md border ${cardBorder} bg-slate-50/50 hover:bg-white transition-all shadow-2xs space-y-2 cursor-pointer`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">{ind.pillarArabic}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeBg}`}>
                  {statusText}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{ind.nameArabic}</h4>
                <span className="text-[10px] text-slate-400 font-mono block">{ind.nameEnglish}</span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                  {ind.currentValue} <span className="text-xs font-sans text-slate-500">{ind.unit}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  العتبة: &lt; {ind.benchmarkLow}
                </span>
              </div>

              {/* Progress bar visual indicating distance to high threshold */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${circleColor}`}
                  style={{ width: `${Math.min(100, Math.max(15, (ind.currentValue / (ind.benchmarkHigh || 1)) * 100))}%` }}
                ></div>
              </div>

              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed pt-1">
                {ind.explanation}
              </p>
            </div>
          );
        })}
      </div>

      {/* Traffic Light Methodology Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-800">مستويات التصنيف (Traffic Lights):</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-700">أخضر (دون العتبة الاحترازية)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-slate-700">برتقالي (منطقة إنذار مبكر)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="text-slate-700">أحمر (تجاوز عتبة الأمان السيادية)</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 font-mono">
          معتمد على أوراق عمل IMF Technical Staff Note on Sovereign Risk
        </span>
      </div>
    </div>
  );
};
