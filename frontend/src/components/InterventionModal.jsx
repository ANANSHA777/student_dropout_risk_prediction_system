import React, { useState } from 'react';
import { HeartHandshake, X } from 'lucide-react';

const InterventionModal = ({ isOpen, student, onClose, onSave }) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    sessionType: 'In-Person Counseling',
    notes: '',
    status: 'In Progress',
    actionPlan: 'Financial Aid Advisory',
  });

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(student._id || student.id, form);
      onClose();
    } catch (err) {
      alert(`Error logging intervention: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <HeartHandshake className="text-emerald-400" size={20} />
            Log Support Intervention
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Case file for <span className="text-white font-semibold">{student.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Session Format</label>
            <select
              value={form.sessionType}
              onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="In-Person Counseling">In-Person Counseling</option>
              <option value="Online Video Check-in">Online Video Check-in</option>
              <option value="Financial Counseling">Financial Advisory Session</option>
              <option value="Parent/Guardian Meeting">Parent / Guardian Meeting</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Recommended Action Plan</label>
            <select
              value={form.actionPlan}
              onChange={(e) => setForm({ ...form, actionPlan: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Financial Aid Advisory">Connect to Financial Aid Advisory</option>
              <option value="Peer Mentorship Program">Enroll in Peer Mentorship</option>
              <option value="Academic Extension Granted">Grant Course Deadline Extension</option>
              <option value="Mental Wellness Care Package">Provide Counseling Center Referral</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Case Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="In Progress">In Progress (Active Support)</option>
              <option value="Monitoring">Monitoring (Follow-up pending)</option>
              <option value="Resolved">Resolved (Goal Achieved)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Confidential Counselor Notes</label>
            <textarea
              rows="3"
              required
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Record clinical observations, student feedback, or financial relief steps taken..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-lg shadow-emerald-500/20"
            >
              {submitting ? 'Saving...' : 'Save Intervention'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterventionModal;