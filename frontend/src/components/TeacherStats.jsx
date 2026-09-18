// src/components/TeacherStats.jsx
import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, HelpCircle, Users } from 'lucide-react';

export default function TeacherStats({ students = [] }) {
  const total = students.length;

  // Dynamic filtering for Risk Levels & Evaluated status (supports "High Risk", "High", etc.)
  const highRisk = students.filter((s) => {
    const r = String(s.riskLevel || '').toLowerCase();
    return r.includes('high');
  }).length;

  const mediumRisk = students.filter((s) => {
    const r = String(s.riskLevel || '').toLowerCase();
    return r.includes('medium') || r.includes('moderate');
  }).length;

  const lowRisk = students.filter((s) => {
    const r = String(s.riskLevel || '').toLowerCase();
    return (r.includes('low') || r.includes('safe') || r.includes('normal')) && !r.includes('high') && !r.includes('medium');
  }).length;

  const unevaluated = students.filter((s) => {
    if (!s.riskLevel) return true;
    const r = String(s.riskLevel).toLowerCase();
    return r.includes('unevaluated') || r.includes('pending') || s.riskEvaluated === false;
  }).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Students */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-400">Total Students</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
          <Users size={20} />
        </div>
      </div>

      {/* High Risk */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-400">High Risk</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{highRisk}</p>
        </div>
        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
          <ShieldAlert size={20} />
        </div>
      </div>

      {/* Medium Risk */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-400">Medium Risk</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{mediumRisk}</p>
        </div>
        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
          <AlertTriangle size={20} />
        </div>
      </div>

      {/* Low Risk / Normal */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-400">Low Risk / Normal</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{lowRisk}</p>
        </div>
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
          <CheckCircle2 size={20} />
        </div>
      </div>

      {/* Pending Evaluation */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-400">Not Evaluated</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">{unevaluated}</p>
        </div>
        <div className="p-3 bg-slate-800 text-slate-400 rounded-lg border border-slate-700">
          <HelpCircle size={20} />
        </div>
      </div>
    </div>
  );
}