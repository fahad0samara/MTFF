import React, { useState, useMemo } from 'react';
import { REAL_SOVEREIGN_COUNTRIES, SovereignCountryProfile } from './data/realSovereignData';
import { PRESET_SCENARIOS } from './data/baselineData';
import { ScenarioParameters, MacroIndicators } from './types/fiscal';
import { simulateFiscalTrajectory, generateFanChartBands } from './utils/fiscalCalculations';
import { Header } from './components/Header';
import { MacroTicker } from './components/MacroTicker';
import { DebtSustainabilityTab } from './components/DebtSustainabilityTab';
import { MediumTermFrameworkTab } from './components/MediumTermFrameworkTab';
import { ScenarioModelingTab } from './components/ScenarioModelingTab';
import { DebtStructureTab } from './components/DebtStructureTab';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { VerifiedDataInspectorModal } from './components/VerifiedDataInspectorModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dsa' | 'mtff' | 'scenario' | 'debt_structure'>('dsa');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('USA');
  const [currencyMode, setCurrencyMode] = useState<'LOCAL' | 'USD'>('LOCAL');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isInspectorModalOpen, setIsInspectorModalOpen] = useState(false);

  // Active sovereign country profile with real IMF WEO data
  const activeCountry = useMemo(() => {
    return REAL_SOVEREIGN_COUNTRIES.find((c) => c.id === selectedCountryId) || REAL_SOVEREIGN_COUNTRIES[0];
  }, [selectedCountryId]);

  const [scenarioParams, setScenarioParams] = useState<ScenarioParameters>(PRESET_SCENARIOS[0]);

  // When changing country, reset scenario to baseline
  const handleSelectCountry = (id: string) => {
    setSelectedCountryId(id);
    setScenarioParams(PRESET_SCENARIOS[0]);
  };

  const currencyMultiplier = currencyMode === 'USD' ? (1 / activeCountry.exchangeRateToUSD) : 1;
  const currencySymbol = currencyMode === 'USD'
    ? 'مليار $'
    : `مليار (${activeCountry.currencyCode})`;

  const { fiscal: simulatedFiscal, macro: simulatedMacro } = useMemo(() => {
    return simulateFiscalTrajectory(activeCountry.fiscalSeries, activeCountry.macroSeries, scenarioParams);
  }, [activeCountry, scenarioParams]);

  const displayFiscal = useMemo(() => {
    if (currencyMode === 'LOCAL' || activeCountry.currencyCode === 'USD') return simulatedFiscal;
    return simulatedFiscal.map((f) => ({
      ...f,
      oilRevenue: Math.round(f.oilRevenue * currencyMultiplier),
      taxRevenue: Math.round(f.taxRevenue * currencyMultiplier),
      nonTaxRevenue: Math.round(f.nonTaxRevenue * currencyMultiplier),
      totalRevenue: Math.round(f.totalRevenue * currencyMultiplier),
      wagesAndSalaries: Math.round(f.wagesAndSalaries * currencyMultiplier),
      goodsAndServices: Math.round(f.goodsAndServices * currencyMultiplier),
      subsidiesAndTransfers: Math.round(f.subsidiesAndTransfers * currencyMultiplier),
      capitalExpenditure: Math.round(f.capitalExpenditure * currencyMultiplier),
      debtInterest: Math.round(f.debtInterest * currencyMultiplier),
      totalExpenditure: Math.round(f.totalExpenditure * currencyMultiplier),
      overallBalance: Math.round(f.overallBalance * currencyMultiplier),
      primaryBalance: Math.round(f.primaryBalance * currencyMultiplier),
      nominalDebt: Math.round(f.nominalDebt * currencyMultiplier),
      debtDomestic: Math.round(f.debtDomestic * currencyMultiplier),
      debtExternal: Math.round(f.debtExternal * currencyMultiplier),
      debtAmortization: Math.round(f.debtAmortization * currencyMultiplier),
      grossFinancingNeeds: Math.round(f.grossFinancingNeeds * currencyMultiplier),
    }));
  }, [simulatedFiscal, currencyMultiplier, currencyMode, activeCountry]);

  const displayBaseline = useMemo(() => {
    if (currencyMode === 'LOCAL' || activeCountry.currencyCode === 'USD') return activeCountry.fiscalSeries;
    return activeCountry.fiscalSeries.map((f) => ({
      ...f,
      oilRevenue: Math.round(f.oilRevenue * currencyMultiplier),
      taxRevenue: Math.round(f.taxRevenue * currencyMultiplier),
      nonTaxRevenue: Math.round(f.nonTaxRevenue * currencyMultiplier),
      totalRevenue: Math.round(f.totalRevenue * currencyMultiplier),
      wagesAndSalaries: Math.round(f.wagesAndSalaries * currencyMultiplier),
      goodsAndServices: Math.round(f.goodsAndServices * currencyMultiplier),
      subsidiesAndTransfers: Math.round(f.subsidiesAndTransfers * currencyMultiplier),
      capitalExpenditure: Math.round(f.capitalExpenditure * currencyMultiplier),
      debtInterest: Math.round(f.debtInterest * currencyMultiplier),
      totalExpenditure: Math.round(f.totalExpenditure * currencyMultiplier),
      overallBalance: Math.round(f.overallBalance * currencyMultiplier),
      primaryBalance: Math.round(f.primaryBalance * currencyMultiplier),
      nominalDebt: Math.round(f.nominalDebt * currencyMultiplier),
      debtDomestic: Math.round(f.debtDomestic * currencyMultiplier),
      debtExternal: Math.round(f.debtExternal * currencyMultiplier),
      debtAmortization: Math.round(f.debtAmortization * currencyMultiplier),
      grossFinancingNeeds: Math.round(f.grossFinancingNeeds * currencyMultiplier),
    }));
  }, [activeCountry, currencyMultiplier, currencyMode]);

  const fanBands = useMemo(() => {
    return generateFanChartBands(displayFiscal);
  }, [displayFiscal]);

  const handleRefreshLiveFeed = () => {
    // Subtle realistic market fluctuations
    const deltaYield = Number(((Math.random() - 0.5) * 0.05).toFixed(2));
    setScenarioParams((prev) => ({
      ...prev,
      borrowingCostAdjustment: Number((prev.borrowingCostAdjustment + deltaYield).toFixed(2)),
    }));
  };

  const isScenarioActive = scenarioParams.scenarioId !== 'baseline';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-[#006C35] selection:text-white">
      {/* Sovereign Header with Multi-Country Selector */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenInspectorModal={() => setIsInspectorModalOpen(true)}
        selectedCountryId={selectedCountryId}
        onSelectCountry={handleSelectCountry}
        countries={REAL_SOVEREIGN_COUNTRIES}
        currencyMode={currencyMode}
        setCurrencyMode={setCurrencyMode}
        activeCountry={activeCountry}
      />

      {/* Real-time Macro Indicator Ticker */}
      <MacroTicker
        macro={simulatedMacro[3] || activeCountry.macroSeries[3]}
        fiscal={displayFiscal[3] || activeCountry.fiscalSeries[3]}
        onRefreshData={handleRefreshLiveFeed}
        currencySymbol={currencySymbol}
        country={activeCountry}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dsa' && (
          <DebtSustainabilityTab
            baselineFiscal={displayBaseline}
            currentFiscal={displayFiscal}
            fanBands={fanBands}
            macro={simulatedMacro[3] || activeCountry.macroSeries[3]}
            macroSeries={activeCountry.macroSeries}
            isScenarioActive={isScenarioActive}
            activeScenarioName={scenarioParams.name}
            currencySymbol={currencySymbol}
            onNavigateToScenario={() => setActiveTab('scenario')}
            country={activeCountry}
            onSelectCountry={handleSelectCountry}
          />
        )}

        {activeTab === 'mtff' && (
          <MediumTermFrameworkTab
            fiscalData={displayFiscal}
            macroData={simulatedMacro}
            currencySymbol={currencySymbol}
            country={activeCountry}
          />
        )}

        {activeTab === 'scenario' && (
          <ScenarioModelingTab
            currentParams={scenarioParams}
            onUpdateParams={setScenarioParams}
            baselineFiscal={displayBaseline}
            baselineMacro={activeCountry.macroSeries}
            simulatedFiscal={displayFiscal}
            currencySymbol={currencySymbol}
          />
        )}

        {activeTab === 'debt_structure' && (
          <DebtStructureTab
            currentFiscal={displayFiscal}
            currencySymbol={currencySymbol}
            country={activeCountry}
          />
        )}
      </main>

      {/* Official Government Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div>
            <span className="font-semibold text-slate-800">
              {activeCountry.nameArabic} ({activeCountry.nameEnglish}) · وزارة المالية وإدارة الدين العام
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              بيانات حقيقية موثقة مستخرجة من تقارير صندوق النقد الدولي (IMF WEO) والمؤسسات الرسمية السيادية (2022 - 2030م)
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
            <button
              onClick={() => setIsInspectorModalOpen(true)}
              className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
            >
              فحص وتدقيق مصادر البيانات (IMF Inspector)
            </button>
            <span>·</span>
            <span>الأفق: 2022 - 2030م</span>
          </div>
        </div>
      </footer>

      {/* Executive Policy Brief Modal */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        fiscalData={displayFiscal}
        macroData={simulatedMacro}
        activeScenario={scenarioParams}
        currencySymbol={currencySymbol}
        country={activeCountry}
      />

      {/* Verified Real Data Source & Methodology Inspector */}
      <VerifiedDataInspectorModal
        isOpen={isInspectorModalOpen}
        onClose={() => setIsInspectorModalOpen(false)}
        country={activeCountry}
      />
    </div>
  );
}
