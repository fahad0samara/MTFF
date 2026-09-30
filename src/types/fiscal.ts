export interface MacroIndicators {
  year: number;
  realGdpGrowth: number; // percentage, e.g. 3.2%
  nominalGdp: number; // in billions of currency
  inflationRate: number; // percentage
  centralBankRate?: number; // Central bank policy rate (Fed Funds, ECB, SAMA, BOE, BOJ)
  sovereignYield10Y: number; // percentage, e.g. 4.15%
  sovereignYield2Y?: number; // percentage, e.g. 4.05%
  exchangeRate: number; // local currency per USD
  interestRateEffective: number; // effective average interest on public debt
  oilPrice?: number; // USD per barrel (for resource economies)
  oilProduction?: number; // million barrels/day
}

export interface FiscalAccountYear {
  year: number;
  // IMF GFS 2014 Revenue Breakdown
  oilRevenue: number; // Kept for backwards compatibility / resource revenue
  directTaxRevenue?: number; // Taxes on Income, Profits & Capital Gains / Oil for KSA
  indirectTaxRevenue?: number; // Taxes on Goods & Services, VAT & Customs
  taxRevenue: number; // Combined tax revenue
  nonTaxRevenue: number; // Property income, fees, sales of goods & services
  totalRevenue: number;
  
  // Expenditures
  wagesAndSalaries: number;
  goodsAndServices: number;
  subsidiesAndTransfers: number;
  capitalExpenditure: number; // CAPEX
  debtInterest: number;
  totalExpenditure: number;
  
  // Balances
  primaryBalance: number; // Revenue - (Expenditure - debtInterest)
  overallBalance: number; // Revenue - Expenditure
  primaryBalancePercentGdp: number;
  overallBalancePercentGdp: number;
  
  // Debt
  nominalDebt: number;
  debtToGdp: number; // percentage
  debtDomestic: number;
  debtExternal: number;
  
  // Financing
  debtAmortization: number; // Principal repayment
  grossFinancingNeeds: number; // Deficit + Amortization
  gfnPercentGdp: number;
}

export interface DebtTranche {
  id: string;
  name: string;
  type:
    | 'سندات دولية (Eurobonds)'
    | 'صكوك سيادية (Sukuk)'
    | 'أذونات خزانة محلية (T-Bills)'
    | 'سندات حكومية قياسية (Benchmark Bonds)'
    | 'سندات جيلت سيادية (Gilts)'
    | 'سندات فيدرالية (Bunds/Bobl)'
    | 'سندات خزانة محلية (JGBs)'
    | 'قروض تنموية ثنائية (Bilateral)'
    | 'سندات تنمية حكومية (Dev Bonds)';
  currency: string;
  couponRate: number; // %
  issuanceYear: number;
  maturityYear: number;
  amount: number; // in billions
  rateType: 'ثابت (Fixed)' | 'متغير (Floating)';
}

export interface ScenarioParameters {
  scenarioId: string;
  name: string;
  description: string;
  oilPriceAdjustment: number; // e.g. -20 USD
  realGdpGrowthAdjustment: number; // e.g. -1.5%
  borrowingCostAdjustment: number; // e.g. +1.5%
  nonOilRevenueEffort: number; // percentage increase e.g. +10%
  wageBillRestraint: number; // percentage cap reduction e.g. -5%
  capexAdjustment: number; // adjustment in capital expenditure %
}

export interface FanChartBand {
  year: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
}

export type FiscalRuleStatus = 'compliant' | 'warning' | 'breached';

export interface FiscalRuleAssessment {
  ruleName: string;
  ruleArabicName: string;
  target: string;
  currentValue: number;
  unit: string;
  status: FiscalRuleStatus;
  commentary: string;
}
