import React, { useState, useEffect } from 'react';
import { DebtTranche, FiscalAccountYear } from '../types/fiscal';
import { SovereignCountryProfile } from '../data/realSovereignData';
import { AmortizationScheduleChart } from './charts/AmortizationScheduleChart';
import { YieldCurveChart } from './charts/YieldCurveChart';
import { DebtMaturityWallChart } from './charts/DebtMaturityWallChart';

interface DebtStructureTabProps {
  currentFiscal: FiscalAccountYear[];
  currencySymbol: string;
  country: SovereignCountryProfile;
}

export const DebtStructureTab: React.FC<DebtStructureTabProps> = ({
  currentFiscal,
  currencySymbol,
  country,
}) => {
  const [tranches, setTranches] = useState<DebtTranche[]>(country.debtTranches);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    setTranches(country.debtTranches);
  }, [country.id]);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newIssuance, setNewIssuance] = useState<Partial<DebtTranche>>({
    name: `سندات سيادية قياسية جديدة 10 سنوات (${country.currencyCode})`,
    type: 'سندات حكومية قياسية (Benchmark Bonds)',
    currency: country.currencyCode,
    couponRate: 4.25,
    issuanceYear: 2025,
    maturityYear: 2035,
    amount: 10.0,
    rateType: 'ثابت (Fixed)',
  });

  const availableCurrencies = Array.from(new Set(['all', country.currencyCode, 'USD', ...tranches.map((t) => t.currency)]));

  const filteredTranches = tranches.filter((t) => {
    const matchesType = filterType === 'all' || t.type.includes(filterType);
    const matchesCurrency = filterCurrency === 'all' || t.currency === filterCurrency;
    const matchesSearch =
      searchTerm.trim() === '' ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesCurrency && matchesSearch;
  });

  const handleAddIssuance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssuance.name || !newIssuance.amount || !newIssuance.couponRate) return;

    const newId = `${country.id}-${new Date().getFullYear()}-${String(tranches.length + 1).padStart(2, '0')}`;
    const trancheToAdd: DebtTranche = {
      id: newId,
      name: newIssuance.name,
      type: newIssuance.type as any,
      currency: newIssuance.currency || country.currencyCode,
      couponRate: Number(newIssuance.couponRate),
      issuanceYear: Number(newIssuance.issuanceYear || 2025),
      maturityYear: Number(newIssuance.maturityYear || 2035),
      amount: Number(newIssuance.amount),
      rateType: newIssuance.rateType as any,
    };

    setTranches([trancheToAdd, ...tranches]);
    setShowAddModal(false);
  };

  const latestFiscal = currentFiscal.find((d) => d.year === 2025) || currentFiscal[0];
  const domesticRatio = latestFiscal.nominalDebt > 0
    ? Math.round((latestFiscal.debtDomestic / latestFiscal.nominalDebt) * 100)
    : 70;
  const externalRatio = 100 - domesticRatio;

  const totalTrancheAmount = tranches.reduce((sum, t) => sum + t.amount, 0);
  const weightedAvgCoupon = totalTrancheAmount > 0
    ? (tranches.reduce((sum, t) => sum + t.couponRate * t.amount, 0) / totalTrancheAmount).toFixed(2)
    : '3.85';

  const fixedAmount = tranches.filter((t) => t.rateType.includes('ثابت') || t.rateType.includes('Fixed')).reduce((sum, t) => sum + t.amount, 0);
  const fixedRatio = totalTrancheAmount > 0 ? Math.round((fixedAmount / totalTrancheAmount) * 100) : 80;

  return (
    <div className="space-y-6">
      {/* Portfolio Structure KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            توزيع الدين (محلي مقابل خارجي)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold font-mono text-slate-900">
              {domesticRatio}% محلي / {externalRatio}% خارجي
            </span>
          </div>
          <div className="mt-2.5 flex h-2 rounded-full overflow-hidden bg-slate-100">
            <div className="bg-[#006C35]" style={{ width: `${domesticRatio}%` }}></div>
            <div className="bg-[#1e3a8a]" style={{ width: `${externalRatio}%` }}></div>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            مؤشر الحماية من تقلبات أسعار الصرف العالمية
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            متوسط سعر الكوبون المرجح
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {weightedAvgCoupon}%
            </span>
            <span className="text-xs text-slate-500">تكلفة التمويل الفعلي</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(100, Number(weightedAvgCoupon) * 10)}%` }}></div>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            العائد الفعلي لمحفظة السندات والصكوك
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            هيكل أسعار الفائدة
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold font-mono text-slate-900">
              {fixedRatio}% ثابت / {100 - fixedRatio}% متغير
            </span>
          </div>
          <div className="mt-2.5 flex h-2 rounded-full overflow-hidden bg-slate-100">
            <div className="bg-slate-800" style={{ width: `${fixedRatio}%` }}></div>
            <div className="bg-amber-500" style={{ width: `${100 - fixedRatio}%` }}></div>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            تحصين الميزانية ضد دورات رفع الفائدة
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1 font-medium">
            الجدارة الائتمانية السيادية
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              {country.creditRatings.moodys.rating} / {country.creditRatings.sp.rating}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 font-mono">
            <span>Moody's: {country.creditRatings.moodys.rating}</span>
            <span>S&P: {country.creditRatings.sp.rating}</span>
            <span>Fitch: {country.creditRatings.fitch.rating}</span>
          </div>
          <span className="text-[11px] text-emerald-800 block mt-1 font-bold">
            نظرة مستقبلية: {country.creditRatings.sp.outlook}
          </span>
        </div>
      </div>

      {/* Amortization Schedule Chart */}
      <AmortizationScheduleChart tranches={tranches} currencySymbol={currencySymbol} />

      {/* Sovereign Debt Maturity Wall & Refinancing Profile */}
      <DebtMaturityWallChart
        tranches={tranches}
        currencySymbol={currencySymbol}
        country={country}
      />

      {/* Sovereign Yield Curve & Term Structure */}
      <YieldCurveChart country={country} />

      {/* Tranches Management Table */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>سجل أدوات الدين السيادي والسندات المصدرة ({country.nameArabic})</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                {tranches.length} أداة مدرجة
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              السندات والصكوك السيادية وأذونات الخزانة المعتمدة في محفظة الدين العام
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors shadow-xs cursor-pointer"
          >
            <span>+</span>
            <span>إضافة إصدار سيادي جديد</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">بحث:</span>
            <input
              type="text"
              placeholder="ابحث بالاسم أو المعرف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-700 w-48 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">الأداة:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 cursor-pointer"
              >
                <option value="all">كافة الأدوات</option>
                <option value="سندات">سندات حكومية</option>
                <option value="صكوك">صكوك سيادية</option>
                <option value="أذونات">أذونات خزانة (T-Bills)</option>
                <option value="جيلت">سندات جيلت (Gilts)</option>
                <option value="JGB">سندات JGBs</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">العملة:</span>
              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 cursor-pointer"
              >
                {availableCurrencies.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'جميع العملات' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-2.5 px-3">معرف الإصدار</th>
                <th className="py-2.5 px-3">اسم الشريحة / السند</th>
                <th className="py-2.5 px-3">نوع الأداة</th>
                <th className="py-2.5 px-3 text-center">العملة</th>
                <th className="py-2.5 px-3 text-center">الكوبون (%)</th>
                <th className="py-2.5 px-3 text-center">سنة الإصدار</th>
                <th className="py-2.5 px-3 text-center">سنة الاستحقاق</th>
                <th className="py-2.5 px-3 text-left">القيمة ({currencySymbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
              {filteredTranches.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 text-slate-500 font-bold">{t.id}</td>
                  <td className="py-3 px-3 font-sans font-medium text-slate-900">{t.name}</td>
                  <td className="py-3 px-3 font-sans text-slate-600">
                    <span className="text-slate-700 font-medium">{t.type}</span>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-700">{t.currency}</td>
                  <td className="py-3 px-3 text-center text-[#006C35] font-bold">{t.couponRate}%</td>
                  <td className="py-3 px-3 text-center text-slate-500">{t.issuanceYear}</td>
                  <td className="py-3 px-3 text-center text-slate-900 font-bold">{t.maturityYear}</td>
                  <td className="py-3 px-3 text-left font-bold text-slate-900">
                    {t.amount.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-md p-6 max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">تسجيل إصدار سيادي جديد في المحفظة</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddIssuance} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم الإصدار:</label>
                <input
                  type="text"
                  required
                  value={newIssuance.name}
                  onChange={(e) => setNewIssuance({ ...newIssuance, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">نوع الأداة:</label>
                  <select
                    value={newIssuance.type}
                    onChange={(e) => setNewIssuance({ ...newIssuance, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  >
                    <option value="سندات حكومية قياسية (Benchmark Bonds)">سندات حكومية قياسية</option>
                    <option value="سندات دولية (Eurobonds)">سندات دولية (Eurobonds)</option>
                    <option value="صكوك سيادية (Sukuk)">صكوك سيادية (Sukuk)</option>
                    <option value="أذونات خزانة محلية (T-Bills)">أذونات خزانة (T-Bills)</option>
                    <option value="سندات جيلت سيادية (Gilts)">سندات جيلت (Gilts)</option>
                    <option value="سندات فيدرالية (Bunds/Bobl)">سندات فيدرالية (Bunds/Bobl)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">عملة الإصدار:</label>
                  <input
                    type="text"
                    required
                    value={newIssuance.currency}
                    onChange={(e) => setNewIssuance({ ...newIssuance, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الكوبون (%):</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={newIssuance.couponRate}
                    onChange={(e) => setNewIssuance({ ...newIssuance, couponRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">سنة الاستحقاق:</label>
                  <input
                    type="number"
                    required
                    value={newIssuance.maturityYear}
                    onChange={(e) => setNewIssuance({ ...newIssuance, maturityYear: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">القيمة (بالمليار):</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newIssuance.amount}
                    onChange={(e) => setNewIssuance({ ...newIssuance, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">هيكل الفائدة:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="rateType"
                      checked={newIssuance.rateType === 'ثابت (Fixed)'}
                      onChange={() => setNewIssuance({ ...newIssuance, rateType: 'ثابت (Fixed)' })}
                    />
                    <span>ثابت (Fixed)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="rateType"
                      checked={newIssuance.rateType === 'متغير (Floating)'}
                      onChange={() => setNewIssuance({ ...newIssuance, rateType: 'متغير (Floating)' })}
                    />
                    <span>متغير (Floating)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer"
                >
                  حفظ في المحفظة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
