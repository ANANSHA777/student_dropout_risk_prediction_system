import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, DollarSign, BookOpen, Heart, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const StudentSurveyForm = ({ initialData, onSurveySubmitted, studentId = null }) => {
  const defaultState = {
    familyMonthlyIncome: 'Below ₹15,000',
    moneyFeeWorries: 'Low (No issue)',
    livingSituation: 'With Family',
    partTimeWork: 'No Job',
    dailySelfStudyHours: '3 - 5 hours',
    dailyCommuteTime: 'Less than 30 mins',
    activeBacklogs: '0 Backlogs',
    nightlySleepHours: '7 - 8 hours',
    mentalHealthState: 'Good / Balanced',
    impactFactors: ['None of the Above'],
  };

  const [formData, setFormData] = useState(defaultState);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Helper to extract and map survey fields from raw DB object safely
  const mapDataToForm = useCallback((source) => {
    if (!source) return defaultState;

    const nested = source.surveyData || {};

    return {
      familyMonthlyIncome:
        nested.familyMonthlyIncome ||
        nested.familyIncome ||
        source.familyIncome ||
        source.familyMonthlyIncome ||
        'Below ₹15,000',
      moneyFeeWorries:
        nested.moneyFeeWorries ||
        nested.feeWorries ||
        source.moneyFeeWorries ||
        source.financialStress ||
        'Low (No issue)',
      livingSituation:
        nested.livingSituation ||
        source.livingSituation ||
        'With Family',
      partTimeWork:
        nested.partTimeWork ||
        nested.partTimeJob ||
        source.partTimeWork ||
        source.partTimeJob ||
        'No Job',
      dailySelfStudyHours:
        nested.dailySelfStudyHours ||
        nested.selfStudyHours ||
        source.dailySelfStudyHours ||
        source.studyHoursPerDay ||
        '3 - 5 hours',
      dailyCommuteTime:
        nested.dailyCommuteTime ||
        nested.commuteTime ||
        source.dailyCommuteTime ||
        source.commuteTime ||
        'Less than 30 mins',
      activeBacklogs:
        nested.activeBacklogs ||
        nested.backlogs ||
        source.activeBacklogs ||
        '0 Backlogs',
      nightlySleepHours:
        nested.nightlySleepHours ||
        nested.sleepHours ||
        source.nightlySleepHours ||
        source.sleepHoursPerNight ||
        '7 - 8 hours',
      mentalHealthState:
        nested.mentalHealthState ||
        nested.mentalHealth ||
        source.mentalHealthState ||
        source.mentalHealthStatus ||
        source.mentalHealthSelfReport ||
        'Good / Balanced',
      impactFactors: Array.isArray(nested.impactFactors) && nested.impactFactors.length > 0
        ? nested.impactFactors
        : Array.isArray(source.addictions) && source.addictions.length > 0
        ? source.addictions
        : ['None of the Above'],
    };
  }, []);

  // Sync state on load or when initialData arrives
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(mapDataToForm(initialData));
    } else {
      // Direct DB Fetch Fallback if parent component passed null/empty initialData on refresh
      const fetchProfileOnMount = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/student/profile', {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });
          const result = await res.json();
          if (res.ok && result.profile) {
            setFormData(mapDataToForm(result.profile));
          }
        } catch (err) {
          console.error('Failed to auto-fetch profile on mount:', err);
        }
      };

      fetchProfileOnMount();
    }
  }, [initialData, mapDataToForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (factor) => {
    setFormData((prev) => {
      let current = [...(prev.impactFactors || [])];

      if (factor === 'None of the Above') {
        return { ...prev, impactFactors: ['None of the Above'] };
      }

      current = current.filter((item) => item !== 'None of the Above');

      if (current.includes(factor)) {
        current = current.filter((item) => item !== factor);
      } else {
        current.push(factor);
      }

      if (current.length === 0) current = ['None of the Above'];

      return { ...prev, impactFactors: current };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const targetStudentId = studentId || initialData?._id || initialData?.id;

      const payload = {
        studentId: targetStudentId,
        surveyCompleted: true,
        surveyStatus: 'Completed',
        isSurveyDone: true,
        financialStress: formData.moneyFeeWorries,
        mentalHealthStatus: formData.mentalHealthState,
        mentalHealthSelfReport: formData.mentalHealthState,
        ...formData,
        surveyData: {
          ...formData,
          familyIncome: formData.familyMonthlyIncome,
          feeWorries: formData.moneyFeeWorries,
          partTimeJob: formData.partTimeWork,
          selfStudyHours: formData.dailySelfStudyHours,
          commuteTime: formData.dailyCommuteTime,
          backlogs: formData.activeBacklogs,
          sleepHours: formData.nightlySleepHours,
          mentalHealth: formData.mentalHealthState,
        },
      };

      const response = await fetch('/api/student/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit self-assessment');
      }

      // Update state with saved response immediately to avoid state flicker
      const updatedProfile = result.profile || result.data || payload;
      setFormData(mapDataToForm(updatedProfile));

      setStatusMessage({
        type: 'success',
        text: 'Self-assessment survey submitted successfully!',
      });

      if (onSurveySubmitted) {
        onSurveySubmitted(updatedProfile);
      }
    } catch (error) {
      console.error('Survey Submission Error:', error);
      setStatusMessage({
        type: 'error',
        text: error.message || 'An error occurred while submitting your survey.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={20} />
          Student Self-Assessment & Lifestyle Survey
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Structured metrics to help identify potential academic or wellness roadblocks early.
        </p>
      </div>

      {/* Alert Banner */}
      {statusMessage.text && (
        <div
          className={`p-3.5 mb-6 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: FINANCIAL & LOGISTICAL */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
            <DollarSign size={14} /> FINANCIAL & LOGISTICAL INDICATORS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Family Monthly Income (₹)</label>
              <select
                name="familyMonthlyIncome"
                value={formData.familyMonthlyIncome}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Below ₹15,000">Below ₹15,000</option>
                <option value="₹15,000 - ₹30,000">₹15,000 - ₹30,000</option>
                <option value="₹30,000 - ₹60,000">₹30,000 - ₹60,000</option>
                <option value="Above ₹60,000">Above ₹60,000</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Money & Fee Worries</label>
              <select
                name="moneyFeeWorries"
                value={formData.moneyFeeWorries}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Low (No issue)">Low (No issue)</option>
                <option value="Moderate Strain">Moderate Strain</option>
                <option value="High (Severe burden)">High (Severe burden)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Living Situation</label>
              <select
                name="livingSituation"
                value={formData.livingSituation}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="With Family">With Family</option>
                <option value="Hostel">Hostel</option>
                <option value="Rented Flat / PG">Rented Flat / PG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Part-Time Work / Job</label>
              <select
                name="partTimeWork"
                value={formData.partTimeWork}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="No Job">No Job</option>
                <option value="Part-time (<20 hrs/wk)">Part-time (&lt;20 hrs/wk)</option>
                <option value="Full-time Work">Full-time Work</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: ACADEMIC LOAD & SCHEDULE */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
            <BookOpen size={14} /> ACADEMIC LOAD & DAILY SCHEDULE
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Daily Self-Study Hours</label>
              <select
                name="dailySelfStudyHours"
                value={formData.dailySelfStudyHours}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Less than 1 hour">Less than 1 hour</option>
                <option value="1 - 2 hours">1 - 2 hours</option>
                <option value="3 - 5 hours">3 - 5 hours</option>
                <option value="5+ hours">5+ hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Daily Commute Time</label>
              <select
                name="dailyCommuteTime"
                value={formData.dailyCommuteTime}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Less than 30 mins">Less than 30 mins</option>
                <option value="1 - 2 hours">1 - 2 hours</option>
                <option value="2+ hours">2+ hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Active Backlogs / Failed Papers</label>
              <select
                name="activeBacklogs"
                value={formData.activeBacklogs}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="0 Backlogs">0 Backlogs</option>
                <option value="1 - 2 Backlogs">1 - 2 Backlogs</option>
                <option value="3+ Backlogs">3+ Backlogs</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: WELLNESS & BEHAVIOR */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
            <Heart size={14} /> WELLNESS & BEHAVIOR
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nightly Sleep Hours</label>
              <select
                name="nightlySleepHours"
                value={formData.nightlySleepHours}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Less than 5 hours">Less than 5 hours</option>
                <option value="5 - 6 hours">5 - 6 hours</option>
                <option value="7 - 8 hours">7 - 8 hours</option>
                <option value="8+ hours">8+ hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Mental Health & Emotional State</label>
              <select
                name="mentalHealthState"
                value={formData.mentalHealthState}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Good / Balanced">Good / Balanced</option>
                <option value="Anxious / Stressed">Anxious / Stressed</option>
                <option value="Overwhelmed">Overwhelmed</option>
              </select>
            </div>
          </div>

          {/* Impact Factors Checkboxes */}
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <label className="block text-xs text-slate-400 mb-2.5 font-medium">
              Select any factors that impact your daily study routine:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                'Excessive Social Media',
                'Excessive Gaming',
                'Substance / Alcohol Use',
                'None of the Above',
              ].map((factor) => (
                <label key={factor} className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={(formData.impactFactors || []).includes(factor)}
                    onChange={() => handleCheckboxChange(factor)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>{factor}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Submitting Self-Assessment...</span>
              </>
            ) : (
              <span>Submit Self-Assessment Update</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentSurveyForm;