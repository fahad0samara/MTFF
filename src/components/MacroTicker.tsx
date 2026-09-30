import React, { useState } from 'react';
import { MacroIndicators, FiscalAccountYear } from '../types/fiscal';
import { SovereignCountryProfile } from '../data/realSovereignData';

interface MacroTickerProps {
  macro: MacroIndicators;
  fiscal: FiscalAccountYear;
  onRefreshData?: () => void;
  currencySymbol: string;
  country: SovereignCountryProfile;
}

export const MacroTicker: React.FC<MacroTickerProps> = ({
  macro,
  fiscal,
  onRefreshData,
  country,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    return new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  });

  const handleManualSync = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      const time = new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(time);
      if (onRefreshData) onRefreshData();
    }, 350);
  };

  const isCompliantWithAnchor = fiscal.debtToGdp <= country.fiscalAnchorTarget;

  return (
    <div className="w-full bg-slate-100/90 border-b border-slate-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Institutional Feed Status */}
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-2 h-2 rounded-full bg-[#006C35] inline-block"></span>
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <span>{country.flagEmoji}</span>
            <span>{country.institutionNameArabic}:</span>
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            آخر تحديث: {lastUpdated}
          </span>
          <button
            onClick={handleManualSync}
            disabled={isUpdating}
            className="text-[11px] font-semibold text-[#006C35] hover:text-[#005429] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>↻</span>
            <span>{isUpdating ? 'جارِ التحديث...' : 'تحديث المؤشرات'}</span>
          </button>
        </div>

        {/* Ticker Figures Strip (Clean tabular layout, NO candy pills) */}
        <div className="flex items-center flex-wrap gap-4 text-xs font-mono">
          {/* Item 1: Central Bank Policy Rate OR Oil for hydrocarbon countries */}
          {country.isHydrocarbonEconomy ? (
            <div className="flex items-baseline gap-1 text-slate-700">
              <span className="font-sans text-slate-500 text-[11px]">خام برنت المرجعي:</span>
              <span className="font-bold text-slate-900 tabular-nums">${macro.oilPrice || 77}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1 text-slate-700">
              <span className="font-sans text-slate-500 text-[11px]">{country.centralBankNameArabic}:</span>
              <span className="font-bold text-slate-900 tabular-nums">{country.centralBankRateValue}%</span>
            </div>
          )}

          <span className="text-slate-300">/</span>

          {/* Item 2: 10Y Benchmark Sovereign Yield */}
          <div className="flex items-baseline gap-1 text-slate-700">
            <span className="font-sans text-slate-500 text-[11px]">عائد السندات 10Y:</span>
            <span className="font-bold text-slate-900 tabular-nums">{macro.sovereignYield10Y}%</span>
          </div>

          <span className="text-slate-300">/</span>

          {/* Item 3: Real GDP Growth */}
          <div className="flex items-baseline gap-1 text-slate-700">
            <span className="font-sans text-slate-500 text-[11px]">النمو الحقيقي:</span>
            <span className={`font-bold tabular-nums ${macro.realGdpGrowth >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
              {macro.realGdpGrowth > 0 ? `+${macro.realGdpGrowth}%` : `${macro.realGdpGrowth}%`}
            </span>
          </div>

          <span className="text-slate-300">/</span>

          {/* Item 4: Inflation Rate CPI */}
          <div className="flex items-baseline gap-1 text-slate-700">
            <span className="font-sans text-slate-500 text-[11px]">التضخم (CPI):</span>
            <span className="font-bold text-slate-900 tabular-nums">{macro.inflationRate}%</span>
          </div>

          <span className="text-slate-300">/</span>

          {/* Item 5: Debt to GDP vs Anchor */}
          <div className="flex items-baseline gap-1 text-slate-700">
            <span className="font-sans text-slate-500 text-[11px]">الدين للناتج:</span>
            <span className="font-bold text-slate-900 tabular-nums">{fiscal.debtToGdp}%</span>
            <span className={`font-sans text-[10px] font-bold ${isCompliantWithAnchor ? 'text-emerald-700' : 'text-amber-700'}`}>
              ({isCompliantWithAnchor ? `سليم دون السقف ${country.fiscalAnchorTarget}%` : `متجاوز السقف ${country.fiscalAnchorTarget}%`})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
