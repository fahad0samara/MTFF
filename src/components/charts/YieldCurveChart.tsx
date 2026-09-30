import React, { useState, useMemo } from 'react';
import { SovereignCountryProfile, REAL_SOVEREIGN_COUNTRIES } from '../../data/realSovereignData';

interface YieldCurveChartProps {
  country: SovereignCountryProfile;
}

interface TenorYield {
  tenor: string;
  label: string;
  years: number;
}

const TENORS: TenorYield[] = [
  { tenor: '3M', label: '3 أشهر', years: 0.25 },
  { tenor: '6M', label: '6 أشهر', years: 0.5 },
  { tenor: '1Y', label: 'سنة', years: 1 },
  { tenor: '2Y', label: 'سنتان', years: 2 },
  { tenor: '3Y', label: '3 سنوات', years: 3 },
  { tenor: '5Y', label: '5 سنوات', years: 5 },
  { tenor: '7Y', label: '7 سنوات', years: 7 },
  { tenor: '10Y', label: '10 سنوات', years: 10 },
  { tenor: '20Y', label: '20 سنة', years: 20 },
  { tenor: '30Y', label: '30 سنة', years: 30 },
];

const SOVEREIGN_BENCHMARK_CURVES: Record<string, number[]> = {
  USA: [4.85, 4.70, 4.40, 4.05, 3.98, 4.02, 4.08, 4.15, 4.45, 4.38],
  KSA: [5.50, 5.40, 5.15, 4.60, 4.45, 4.55, 4.60, 4.65, 4.95, 5.10],
  GBR: [4.90, 4.75, 4.45, 4.10, 4.00, 3.95, 4.00, 4.05, 4.55, 4.60],
  DEU: [3.15, 2.85, 2.50, 2.15, 2.10, 2.15, 2.20, 2.25, 2.45, 2.50],
  EGY: [26.5, 26.0, 25.5, 23.5, 22.0, 21.0, 20.8, 20.5, 18.5, 18.0],
  JPN: [0.15, 0.25, 0.40, 0.55, 0.65, 0.75, 0.90, 1.15, 1.75, 2.10],
};

export const YieldCurveChart: React.FC<YieldCurveChartProps> = ({ country }) => {
  const [shiftBps, setShiftBps] = useState<number>(0); // in basis points
  const [compareCountryId, setCompareCountryId] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const baseCurve = useMemo(() => {
    return SOVEREIGN_BENCHMARK_CURVES[country.id] || SOVEREIGN_BENCHMARK_CURVES.USA;
  }, [country.id]);

  const shiftedCurve = useMemo(() => {
    const shiftPercent = shiftBps / 100;
    return baseCurve.map((y) => Number(Math.max(0.01, y + shiftPercent).toFixed(2)));
  }, [baseCurve, shiftBps]);

  const compareCurve = useMemo(() => {
    if (!compareCountryId) return null;
    return SOVEREIGN_BENCHMARK_CURVES[compareCountryId] || null;
  }, [compareCountryId]);

  const compareCountry = useMemo(() => {
    if (!compareCountryId) return null;
    return REAL_SOVEREIGN_COUNTRIES.find((c) => c.id === compareCountryId) || null;
  }, [compareCountryId]);

  // Spread calculations
  const spread2Y10Y = Number((shiftedCurve[7] - shiftedCurve[3]).toFixed(2));
  const isInverted = spread2Y10Y < 0;

  // SVG dimensions
  const width = 760;
  const height = 300;
  const padding = { top: 25, right: 35, bottom: 45, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Determine scale
  const allYValues = [...shiftedCurve, ...(compareCurve || [])];
  const minYield = Math.max(0, Math.floor(Math.min(...allYValues) - 0.5));
  const maxYield = Math.ceil(Math.max(...allYValues) + 0.8);

  const getX = (index: number) => {
    return padding.left + (index / (TENORS.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - minYield) / (maxYield - minYield)) * chartHeight;
  };

  const activePoints = shiftedCurve.map((y, i) => `${getX(i)},${getY(y)}`).join(' L ');
  const basePoints = baseCurve.map((y, i) => `${getX(i)},${getY(y)}`).join(' L ');
  const comparePoints = compareCurve ? compareCurve.map((y, i) => `${getX(i)},${getY(y)}`).join(' L ') : '';

  // Y Axis ticks
  const yTicks: number[] = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    yTicks.push(Number((minYield + (i * (maxYield - minYield)) / tickCount).toFixed(1)));
  }

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-900"></span>
            <h3 className="text-sm font-bold text-slate-900">
              منحنى العائد السيادي وهيكل أسعار الفائدة (Sovereign Yield Curve Benchmark)
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {country.flagEmoji} {country.nameArabic}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            هيكل تكلفة التمويل الحكومي عبر آجال الاستحقاق من 3 أشهر حتى 30 سنة مع رصد ميل المنحنى وفارق (10Y - 2Y).
          </p>
        </div>

        {/* Action Controls: Shift & Peer Compare */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Peer Overlay Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">مقارنة مع:</span>
            <select
              value={compareCountryId || ''}
              onChange={(e) => setCompareCountryId(e.target.value || null)}
              className="bg-slate-100 border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs font-semibold cursor-pointer"
            >
              <option value="">(بدون مقارنة)</option>
              {REAL_SOVEREIGN_COUNTRIES.filter((c) => c.id !== country.id).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.flagEmoji} {c.nameArabic}
                </option>
              ))}
            </select>
          </div>

          {/* Curve Shift Pills */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded p-0.5 font-mono text-[11px]">
            <span className="px-1.5 text-slate-500 font-sans">محاكاة إزاحة:</span>
            {[-50, 0, 50, 100].map((bps) => (
              <button
                key={bps}
                onClick={() => setShiftBps(bps)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  shiftBps === bps
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {bps === 0 ? 'الأساس' : bps > 0 ? `+${bps}bps` : `${bps}bps`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Yield Curve Indicators Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded p-3 text-xs">
        <div>
          <span className="text-slate-500 block text-[11px]">عائد السندات القياسية 10Y:</span>
          <span className="text-base font-bold font-mono text-slate-900">
            {shiftedCurve[7]}%
          </span>
          {shiftBps !== 0 && (
            <span className="text-[10px] font-mono text-slate-500 block">
              (الأساس: {baseCurve[7]}%)
            </span>
          )}
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">عائد السندات قصيرة الأجل 2Y:</span>
          <span className="text-base font-bold font-mono text-slate-900">
            {shiftedCurve[3]}%
          </span>
          <span className="text-[10px] text-slate-500 block">سعر الفائدة على المدى القريب</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">فارق المنحنى (10Y - 2Y Spread):</span>
          <span className={`text-base font-bold font-mono ${isInverted ? 'text-red-700' : 'text-emerald-700'}`}>
            {spread2Y10Y > 0 ? `+${spread2Y10Y}%` : `${spread2Y10Y}%`}
          </span>
          <span className="text-[10px] block font-semibold">
            {isInverted ? '⚠ منحنى مقلوب (إشارة ركود)' : '✓ منحنى تصاعدي طبيعي'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">عائد السندات 30 سنة (30Y Long):</span>
          <span className="text-base font-bold font-mono text-slate-900">
            {shiftedCurve[9]}%
          </span>
          <span className="text-[10px] text-slate-500 block">علاوة المخاطر طويلة الأجل</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto text-xs font-mono"
          style={{ minWidth: '600px' }}
        >
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={getY(tick)}
                x2={width - padding.right}
                y2={getY(tick)}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray={i === 0 ? 'none' : '3,3'}
              />
              <text
                x={padding.left - 8}
                y={getY(tick) + 3}
                textAnchor="end"
                className="fill-slate-500 text-[10px]"
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Tenor X Grid */}
          {TENORS.map((t, i) => (
            <g key={t.tenor}>
              <line
                x1={getX(i)}
                y1={padding.top}
                x2={getX(i)}
                y2={height - padding.bottom}
                stroke="#f1f5f9"
                strokeWidth={1}
              />
              <text
                x={getX(i)}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                className="fill-slate-800 text-[11px] font-bold"
              >
                {t.tenor}
              </text>
              <text
                x={getX(i)}
                y={height - padding.bottom + 28}
                textAnchor="middle"
                className="fill-slate-400 text-[9px] font-sans"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Baseline curve if shifted */}
          {shiftBps !== 0 && (
            <path
              d={`M ${basePoints}`}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
          )}

          {/* Compare Country Curve */}
          {compareCurve && (
            <>
              <path
                d={`M ${comparePoints}`}
                fill="none"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="2,2"
              />
              {compareCurve.map((y, i) => (
                <circle
                  key={`comp-${i}`}
                  cx={getX(i)}
                  cy={getY(y)}
                  r={3}
                  fill="#6366f1"
                />
              ))}
            </>
          )}

          {/* Active Main Curve */}
          <path
            d={`M ${activePoints}`}
            fill="none"
            stroke="#0f172a"
            strokeWidth={2.75}
          />

          {/* Data Points */}
          {shiftedCurve.map((y, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <circle
                  cx={getX(i)}
                  cy={getY(y)}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#006C35' : '#0f172a'}
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="transition-all"
                />
                {/* Value label on top of point */}
                <text
                  x={getX(i)}
                  y={getY(y) - 8}
                  textAnchor="middle"
                  className={`text-[10px] font-bold ${isHovered ? 'fill-emerald-800 text-[11px]' : 'fill-slate-700'}`}
                >
                  {y}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Analytical Takeaway */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-slate-900 inline-block"></span>
            <span className="font-semibold text-slate-800">
              {country.nameArabic} ({country.currencyCode})
            </span>
          </div>

          {shiftBps !== 0 && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="w-3 h-0.5 bg-slate-400 border-dashed inline-block"></span>
              <span>المنحنى الأصلي قبل الإزاحة</span>
            </div>
          )}

          {compareCountry && (
            <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
              <span className="w-3 h-1 bg-indigo-500 inline-block"></span>
              <span>
                {compareCountry.flagEmoji} {compareCountry.nameArabic} ({compareCountry.currencyCode})
              </span>
            </div>
          )}
        </div>

        <div className="text-slate-500 text-[11px]">
          <span>تحليل: </span>
          <span className="font-medium text-slate-700">
            {isInverted
              ? 'انقلاب المنحنى يعكس تشديداً نقدياً مؤقتاً في أسعار الفائدة قصيرة الأجل.'
              : 'منحنى طبيعي يتيح إصدار سندات طويلة الأجل لتمويل المشاريع الرأسمالية بكفاءة.'}
          </span>
        </div>
      </div>
    </div>
  );
};
