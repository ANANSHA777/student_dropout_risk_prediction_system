// src/components/RiskAnalyticsCharts.jsx
import React from 'react';
import { BarChart2, PieChart, ShieldAlert } from 'lucide-react';

export default function RiskAnalyticsCharts({ analytics = {} }) {
  // Calculate top-level overall totals across all departments & years
  const grandTotals = { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, unevaluated: 0 };

  Object.values(analytics).forEach((years) => {
    Object.values(years).forEach((stats) => {
      grandTotals.total += stats.total;
      grandTotals.highRisk += stats.highRisk;
      grandTotals.mediumRisk += stats.mediumRisk;
      grandTotals.lowRisk += stats.lowRisk;
      grandTotals.unevaluated += stats.unevaluated;
    });
  });

  const getPercent = (val) => (grandTotals.total > 0 ? ((val / grandTotals.total) * 100).toFixed(1) : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* 1. Institution-Wide Risk Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="text-indigo-400" size={20} />
            <h3 className="text-base font-bold text-white">Overall Institution Snapshot</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6">Total Enrolled: <span className="text-white font-bold">{grandTotals.total} Students</span></p>
        </div>

        {/* Visual Percentage Segment Bar */}
        <div className="space-y-4">
          <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: `${getPercent(grandTotals.highRisk)}%` }} className="bg-red-500 h-full transition-all" title="High Risk" />
            <div style={{ width: `${getPercent(grandTotals.mediumRisk)}%` }} className="bg-amber-500 h-full transition-all" title="Medium Risk" />
            <div style={{ width: `${getPercent(grandTotals.lowRisk)}%` }} className="bg-emerald-500 h-full transition-all" title="Low Risk" />
            <div style={{ width: `${getPercent(grandTotals.unevaluated)}%` }} className="bg-slate-700 h-full transition-all" title="Unevaluated" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <span className="text-slate-300">High Risk: <strong>{getPercent(grandTotals.highRisk)}%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-300">Medium Risk: <strong>{getPercent(grandTotals.mediumRisk)}%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-300">Low Risk: <strong>{getPercent(grandTotals.lowRisk)}%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-700 shrink-0" />
              <span className="text-slate-300">Pending: <strong>{getPercent(grandTotals.unevaluated)}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Departmental Visual Comparison Bars */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-purple-400" size={20} />
            <h3 className="text-base font-bold text-white">Department Risk Levels</h3>
          </div>
          <span className="text-xs text-slate-400">High Risk Emphasis</span>
        </div>

        <div className="space-y-4 pt-2">
          {Object.entries(analytics).length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-8">No departmental analytics available</p>
          ) : (
            Object.entries(analytics).map(([dept, years]) => {
              // Aggregate totals for the department across all years
              const deptTotals = Object.values(years).reduce(
                (acc, curr) => ({
                  total: acc.total + curr.total,
                  highRisk: acc.highRisk + curr.highRisk,
                  mediumRisk: acc.mediumRisk + curr.mediumRisk,
                  lowRisk: acc.lowRisk + curr.lowRisk,
                }),
                { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 }
              );

              const highRiskPct = deptTotals.total > 0 ? (deptTotals.highRisk / deptTotals.total) * 100 : 0;
              const medRiskPct = deptTotals.total > 0 ? (deptTotals.mediumRisk / deptTotals.total) * 100 : 0;

              return (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{dept}</span>
                    <span className="text-slate-400">
                      {deptTotals.highRisk} High / {deptTotals.total} Total
                    </span>
                  </div>

                  {/* Multi-tier progress bar */}
                  <div className="h-3 w-full bg-slate-800 rounded-lg overflow-hidden flex">
                    <div style={{ width: `${highRiskPct}%` }} className="bg-red-500 h-full transition-all" />
                    <div style={{ width: `${medRiskPct}%` }} className="bg-amber-500 h-full transition-all" />
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