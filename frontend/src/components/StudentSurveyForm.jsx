import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle2, Send, AlertCircle, Edit3, ChevronUp, Clock } from 'lucide-react';

export default function StudentSurveyForm({ initialData = {}, onSurveySubmitted, studentId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    academicInterest: 'High (Interested & Motivated)',
    abilityToStudy: 'Full (Good Environment & Focus)',
    familyMonthlyIncome: 'Above ₹60,000',
    moneyFeeWorries: 'Moderate (Manageable)',
    livingSituation: 'Campus Hostel',
    partTimeWork: 'No Job',
    dailySelfStudyHours: '1 - 2 hours',
    dailyCommuteTime: 'Less than 30 mins',
    activeBacklogs: '0 Backlogs',
    nightlySleepHours: '5 - 6 hours',
    mentalHealthState: 'Good / Balanced',
    impactFactors: ['None of the Above'],
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        academicInterest: initialData.academicInterest || prev.academicInterest,
        abilityToStudy: initialData.abilityToStudy || prev.abilityToStudy,
        familyMonthlyIncome: initialData.familyMonthlyIncome || initialData.familyIncome || prev.familyMonthlyIncome,
        moneyFeeWorries: initialData.moneyFeeWorries || initialData.financialStress || prev.moneyFeeWorries,
        livingSituation: initialData.livingSituation || prev.livingSituation,
        partTimeWork: initialData.partTimeWork || initialData.partTimeJob || prev.partTimeWork,
        dailySelfStudyHours: initialData.dailySelfStudyHours || initialData.studyHoursPerDay || prev.dailySelfStudyHours,
        dailyCommuteTime: initialData.dailyCommuteTime || initialData.commuteTime || prev.dailyCommuteTime,
        activeBacklogs: initialData.activeBacklogs || prev.activeBacklogs,
        nightlySleepHours: initialData.nightlySleepHours || initialData.sleepHoursPerNight || prev.nightlySleepHours,
        mentalHealthState: initialData.mentalHealthState || initialData.mentalHealthSelfReport || prev.mentalHealthState,
        impactFactors: initialData.impactFactors?.length ? initialData.impactFactors : prev.impactFactors,
      }));
    }
  }, [initialData]);

  const isCompleted = initialData?.surveyCompleted || initialData?.surveyStatus === 'Completed';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (factor) => {
    setFormData((prev) => {
      let current = [...prev.impactFactors];

      if (factor === 'None of the Above') {
        return { ...prev, impactFactors: ['None of the Above'] };
      }

      current = current.filter((item) => item !== 'None of the Above');

      if (current.includes(factor)) {
        current = current.filter((item) => item !== factor);
      } else {
        current.push(factor);
      }

      if (current.length === 0) {
        current = ['None of the Above'];
      }

      return { ...prev, impactFactors: current };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      ...formData,
      studentId: studentId || initialData._id || initialData.id,
      surveyCompleted: true,
      surveyStatus: 'Completed',
      lastSurveySubmittedAt: new Date().toISOString(),
      surveyData: { ...formData },
    };

    try {
      const res = await fetch('/api/student/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success || res.ok) {
        setMessage({ type: 'success', text: 'Self-assessment updated successfully!' });
        setIsEditing(false);
        if (onSurveySubmitted) {
          onSurveySubmitted(data.profile || payload);
        }
      } else {
        throw new Error(data.message || 'Failed to update self-assessment.');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error connecting to server.' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 text-slate-200 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="text-indigo-400" size={22} />
            Student Self-Assessment & Lifestyle Survey
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured metrics to help identify potential academic or wellness roadblocks early.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-3 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <CheckCircle2 size={14} />
            Survey Status: {isCompleted ? 'Completed' : 'Pending'}
          </span>

          {/* Cooldown pill */}
          {isCompleted && initialData?.cooldownActive && (
            <span className="text-[11px] text-amber-400 font-medium px-2.5 py-1 rounded-full bg-amber-950/50 border border-amber-500/30 flex items-center gap-1.5">
              <Clock size={12} />
              Cooldown: {initialData.daysRemaining || 14}d left
            </span>
          )}

          {/* Single Primary Action Button */}
          {isCompleted && !isEditing && (
            <button
              type="button"
              onClick={() => !initialData?.cooldownActive && setIsEditing(true)}
              disabled={Boolean(initialData?.cooldownActive)}
              title={
                initialData?.cooldownActive
                  ? `Survey cooldown active: ${initialData.daysRemaining || 14} days remaining before you can update self-assessment.`
                  : 'Update Self-Assessment'
              }
              className={`border text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                initialData?.cooldownActive
                  ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300 cursor-pointer'
              }`}
            >
              <Edit3 size={14} />
              Update Self-Assessment
            </button>
          )}
        </div>
      </div>

      {/* Override Notice if teacher requested re-survey */}
      {initialData?.survey_cooldown_override && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
          <span>Faculty teacher has requested an updated self-assessment. Cooldown override active.</span>
        </div>
      )}

      {/* Cooldown Active Information Banner */}
      {initialData?.cooldownActive && !isEditing && (
        <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={15} className="shrink-0 text-amber-400" />
            <span>
              14-day re-assessment cooldown active ({initialData.daysRemaining || 14} days remaining). Your answers are locked until the cycle finishes or faculty requests a re-submission.
            </span>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* COLLAPSED / COMPLETED SUMMARY VIEW */}
      {isCompleted && !isEditing ? (
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block font-medium">Academic Interest:</span>
              <span className="text-slate-200 font-semibold">{formData.academicInterest}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Study Ability:</span>
              <span className="text-slate-200 font-semibold">{formData.abilityToStudy}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Financial Worries:</span>
              <span className="text-slate-200 font-semibold">{formData.moneyFeeWorries}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Mental Wellbeing:</span>
              <span className="text-slate-200 font-semibold">{formData.mentalHealthState}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <span>
              Factors Selected:{' '}
              <strong className="text-indigo-300 font-medium">
                {formData.impactFactors.join(', ')}
              </strong>
            </span>
          </div>
        </div>
      ) : (
        /* EXPANDED FULL SURVEY FORM */
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
          {/* SECTION 1: ACADEMIC & STUDY ENGAGEMENT */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
              🎓 ACADEMIC & STUDY ENGAGEMENT
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Interest in Current Course</label>
                <select
                  name="academicInterest"
                  value={formData.academicInterest}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="High (Interested & Motivated)">High (Interested & Motivated)</option>
                  <option value="Moderate (Neutral)">Moderate (Neutral)</option>
                  <option value="Low (Lost Interest / Disengaged)">Low (Lost Interest / Disengaged)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Ability to Study Effectively</label>
                <select
                  name="abilityToStudy"
                  value={formData.abilityToStudy}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Full (Good Environment & Focus)">Full (Good Environment & Focus)</option>
                  <option value="Partial (Frequent Distractions)">Partial (Frequent Distractions)</option>
                  <option value="Severe Focus Issues">Severe Focus Issues</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: FINANCIAL & LOGISTICAL INDICATORS */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
              💲 FINANCIAL & LOGISTICAL INDICATORS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Family Monthly Income (₹)</label>
                <select
                  name="familyMonthlyIncome"
                  value={formData.familyMonthlyIncome}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
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
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Low (No Issue)">Low (No Issue)</option>
                  <option value="Moderate (Manageable)">Moderate (Manageable)</option>
                  <option value="High (Severe Financial Strain)">High (Severe Financial Strain)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Living Situation</label>
                <select
                  name="livingSituation"
                  value={formData.livingSituation}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Campus Hostel">Campus Hostel</option>
                  <option value="With Family">With Family</option>
                  <option value="Rented Flat / PG">Rented Flat / PG</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Part-Time Work / Job</label>
                <select
                  name="partTimeWork"
                  value={formData.partTimeWork}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="No Job">No Job</option>
                  <option value="Part-time (< 20 hrs/wk)">Part-time (&lt; 20 hrs/wk)</option>
                  <option value="Full-time / Heavy Workload">Full-time / Heavy Workload</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: ACADEMIC LOAD & DAILY SCHEDULE */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
              📖 ACADEMIC LOAD & DAILY SCHEDULE
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Daily Self-Study Hours</label>
                <select
                  name="dailySelfStudyHours"
                  value={formData.dailySelfStudyHours}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Less than 1 hour">Less than 1 hour</option>
                  <option value="1 - 2 hours">1 - 2 hours</option>
                  <option value="3 - 5 hours">3 - 5 hours</option>
                  <option value="More than 5 hours">More than 5 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Daily Commute Time</label>
                <select
                  name="dailyCommuteTime"
                  value={formData.dailyCommuteTime}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Less than 30 mins">Less than 30 mins</option>
                  <option value="1 - 2 hours">1 - 2 hours</option>
                  <option value="More than 2 hours">More than 2 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Active Backlogs / Failed Papers</label>
                <select
                  name="activeBacklogs"
                  value={formData.activeBacklogs}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="0 Backlogs">0 Backlogs</option>
                  <option value="1 - 2 Backlogs">1 - 2 Backlogs</option>
                  <option value="3+ Backlogs">3+ Backlogs</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: WELLNESS & BEHAVIOR */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
              ♡ WELLNESS & BEHAVIOR
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nightly Sleep Hours</label>
                <select
                  name="nightlySleepHours"
                  value={formData.nightlySleepHours}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
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
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Good / Balanced">Good / Balanced</option>
                  <option value="Anxious / Stressed">Anxious / Stressed</option>
                  <option value="Depressed / Overwhelmed">Depressed / Overwhelmed</option>
                </select>
              </div>
            </div>

            {/* CHECKBOXES */}
            <div className="pt-2">
              <label className="block text-xs text-slate-400 mb-3">
                Select any factors that impact your daily study routine:
              </label>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  'Excessive Social Media',
                  'Excessive Gaming',
                  'Substance / Alcohol Use',
                  'None of the Above',
                ].map((factor) => {
                  const checked = formData.impactFactors.includes(factor);
                  return (
                    <label
                      key={factor}
                      className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-white transition"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleCheckboxChange(factor)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950"
                      />
                      <span>{factor}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FORM FOOTER ACTIONS */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              {submitting ? 'Saving Assessment...' : 'Submit Self-Assessment'}
            </button>

            {isCompleted && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronUp size={14} />
                Cancel Editing
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}