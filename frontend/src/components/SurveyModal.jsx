import React, { useState, useEffect } from 'react';
import { Heart, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const SurveyModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  
  const defaultSurveyState = {
    financialStress: 'Low (No issue)',
    academicWorkload: '3 - 5 hours',
    mentalHealthStatus: 'Good / Balanced',
    comments: '',
  };

  const [survey, setSurvey] = useState(defaultSurveyState);

  // Sync initial data or reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setStatusMessage({ type: '', text: '' });
      if (initialData) {
        const nested = initialData.surveyData || {};
        
        setSurvey({
          financialStress:
            nested.moneyFeeWorries ||
            nested.feeWorries ||
            initialData.financialStress ||
            initialData.moneyFeeWorries ||
            'Low (No issue)',
          academicWorkload:
            nested.dailySelfStudyHours ||
            nested.academicWorkload ||
            initialData.dailySelfStudyHours ||
            initialData.studyHoursPerDay ||
            '3 - 5 hours',
          mentalHealthStatus:
            nested.mentalHealthState ||
            nested.mentalHealth ||
            initialData.mentalHealthStatus ||
            initialData.mentalHealthSelfReport ||
            'Good / Balanced',
          comments: nested.comments || initialData.comments || '',
        });
      } else {
        setSurvey(defaultSurveyState);
      }
    }
  }, [isOpen, initialData]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    try {
      // Structure payload to match both flat and nested backend models
      const payload = {
        financialStress: survey.financialStress,
        moneyFeeWorries: survey.financialStress,
        studyHoursPerDay: survey.academicWorkload,
        dailySelfStudyHours: survey.academicWorkload,
        mentalHealthStatus: survey.mentalHealthStatus,
        mentalHealthSelfReport: survey.mentalHealthStatus,
        mentalHealthState: survey.mentalHealthStatus,
        comments: survey.comments,
        surveyCompleted: true,
        surveyStatus: 'Completed',
        surveyData: {
          moneyFeeWorries: survey.financialStress,
          dailySelfStudyHours: survey.academicWorkload,
          mentalHealthState: survey.mentalHealthStatus,
          comments: survey.comments,
        },
      };

      if (onSubmit) {
        await onSubmit(payload);
      }
      
      setStatusMessage({ type: 'success', text: 'Assessment submitted successfully!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Modal Survey Error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error submitting survey. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Heart className="text-rose-400 fill-rose-400/20" size={20} />
            Wellness & Self-Check Survey
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            disabled={submitting}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Alert Banner */}
        {statusMessage.text && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Financial Situation Stress
            </label>
            <select
              value={survey.financialStress}
              onChange={(e) => setSurvey({ ...survey, financialStress: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
            >
              <option value="Low (No issue)">Low (No issue)</option>
              <option value="Moderate Strain">Moderate Strain</option>
              <option value="High (Severe burden)">High (Severe burden)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Daily Self-Study Hours
            </label>
            <select
              value={survey.academicWorkload}
              onChange={(e) => setSurvey({ ...survey, academicWorkload: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
            >
              <option value="Less than 1 hour">Less than 1 hour</option>
              <option value="1 - 2 hours">1 - 2 hours</option>
              <option value="3 - 5 hours">3 - 5 hours</option>
              <option value="5+ hours">5+ hours</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Personal Wellbeing & Mental Health
            </label>
            <select
              value={survey.mentalHealthStatus}
              onChange={(e) => setSurvey({ ...survey, mentalHealthStatus: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
            >
              <option value="Good / Balanced">Good / Balanced</option>
              <option value="Anxious / Stressed">Anxious / Stressed</option>
              <option value="Overwhelmed">Overwhelmed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Additional Notes (Confidential)
            </label>
            <textarea
              rows="3"
              value={survey.comments}
              onChange={(e) => setSurvey({ ...survey, comments: e.target.value })}
              placeholder="Share anything you would like your counselor or advisor to know..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/60">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold flex items-center gap-2 transition shadow-lg shadow-rose-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Assessment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyModal;