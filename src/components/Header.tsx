import React from 'react';
import { SovereignCountryProfile } from '../data/realSovereignData';

interface HeaderProps {
  activeTab: 'dsa' | 'mtff' | 'scenario' | 'debt_structure';
  setActiveTab: (tab: 'dsa' | 'mtff' | 'scenario' | 'debt_structure') => void;
  onOpenReportModal: () => void;
  onOpenInspectorModal: () => void;
  selectedCountryId: string;
  onSelectCountry: (id: string) => void;
  countries: SovereignCountryProfile[];
  currencyMode: 'LOCAL' | 'USD';
  setCurrencyMode: (c: 'LOCAL' | 'USD') => void;
  activeCountry: SovereignCountryProfile;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  onOpenInspectorModal,
  selectedCountryId,
  onSelectCountry,
  countries,
  currencyMode,
  setCurrencyMode,
  activeCountry,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Institutional Top Stripe */}
      <div className="bg-slate-900 text-slate-200 px-4 sm:px-8 py-1.5 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-semibold text-white">وزارة المالية وإدارة الدين العام</span>
          <span className="text-slate-500">·</span>
          <span>إطار التخطيط المالي متوسط الأجل (MTFF)</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300 font-medium flex items-center gap-1">
            <span>{activeCountry.flagEmoji}</span>
            <span>{activeCountry.nameArabic}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
          <span className="text-emerald-400 font-sans font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>بيانات حقيقية موثقة (IMF WEO Oct 2024)</span>
          </span>
          <span className="hidden sm:inline text-slate-600">·</span>
          <span className="hidden sm:inline">2022 - 2030م</span>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Sovereign Country Selector & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded bg-slate-900 text-white flex items-center justify-center p-1.5 shadow-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                منظومة التخطيط المالي واستدامة الدين
              </span>
            </div>
            {/* Quick Country Dropdown */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <label htmlFor="country-select" className="text-[10px] text-slate-500 font-bold">
                الدولة السيادية:
              </label>
              <select
                id="country-select"
                value={selectedCountryId}
                onChange={(e) => onSelectCountry(e.target.value)}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 text-xs font-semibold rounded px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-700"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flagEmoji} {c.nameArabic} ({c.currencyCode})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('dsa')}
            className={`transition-colors py-5 border-b-2 cursor-pointer ${
              activeTab === 'dsa'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            استدامة الدين العام (DSA)
          </button>
          <button
            onClick={() => setActiveTab('mtff')}
            className={`transition-colors py-5 border-b-2 cursor-pointer ${
              activeTab === 'mtff'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            إطار الميزانية (MTFF)
          </button>
          <button
            onClick={() => setActiveTab('scenario')}
            className={`transition-colors py-5 border-b-2 cursor-pointer ${
              activeTab === 'scenario'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            نمذجة السيناريوهات واختبارات الجهد
          </button>
          <button
            onClick={() => setActiveTab('debt_structure')}
            className={`transition-colors py-5 border-b-2 cursor-pointer ${
              activeTab === 'debt_structure'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            محفظة الدين وأدوات التمويل
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real Data Inspector Button */}
          <button
            onClick={onOpenInspectorModal}
            title="فحص وتوثيق سلاسل البيانات الحقيقية من صندوق النقد الدولي"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors shadow-2xs cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="hidden sm:inline">توثيق بيانات صندوق النقد (IMF WEO)</span>
            <span className="sm:hidden">توثيق IMF</span>
          </button>

          {/* Currency Switcher */}
          <div className="flex items-center text-xs bg-slate-100 border border-slate-300 rounded p-0.5 font-mono">
            <button
              onClick={() => setCurrencyMode('LOCAL')}
              title={`العملة الرسمية المحلية: ${activeCountry.currencyCode}`}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                currencyMode === 'LOCAL'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activeCountry.currencyCode}
            </button>
            <button
              onClick={() => setCurrencyMode('USD')}
              title="التحويل إلى الدولار الأمريكي للمقارنة الدولية"
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                currencyMode === 'USD'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD $
            </button>
          </div>

          {/* Policy Brief Modal */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="hidden sm:inline">مذكرة السياسات المالية</span>
            <span className="sm:hidden">المذكرة</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="lg:hidden flex overflow-x-auto border-t border-slate-200 px-3 py-1.5 text-xs gap-2 bg-slate-50">
        <button
          onClick={() => setActiveTab('dsa')}
          className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
            activeTab === 'dsa' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'
          }`}
        >
          استدامة الدين (DSA)
        </button>
        <button
          onClick={() => setActiveTab('mtff')}
          className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
            activeTab === 'mtff' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'
          }`}
        >
          إطار الميزانية (MTFF)
        </button>
        <button
          onClick={() => setActiveTab('scenario')}
          className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
            activeTab === 'scenario' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'
          }`}
        >
          السيناريوهات واختبارات الجهد
        </button>
        <button
          onClick={() => setActiveTab('debt_structure')}
          className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
            activeTab === 'debt_structure' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'
          }`}
        >
          محفظة الدين
        </button>
      </div>
    </header>
  );
};
