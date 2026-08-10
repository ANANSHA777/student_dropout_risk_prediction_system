import React from 'react';
import { MessageSquarePlus, ShieldAlert, Heart, RefreshCw } from 'lucide-react';

const CasesTable = ({ cases, loading, onOpenModal, onRefresh }) => {
  return (
    <section className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center border-b border-slate-700/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Student Wellness & Financial Intervention Cases</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track survey disclosures, risk categories, and wellness notes</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-lg transition"
          title="Refresh Cases"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 px-4">Student</th>
              <th className="pb-3 px-4">Primary Concern</th>
              <th className="pb-3 px-4">Self-Reported Status</th>
              <th className="pb-3 px-4">Case Status</th>
              <th className="pb-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-sm">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                  Loading intervention cases...
                </td>
              </tr>
            ) : cases.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500 text-xs italic">
                  No active student cases assigned.
                </td>
              </tr>
            ) : (
              cases.map((student) => {
                const id = student._id || student.id;
                return (
                  <tr key={id} className="hover:bg-slate-700/30 transition">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{student.name}</div>
                      <div className="text-xs text-slate-400">{student.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-md">
                        {student.riskCategory || 'Personal / Wellness'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Heart size={14} className="text-rose-400" />
                        {student.mentalHealthSelfReport || 'Moderate'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                        student.status === 'Resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {student.status || 'Active Review'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => onOpenModal(student)}
                        className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/30 transition flex items-center gap-1.5 mx-auto"
                      >
                        <MessageSquarePlus size={14} />
                        Log Intervention
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CasesTable;