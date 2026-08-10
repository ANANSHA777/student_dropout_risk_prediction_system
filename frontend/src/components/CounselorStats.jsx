import React from 'react';
import { ShieldAlert, HeartHandshake, CheckCircle2 } from 'lucide-react';

const CounselorStats = ({ cases }) => {
  const totalCases = cases.length;
  const criticalCases = cases.filter((c) => c.riskLevel === 'High' || c.mentalHealthStatus === 'Critical').length;
  const resolvedCases = cases.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
          <HeartHandshake size={22} />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{totalCases}</div>
          <div className="text-xs text-slate-400 font-medium">Active Assigned Cases</div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
          <ShieldAlert size={22} />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{criticalCases}</div>
          <div className="text-xs text-slate-400 font-medium">Critical / High Priority</div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <CheckCircle2 size={22} />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{resolvedCases}</div>
          <div className="text-xs text-slate-400 font-medium">Interventions Resolved</div>
        </div>
      </div>
    </div>
  );
};

export default CounselorStats;