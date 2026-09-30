import React from 'react';
import { ScenarioParameters, FiscalAccountYear, MacroIndicators } from '../types/fiscal';
import { PRESET_SCENARIOS } from '../data/baselineData';
import { FanChart } from './charts/FanChart';
import { generateFanChartBands } from '../utils/fiscalCalculations';
import { SensitivityAnalysisTool } from './SensitivityAnalysisTool';
import { StressTestTornadoChart } from './charts/StressTestTornadoChart';

interface ScenarioModelingTabProps {
  currentParams: ScenarioParameters;
  onUpdateParams: (newParams: ScenarioParameters) => void;
  baselineFiscal: FiscalAccountYear[];
  baselineMacro: MacroIndicators[];
  simulatedFiscal: FiscalAccountYear[];
  currencySymbol: string;
}

export const ScenarioModelingTab: React.FC<ScenarioModelingTabProps> = ({
  currentParams,
  onUpdateParams,
  baselineFiscal,
  baselineMacro,
  simulatedFiscal,
  currencySymbol,
}) => {
  const isCustomOrNonBaseline = currentParams.scenarioId !== 'baseline';

  const handleSelectPreset = (preset: ScenarioParameters) => {
    onUpdateParams({ ...preset });
  };

  const handleResetToBaseline = () => {
    const baseline = PRESET_SCENARIOS[0];
    onUpdateParams({ ...baseline });
  };

  const updateSingleParam = (key: keyof ScenarioParameters, val: number) => {
    onUpdateParams({
      ...currentParams,
      scenarioId: 'custom',
      name: 'سيناريو مخصص لصناع القرار (Custom Stress Test)',
      description: 'سيناريو تم تعديل متغيراته الكلية يدوياً لاختبار مرونة السياسة المالية.',
      [key]: val,
    });
  };

  const sim2026 = simulatedFiscal.find((d) => d.year === 2026)!;
  const base2026 = baselineFiscal.find((d) => d.year === 2026)!;

  const sim2030 = simulatedFiscal.find((d) => d.year === 2030)!;
  const base2030 = baselineFiscal.find((d) => d.year === 2030)!;

  const debtDelta2030 = Number((sim2030.debtToGdp - base2030.debtToGdp).toFixed(1));

  const baseCumulativeDeficit = baselineFiscal
    .filter((d) => d.year >= 2025)
    .reduce((sum, d) => sum + Math.max(0, -d.overallBalance), 0);
  const simCumulativeDeficit = simulatedFiscal
    .filter((d) => d.year >= 2025)
    .reduce((sum, d) => sum + Math.max(0, -d.overallBalance), 0);
  const cumulativeGap = simCumulativeDeficit - baseCumulativeDeficit;

  const fanBands = generateFanChartBands(simulatedFiscal);

  return (
    <div className="space-y-6">
      {/* Presets and Scenarios Header */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>أداة نمذجة السيناريوهات واختبارات الجهد المالي (Stress Testing Engine)</span>
              {isCustomOrNonBaseline && (
                <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded font-mono">
                  وضع المحاكاة نشط
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-3xl leading-relaxed">
              نموذج ديناميكي يتيح محاكاة صدمات الاقتصاد الكلي والسياسات المالية وحساب الأثر الفوري على
              مسار الدين والعجز التراكمي حتى عام 2030م.
            </p>
          </div>

          <button
            onClick={handleResetToBaseline}
            disabled={!isCustomOrNonBaseline}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded border border-slate-300 transition-colors cursor-pointer"
          >
            إعادة التعيين للمسار المرجعي
          </button>
        </div>

        {/* Preset Selector Grid */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 block">
            سيناريوهات الإجهاد المعيارية المعتمدة (Stress Test Presets):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESET_SCENARIOS.map((preset) => {
              const isActive = currentParams.scenarioId === preset.scenarioId;
              return (
                <button
                  key={preset.scenarioId}
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-right p-3 rounded border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50/70 border-[#006C35] text-slate-900 ring-1 ring-[#006C35]'
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                    {isActive && <span className="text-[#006C35] text-xs font-bold">✓ مفعّل</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Controls & Live Outcome Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-5 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              معايير الصدمة والسياسات المالية (Shock Parameters)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              حرّك المؤشرات لمشاهدة الاستجابة الفورية لمؤشرات المالية العامة.
            </p>
          </div>

          {/* Slider 1: Oil Price */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-semibold">تعديل سعر برميل النفط:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {currentParams.oilPriceAdjustment > 0 ? `+${currentParams.oilPriceAdjustment}` : currentParams.oilPriceAdjustment} $ للبرميل
              </span>
            </div>
            <input
              type="range"
              min="-35"
              max="35"
              step="5"
              value={currentParams.oilPriceAdjustment}
              onChange={(e) => updateSingleParam('oilPriceAdjustment', Number(e.target.value))}
              className="w-full accent-[#006C35] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-35$ (صدمة هبوط)</span>
              <span>0 (الأساس 75$)</span>
              <span>+35$ (طفرة أسعار)</span>
            </div>
          </div>

          {/* Slider 2: GDP Growth */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-semibold">معدل نمو الناتج الحقيقي:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {currentParams.realGdpGrowthAdjustment > 0
                  ? `+${currentParams.realGdpGrowthAdjustment}`
                  : currentParams.realGdpGrowthAdjustment}%
              </span>
            </div>
            <input
              type="range"
              min="-4.0"
              max="3.0"
              step="0.5"
              value={currentParams.realGdpGrowthAdjustment}
              onChange={(e) => updateSingleParam('realGdpGrowthAdjustment', Number(e.target.value))}
              className="w-full accent-[#006C35] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-4.0% (ركود عميق)</span>
              <span>0.0% (الأساس)</span>
              <span>+3.0% (تسارع نمو)</span>
            </div>
          </div>

          {/* Slider 3: Borrowing Cost */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-semibold">تكلفة الاقتراض وهوامش الفائدة:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {currentParams.borrowingCostAdjustment > 0
                  ? `+${currentParams.borrowingCostAdjustment}`
                  : currentParams.borrowingCostAdjustment}%
              </span>
            </div>
            <input
              type="range"
              min="-1.5"
              max="3.5"
              step="0.25"
              value={currentParams.borrowingCostAdjustment}
              onChange={(e) => updateSingleParam('borrowingCostAdjustment', Number(e.target.value))}
              className="w-full accent-[#1e3a8a] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-1.5% (تيسير)</span>
              <span>0% (مستقر)</span>
              <span>+3.5% (تشديد أسواق)</span>
            </div>
          </div>

          {/* Slider 4: Non-Oil Tax Effort */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-semibold">جهد تعبئة الإيرادات غير النفطية:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {currentParams.nonOilRevenueEffort > 0
                  ? `+${currentParams.nonOilRevenueEffort}`
                  : currentParams.nonOilRevenueEffort}%
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="25"
              step="5"
              value={currentParams.nonOilRevenueEffort}
              onChange={(e) => updateSingleParam('nonOilRevenueEffort', Number(e.target.value))}
              className="w-full accent-[#0d9488] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-10%</span>
              <span>0%</span>
              <span>+25% (إصلاح ضريبي)</span>
            </div>
          </div>

          {/* Slider 5: Wage Bill Restraint */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-semibold">ترشيد كتلة الأجور والرواتب:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {currentParams.wageBillRestraint > 0
                  ? `+${currentParams.wageBillRestraint}`
                  : currentParams.wageBillRestraint}%
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="10"
              step="2.5"
              value={currentParams.wageBillRestraint}
              onChange={(e) => updateSingleParam('wageBillRestraint', Number(e.target.value))}
              className="w-full accent-slate-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-15% (كبح الرواتب)</span>
              <span>0%</span>
              <span>+10% (توسع)</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Outcomes & Impact Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">
                نسبة الدين في 2030م
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {sim2030.debtToGdp}%
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    debtDelta2030 > 0 ? 'text-red-700' : debtDelta2030 < 0 ? 'text-[#006C35]' : 'text-slate-500'
                  }`}
                >
                  {debtDelta2030 > 0 ? `+${debtDelta2030}%` : `${debtDelta2030}%`}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1 font-mono">
                الأساس: {base2030.debtToGdp}%
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">
                الفجوة التمويلية التراكمية (2025-2030)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    cumulativeGap > 0 ? 'text-red-700' : cumulativeGap < 0 ? 'text-[#006C35]' : 'text-slate-900'
                  }`}
                >
                  {cumulativeGap > 0 ? `+${cumulativeGap}` : cumulativeGap}
                </span>
                <span className="text-xs text-slate-500">{currencySymbol}</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                {cumulativeGap > 0 ? 'احتياج تمويلي إضافي' : 'وفر مالي محقق'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">
                رصيد ميزانية 2026م
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    sim2026.overallBalance >= 0 ? 'text-[#006C35]' : 'text-red-700'
                  }`}
                >
                  {sim2026.overallBalance >= 0 ? '+' : ''}
                  {sim2026.overallBalance}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({sim2026.overallBalancePercentGdp}%)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1 font-mono">
                فارق الأساس:{' '}
                {(sim2026.overallBalance - base2026.overallBalance > 0 ? '+' : '') +
                  (sim2026.overallBalance - base2026.overallBalance)}{' '}
                {currencySymbol}
              </span>
            </div>
          </div>

          {/* Scenario Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <span>مقارنة تفصيلية بين المسار المرجعي وسيناريو المحاكاة</span>
              <span className="font-mono text-slate-500 font-normal">الوحدة: {currencySymbol} أو %</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                    <th className="py-2 px-3">المؤشر المالي</th>
                    <th className="py-2 px-2 text-center font-mono">2026 (أساس)</th>
                    <th className="py-2 px-2 text-center font-mono text-amber-900 bg-amber-50/50">2026 (محاكاة)</th>
                    <th className="py-2 px-2 text-center font-mono">2030 (أساس)</th>
                    <th className="py-2 px-2 text-center font-mono text-amber-900 bg-amber-50/50">2030 (محاكاة)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-sans text-slate-700">إجمالي الإيرادات العامة</td>
                    <td className="py-2 px-2 text-center">{base2026.totalRevenue}</td>
                    <td className="py-2 px-2 text-center font-bold text-slate-900 bg-amber-50/30">{sim2026.totalRevenue}</td>
                    <td className="py-2 px-2 text-center">{base2030.totalRevenue}</td>
                    <td className="py-2 px-2 text-center font-bold text-slate-900 bg-amber-50/30">{sim2030.totalRevenue}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-sans text-slate-700">إجمالي النفقات العامة</td>
                    <td className="py-2 px-2 text-center">{base2026.totalExpenditure}</td>
                    <td className="py-2 px-2 text-center font-bold text-slate-900 bg-amber-50/30">{sim2026.totalExpenditure}</td>
                    <td className="py-2 px-2 text-center">{base2030.totalExpenditure}</td>
                    <td className="py-2 px-2 text-center font-bold text-slate-900 bg-amber-50/30">{sim2030.totalExpenditure}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-sans text-slate-700">رصيد الميزانية (فائض / عجز)</td>
                    <td className="py-2 px-2 text-center font-bold text-red-700">{base2026.overallBalance}</td>
                    <td
                      className={`py-2 px-2 text-center font-bold bg-amber-50/30 ${
                        sim2026.overallBalance >= 0 ? 'text-[#006C35]' : 'text-red-700'
                      }`}
                    >
                      {sim2026.overallBalance}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-[#006C35]">+{base2030.overallBalance}</td>
                    <td
                      className={`py-2 px-2 text-center font-bold bg-amber-50/30 ${
                        sim2030.overallBalance >= 0 ? 'text-[#006C35]' : 'text-red-700'
                      }`}
                    >
                      {sim2030.overallBalance >= 0 ? '+' : ''}{sim2030.overallBalance}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 font-bold">
                    <td className="py-2 px-3 font-sans text-slate-900">نسبة الدين إلى الناتج %</td>
                    <td className="py-2 px-2 text-center text-slate-900">{base2026.debtToGdp}%</td>
                    <td className="py-2 px-2 text-center text-amber-900 bg-amber-50/30">{sim2026.debtToGdp}%</td>
                    <td className="py-2 px-2 text-center text-slate-900">{base2030.debtToGdp}%</td>
                    <td className="py-2 px-2 text-center text-amber-900 bg-amber-50/30">{sim2030.debtToGdp}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Public Debt Sensitivity Analysis Tool (±10% Oil / Interest Rate Shock) */}
      <SensitivityAnalysisTool
        baselineFiscal={baselineFiscal}
        baselineMacro={baselineMacro}
        currencySymbol={currencySymbol}
        onApplyToSimulation={(shockParams) =>
          onUpdateParams({
            ...currentParams,
            ...shockParams,
            scenarioId: 'custom',
          })
        }
      />

      {/* Stress-Testing Tornado Sensitivity Chart */}
      <StressTestTornadoChart
        baselineFiscal={baselineFiscal}
        currencySymbol={currencySymbol}
      />

      {/* Fan Chart Projection Bands */}
      <FanChart
        baselineFiscal={baselineFiscal}
        currentFiscal={simulatedFiscal}
        fanBands={fanBands}
        scenarioName={currentParams.name}
        isScenarioActive={isCustomOrNonBaseline}
      />
    </div>
  );
};
