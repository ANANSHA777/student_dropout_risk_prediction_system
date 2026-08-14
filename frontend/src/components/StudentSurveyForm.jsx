import React, { useState, useEffect } from 'react';

const StudentSurveyForm = ({ initialData, onSurveySubmitted }) => {
  const [formData, setFormData] = useState({
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
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Sync with existing saved data if student re-opens the form
  useEffect(() => {
    if (initialData) {
      const survey = initialData.surveyData || initialData;
      setFormData({
        familyMonthlyIncome: survey.familyMonthlyIncome || 'Below ₹15,000',
        moneyFeeWorries: survey.moneyFeeWorries || survey.financialStress || 'Low (No issue)',
        livingSituation: survey.livingSituation || 'With Family',
        partTimeWork: survey.partTimeWork || 'No Job',
        dailySelfStudyHours: survey.dailySelfStudyHours || '3 - 5 hours',
        dailyCommuteTime: survey.dailyCommuteTime || 'Less than 30 mins',
        activeBacklogs: survey.activeBacklogs || '0 Backlogs',
        nightlySleepHours: survey.nightlySleepHours || '7 - 8 hours',
        mentalHealthState: survey.mentalHealthState || survey.mentalHealthSelfReport || 'Good / Balanced',
        impactFactors: survey.impactFactors || ['None of the Above'],
      });
    }
  }, [initialData]);

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

      // Send payload supporting both flat fields and surveyData object
      const payload = {
        ...formData,
        financialStress: formData.moneyFeeWorries,
        mentalHealthStatus: formData.mentalHealthState,
        mentalHealthSelfReport: formData.mentalHealthState,
        surveyData: formData,
      };

      const response = await fetch('/api/student/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit self-assessment');
      }

      setStatusMessage({
        type: 'success',
        text: 'Self-assessment survey submitted successfully!',
      });

      if (onSurveySubmitted) {
        onSurveySubmitted(result.profile || result.data);
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error.message || 'An error occurred while submitting your survey.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          🧠 Student Self-Assessment & Lifestyle Survey
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Structured metrics to help identify potential academic or wellness roadblocks early.
        </p>
      </div>

      {statusMessage.text && (
        <div
          className={`p-3 mb-6 rounded-lg text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* FINANCIAL & LOGISTICAL INDICATORS */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
            $ FINANCIAL & LOGISTICAL INDICATORS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Family Monthly Income (₹)</label>
              <select
                name="familyMonthlyIncome"
                value={formData.familyMonthlyIncome}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="Below ₹15,000">Below ₹15,000</option>
                <option value="₹15,000 - ₹30,000">₹15,000 - ₹30,000</option>
                <option value="₹30,000 - ₹60,000">₹30,000 - ₹60,000</option>
                <option value="Above ₹60,000">Above ₹60,000</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Money & Fee Worries</label>
              <select
                name="moneyFeeWorries"
                value={formData.moneyFeeWorries}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="Low (No issue)">Low (No issue)</option>
                <option value="Moderate Strain">Moderate Strain</option>
                <option value="High (Severe burden)">High (Severe burden)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Living Situation</label>
              <select
                name="livingSituation"
                value={formData.livingSituation}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="With Family">With Family</option>
                <option value="Hostel">Hostel</option>
                <option value="Rented Flat / PG">Rented Flat / PG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Part-Time Work / Job</label>
              <select
                name="partTimeWork"
                value={formData.partTimeWork}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="No Job">No Job</option>
                <option value="Part-time (<20 hrs/wk)">Part-time (&lt;20 hrs/wk)</option>
                <option value="Full-time Work">Full-time Work</option>
              </select>
            </div>
          </div>
        </div>

        {/* ACADEMIC LOAD & DAILY SCHEDULE */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
            📖 ACADEMIC LOAD & DAILY SCHEDULE
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Daily Self-Study Hours</label>
              <select
                name="dailySelfStudyHours"
                value={formData.dailySelfStudyHours}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="Less than 1 hour">Less than 1 hour</option>
                <option value="1 - 2 hours">1 - 2 hours</option>
                <option value="3 - 5 hours">3 - 5 hours</option>
                <option value="5+ hours">5+ hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Daily Commute Time</label>
              <select
                name="dailyCommuteTime"
                value={formData.dailyCommuteTime}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="Less than 30 mins">Less than 30 mins</option>
                <option value="1 - 2 hours">1 - 2 hours</option>
                <option value="2+ hours">2+ hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Active Backlogs / Failed Papers</label>
              <select
                name="activeBacklogs"
                value={formData.activeBacklogs}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="0 Backlogs">0 Backlogs</option>
                <option value="1 - 2 Backlogs">1 - 2 Backlogs</option>
                <option value="3+ Backlogs">3+ Backlogs</option>
              </select>
            </div>
          </div>
        </div>

        {/* WELLNESS & BEHAVIOR */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
            ♡ WELLNESS & BEHAVIOR
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nightly Sleep Hours</label>
              <select
                name="nightlySleepHours"
                value={formData.nightlySleepHours}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="Less than 5 hours">Less than 5 hours</option>
                <option value="5 - 6 hours">5 - 6 hours</option>
                <option value="7 - 8 hours">7 - 8 hours</option>
                <option value="8+ hours">8+ hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Mental Health & Emotional State</label>
              <select
                name="mentalHealthState"
                value={formData.mentalHealthState}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="Good / Balanced">Good / Balanced</option>
                <option value="Anxious / Stressed">Anxious / Stressed</option>
                <option value="Overwhelmed">Overwhelmed</option>
              </select>
            </div>
          </div>

          {/* Impact Factors Checkboxes */}
          <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <label className="block text-xs text-slate-400 mb-2">
              Select any factors that impact your daily study routine:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {[
                'Excessive Social Media',
                'Excessive Gaming',
                'Substance / Alcohol Use',
                'None of the Above',
              ].map((factor) => (
                <label key={factor} className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={(formData.impactFactors || []).includes(factor)}
                    onChange={() => handleCheckboxChange(factor)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  {factor}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-lg disabled:opacity-50"
          >
            {loading ? 'Submitting Self-Assessment...' : 'Submit Self-Assessment Update'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentSurveyForm;