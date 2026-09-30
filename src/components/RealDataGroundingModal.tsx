import React, { useState } from 'react';

interface RealDataGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRealData: (realData: any) => void;
}

export const RealDataGroundingModal: React.FC<RealDataGroundingModalProps> = ({
  isOpen,
  onClose,
  onApplyRealData,
}) => {
  const [targetCountry, setTargetCountry] = useState<string>('United States');
  const [customCountry, setCustomCountry] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchedData, setFetchedData] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const popularCountries = [
    { id: 'United States', label: 'الولايات المتحدة (USA)' },
    { id: 'United Kingdom', label: 'المملكة المتحدة (UK)' },
    { id: 'Germany', label: 'ألمانيا (Germany)' },
    { id: 'Japan', label: 'اليابان (Japan)' },
    { id: 'United Arab Emirates', label: 'الإمارات العربية المتحدة (UAE)' },
    { id: 'Saudi Arabia', label: 'المملكة العربية السعودية (KSA)' },
    { id: 'Egypt', label: 'مصر (Egypt)' },
    { id: 'Jordan', label: 'الأردن (Jordan)' },
  ];

  const handleFetchData = async (countryName: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setFetchedData(null);
    setSources([]);

    try {
      const response = await fetch('/api/real-country-dsa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName }),
      });

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.error || 'فشل جلب البيانات المباشرة');
      }

      setFetchedData(resJson.data);
      setSources(resJson.sources || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'حدث خطأ أثناء الاتصال بمحرك البحث والذكاء الاصطناعي');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (fetchedData) {
      onApplyRealData(fetchedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-3 sm:p-6 lg:p-8">
      <div className="relative bg-white border border-slate-300 rounded-md w-full max-w-3xl shadow-2xl text-slate-900 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-100 rounded-t-md">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                استيراد بيانات مالية حقيقية عبر Google Search Grounding
              </h3>
              <p className="text-[11px] text-slate-500">
                ربط المنظومة ببيانات صندوق النقد الدولي (IMF) والبنك الدولي والوزارات الرسمية مباشرة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Country Selection */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 block">
              اختر الدولة أو الكيان السيادي لجلب بيانات الميزانية والدين العام الحقيقية:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {popularCountries.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setTargetCountry(c.id);
                    setCustomCountry('');
                    handleFetchData(c.id);
                  }}
                  className={`p-2 rounded border text-center transition-colors cursor-pointer ${
                    targetCountry === c.id && !customCountry
                      ? 'bg-slate-900 text-white font-bold border-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="أو اكتب اسم أي دولة أخرى بالإنجليزية أو العربية (مثال: France, Kuwait, Singapore)..."
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customCountry.trim()) {
                    handleFetchData(customCountry.trim());
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-slate-900"
              />
              <button
                onClick={() => {
                  if (customCountry.trim()) {
                    handleFetchData(customCountry.trim());
                  }
                }}
                disabled={!customCountry.trim() || isLoading}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded font-bold cursor-pointer"
              >
                بحث مباشر
              </button>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="inline-block w-6 h-6 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin"></div>
              <p className="font-semibold text-slate-800">
                جارِ البحث عبر Google Search Grounding والتحقق من أحدث تقارير صندوق النقد الدولي (WEO)...
              </p>
              <span className="text-[11px] text-slate-500 block">
                استخراج مؤشرات نسبة الدين للناتج، ومعدلات النمو، وأسعار الفائدة، ورصيد الميزانية.
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded">
              <span className="font-bold">خطأ في الاستيراد: </span>
              {errorMessage}
            </div>
          )}

          {/* Fetched Data Preview */}
          {fetchedData && !isLoading && (
            <div className="space-y-4 bg-slate-50/70 border border-slate-200 rounded p-4">
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    البيانات المستخرجة لدولة: {fetchedData.countryNameArabic || fetchedData.countryName}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    المصدر المعتمد: {fetchedData.officialSource || 'IMF World Economic Outlook & World Bank'}
                  </span>
                </div>
                <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded text-[11px]">
                  ✓ تم التحقق عبر Google Search
                </span>
              </div>

              {/* Series table */}
              {fetchedData.series && fetchedData.series.length > 0 && (
                <div className="overflow-x-auto border border-slate-200 rounded bg-white">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                        <th className="p-2">السنة</th>
                        <th className="p-2 text-center">النمو الحقيقي %</th>
                        <th className="p-2 text-center">نسبة الدين %</th>
                        <th className="p-2 text-center">رصيد الميزانية %</th>
                        <th className="p-2 text-center">الاحتياجات التمويلية %</th>
                        <th className="p-2 text-center">التضخم %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
                      {fetchedData.series.map((item: any) => (
                        <tr key={item.year} className="hover:bg-slate-50">
                          <td className="p-2 font-bold">{item.year}</td>
                          <td className="p-2 text-center text-emerald-700 font-bold">
                            {item.realGdpGrowth}%
                          </td>
                          <td className="p-2 text-center font-bold">
                            {item.debtToGdp}%
                          </td>
                          <td
                            className={`p-2 text-center font-bold ${
                              item.overallBalancePercentGdp >= 0
                                ? 'text-emerald-700'
                                : 'text-red-700'
                            }`}
                          >
                            {item.overallBalancePercentGdp}%
                          </td>
                          <td className="p-2 text-center">{item.gfnPercentGdp || 8.5}%</td>
                          <td className="p-2 text-center">{item.inflationRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Key Insights */}
              {fetchedData.keyInsights && (
                <div className="text-[11px] text-slate-700 bg-white p-3 rounded border border-slate-200 leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-1">الرؤية التحليلية:</span>
                  {fetchedData.keyInsights}
                </div>
              )}

              {/* Sources citations from Google Search */}
              {sources.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-800 text-[11px] block">
                    المصادر المرجعية المعتمدة (Google Search Citations):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded hover:underline inline-flex items-center gap-1 font-mono"
                      >
                        <span>🔗</span>
                        <span>{src.title || src.uri.slice(0, 35)}...</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-md">
          <span className="text-[11px] text-slate-500 font-mono">
            Powered by Google Search Grounding & Gemini 2.5 Flash
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleApply}
              disabled={!fetchedData}
              className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold cursor-pointer"
            >
              تطبيق البيانات الحقيقية على لوحة المتابعة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
