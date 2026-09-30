import React, { useState, useMemo } from 'react';
import { REAL_SOVEREIGN_COUNTRIES, SovereignCountryProfile } from '../../data/realSovereignData';

interface PeerComparisonChartProps {
  activeCountry: SovereignCountryProfile;
  onSelectCountry: (id: string) => void;
}

type MetricKey = 'debtToGdp' | 'overallBalance' | 'primaryBalance' | 'realGrowth' | 'yield10Y' | 'gfn';

interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  imfCode: string;
  benchmarkRule?: string;
  isLowerBetter: boolean;
}

const METRICS: MetricConfig[] = [
  { key: 'debtToGdp', label: 'نسبة الدين إلى الناتج (% of GDP)', unit: '%', imfCode: 'GGXWDG_NGDP', benchmarkRule: 'معيار ماستريخت 60% / صندوق النقد', isLowerBetter: true },
  { key: 'overallBalance', label: 'عجز / فائض الميزانية الكلي (% من الناتج)', unit: '%', imfCode: 'GGXCNL_NGDP', benchmarkRule: 'سقف العجز 3.0%', isLowerBetter: false },
  { key: 'primaryBalance', label: 'الرصيد الأولي (% من الناتج)', unit: '%', imfCode: 'Primary Balance', benchmarkRule: 'الفوائض الأولية تخفض الدين', isLowerBetter: false },
  { key: 'realGrowth', label: 'معدل نمو الناتج الحقيقي (%)', unit: '%', imfCode: 'NGDP_RPCH', benchmarkRule: 'النمو التنموي المستدام', isLowerBetter: false },
  { key: 'yield10Y', label: 'عائد السندات القياسية 10 سنوات (%)', unit: '%', imfCode: '10Y Sovereign Yield', benchmarkRule: 'تكلفة الاقتراض السيادي طويل الأجل', isLowerBetter: true },
  { key: 'gfn', label: 'الاحتياجات التمويلية السنوية (GFN %)', unit: '%', imfCode: 'Gross Financing Needs', benchmarkRule: 'عتبة الأمان < 15% من الناتج', isLowerBetter: true },
];

export const PeerComparisonChart: React.FC<PeerComparisonChartProps> = ({
  activeCountry,
  onSelectCountry,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('debtToGdp');
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  const activeConfig = METRICS.find((m) => m.key === selectedMetric) || METRICS[0];

  const peerData = useMemo(() => {
    return REAL_SOVEREIGN_COUNTRIES.map((country) => {
      const f = country.fiscalSeries.find((d) => d.year === selectedYear) || country.fiscalSeries[0];
      const m = country.macroSeries.find((d) => d.year === selectedYear) || country.macroSeries[0];

      let value = 0;
      switch (selectedMetric) {
        case 'debtToGdp':
          value = f.debtToGdp;
          break;
        case 'overallBalance':
          value = f.overallBalancePercentGdp;
          break;
        case 'primaryBalance':
          value = f.primaryBalancePercentGdp;
          break;
        case 'realGrowth':
          value = m.realGdpGrowth;
          break;
        case 'yield10Y':
          value = m.sovereignYield10Y;
          break;
        case 'gfn':
          value = f.gfnPercentGdp;
          break;
      }

      return {
        id: country.id,
        nameArabic: country.nameArabic,
        nameEnglish: country.nameEnglish,
        flagEmoji: country.flagEmoji,
        currencyCode: country.currencyCode,
        rating: country.creditRatings.sp.rating,
        value,
        isActive: country.id === activeCountry.id,
      };
    }).sort((a, b) => (activeConfig.isLowerBetter ? a.value - b.value : b.value - a.value));
  }, [selectedMetric, selectedYear, activeCountry.id, activeConfig.isLowerBetter]);

  const maxVal = Math.max(...peerData.map((d) => Math.abs(d.value)), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-900"></span>
            <h3 className="text-sm font-bold text-slate-900">
              المقارنة المعيارية السيادية مع الاقتصادات النظيرة (IMF Sovereign Peer Benchmarking)
            </h3>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold">
              {activeConfig.imfCode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            مقارنة مباشرة ودقيقة بين الاقتصادات الخمسة الكبرى المعتمدة في النظام وفق بيانات صندوق النقد الدولي الرسمية.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">السنة:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 font-mono">
            {[2024, 2025, 2028, 2030].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {yr}م
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Selector Strip */}
      <div className="flex overflow-x-auto gap-1.5 pb-1 text-xs">
        {METRICS.map((metric) => (
          <button
            key={metric.key}
            onClick={() => setSelectedMetric(metric.key)}
            className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedMetric === metric.key
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Peer Comparison Bar Rows */}
      <div className="space-y-3 pt-2">
        {peerData.map((item, index) => {
          const barWidthPercent = Math.min(100, Math.max(6, (Math.abs(item.value) / maxVal) * 100));
          return (
            <div
              key={item.id}
              onClick={() => onSelectCountry(item.id)}
              className={`p-3 rounded border transition-all cursor-pointer ${
                item.isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-800'
                  : 'bg-slate-50/70 hover:bg-slate-100/80 text-slate-900 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.flagEmoji}</span>
                  <span className="font-bold">
                    {item.nameArabic} ({item.nameEnglish})
                  </span>
                  {item.isActive && (
                    <span className="bg-emerald-500 text-slate-900 font-sans text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                      الدولة المحددة حالياً
                    </span>
                  )}
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${item.isActive ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border border-slate-200'}`}>
                    S&P: {item.rating}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold font-mono ${item.isActive ? 'text-white' : 'text-slate-900'}`}>
                    {item.value > 0 && selectedMetric !== 'debtToGdp' && selectedMetric !== 'yield10Y' && selectedMetric !== 'gfn' ? `+${item.value}` : item.value}
                    {activeConfig.unit}
                  </span>
                  <span className={`text-[11px] font-sans ${item.isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                    (الترتيب: {index + 1})
                  </span>
                </div>
              </div>

              {/* Bar track */}
              <div className={`w-full h-2 rounded-full overflow-hidden ${item.isActive ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.isActive
                      ? 'bg-emerald-400'
                      : selectedMetric === 'debtToGdp' && item.value > 100
                      ? 'bg-amber-600'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${barWidthPercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Benchmarking Commentary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div>
          <span className="font-semibold text-slate-700">معيار المقارنة: </span>
          <span>{activeConfig.benchmarkRule}</span>
        </div>
        <div className="text-[11px] text-slate-400 font-sans">
          انقر فوق أي دولة أعلاه لتبديل المنظومة بالكامل فورياً إلى ملفها المالي
        </div>
      </div>
    </div>
  );
};
