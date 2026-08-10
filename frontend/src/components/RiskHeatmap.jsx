// src/components/RiskHeatmap.jsx
import React from 'react';
import { Grid, ShieldAlert, Sparkles } from 'lucide-react';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function RiskHeatmap({ analytics = {}, onSelectCohort, selectedDept, selectedYear }) {
  const departments = Object.keys(analytics);

  // Helper to determine heat intensity based on high-risk ratio
  const getHeatStyle = (highRisk, total) => {
    if (!total || total === 0) {
      return {
        bg: 'bg-slate-900/60 border-slate-800 text-slate-600',
        badge: 'bg-slate-800 text-slate-500',
        label: 'No Data',
      };
    }

    const ratio = highRisk / total;

    if (ratio >= 0.3) {
      return {
        bg: 'bg-red-950/40 border-red-800/60 text-red-200 hover:bg-red-900/50',
        badge: 'bg-red-500/20 text-red-400 border-red-500/30',
        label: 'Critical',
      };
    }
    if (ratio >= 0.15) {
      return {
        bg: 'bg-amber-950/40 border-amber-800/60 text-amber-200 hover:bg-amber-900/50',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        label: 'Warning',
      };
    }
    return {
      bg: 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200 hover:bg-emerald-900/40',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      label: 'Healthy',
    };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Grid className="text-purple-400" size={20} />
          <h2 className="text-lg font-bold text-white">Department vs. Year Risk Density Heatmap</h2>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Healthy (&lt;15% High Risk)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Warning (15-30%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical (&gt;30%)</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-2">
          <thead>
            <tr>
              <th className="p-3 text-xs uppercase tracking-wider text-slate-400 bg-slate-950/40 rounded-lg">Department</th>
              {YEARS.map((year) => (
                <th key={year} className="p-3 text-xs uppercase tracking-wider text-indigo-400 text-center bg-slate-950/40 rounded-lg">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                  No risk analytics available to construct heatmap.
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept}>
                  <td className="p-3 font-semibold text-slate-200 bg-slate-950/30 rounded-lg text-sm">
                    {dept}
                  </td>
                  {YEARS.map((year) => {
                    const stats = analytics[dept]?.[year] || { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 };
                    const style = getHeatStyle(stats.highRisk, stats.total);
                    const isSelected = selectedDept === dept && selectedYear === year;

                    return (
                      <td
                        key={year}
                        onClick={() => onSelectCohort(dept, year)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer text-center relative ${style.bg} ${
                          isSelected ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' : ''
                        }`}
                      >
                        <div className="text-xl font-extrabold text-white">{stats.highRisk}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">High Risk / {stats.total} Total</div>
                        <div className="mt-2">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${style.badge}`}>
                            {style.label}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}