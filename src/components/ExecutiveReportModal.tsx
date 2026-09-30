import React from 'react';
import { FiscalAccountYear, MacroIndicators, ScenarioParameters } from '../types/fiscal';
import { SovereignCountryProfile } from '../data/realSovereignData';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fiscalData: FiscalAccountYear[];
  macroData: MacroIndicators[];
  activeScenario: ScenarioParameters;
  currencySymbol: string;
  country: SovereignCountryProfile;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  fiscalData,
  macroData,
  activeScenario,
  currencySymbol,
  country,
}) => {
  if (!isOpen) return null;

  const f2025 = fiscalData.find((d) => d.year === 2025) || fiscalData[0];
  const f2030 = fiscalData.find((d) => d.year === 2030) || fiscalData[fiscalData.length - 1];

  const handlePrint = () => {
    window.print();
  };

  const isCompliant = f2025.debtToGdp <= country.fiscalAnchorTarget;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-3 sm:p-6 lg:p-8">
      <div className="relative bg-white border border-slate-300 rounded-md w-full max-w-4xl shadow-2xl text-slate-900 flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="no-print flex items-center justify-between p-3.5 border-b border-slate-200 bg-slate-100 rounded-t-md">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
            <span>مذكرة السياسات المالية واستدامة الدين العام (وثيقة رسمية معتمدة)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span>طباعة / حفظ PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Official Government Document Body */}
        <div className="overflow-y-auto p-6 sm:p-10 space-y-6 text-sm bg-white text-slate-900 font-sans">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700 tracking-wide block">
                وزارة المالية · إدارة السياسات المالية الكلية ومكتب إدارة الدين العام
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                مذكرة سياسات استدامة الدين العام وإطار الميزانية متوسط الأجل ({country.nameArabic})
              </h1>
              <p className="text-xs text-slate-600">
                مرفوعة إلى: المجلس الاقتصادي الأعلى واللجنة المالية الوزارية · مستندة إلى بيانات صندوق النقد الدولي الرسمية
              </p>
            </div>

            {/* Treasury Emblem */}
            <div className="w-14 h-14 border border-slate-300 rounded p-2 flex items-center justify-center text-slate-900 bg-slate-50">
              <span className="text-3xl">{country.flagEmoji}</span>
            </div>
          </div>

          {/* Reference metadata strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs font-mono">
            <div>
              <span className="text-slate-500 block font-sans text-[11px]">رقم الوثيقة:</span>
              <span className="font-bold text-slate-900">DMO-{country.id}-MTFF-2026</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans text-[11px]">تاريخ المذكرة:</span>
              <span className="font-bold text-slate-900">سبتمبر ٢٠٢٦م</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans text-[11px]">السيناريو المحاكى:</span>
              <span className="font-bold text-slate-900 font-sans">{activeScenario.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans text-[11px]">مرجع البيانات:</span>
              <span className="font-bold text-emerald-800 font-sans">IMF WEO Oct 2024</span>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-r-3 border-slate-900 pr-2">
              ١. الملخص التنفيذي واستدامة الدين العام (Executive Summary)
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              تؤكد نتائج نمذجة إطار المالية العامة متوسط الأجل (MTFF 2025–2030) لـ <strong>{country.nameArabic}</strong> المستندة
              إلى قواعد بيانات <strong>صندوق النقد الدولي (IMF WEO)</strong> وتقارير وزارة المالية أن نسبة الدين العام إلى
              الناتج المحلي الإجمالي تبلغ <strong>{f2025.debtToGdp}% في عام 2025م</strong>، ويتوقع أن تصل إلى نحو{' '}
              <strong>{f2030.debtToGdp}% بحلول عام 2030م</strong>، مقارنة بالسقف المالي المستهدف البالغ{' '}
              <strong>{country.fiscalAnchorTarget}%</strong>.
            </p>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              كما أن إجمالي الاحتياجات التمويلية السنوية (Gross Financing Needs - GFN) يقدر بـ <strong>{f2025.gfnPercentGdp}% من الناتج</strong>{' '}
              (ما يعادل {f2025.grossFinancingNeeds.toLocaleString()} {currencySymbol})، مقارنة بالعتبة الاحترازية البالغة{' '}
              <strong>{country.gfnThreshold}%</strong>. وتتمتع الدولة بتصنيف ائتماني سيادي عند{' '}
              <strong>{country.creditRatings.sp.rating}</strong> من وكالة S&P Global بنظرة مستقبلية{' '}
              <strong>{country.creditRatings.sp.outlook}</strong>، و <strong>{country.creditRatings.moodys.rating}</strong> من وكالة Moody's.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-r-3 border-slate-900 pr-2">
              ٢. جدول المؤشرات المحورية للتخطيط المالي (2025 - 2030م)
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                    <th className="p-2.5">المؤشر</th>
                    <th className="p-2.5 text-center font-mono">2025</th>
                    <th className="p-2.5 text-center font-mono">2026</th>
                    <th className="p-2.5 text-center font-mono">2027</th>
                    <th className="p-2.5 text-center font-mono">2028</th>
                    <th className="p-2.5 text-center font-mono">2029</th>
                    <th className="p-2.5 text-center font-mono">2030</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px] tabular-nums">
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-900">إجمالي الإيرادات ({currencySymbol})</td>
                    {fiscalData.filter((d) => d.year >= 2025).map((d) => (
                      <td key={d.year} className="p-2.5 text-center">{d.totalRevenue.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-900">إجمالي النفقات ({currencySymbol})</td>
                    {fiscalData.filter((d) => d.year >= 2025).map((d) => (
                      <td key={d.year} className="p-2.5 text-center">{d.totalExpenditure.toLocaleString()}</td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/60 font-bold">
                    <td className="p-2.5 font-sans text-slate-900">الرصيد الكلي (% من الناتج)</td>
                    {fiscalData.filter((d) => d.year >= 2025).map((d) => (
                      <td
                        key={d.year}
                        className={`p-2.5 text-center ${d.overallBalancePercentGdp >= 0 ? 'text-[#006C35]' : 'text-red-700'}`}
                      >
                        {d.overallBalancePercentGdp >= 0 ? `+${d.overallBalancePercentGdp}%` : `${d.overallBalancePercentGdp}%`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-900">الرصيد الأولي (% من الناتج)</td>
                    {fiscalData.filter((d) => d.year >= 2025).map((d) => (
                      <td
                        key={d.year}
                        className={`p-2.5 text-center ${d.primaryBalancePercentGdp >= 0 ? 'text-[#006C35]' : 'text-amber-800'}`}
                      >
                        {d.primaryBalancePercentGdp >= 0 ? `+${d.primaryBalancePercentGdp}%` : `${d.primaryBalancePercentGdp}%`}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-100/60 font-bold">
                    <td className="p-2.5 font-sans text-slate-900">نسبة الدين العام للناتج %</td>
                    {fiscalData.filter((d) => d.year >= 2025).map((d) => (
                      <td key={d.year} className="p-2.5 text-center text-slate-900">{d.debtToGdp}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-900">الاحتياجات التمويلية % GFN</td>
                    {fiscalData.filter((d) => d.year >= 2025).map((d) => (
                      <td key={d.year} className="p-2.5 text-center">{d.gfnPercentGdp}%</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-r-3 border-slate-900 pr-2">
              ٣. التوصيات الاستراتيجية للسياسة المالية (Policy Recommendations)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-bold text-slate-900 block">١. إدارة فجوات الاستحقاق وإعادة التمويل:</span>
                <p className="text-slate-600 leading-relaxed">
                  الحرص على توزيع استحقاقات السندات السيادية وتجنب تركيز أكثر من 15% من إجمالي الديون في سنة مالية واحدة لتقليص مخاطر السيولة.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-bold text-slate-900 block">٢. الحفاظ على الانضباط الأولي (Primary Balance):</span>
                <p className="text-slate-600 leading-relaxed">
                  استهداف رصيد أولي يتوافق مع معدل الاستقرار الديناميكي لتثبيت مسار الدين دون السقف المالي المعتمد ({country.fiscalAnchorTarget}%).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-bold text-slate-900 block">٣. تنويع قاعدة المستثمرين والعملات:</span>
                <p className="text-slate-600 leading-relaxed">
                  مواصلة استقطاب الصناديق السيادية العالمية وتوسيع برامج السندات الخضراء وأدوات التمويل المستدام لخفض كلفة الاقتراض.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-bold text-slate-900 block">٤. تطبيق اختبارات الجهد الدورية:</span>
                <p className="text-slate-600 leading-relaxed">
                  مراجعة مصفوفة حساسية الفائدة وأسعار السلع بصورة ربع سنوية لاكتشاف أي ضغوط مبكرة على خدمة الدين واتخاذ التدابير الاحترازية.
                </p>
              </div>
            </div>
          </section>

          {/* Official Sign-off and Seals */}
          <div className="border-t-2 border-slate-900 pt-6 mt-8 flex flex-wrap items-center justify-between gap-6 text-xs font-sans">
            <div>
              <span className="text-slate-500 block font-medium">الجهة المعدة للتقرير:</span>
              <span className="font-bold text-slate-900 block mt-0.5">
                مكتب إدارة الدين العام ومستشارو السياسات المالية
              </span>
              <span className="text-[11px] text-slate-500 block font-mono mt-0.5">
                المصدر: {country.imfDataCitation}
              </span>
            </div>

            {/* Official sovereign stamp box */}
            <div className="border-2 border-dashed border-slate-400 rounded p-3 text-center min-w-44 text-[11px] font-mono text-slate-700 bg-slate-50">
              <div className="font-bold text-slate-900">اعتماد رسمي للمقابلة / العرض</div>
              <div className="text-[10px] text-slate-500 mt-0.5">بيانات حقيقية موثقة - IMF WEO</div>
              <div className="text-[10px] text-emerald-800 font-bold mt-1">✓ VERIFIED OFFICIAL</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="no-print p-4 border-t border-slate-200 bg-slate-100 flex items-center justify-between text-xs text-slate-500 rounded-b-md">
          <span>المذكرة مهيأة للطباعة المباشرة بصيغة A4 وتصدير PDF بدون شريط الأدوات العلوي.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
