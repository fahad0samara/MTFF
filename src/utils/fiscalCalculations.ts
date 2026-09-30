import { FiscalAccountYear, MacroIndicators, ScenarioParameters, FanChartBand, FiscalRuleAssessment } from '../types/fiscal';

/**
 * Calculates simulated fiscal accounts given scenario parameters applied to baseline
 */
export function simulateFiscalTrajectory(
  baselineFiscal: FiscalAccountYear[],
  baselineMacro: MacroIndicators[],
  params: ScenarioParameters
): { fiscal: FiscalAccountYear[]; macro: MacroIndicators[] } {
  const simulatedFiscal: FiscalAccountYear[] = [];
  const simulatedMacro: MacroIndicators[] = [];

  // Start with historical years (up to 2024 unchanged)
  for (let i = 0; i < baselineFiscal.length; i++) {
    const fYear = baselineFiscal[i];
    const mYear = baselineMacro[i];

    if (fYear.year <= 2024) {
      simulatedFiscal.push({ ...fYear });
      simulatedMacro.push({ ...mYear });
      continue;
    }

    // For forecast years (2025+), apply shocks dynamically
    const prevSimFiscal = simulatedFiscal[simulatedFiscal.length - 1];

    // Macro shocks
    const simRealGdpGrowth = Math.max(-5, mYear.realGdpGrowth + params.realGdpGrowthAdjustment);
    const baseOil = mYear.oilPrice ?? 75;
    const simOilPrice = Math.max(30, baseOil + params.oilPriceAdjustment);
    const simEffectiveRate = Math.max(1, mYear.interestRateEffective + params.borrowingCostAdjustment);
    const simInflation = Math.max(0.5, mYear.inflationRate + (params.realGdpGrowthAdjustment < -1 ? -0.5 : 0.2));
    
    // Nominal GDP growth = (1 + realGrowth)*(1 + inflation) - 1
    const nominalGrowth = ((1 + simRealGdpGrowth / 100) * (1 + simInflation / 100) - 1) * 100;
    const simNominalGdp = Math.round(simulatedMacro[simulatedMacro.length - 1].nominalGdp * (1 + nominalGrowth / 100));

    simulatedMacro.push({
      year: mYear.year,
      realGdpGrowth: Number(simRealGdpGrowth.toFixed(1)),
      nominalGdp: simNominalGdp,
      inflationRate: Number(simInflation.toFixed(1)),
      oilPrice: Number(simOilPrice.toFixed(1)),
      oilProduction: mYear.oilProduction,
      sovereignYield10Y: Number((mYear.sovereignYield10Y + params.borrowingCostAdjustment).toFixed(2)),
      sovereignYield2Y: mYear.sovereignYield2Y !== undefined ? Number((mYear.sovereignYield2Y + params.borrowingCostAdjustment * 0.9).toFixed(2)) : undefined,
      centralBankRate: mYear.centralBankRate,
      exchangeRate: mYear.exchangeRate,
      interestRateEffective: Number(simEffectiveRate.toFixed(2)),
    });

    // Revenue adjustments:
    const gdpRatio = simNominalGdp / (mYear.nominalGdp || 1);
    const taxEffortMult = 1 + params.nonOilRevenueEffort / 100;

    // Direct Tax / Oil Revenue
    let simOilRevenue = 0;
    let simDirectTax = 0;

    if (fYear.oilRevenue > 0) {
      // Hydrocarbon revenue elasticity
      const baseOil = mYear.oilPrice || 75;
      const oilPriceRatio = simOilPrice / baseOil;
      simOilRevenue = Math.round(fYear.oilRevenue * Math.pow(oilPriceRatio, 0.95));
      simDirectTax = simOilRevenue;
    } else {
      simDirectTax = Math.round((fYear.directTaxRevenue || fYear.taxRevenue * 0.6) * gdpRatio * taxEffortMult);
    }

    // Indirect Taxes (VAT, Customs, Sales)
    const simIndirectTax = Math.round((fYear.indirectTaxRevenue || fYear.taxRevenue * 0.4) * gdpRatio * taxEffortMult);
    const simTaxRevenue = simDirectTax + simIndirectTax;
    const simNonTaxRevenue = Math.round(fYear.nonTaxRevenue * gdpRatio * (1 + (params.nonOilRevenueEffort * 0.4) / 100));
    const simTotalRevenue = (fYear.oilRevenue > 0 ? simOilRevenue : 0) + (fYear.oilRevenue > 0 ? Math.round(fYear.taxRevenue * gdpRatio * taxEffortMult) : simTaxRevenue) + simNonTaxRevenue;

    // Expenditure adjustments:
    // Wage bill restraint
    const wageMultiplier = 1 + params.wageBillRestraint / 100;
    const simWages = Math.round(fYear.wagesAndSalaries * wageMultiplier);

    const simGoodsAndServices = Math.round(fYear.goodsAndServices * (1 + (params.realGdpGrowthAdjustment < 0 ? -0.02 : 0)));
    // Subsidies rise if oil or inflation rises, or countercyclical support in recession
    const subsidyCounterCyclical = params.realGdpGrowthAdjustment < -1 ? 15 : 0;
    const simSubsidies = Math.round(fYear.subsidiesAndTransfers + subsidyCounterCyclical);

    // Capex
    const capexMult = 1 + params.capexAdjustment / 100;
    const simCapex = Math.round(fYear.capitalExpenditure * capexMult);

    // Interest on debt: based on previous year's nominal debt * effective interest rate
    const simDebtInterest = Math.round(prevSimFiscal.nominalDebt * (simEffectiveRate / 100));

    const simTotalExpenditure = simWages + simGoodsAndServices + simSubsidies + simCapex + simDebtInterest;

    // Balances
    const simOverallBalance = simTotalRevenue - simTotalExpenditure;
    const simPrimaryBalance = simTotalRevenue - (simTotalExpenditure - simDebtInterest);
    const simPrimaryBalancePercent = Number(((simPrimaryBalance / simNominalGdp) * 100).toFixed(2));
    const simOverallBalancePercent = Number(((simOverallBalance / simNominalGdp) * 100).toFixed(2));

    // Debt accumulation: Previous debt - Overall Balance (if deficit, debt increases)
    const deficitFinancing = simOverallBalance < 0 ? Math.abs(simOverallBalance) : -Math.min(simOverallBalance * 0.7, 50); // some surplus pays down debt
    const simNominalDebt = Math.round(prevSimFiscal.nominalDebt + deficitFinancing);
    const simDebtToGdp = Number(((simNominalDebt / simNominalGdp) * 100).toFixed(1));

    // Domestic vs External split (approx 60/40)
    const simDebtDomestic = Math.round(simNominalDebt * 0.58);
    const simDebtExternal = simNominalDebt - simDebtDomestic;

    // Amortization (typically 7-10% of debt maturing each year)
    const simDebtAmortization = Math.round(prevSimFiscal.nominalDebt * 0.085);
    const simGfn = Math.max(0, -simOverallBalance) + simDebtAmortization;
    const simGfnPercent = Number(((simGfn / simNominalGdp) * 100).toFixed(2));

    simulatedFiscal.push({
      year: fYear.year,
      oilRevenue: simOilRevenue,
      directTaxRevenue: simDirectTax,
      indirectTaxRevenue: simIndirectTax,
      taxRevenue: simTaxRevenue,
      nonTaxRevenue: simNonTaxRevenue,
      totalRevenue: simTotalRevenue,
      wagesAndSalaries: simWages,
      goodsAndServices: simGoodsAndServices,
      subsidiesAndTransfers: simSubsidies,
      capitalExpenditure: simCapex,
      debtInterest: simDebtInterest,
      totalExpenditure: simTotalExpenditure,
      primaryBalance: simPrimaryBalance,
      overallBalance: simOverallBalance,
      primaryBalancePercentGdp: simPrimaryBalancePercent,
      overallBalancePercentGdp: simOverallBalancePercent,
      nominalDebt: simNominalDebt,
      debtToGdp: simDebtToGdp,
      debtDomestic: simDebtDomestic,
      debtExternal: simDebtExternal,
      debtAmortization: simDebtAmortization,
      grossFinancingNeeds: simGfn,
      gfnPercentGdp: simGfnPercent,
    });
  }

  return { fiscal: simulatedFiscal, macro: simulatedMacro };
}

/**
 * Calculates Debt-Stabilizing Primary Balance (DSPB):
 * pb* = (r - g)/(1 + g) * d
 */
export function calculateDebtStabilizingPrimaryBalance(
  debtToGdp: number,
  realGrowth: number,
  realInterestRate: number
): { dspb: number; gap: number } {
  const g = realGrowth / 100;
  const r = realInterestRate / 100;
  
  // pb* as % of GDP
  const dspb = ((r - g) / (1 + g)) * debtToGdp;
  return {
    dspb: Number(dspb.toFixed(2)),
    gap: 0, // calculated against actual pb
  };
}

/**
 * Generates stochastic fan chart percentile bounds for debt-to-GDP projection
 */
export function generateFanChartBands(baselineData: FiscalAccountYear[]): FanChartBand[] {
  return baselineData.map((d, index) => {
    if (d.year <= 2024) {
      return {
        year: d.year,
        p10: d.debtToGdp,
        p25: d.debtToGdp,
        median: d.debtToGdp,
        p75: d.debtToGdp,
        p90: d.debtToGdp,
      };
    }

    const t = d.year - 2024; // forecast horizon step
    const sigma = 1.8 * Math.sqrt(t); // volatility expands with square root of time

    return {
      year: d.year,
      p10: Number(Math.max(15, d.debtToGdp - 1.645 * sigma).toFixed(1)),
      p25: Number(Math.max(18, d.debtToGdp - 0.674 * sigma).toFixed(1)),
      median: Number(d.debtToGdp.toFixed(1)),
      p75: Number((d.debtToGdp + 0.674 * sigma).toFixed(1)),
      p90: Number((d.debtToGdp + 1.645 * sigma).toFixed(1)),
    };
  });
}

/**
 * Assess compliance with fiscal anchors and institutional sustainability rules
 */
export function evaluateFiscalRules(
  latestYear: FiscalAccountYear,
  targetDebtCeiling: number = 60.0,
  targetGfn: number = 15.0
): FiscalRuleAssessment[] {
  const isDebtCompliant = latestYear.debtToGdp <= targetDebtCeiling;
  const isDebtWarning = latestYear.debtToGdp <= targetDebtCeiling * 1.1;

  return [
    {
      ruleName: 'Debt-to-GDP Ceiling',
      ruleArabicName: 'سقف الدين العام إلى الناتج المحلي',
      target: `≤ ${targetDebtCeiling.toFixed(1)}%`,
      currentValue: latestYear.debtToGdp,
      unit: '%',
      status: isDebtCompliant ? 'compliant' : isDebtWarning ? 'warning' : 'breached',
      commentary: isDebtCompliant
        ? `مؤشر أمان مالي مستدام دون السقف المستهدف (${targetDebtCeiling}%).`
        : isDebtWarning
        ? `يقترب من النطاق الحرج ويتطلب كبح وتيرة الاقتراض الجديدة.`
        : `تجاوز السقف السيادي المعتمد (${targetDebtCeiling}%)، يستوجب تفعيل تدابير الضبط المالي.`,
    },
    {
      ruleName: 'Fiscal Deficit Anchor',
      ruleArabicName: 'سقف عجز الميزانية العام',
      target: '≤ 3.0%',
      currentValue: Math.abs(Math.min(0, latestYear.overallBalancePercentGdp)),
      unit: '%',
      status: Math.abs(latestYear.overallBalancePercentGdp) <= 3.0 ? 'compliant' : Math.abs(latestYear.overallBalancePercentGdp) <= 5.0 ? 'warning' : 'breached',
      commentary: latestYear.overallBalancePercentGdp >= 0
        ? 'تسجيل فائض مالي يعزز الاحتياطيات النقدية وصندوق الاستقرار السيادي.'
        : Math.abs(latestYear.overallBalancePercentGdp) <= 3.0
        ? 'ضمن معايير الانضباط المالي الدولية ومعاهدات الاستقرار (معيار 3% من الناتج).'
        : 'عجز مرتفع يتطلب ترشيد النفقات التشغيلية ومراجعة الدعم الموجه.',
    },
    {
      ruleName: 'Gross Financing Needs (GFN)',
      ruleArabicName: 'إجمالي الاحتياجات التمويلية السنوية',
      target: `≤ ${targetGfn.toFixed(1)}%`,
      currentValue: latestYear.gfnPercentGdp,
      unit: '%',
      status: latestYear.gfnPercentGdp <= targetGfn * 0.85 ? 'compliant' : latestYear.gfnPercentGdp <= targetGfn ? 'warning' : 'breached',
      commentary: latestYear.gfnPercentGdp <= targetGfn * 0.85
        ? 'مخاطر تجديد ديون منخفضة ومستويات سيولة مريحة في الأسواق.'
        : latestYear.gfnPercentGdp <= targetGfn
        ? 'حجم إعادة التمويل معتدل مع ضرورة تنويع آجال الاستحقاق.'
        : `ضغوط سيولة متصاعدة تتجاوز العتبة الاحترازية (${targetGfn}%).`,
    },
    {
      ruleName: 'Interest-to-Revenue Ratio',
      ruleArabicName: 'عبء خدمة الدين من الإيرادات العامة',
      target: '≤ 15.0%',
      currentValue: Number(((latestYear.debtInterest / (latestYear.totalRevenue || 1)) * 100).toFixed(1)),
      unit: '%',
      status: (latestYear.debtInterest / (latestYear.totalRevenue || 1)) * 100 <= 10.0 ? 'compliant' : (latestYear.debtInterest / (latestYear.totalRevenue || 1)) * 100 <= 15.0 ? 'warning' : 'breached',
      commentary: (latestYear.debtInterest / (latestYear.totalRevenue || 1)) * 100 <= 10.0
        ? 'تكلفة فوائد محكومة لا تضغط على مخصصات الخدمات الأساسية والاستثمار.'
        : 'ارتفاع في فاتورة الفوائد السنوية يحد جزئياً من الحيز المالي.',
    },
    {
      ruleName: 'Golden Fiscal Rule (Capex Financing)',
      ruleArabicName: 'القاعدة الذهبية للاستثمار الحكومي (Capex)',
      target: 'الاستدانة لتمويل المشروعات التنموية الرأسمالية فقط',
      currentValue: Number(((latestYear.capitalExpenditure / (latestYear.totalExpenditure || 1)) * 100).toFixed(1)),
      unit: '% من الإنفاق',
      status: latestYear.capitalExpenditure >= Math.abs(latestYear.overallBalance) ? 'compliant' : 'warning',
      commentary: latestYear.capitalExpenditure >= Math.abs(latestYear.overallBalance)
        ? 'الاقتراض موجه لتمويل أصول رأسمالية ذات عائد إنتاجي مستدام.'
        : 'جزء من الديون يسد فجوات تشغيلية؛ يوصى بتحسين كفاءة الإنفاق الجاري.',
    },
  ];
}
