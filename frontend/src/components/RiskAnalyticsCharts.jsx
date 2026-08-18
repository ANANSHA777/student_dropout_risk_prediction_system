// src/components/RiskAnalyticsCharts.jsx
import React from 'react';
import { BarChart2, PieChart } from 'lucide-react';

export default function RiskAnalyticsCharts({ analytics = {} }) {
  // 1. Calculate top-level overall totals across all departments & years
  const grandTotals = { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, unevaluated: 0 };

  Object.values(analytics || {}).forEach((years) => {
    Object.values(years || {}).forEach((stats) => {
      grandTotals.total += stats?.total || 0;
      grandTotals.highRisk += stats?.highRisk || 0;
      grandTotals.mediumRisk += stats?.mediumRisk || 0;
      grandTotals.lowRisk += stats?.lowRisk || 0;
      grandTotals.unevaluated += stats?.unevaluated || 0;
    });
  });

  const getPercent = (val) =>
    grandTotals.total > 0 ? ((val / grandTotals.total) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* CARD 1: Institution-Wide Risk Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="text-indigo-400" size={20} />
            <h3 className="text-base font-bold text-white">Overall Institution Snapshot</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Total Enrolled: <span className="text-white font-bold">{grandTotals.total} Students</span>
          </p>
        </div>

        {/* Visual Percentage Segment Bar */}
        <div className="space-y-4">
          <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${getPercent(grandTotals.highRisk)}%` }}
              className="bg-red-500 h-full transition-all duration-300"
              title={`High Risk: ${grandTotals.highRisk}`}
            />
            <div
              style={{ width: `${getPercent(grandTotals.mediumRisk)}%` }}
              className="bg-amber-500 h-full transition-all duration-300"
              title={`Medium Risk: ${grandTotals.mediumRisk}`}
            />
            <div
              style={{ width: `${getPercent(grandTotals.lowRisk)}%` }}
              className="bg-emerald-500 h-full transition-all duration-300"
              title={`Low Risk: ${grandTotals.lowRisk}`}
            />
            <div
              style={{ width: `${getPercent(grandTotals.unevaluated)}%` }}
              className="bg-slate-700 h-full transition-all duration-300"
              title={`Unevaluated: ${grandTotals.unevaluated}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <span className="text-slate-300">
                High Risk: <strong>{getPercent(grandTotals.highRisk)}%</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-300">
                Medium Risk: <strong>{getPercent(grandTotals.mediumRisk)}%</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-300">
                Low Risk: <strong>{getPercent(grandTotals.lowRisk)}%</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-700 shrink-0" />
              <span className="text-slate-300">
                Pending: <strong>{getPercent(grandTotals.unevaluated)}%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Departmental Visual Comparison Bars */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-purple-400" size={20} />
            <h3 className="text-base font-bold text-white">Department Risk Levels</h3>
          </div>
          <span className="text-xs text-slate-400">High Risk Emphasis</span>
        </div>

        <div className="space-y-4 pt-2">
          {!analytics || Object.keys(analytics).length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-8">
              No departmental analytics available
            </p>
          ) : (
            Object.entries(analytics).map(([dept, years]) => {
              // Safely aggregate totals for each department across all years
              const deptTotals = Object.values(years || {}).reduce(
                (acc, curr) => ({
                  total: acc.total + (curr?.total || 0),
                  highRisk: acc.highRisk + (curr?.highRisk || 0),
                  mediumRisk: acc.mediumRisk + (curr?.mediumRisk || 0),
                  lowRisk: acc.lowRisk + (curr?.lowRisk || 0),
                  unevaluated: acc.unevaluated + (curr?.unevaluated || 0),
                }),
                { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, unevaluated: 0 }
              );

              const denominator = deptTotals.total > 0 ? deptTotals.total : 1;
              const highRiskPct = (deptTotals.highRisk / denominator) * 100;
              const medRiskPct = (deptTotals.mediumRisk / denominator) * 100;
              const lowRiskPct = (deptTotals.lowRisk / denominator) * 100;
              const unEvalPct = (deptTotals.unevaluated / denominator) * 100;

              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">{dept}</span>
                    <span className="text-slate-400 font-medium">
                      <strong className="text-red-400">{deptTotals.highRisk} High</strong> / {deptTotals.total} Total
                    </span>
                  </div>

                  {/* Multi-tier progress bar displaying all risk spectrums */}
                  <div className="h-3 w-full bg-slate-800/80 rounded-lg overflow-hidden flex shadow-inner">
                    {/* Red: High Risk */}
                    {highRiskPct > 0 && (
                      <div
                        style={{ width: `${highRiskPct}%` }}
                        className="bg-red-500 h-full transition-all duration-300"
                        title={`High Risk: ${deptTotals.highRisk}`}
                      />
                    )}

                    {/* Amber: Medium Risk */}
                    {medRiskPct > 0 && (
                      <div
                        style={{ width: `${medRiskPct}%` }}
                        className="bg-amber-500 h-full transition-all duration-300"
                        title={`Medium Risk: ${deptTotals.mediumRisk}`}
                      />
                    )}

                    {/* Emerald: Low Risk / Safe */}
                    {lowRiskPct > 0 && (
                      <div
                        style={{ width: `${lowRiskPct}%` }}
                        className="bg-emerald-500 h-full transition-all duration-300"
                        title={`Low Risk: ${deptTotals.lowRisk}`}
                      />
                    )}

                    {/* Gray: Unevaluated */}
                    {unEvalPct > 0 && (
                      <div
                        style={{ width: `${unEvalPct}%` }}
                        className="bg-slate-600 h-full transition-all duration-300"
                        title={`Unevaluated: ${deptTotals.unevaluated}`}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}