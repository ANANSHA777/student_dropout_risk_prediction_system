// src/components/StudentInterventionsView.jsx
import React from 'react';
import { BookOpen, CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';

export default function StudentInterventionsView({ studentData }) {
  const plan =
    studentData?.assignedAcademicPlan ||
    studentData?.academicPlan ||
    studentData?.assignedPlan ||
    studentData?.remedialPlan ||
    studentData?.interventions?.[0];

  if (!plan) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm font-medium">No assigned academic interventions at this time.</p>
        <p className="text-xs text-slate-500 mt-1">Keep up the good work!</p>
      </div>
    );
  }

  const planType = typeof plan === 'string' ? plan : plan?.planType || plan?.title || 'Academic Support Plan';
  const planNotes = typeof plan === 'object' ? plan?.notes : null;
  const planDate = typeof plan === 'object' && plan?.date ? new Date(plan.date).toLocaleDateString() : 'Recently assigned';

  return (
    <div className="bg-linear-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Assigned Academic Support Plan</h3>
            <p className="text-xs text-indigo-300">Assigned by your faculty instructor</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
          <CheckCircle size={13} /> Active Plan
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Plan Details</span>
          <div className="text-sm font-semibold text-slate-100 mt-0.5">{planType}</div>
        </div>

        {planNotes && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold mb-1">
              <FileText size={13} /> Instructor Instructions
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{planNotes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>Assigned Date: {planDate}</span>
          <span className="text-indigo-400 font-medium">Status: In Progress</span>
        </div>
      </div>
    </div>
  );
}