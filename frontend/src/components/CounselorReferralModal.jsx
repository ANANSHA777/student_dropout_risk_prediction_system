// src/components/CounselorReferralModal.jsx
import React, { useState } from 'react';
import { X, UserCheck, AlertTriangle, FileText, Tag } from 'lucide-react';

const CounselorReferralModal = ({ student, isOpen, onClose, onSubmit }) => {
  const [reasonForReferral, setReasonForReferral] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState(
    student?.primaryRiskCategory || 'General Support'
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        studentId: student._id || student.id,
        reasonForReferral,
        notes: notes || 'Faculty referral submitted.',
        category,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Counselor Referral</h3>
              <p className="text-xs text-slate-400">
                Initiate support session for <span className="text-indigo-300 font-medium">{student.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag size={14} className="text-indigo-400" />
              Referral Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="Academic Support">Academic Support</option>
              <option value="Academic Disengagement">Academic Disengagement</option>
              <option value="Wellness & Mental Health">Wellness & Mental Health</option>
              <option value="Financial/Personal">Financial / Personal</option>
              <option value="Career Guidance">Career Guidance</option>
              <option value="General Support">General Support</option>
            </select>
          </div>

          {/* Primary Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-400" />
              Reason for Referral
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Low attendance, high stress, academic struggle"
              value={reasonForReferral}
              onChange={(e) => setReasonForReferral(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Detailed Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText size={14} className="text-slate-400" />
              Additional Notes / Observations
            </label>
            <textarea
              rows={3}
              placeholder="Provide context or specific details for the assigned counselor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
            >
              {submitting ? 'Dispatching...' : 'Dispatch Referral'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CounselorReferralModal;