import React, { useState, useMemo } from 'react';
import { FiscalAccountYear, MacroIndicators, ScenarioParameters } from '../types/fiscal';
import { simulateFiscalTrajectory } from '../utils/fiscalCalculations';

interface SensitivityAnalysisToolProps {
  baselineFiscal: FiscalAccountYear[];
  baselineMacro: MacroIndicators[];
  currencySymbol: string;
  onApplyToSimulation: (params: Partial<ScenarioParameters>) => void;
}

type ShockVariable = 'oil' | 'interest' | 'combined';

export const SensitivityAnalysisTool: React.FC<SensitivityAnalysisToolProps> = ({
  baselineFiscal,
  baselineMacro,
  currencySymbol,
  onApplyToSimulation,
}) => {
  const [selectedVariable, setSelectedVariable] = useState<ShockVariable>('oil');
  const [percentageShock, setPercentageShock] = useState<number>(10); // default +/- 10%
  const [analysisHorizon, setAnalysisHorizon] = useState<2026 | 2028 | 2030>(2030);

  // Reference macro baseline at 2025
  const baseYearMacro = baselineMacro.find((m) => m.year === 2025) || baselineMacro[0];
  const baseOil = baseYearMacro?.oilPrice ?? 75;
  const baseRate = baseYearMacro.interestRateEffective;

  // Calculate simulated data for -Shock% and +Shock%
  const { minusFiscal, plusFiscal, minusParam, plusParam } = useMemo(() => {
    let minusOilAdj = 0;
    let plusOilAdj = 0;
    let minusRateAdj = 0;
    let plusRateAdj = 0;

    const oilDelta = Number(((baseOil * percentageShock) / 100).toFixed(1));
    const rateDelta = Number(((baseRate * percentageShock) / 100).toFixed(2));

    if (selectedVariable === 'oil') {
      minusOilAdj = -oilDelta;
      plusOilAdj = oilDelta;
    } else if (selectedVariable === 'interest') {
      // For interest rate: minus shock means rate drops by rateDelta, plus shock means rate rises by rateDelta
      minusRateAdj = -rateDelta;
      plusRateAdj = rateDelta;
    } else if (selectedVariable === 'combined') {
      // Combined adverse shock: oil drops -10% AND interest rises +10%
      minusOilAdj = -oilDelta;
      minusRateAdj = rateDelta;
      // Combined favorable shock: oil rises +10% AND interest drops -10%
      plusOilAdj = oilDelta;
      plusRateAdj = -rateDelta;
    }

    const minusParams: ScenarioParameters = {
      scenarioId: 'sensitivity_minus',
      name: `حساسية: ${selectedVariable === 'oil' ? `هبوط النفط (-${percentageShock}%)` : selectedVariable === 'interest' ? `انخفاض الفائدة (-${percentageShock}%)` : `صدمة معاكسة مركبة (نفط -${percentageShock}% / فائدة +${percentageShock}%)`}`,
      description: '',
      oilPriceAdjustment: minusOilAdj,
      realGdpGrowthAdjustment: selectedVariable === 'oil' || selectedVariable === 'combined' ? -0.8 : 0,
      borrowingCostAdjustment: minusRateAdj,
      nonOilRevenueEffort: 0,
      wageBillRestraint: 0,
      capexAdjustment: 0,
    };

    const plusParams: ScenarioParameters = {
      scenarioId: 'sensitivity_plus',
      name: `حساسية: ${selectedVariable === 'oil' ? `ارتفاع النفط (+${percentageShock}%)` : selectedVariable === 'interest' ? `ارتفاع الفائدة (+${percentageShock}%)` : `تحسن مركب (نفط +${percentageShock}% / فائدة -${percentageShock}%)`}`,
      description: '',
      oilPriceAdjustment: plusOilAdj,
      realGdpGrowthAdjustment: selectedVariable === 'oil' || selectedVariable === 'combined' ? 0.6 : 0,
      borrowingCostAdjustment: plusRateAdj,
      nonOilRevenueEffort: 0,
      wageBillRestraint: 0,
      capexAdjustment: 0,
    };

    const simMinus = simulateFiscalTrajectory(baselineFiscal, baselineMacro, minusParams);
    const simPlus = simulateFiscalTrajectory(baselineFiscal, baselineMacro, plusParams);

    return {
      minusFiscal: simMinus.fiscal,
      plusFiscal: simPlus.fiscal,
      minusParam: minusParams,
      plusParam: plusParams,
    };
  }, [selectedVariable, percentageShock, baseOil, baseRate]);

  // Extract metrics for baseline, minus, plus for selected horizon
  const baseYearData = baselineFiscal.find((d) => d.year === analysisHorizon)!;
  const minusYearData = minusFiscal.find((d) => d.year === analysisHorizon)!;
  const plusYearData = plusFiscal.find((d) => d.year === analysisHorizon)!;

  // Debt to GDP
  const baseDebt = baseYearData.debtToGdp;
  const minusDebt = minusYearData.debtToGdp;
  const plusDebt = plusYearData.debtToGdp;

  // Fiscal balance
  const baseBalance = baseYearData.overallBalancePercentGdp;
  const minusBalance = minusYearData.overallBalancePercentGdp;
  const plusBalance = plusYearData.overallBalancePercentGdp;

  // Interest expenditure
  const baseInterest = baseYearData.debtInterest;
  const minusInterest = minusYearData.debtInterest;
  const plusInterest = plusYearData.debtInterest;

  // Gross Financing Needs %
  const baseGfn = baseYearData.gfnPercentGdp;
  const minusGfn = minusYearData.gfnPercentGdp;
  const plusGfn = plusYearData.gfnPercentGdp;

  // Nominal Debt
  const baseNominalDebt = baseYearData.nominalDebt;
  const minusNominalDebt = minusYearData.nominalDebt;
  const plusNominalDebt = plusYearData.nominalDebt;

  // Calculate cumulative financing impact 2025-2030
  const cumDeficitBase = baselineFiscal.filter(d => d.year >= 2025).reduce((s, d) => s + Math.max(0, -d.overallBalance), 0);
  const cumDeficitMinus = minusFiscal.filter(d => d.year >= 2025).reduce((s, d) => s + Math.max(0, -d.overallBalance), 0);
  const cumDeficitPlus = plusFiscal.filter(d => d.year >= 2025).reduce((s, d) => s + Math.max(0, -d.overallBalance), 0);

  const cumGapMinus = cumDeficitMinus - cumDeficitBase;
  const cumGapPlus = cumDeficitPlus - cumDeficitBase;

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-900"></span>
            <h3 className="text-sm font-bold text-slate-900">
              أداة تحليل الحساسية لمؤشرات الدين العام (Public Debt Sensitivity Analysis)
            </h3>
            <span className="text-[11px] font-mono text-[#006C35] bg-emerald-50 px-2 py-0.5 rounded font-bold">
              ±{percentageShock}% Shock Elasticity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            قياس كمي دقيق لمدى تأثر مسار الدين العام والفوائد السنوية والفجوة التمويلية بصدمات أسعار النفط أو معدلات الفائدة بنسبة محددة.
          </p>
        </div>

        {/* Horizon selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">أفق القياس:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 font-mono">
            {[2026, 2028, 2030].map((yr) => (
              <button
                key={yr}
                onClick={() => setAnalysisHorizon(yr as 2026 | 2028 | 2030)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  analysisHorizon === yr ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {yr}م
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Control Strip: Variable Selection & Magnitude */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50/70 p-3.5 rounded border border-slate-200 text-xs">
        {/* Variable Switcher (5 cols) */}
        <div className="md:col-span-6 space-y-1.5">
          <span className="text-slate-700 font-semibold block">متغير الصدمة الأساسي:</span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setSelectedVariable('oil')}
              className={`p-2 rounded text-center transition-colors cursor-pointer border ${
                selectedVariable === 'oil'
                  ? 'bg-white text-slate-900 font-bold border-slate-900 shadow-xs'
                  : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'
              }`}
            >
              أسعار النفط (±{percentageShock}%)
              <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                ±{((baseOil * percentageShock) / 100).toFixed(1)}$ / برميل
              </span>
            </button>

            <button
              onClick={() => setSelectedVariable('interest')}
              className={`p-2 rounded text-center transition-colors cursor-pointer border ${
                selectedVariable === 'interest'
                  ? 'bg-white text-slate-900 font-bold border-slate-900 shadow-xs'
                  : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'
              }`}
            >
              معدلات الفائدة (±{percentageShock}%)
              <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                ±{Math.round((baseRate * percentageShock) * 10)} نقطة أساس
              </span>
            </button>

            <button
              onClick={() => setSelectedVariable('combined')}
              className={`p-2 rounded text-center transition-colors cursor-pointer border ${
                selectedVariable === 'combined'
                  ? 'bg-white text-slate-900 font-bold border-slate-900 shadow-xs'
                  : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'
              }`}
            >
              صدمة مركبة متزامنة
              <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                نفط وفائدة معاً
              </span>
            </button>
          </div>
        </div>

        {/* Magnitude Preset Buttons (6 cols) */}
        <div className="md:col-span-6 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 font-semibold">نسبة التغير (الصدمة):</span>
            <span className="font-mono font-bold text-slate-900">
              ±{percentageShock}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[5, 10, 15, 20].map((val) => (
              <button
                key={val}
                onClick={() => setPercentageShock(val)}
                className={`flex-1 py-1.5 font-mono text-center rounded border transition-colors cursor-pointer ${
                  percentageShock === val
                    ? 'bg-slate-900 text-white font-bold border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ±{val}%
                {val === 10 && <span className="block text-[9px] font-sans font-normal text-emerald-200">المعياري</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Sensitivity Impact Table (Side-by-Side: Minus vs Baseline vs Plus) */}
      <div className="overflow-x-auto border border-slate-200 rounded">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
              <th className="p-2.5">المؤشر المالي المحوري</th>
              <th className="p-2.5 text-center font-mono">
                {selectedVariable === 'oil'
                  ? `حالة الانخفاض (-${percentageShock}%)`
                  : selectedVariable === 'interest'
                  ? `حالة الارتفاع (+${percentageShock}%)`
                  : `صدمة معاكسة (${percentageShock}%)`}
              </th>
              <th className="p-2.5 text-center font-mono bg-slate-200/50">
                المسار المرجعي (الأساس {analysisHorizon})
              </th>
              <th className="p-2.5 text-center font-mono">
                {selectedVariable === 'oil'
                  ? `حالة الارتفاع (+${percentageShock}%)`
                  : selectedVariable === 'interest'
                  ? `حالة الانخفاض (-${percentageShock}%)`
                  : `تحسن مركب (${percentageShock}%)`}
              </th>
              <th className="p-2.5 text-center">أقصى تفاوت (Δ Elasticity)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
            {/* 1. Debt-to-GDP */}
            <tr className="hover:bg-slate-50/60">
              <td className="p-2.5 font-sans font-semibold text-slate-900">
                نسبة الدين إلى الناتج (% GDP)
              </td>
              <td className="p-2.5 text-center font-bold text-red-700 bg-red-50/20">
                {minusDebt}%
                <span className="block text-[10px] text-red-600 font-normal">
                  ({(minusDebt - baseDebt > 0 ? '+' : '') + (minusDebt - baseDebt).toFixed(1)}%)
                </span>
              </td>
              <td className="p-2.5 text-center font-bold bg-slate-100/50">
                {baseDebt}%
              </td>
              <td className="p-2.5 text-center font-bold text-[#006C35] bg-emerald-50/20">
                {plusDebt}%
                <span className="block text-[10px] text-emerald-600 font-normal">
                  ({(plusDebt - baseDebt > 0 ? '+' : '') + (plusDebt - baseDebt).toFixed(1)}%)
                </span>
              </td>
              <td className="p-2.5 text-center font-bold text-slate-900 font-sans">
                ±{Math.abs(Number(((minusDebt - plusDebt) / 2).toFixed(1)))}% نقطة مئوية
              </td>
            </tr>

            {/* 2. Nominal Debt Amount */}
            <tr className="hover:bg-slate-50/60">
              <td className="p-2.5 font-sans text-slate-700">
                رصيد الدين الاسمي ({currencySymbol})
              </td>
              <td className="p-2.5 text-center text-red-700 font-bold">
                {minusNominalDebt}
                <span className="block text-[10px] text-red-600 font-normal">
                  ({(minusNominalDebt - baseNominalDebt > 0 ? '+' : '') + (minusNominalDebt - baseNominalDebt)} {currencySymbol})
                </span>
              </td>
              <td className="p-2.5 text-center font-semibold bg-slate-100/50">
                {baseNominalDebt}
              </td>
              <td className="p-2.5 text-center text-[#006C35] font-bold">
                {plusNominalDebt}
                <span className="block text-[10px] text-emerald-600 font-normal">
                  ({(plusNominalDebt - baseNominalDebt > 0 ? '+' : '') + (plusNominalDebt - baseNominalDebt)} {currencySymbol})
                </span>
              </td>
              <td className="p-2.5 text-center text-slate-700 font-sans">
                ±{Math.round(Math.abs(minusNominalDebt - plusNominalDebt) / 2)} {currencySymbol}
              </td>
            </tr>

            {/* 3. Annual Interest Bill */}
            <tr className="hover:bg-slate-50/60">
              <td className="p-2.5 font-sans text-slate-700">
                فاتورة فوائد الدين السنوية ({currencySymbol})
              </td>
              <td className="p-2.5 text-center font-bold text-slate-900">
                {minusInterest}
                <span className="block text-[10px] text-slate-500 font-normal">
                  ({(minusInterest - baseInterest > 0 ? '+' : '') + (minusInterest - baseInterest)} {currencySymbol})
                </span>
              </td>
              <td className="p-2.5 text-center font-semibold bg-slate-100/50">
                {baseInterest}
              </td>
              <td className="p-2.5 text-center font-bold text-slate-900">
                {plusInterest}
                <span className="block text-[10px] text-slate-500 font-normal">
                  ({(plusInterest - baseInterest > 0 ? '+' : '') + (plusInterest - baseInterest)} {currencySymbol})
                </span>
              </td>
              <td className="p-2.5 text-center text-slate-700 font-sans">
                ±{Math.abs(Number(((minusInterest - plusInterest) / 2).toFixed(1)))} {currencySymbol}
              </td>
            </tr>

            {/* 4. Overall Fiscal Balance */}
            <tr className="hover:bg-slate-50/60">
              <td className="p-2.5 font-sans text-slate-700">
                رصيد الميزانية (% الناتج)
              </td>
              <td className="p-2.5 text-center font-bold text-red-700">
                {minusBalance}%
              </td>
              <td className="p-2.5 text-center font-semibold bg-slate-100/50">
                {baseBalance}%
              </td>
              <td className="p-2.5 text-center font-bold text-[#006C35]">
                {plusBalance > 0 ? `+${plusBalance}` : plusBalance}%
              </td>
              <td className="p-2.5 text-center text-slate-700 font-sans">
                ±{Math.abs(Number(((minusBalance - plusBalance) / 2).toFixed(1)))}%
              </td>
            </tr>

            {/* 5. Gross Financing Needs (GFN) */}
            <tr className="hover:bg-slate-50/60">
              <td className="p-2.5 font-sans text-slate-700">
                الاحتياجات التمويلية السنوية (GFN %)
              </td>
              <td className="p-2.5 text-center font-bold text-slate-900">
                {minusGfn}%
              </td>
              <td className="p-2.5 text-center font-semibold bg-slate-100/50">
                {baseGfn}%
              </td>
              <td className="p-2.5 text-center font-bold text-[#006C35]">
                {plusGfn}%
              </td>
              <td className="p-2.5 text-center text-slate-700 font-sans">
                ±{Math.abs(Number(((minusGfn - plusGfn) / 2).toFixed(1)))}%
              </td>
            </tr>

            {/* 6. Cumulative Financing Gap (2025-2030) */}
            <tr className="hover:bg-slate-50/60 bg-slate-50/40">
              <td className="p-2.5 font-sans font-bold text-slate-900">
                الفجوة التمويلية التراكمية (2025-2030)
              </td>
              <td className="p-2.5 text-center font-bold text-red-700">
                {cumGapMinus > 0 ? `+${cumGapMinus}` : cumGapMinus} {currencySymbol}
              </td>
              <td className="p-2.5 text-center font-semibold bg-slate-100/50">
                0 (المسار المرجعي)
              </td>
              <td className="p-2.5 text-center font-bold text-[#006C35]">
                {cumGapPlus > 0 ? `+${cumGapPlus}` : cumGapPlus} {currencySymbol}
              </td>
              <td className="p-2.5 text-center font-bold text-slate-900 font-sans">
                نطاق تذبذب: {Math.abs(cumGapMinus - cumGapPlus)} {currencySymbol}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual Comparative Bars for the 3 States */}
      <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
          <span className="font-bold text-slate-900">
            مقارنة بيانية لنسبة الدين إلى الناتج في عام {analysisHorizon}م تحت أثر الصدمة (±{percentageShock}%)
          </span>
          <span className="font-mono text-slate-500">السقف الاحترازي المعتمد: 35.0%</span>
        </div>

        {/* 3 Comparative Bars */}
        <div className="space-y-2.5 text-xs font-mono">
          {/* Minus Shock */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-sans text-slate-700 font-medium">
                {selectedVariable === 'oil'
                  ? `أثر انخفاض النفط (-${percentageShock}%)`
                  : selectedVariable === 'interest'
                  ? `أثر ارتفاع الفائدة (+${percentageShock}%)`
                  : `صدمة معاكسة مركبة (-${percentageShock}%)`}
              </span>
              <span className="font-bold text-red-700 tabular-nums">
                {minusDebt}% ({minusDebt > 35 ? 'يقترب من السقف' : 'ضمن الحدود'})
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded overflow-hidden">
              <div
                className={`h-full ${minusDebt > 35 ? 'bg-red-600' : 'bg-amber-600'}`}
                style={{ width: `${Math.min(100, (minusDebt / 45) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Baseline */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-sans text-slate-700 font-bold">
                المسار المرجعي الأساسي (Baseline)
              </span>
              <span className="font-bold text-slate-900 tabular-nums">
                {baseDebt}% (مستقر)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded overflow-hidden">
              <div
                className="h-full bg-slate-800"
                style={{ width: `${Math.min(100, (baseDebt / 45) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Plus Shock */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-sans text-slate-700 font-medium">
                {selectedVariable === 'oil'
                  ? `أثر ارتفاع النفط (+${percentageShock}%)`
                  : selectedVariable === 'interest'
                  ? `أثر انخفاض الفائدة (-${percentageShock}%)`
                  : `تحسن مركب (+${percentageShock}%)`}
              </span>
              <span className="font-bold text-[#006C35] tabular-nums">
                {plusDebt}% (انخفاض أسرع في المديونية)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded overflow-hidden">
              <div
                className="h-full bg-[#006C35]"
                style={{ width: `${Math.min(100, (plusDebt / 45) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytical Findings & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded md:col-span-2">
          <span className="font-bold text-slate-900 block mb-1">
            خلاصة قياس المرونة والحساسية لصانع القرار:
          </span>
          <p className="text-slate-600 leading-relaxed">
            {selectedVariable === 'oil' ? (
              <>
                كل تغير بنسبة <strong className="text-slate-900 font-mono">±{percentageShock}%</strong> في أسعار النفط (نحو{' '}
                <strong className="text-slate-900 font-mono">±{((baseOil * percentageShock) / 100).toFixed(1)}$</strong> للبرميل)
                يولد تغيراً بنحو <strong className="text-slate-900 font-mono">±{Math.abs(Number(((minusDebt - plusDebt) / 2).toFixed(1)))}%</strong> في نسبة الدين العام للناتج في عام {analysisHorizon}م،
                ويغير الفجوة التمويلية التراكمية بنحو <strong className="text-slate-900 font-mono">±{Math.round(Math.abs(cumGapMinus - cumGapPlus) / 2)} {currencySymbol}</strong>.
              </>
            ) : selectedVariable === 'interest' ? (
              <>
                كل تغير بنسبة <strong className="text-slate-900 font-mono">±{percentageShock}%</strong> في معدلات الفائدة وتكلفة الاقتراض (نحو{' '}
                <strong className="text-slate-900 font-mono">±{Math.round((baseRate * percentageShock) * 10)} نقطة أساس</strong>)
                يغير فاتورة الفوائد السنوية للدين بنحو <strong className="text-slate-900 font-mono">±{Math.abs(Number(((minusInterest - plusInterest) / 2).toFixed(1)))} {currencySymbol}</strong>،
                ويؤكد أهمية الإبقاء على حصة الديون ذات الفائدة الثابتة فوق 80%.
              </>
            ) : (
              <>
                في سيناريو الصدمة المركبة (انخفاض النفط {percentageShock}% وارتفاع الفائدة {percentageShock}%)، تتسع الاحتياجات التمويلية التراكمية
                بمقدار <strong className="text-red-700 font-mono">+{cumGapMinus} {currencySymbol}</strong>، مما يتطلب تفعيل خطط الضبط المالي الاحترازية.
              </>
            )}
          </p>
        </div>

        {/* Action to apply to main simulation */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between gap-2">
          <div>
            <span className="font-bold text-slate-900 block mb-0.5">تطبيق الصدمة:</span>
            <span className="text-[11px] text-slate-500 block leading-tight">
              تطبيق معايير هذه الصدمة مباشرة على نموذج المحاكاة ومخطط المروحة (Fan Chart).
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onApplyToSimulation(minusParam)}
              className="flex-1 py-1.5 px-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold cursor-pointer transition-colors"
            >
              تطبيق صدمة (-{percentageShock}%)
            </button>
            <button
              onClick={() => onApplyToSimulation(plusParam)}
              className="flex-1 py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer transition-colors"
            >
              تطبيق صدمة (+{percentageShock}%)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
