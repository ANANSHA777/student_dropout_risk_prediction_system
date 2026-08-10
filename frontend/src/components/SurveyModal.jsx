import React, { useState } from 'react';
import { Heart, X } from 'lucide-react';

const SurveyModal = ({ isOpen, onClose, onSubmit }) => {
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState({
    financialStress: 'Low',
    academicWorkload: 'Manageable',
    mentalHealthStatus: 'Good',
    comments: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(survey);
      onClose();
    } catch (err) {
      alert(`Error submitting survey: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Heart className="text-rose-400" size={20} />
            Wellness & Self-Check Survey
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Financial Situation Stress</label>
            <select
              value={survey.financialStress}
              onChange={(e) => setSurvey({ ...survey, financialStress: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Low">Low - Secure / No Concerns</option>
              <option value="Moderate">Moderate - Temporary Strain</option>
              <option value="High">High - Need Financial Aid Support</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Course Workload Impression</label>
            <select
              value={survey.academicWorkload}
              onChange={(e) => setSurvey({ ...survey, academicWorkload: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Manageable">Manageable</option>
              <option value="Challenging">Challenging</option>
              <option value="Overwhelming">Overwhelming - Falling Behind</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Personal Wellbeing</label>
            <select
              value={survey.mentalHealthStatus}
              onChange={(e) => setSurvey({ ...survey, mentalHealthStatus: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Good">Feeling Great / Healthy</option>
              <option value="Fair">Fair / Mild Stress</option>
              <option value="Seeking Counsel">Struggling / Would Like Counselor Outreach</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Additional Notes (Confidential)</label>
            <textarea
              rows="3"
              value={survey.comments}
              onChange={(e) => setSurvey({ ...survey, comments: e.target.value })}
              placeholder="Share anything you would like your counselor or advisor to know..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 text-sm"
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
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition shadow-lg shadow-rose-500/20"
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyModal;