import React, { useState } from 'react';
import { FiscalAccountYear, MacroIndicators } from '../types/fiscal';
import { SovereignCountryProfile } from '../data/realSovereignData';
import { BudgetBarChart } from './charts/BudgetBarChart';
import { FiscalImpulseChart } from './charts/FiscalImpulseChart';
import { evaluateFiscalRules } from '../utils/fiscalCalculations';

interface MediumTermFrameworkTabProps {
  fiscalData: FiscalAccountYear[];
  macroData: MacroIndicators[];
  currencySymbol: string;
  country: SovereignCountryProfile;
}

export const MediumTermFrameworkTab: React.FC<MediumTermFrameworkTabProps> = ({
  fiscalData,
  macroData,
  currencySymbol,
  country,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const activeYearFiscal = fiscalData.find((d) => d.year === selectedYear) || fiscalData[0];
  const activeYearMacro = macroData.find((d) => d.year === selectedYear) || macroData[0];

  const fiscalRules = evaluateFiscalRules(
    activeYearFiscal,
    country.fiscalAnchorTarget,
    country.gfnThreshold
  );

  const handleExportCsv = () => {
    const headers = [
      'السنة المالية (FY)',
      country.revenueLabel1,
      country.revenueLabel2,
      country.revenueLabel3,
      'إجمالي الإيرادات العامة',
      'الرواتب والأجور وتعويضات العاملين',
      'السلع والخدمات والمصاريف التشغيلية',
      'الدعم والمنافع الاجتماعية',
      'الإنفاق الاستثماري والرأسمالي (Capex)',
      'فوائد الدين العام (خدمة الدين)',
      'إجمالي النفقات العامة',
      'الرصيد الكلي للميزانية',
      'نسبة الرصيد للناتج %',
      'الدين العام الاسمي',
      'نسبة الدين للناتج %',
    ];

    const rows = fiscalData.map((d) => [
      d.year,
      d.directTaxRevenue || d.oilRevenue,
      d.indirectTaxRevenue || d.taxRevenue,
      d.nonTaxRevenue,
      d.totalRevenue,
      d.wagesAndSalaries,
      d.goodsAndServices,
      d.subsidiesAndTransfers,
      d.capitalExpenditure,
      d.debtInterest,
      d.totalExpenditure,
      d.overallBalance,
      `${d.overallBalancePercentGdp}%`,
      d.nominalDebt,
      `${d.debtToGdp}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [
        `# إطار الميزانية متوسط الأجل: ${country.nameArabic} (${country.nameEnglish})`,
        `# المصدر الرسمي المعتمد: ${country.imfDataCitation}`,
        headers.join(','),
        ...rows.map((e) => e.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MTFF_${country.id}_2022_2030.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const capexShare = ((activeYearFiscal.capitalExpenditure / (activeYearFiscal.totalExpenditure || 1)) * 100).toFixed(1);
  const wageShare = ((activeYearFiscal.wagesAndSalaries / (activeYearFiscal.totalExpenditure || 1)) * 100).toFixed(1);

  // Indicators customized to economy type
  const taxToGdp = ((activeYearFiscal.taxRevenue / (activeYearMacro.nominalGdp || 1)) * 100).toFixed(1);
  const nonOilRevenue = activeYearFiscal.taxRevenue + activeYearFiscal.nonTaxRevenue;
  const nonOilCoverage = ((nonOilRevenue / (activeYearFiscal.totalExpenditure || 1)) * 100).toFixed(1);

  const rev1Value = activeYearFiscal.directTaxRevenue || activeYearFiscal.oilRevenue;
  const rev2Value = activeYearFiscal.indirectTaxRevenue || (activeYearFiscal.taxRevenue - (activeYearFiscal.directTaxRevenue || 0));

  return (
    <div className="space-y-6">
      {/* Overview Cards (High-contrast Institutional) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            إجمالي الإيرادات العامة ({selectedYear}م)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {activeYearFiscal.totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">{currencySymbol}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between font-mono">
            <span>{country.isHydrocarbonEconomy ? 'نفطي' : 'مباشر'}: {rev1Value.toLocaleString()}</span>
            <span>{country.isHydrocarbonEconomy ? 'غير نفطي' : 'غير مباشر'}: {rev2Value.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Total Expenditure */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            إجمالي النفقات العامة ({selectedYear}م)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {activeYearFiscal.totalExpenditure.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">{currencySymbol}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between font-mono">
            <span>الأجور: {wageShare}%</span>
            <span>الاستثماري (Capex): {capexShare}%</span>
          </div>
        </div>

        {/* Card 3: Fiscal Structure Metric */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            {country.isHydrocarbonEconomy ? 'تغطية الإيراد غير النفطي للنفقات' : 'العبء الضريبي إلى الناتج (Tax-to-GDP)'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {country.isHydrocarbonEconomy ? `${nonOilCoverage}%` : `${taxToGdp}%`}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {country.isHydrocarbonEconomy ? 'مستهدف: > 50%' : 'المتوسط الدولي: 20-30%'}
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0d9488]"
              style={{
                width: `${Math.min(100, country.isHydrocarbonEconomy ? Number(nonOilCoverage) : Number(taxToGdp) * 3)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Card 4: Overall Fiscal Balance */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            رصيد الميزانية الكلي ({selectedYear}م)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                activeYearFiscal.overallBalance >= 0 ? 'text-[#006C35]' : 'text-red-700'
              }`}
            >
              {activeYearFiscal.overallBalance >= 0 ? '+' : ''}
              {activeYearFiscal.overallBalance.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">{currencySymbol}</span>
          </div>
          <div className="mt-2 text-xs font-mono text-slate-500 border-t border-slate-100 pt-2">
            {activeYearFiscal.overallBalancePercentGdp >= 0 ? `+${activeYearFiscal.overallBalancePercentGdp}%` : `${activeYearFiscal.overallBalancePercentGdp}%`} من الناتج الاسمي ({activeYearMacro.nominalGdp.toLocaleString()} {currencySymbol})
          </div>
        </div>
      </div>

      {/* Chart: Budget Evolution */}
      <BudgetBarChart fiscalData={fiscalData} currencySymbol={currencySymbol} />

      {/* Chart: Structural Balance & Fiscal Impulse */}
      <FiscalImpulseChart
        country={country}
        fiscalData={fiscalData}
        macroData={macroData}
      />

      {/* Fiscal Rules Assessment Section (Official Auditor Layout) */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>لوحة امتثال القواعد المالية السيادية (Fiscal Rules Compliance)</span>
              <span className="font-mono text-xs text-slate-500 font-normal">
                [سنة التقييم: {selectedYear}م]
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة التزام السياسة المالية بالقواعد الاحترازية لـ {country.nameArabic} والمعايير الدولية لصندوق النقد.
            </p>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            <span className="text-slate-500 px-2 font-medium">السنة:</span>
            {fiscalData.map((d) => (
              <button
                key={d.year}
                onClick={() => setSelectedYear(d.year)}
                className={`px-2.5 py-1 font-mono rounded transition-colors cursor-pointer ${
                  selectedYear === d.year
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.year}
              </button>
            ))}
          </div>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-2.5 px-3">القاعدة المالية المعتمدة</th>
                <th className="py-2.5 px-3">السقف المستهدف</th>
                <th className="py-2.5 px-3">القيمة المحققة</th>
                <th className="py-2.5 px-3">مستوى الامتثال</th>
                <th className="py-2.5 px-3">التقييم الفني والتوصية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fiscalRules.map((rule, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {rule.ruleArabicName}
                    <span className="block text-[10px] text-slate-400 font-mono font-normal">
                      {rule.ruleName}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-700">
                    {rule.target}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {rule.currentValue} {rule.unit}
                  </td>
                  <td className="py-3 px-3">
                    {rule.status === 'compliant' && (
                      <span className="inline-flex items-center gap-1 text-[#006C35] font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        <span>✓</span> متوافق تماماً
                      </span>
                    )}
                    {rule.status === 'warning' && (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        <span>!</span> نطاق تحذيري
                      </span>
                    )}
                    {rule.status === 'breached' && (
                      <span className="inline-flex items-center gap-1 text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded text-[11px]">
                        <span>✕</span> تجاوز السقف
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-xs leading-relaxed max-w-md">
                    {rule.commentary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed MTFF Ledger Data Table */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              جدول الحسابات الختامية والتوقعات لإطار الميزانية متوسط الأجل ({country.nameArabic} 2022 - 2030م)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              كافة المبالغ بـ ({currencySymbol}) - وفق دليل إحصاءات مالية الحكومة الرسمي (IMF GFSM 2014).
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4 text-[#006C35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>تصدير البيانات (CSV / Excel)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-100 text-slate-800 font-bold">
                <th className="py-2.5 px-3">البند المالي \ السنة المالية</th>
                {fiscalData.map((d) => (
                  <th
                    key={d.year}
                    className={`py-2.5 px-2 text-center font-mono tabular-nums ${
                      d.year === selectedYear ? 'text-[#006C35] bg-emerald-50/60 font-bold' : 'text-slate-700'
                    }`}
                  >
                    {d.year}
                    {d.year <= 2024 ? (
                      <span className="block text-[9px] text-slate-400 font-normal">مدقق</span>
                    ) : (
                      <span className="block text-[9px] text-sky-600 font-normal">تقديري</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
              {/* Revenue Header */}
              <tr className="bg-emerald-50/40 font-sans font-bold text-[#006C35]">
                <td className="py-2 px-3 text-right" colSpan={fiscalData.length + 1}>
                  1. الإيرادات العامة (General Government Revenues)
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2 px-3 text-slate-700 font-sans pr-6">{country.revenueLabel1}</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center">
                    {(d.directTaxRevenue || d.oilRevenue).toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2 px-3 text-slate-700 font-sans pr-6">{country.revenueLabel2}</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center">
                    {(d.indirectTaxRevenue || (d.taxRevenue - (d.directTaxRevenue || 0))).toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2 px-3 text-slate-700 font-sans pr-6">{country.revenueLabel3}</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center">{d.nonTaxRevenue.toLocaleString()}</td>
                ))}
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <td className="py-2 px-3 font-sans">إجمالي الإيرادات العامة</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center font-bold text-[#006C35]">
                    {d.totalRevenue.toLocaleString()}
                  </td>
                ))}
              </tr>

              {/* Expenditure Header */}
              <tr className="bg-slate-100 font-sans font-bold text-slate-800">
                <td className="py-2 px-3 text-right" colSpan={fiscalData.length + 1}>
                  2. النفقات العامة (General Government Expenditures)
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2 px-3 text-slate-700 font-sans pr-6">تعويضات العاملين (الرواتب والأجور)</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center">{d.wagesAndSalaries.toLocaleString()}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2 px-3 text-slate-700 font-sans pr-6">السلع والخدمات والمصاريف التشغيلية</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center">{d.goodsAndServices.toLocaleString()}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2 px-3 text-slate-700 font-sans pr-6">الدعم والإعانات الاجتماعية</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center">{d.subsidiesAndTransfers.toLocaleString()}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2 px-3 text-slate-700 font-sans pr-6">الإنفاق الرأسمالي والاستثماري (Capex)</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center">{d.capitalExpenditure.toLocaleString()}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2 px-3 text-slate-700 font-sans pr-6">فوائد الدين العام (خدمة الدين)</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center font-bold text-red-700">{d.debtInterest.toLocaleString()}</td>
                ))}
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <td className="py-2 px-3 font-sans">إجمالي النفقات العامة</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center font-bold text-slate-900">
                    {d.totalExpenditure.toLocaleString()}
                  </td>
                ))}
              </tr>

              {/* Balances */}
              <tr className="bg-slate-100 font-sans font-bold text-slate-800">
                <td className="py-2 px-3 text-right" colSpan={fiscalData.length + 1}>
                  3. الأرصدة المالية ومؤشرات الدين (Fiscal Balances & Debt)
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 font-bold">
                <td className="py-2 px-3 text-slate-900 font-sans pr-6">الرصيد الكلي للميزانية (فائض / عجز)</td>
                {fiscalData.map((d) => (
                  <td
                    key={d.year}
                    className={`py-2 px-2 text-center ${d.overallBalance >= 0 ? 'text-[#006C35]' : 'text-red-700'}`}
                  >
                    {d.overallBalance >= 0 ? '+' : ''}{d.overallBalance.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2 px-3 text-slate-700 font-sans pr-6">نسبة الرصيد الكلي إلى الناتج المحلي %</td>
                {fiscalData.map((d) => (
                  <td
                    key={d.year}
                    className={`py-2 px-2 text-center ${d.overallBalancePercentGdp >= 0 ? 'text-[#006C35]' : 'text-red-700'}`}
                  >
                    {d.overallBalancePercentGdp >= 0 ? `+${d.overallBalancePercentGdp}%` : `${d.overallBalancePercentGdp}%`}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-2 px-3 text-slate-700 font-sans pr-6">الرصيد الأولي للميزانية (% من الناتج)</td>
                {fiscalData.map((d) => (
                  <td
                    key={d.year}
                    className={`py-2 px-2 text-center font-bold ${d.primaryBalancePercentGdp >= 0 ? 'text-[#006C35]' : 'text-amber-800'}`}
                  >
                    {d.primaryBalancePercentGdp >= 0 ? `+${d.primaryBalancePercentGdp}%` : `${d.primaryBalancePercentGdp}%`}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/80 bg-slate-50/60 font-bold">
                <td className="py-2 px-3 text-slate-900 font-sans pr-6">رصيد الدين العام الاسمي</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center text-slate-900">{d.nominalDebt.toLocaleString()}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50/80 bg-slate-100/60 font-bold">
                <td className="py-2 px-3 text-slate-900 font-sans pr-6">نسبة الدين العام إلى الناتج المحلي الإجمالي %</td>
                {fiscalData.map((d) => (
                  <td key={d.year} className="py-2 px-2 text-center text-slate-900">{d.debtToGdp}%</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
