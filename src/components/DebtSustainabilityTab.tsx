import React from 'react';
import { FiscalAccountYear, FanChartBand, MacroIndicators } from '../types/fiscal';
import { SovereignCountryProfile } from '../data/realSovereignData';
import { FanChart } from './charts/FanChart';
import { FinancingNeedsChart } from './charts/FinancingNeedsChart';
import { SensitivityMatrix } from './charts/SensitivityMatrix';
import { YieldCurveChart } from './charts/YieldCurveChart';
import { RGDifferentialChart } from './charts/RGDifferentialChart';
import { PeerComparisonChart } from './charts/PeerComparisonChart';
import { DebtDynamicsDecompositionChart } from './charts/DebtDynamicsDecompositionChart';
import { SovereignRiskHeatmap } from './charts/SovereignRiskHeatmap';
import { calculateDebtStabilizingPrimaryBalance } from '../utils/fiscalCalculations';

interface DebtSustainabilityTabProps {
  baselineFiscal: FiscalAccountYear[];
  currentFiscal: FiscalAccountYear[];
  fanBands: FanChartBand[];
  macro: MacroIndicators;
  macroSeries: MacroIndicators[];
  isScenarioActive: boolean;
  activeScenarioName: string;
  currencySymbol: string;
  onNavigateToScenario: () => void;
  country: SovereignCountryProfile;
  onSelectCountry: (id: string) => void;
}

export const DebtSustainabilityTab: React.FC<DebtSustainabilityTabProps> = ({
  baselineFiscal,
  currentFiscal,
  fanBands,
  macro,
  macroSeries,
  isScenarioActive,
  activeScenarioName,
  currencySymbol,
  onNavigateToScenario,
  country,
  onSelectCountry,
}) => {
  const latestForecast = currentFiscal.find((d) => d.year === 2025) || currentFiscal[currentFiscal.length - 1];
  const horizonEnd = currentFiscal[currentFiscal.length - 1];

  const realInterestRate = macro.interestRateEffective - macro.inflationRate;
  const dspbResult = calculateDebtStabilizingPrimaryBalance(
    latestForecast.debtToGdp,
    macro.realGdpGrowth,
    realInterestRate
  );

  const primaryGap = latestForecast.primaryBalancePercentGdp - dspbResult.dspb;
  const isDebtStabilizing = primaryGap >= 0;

  const safetyMargin = Number((country.fiscalAnchorTarget - latestForecast.debtToGdp).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Scenario notification strip if active */}
      {isScenarioActive && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold">تنبيه المحاكاة:</span>
            <span>
              البيانات المعروضة تعكس نتائج سيناريو الاجهاد: <strong>{activeScenarioName}</strong>
            </span>
          </div>
          <button
            onClick={onNavigateToScenario}
            className="text-xs font-semibold text-amber-950 underline hover:text-black cursor-pointer"
          >
            تعديل معايير الصدمة والعودة للأساس ←
          </button>
        </div>
      )}

      {/* Country Policy Context Banner */}
      <div className="bg-slate-900 text-white rounded-md p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{country.flagEmoji}</span>
            <h2 className="text-sm font-bold">
              إطار استدامة الدين السيادي: {country.nameArabic} ({country.nameEnglish})
            </h2>
            <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono text-emerald-400">
              سلسلة موثقة من صندوق النقد الدولي (IMF WEO)
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            {country.policyContext}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono border-t sm:border-t-0 sm:border-r border-slate-800 pt-2 sm:pt-0 sm:pr-4">
          <div>
            <span className="text-slate-400 block text-[10px] font-sans">سقف الدين المستهدف:</span>
            <span className="text-base font-bold text-white">{country.fiscalAnchorTarget}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-sans">تصنيف S&P:</span>
            <span className="text-base font-bold text-emerald-400">{country.creditRatings.sp.rating}</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid (Clean institutional financial stationery cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Debt-to-GDP */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-baseline justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">نسبة الدين إلى الناتج (2025)</span>
            <span className="font-mono text-slate-500">السقف {country.fiscalAnchorTarget}%</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {latestForecast.debtToGdp}%
            </span>
            <span className={`text-xs font-bold ${safetyMargin >= 0 ? 'text-[#006C35]' : 'text-rose-700'}`}>
              {safetyMargin >= 0 ? `+${safetyMargin}% حيز أمان` : `${safetyMargin}% تجاوز`}
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${safetyMargin >= 0 ? 'bg-[#006C35]' : 'bg-rose-600'}`}
              style={{ width: `${Math.min(100, (latestForecast.debtToGdp / (country.fiscalAnchorTarget * 1.2)) * 100)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>المسار حتى 2030م:</span>
            <span className="font-mono font-bold text-slate-800">{horizonEnd.debtToGdp}%</span>
          </div>
        </div>

        {/* KPI 2: Gross Financing Needs (GFN) */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-baseline justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">الاحتياجات التمويلية (GFN)</span>
            <span className="font-mono text-slate-500">معيار IMF &lt; {country.gfnThreshold}%</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {latestForecast.gfnPercentGdp}%
            </span>
            <span className="text-xs font-mono text-slate-500">
              ({latestForecast.grossFinancingNeeds.toLocaleString()} {currencySymbol})
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1e3a8a]"
              style={{ width: `${Math.min(100, (latestForecast.gfnPercentGdp / country.gfnThreshold) * 100)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>أصل الدين المستحق:</span>
            <span className="font-mono font-bold text-slate-800">{latestForecast.debtAmortization.toLocaleString()} {currencySymbol}</span>
          </div>
        </div>

        {/* KPI 3: Debt-Stabilizing Primary Balance */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-baseline justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">الرصيد الأولي المثبت (DSPB)</span>
            <span className={isDebtStabilizing ? 'text-[#006C35] font-bold' : 'text-amber-800 font-bold'}>
              {isDebtStabilizing ? '✓ مستدام' : '⚠ متسع'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {dspbResult.dspb}%
            </span>
            <span className="text-xs text-slate-500">من الناتج</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${isDebtStabilizing ? 'bg-[#006C35]' : 'bg-amber-600'}`}
              style={{ width: '100%' }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>فارق الاستقرار:</span>
            <span className={`font-mono font-bold ${primaryGap >= 0 ? 'text-[#006C35]' : 'text-amber-800'}`}>
              {primaryGap >= 0 ? `+${primaryGap.toFixed(2)}%` : `${primaryGap.toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* KPI 4: Interest Burden */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-baseline justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">عبء الفائدة من الإيرادات</span>
            <span className="font-mono text-slate-500">معيار &lt; 15%</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {latestForecast.totalRevenue > 0 ? ((latestForecast.debtInterest / latestForecast.totalRevenue) * 100).toFixed(1) : '0.0'}%
            </span>
            <span className="text-xs font-mono text-slate-500">
              ({latestForecast.debtInterest.toLocaleString()} {currencySymbol})
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-700"
              style={{ width: `${Math.min(100, (((latestForecast.debtInterest / (latestForecast.totalRevenue || 1)) * 100) / 15) * 100)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>متوسط تكلفة الاقتراض:</span>
            <span className="font-mono font-bold text-slate-800">{macro.interestRateEffective}%</span>
          </div>
        </div>
      </div>

      {/* Chart 1: Fan Chart */}
      <FanChart
        baselineFiscal={baselineFiscal}
        currentFiscal={currentFiscal}
        fanBands={fanBands}
        scenarioName={activeScenarioName}
        isScenarioActive={isScenarioActive}
        debtAnchor={country.fiscalAnchorTarget}
      />

      {/* Chart 2: IMF Debt Dynamics Waterfall Decomposition */}
      <DebtDynamicsDecompositionChart
        country={country}
        fiscalData={currentFiscal}
        macroData={macroSeries}
      />

      {/* Chart 3: IMF Sovereign Risk & Early Warning Heatmap */}
      <SovereignRiskHeatmap
        country={country}
        fiscalData={currentFiscal}
        macro={macro}
      />

      {/* Chart 4: Sovereign Yield Curve Benchmark & Term Structure */}
      <YieldCurveChart country={country} />

      {/* Chart 5: r - g Interest-Growth Differential & Snowball Effect */}
      <RGDifferentialChart
        country={country}
        fiscalData={currentFiscal}
        macroData={macroSeries}
      />

      {/* Chart 6 & 7: Financing Needs and Sensitivity Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancingNeedsChart
          fiscalData={currentFiscal}
          currencySymbol={currencySymbol}
          thresholdGfn={country.gfnThreshold}
        />
        <SensitivityMatrix
          baseGdpGrowth={macro.realGdpGrowth}
          baseOilPrice={macro.oilPrice}
        />
      </div>

      {/* Chart 8: IMF Sovereign Peer Benchmarking */}
      <PeerComparisonChart
        activeCountry={country}
        onSelectCountry={onSelectCountry}
      />

      {/* Institutional Methodology Footnote */}
      <div className="p-4 bg-white border border-slate-200 rounded-md text-xs text-slate-600 space-y-1.5">
        <span className="font-bold text-slate-800 block">
          منهجية تحليل استدامة الدين (DSA) المعتمدة دولياً:
        </span>
        <p className="leading-relaxed">
          تعتمد المنظومة معادلة ديناميكية استدامة الدين العام المعتمدة لدى صندوق النقد الدولي والبنك الدولي:
          <span className="font-mono font-bold text-slate-800 mx-1.5" dir="ltr">
            d_t - d_{'{t-1}'} = [(r - g) / (1 + g)] * d_{'{t-1}'} - pb_t
          </span>
          حيث يمثل <span className="font-mono">d</span> نسبة الدين للناتج، و<span className="font-mono">r</span> معدل الفائدة الحقيقي الفعلي، و<span className="font-mono">g</span> معدل نمو الناتج الحقيقي، و<span className="font-mono">pb</span> رصيد الميزانية الأولي (% من الناتج).
        </p>
      </div>
    </div>
  );
};
