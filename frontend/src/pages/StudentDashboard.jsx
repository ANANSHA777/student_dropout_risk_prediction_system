// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Calendar,
  AlertTriangle,
  Send,
  GraduationCap,
  KeyRound,
  LogOut,
  CheckCircle2,
  Clock,
  UserCheck,
  Heart,
  DollarSign,
  Brain,
} from 'lucide-react';
import { changePassword } from '../services/authService';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function StudentDashboard() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);

  // Toggle state to switch between summary view and edit form view
  const [isEditingSurvey, setIsEditingSurvey] = useState(false);

  // Structured Survey State with clean default initializers
  const [survey, setSurvey] = useState({
    familyIncome: '< 15,000',
    financialStress: 'Low',
    livingSituation: 'With Family',
    commuteTime: '< 30 mins',
    partTimeJob: 'No',
    activeBacklogs: '0',
    studyHoursPerDay: '3-5 hrs',
    sleepHoursPerNight: '7-8 hrs',
    mentalHealthStatus: 'Good',
    addictions: {
      socialMedia: false,
      gaming: false,
      substances: false,
      none: true,
    },
  });

  const [statusMsg, setStatusMsg] = useState('');
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  // Password Modal & Feedback State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * Translates string arrays or object states into clean boolean map for form checkboxes
   */
  const parseImpactFactorsToBooleans = (rawFactors) => {
    const result = {
      socialMedia: false,
      gaming: false,
      substances: false,
      none: true,
    };

    if (!rawFactors) return result;

    if (Array.isArray(rawFactors)) {
      rawFactors.forEach((factor) => {
        const lower = String(factor).toLowerCase();
        if (lower.includes('social media')) result.socialMedia = true;
        if (lower.includes('gaming')) result.gaming = true;
        if (lower.includes('substance') || lower.includes('alcohol')) result.substances = true;
      });
    } else if (typeof rawFactors === 'object') {
      result.socialMedia = Boolean(rawFactors.socialMedia);
      result.gaming = Boolean(rawFactors.gaming);
      result.substances = Boolean(rawFactors.substances);
    }

    result.none = !result.socialMedia && !result.gaming && !result.substances;
    return result;
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/student/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();

      if (data.success && data.profile) {
        setProfile(data.profile);

        // Normalize survey data payload safely from backend
        const sData = data.profile.surveyData || {};
        const pData = data.profile;

        const rawFactors =
          sData.impactFactors ||
          pData.addictions ||
          sData.addictions ||
          pData.impactFactors;

        const parsedAddictions = parseImpactFactorsToBooleans(rawFactors);

        setSurvey({
          familyIncome: sData.familyMonthlyIncome || pData.familyIncome || '< 15,000',
          financialStress: sData.moneyFeeWorries || pData.financialStress || 'Low',
          livingSituation: sData.livingSituation || pData.livingSituation || 'With Family',
          commuteTime: sData.dailyCommuteTime || pData.commuteTime || '< 30 mins',
          partTimeJob: sData.partTimeWork || pData.partTimeJob || 'No',
          activeBacklogs: sData.activeBacklogs || pData.activeBacklogs || '0',
          studyHoursPerDay: sData.dailySelfStudyHours || pData.studyHoursPerDay || '3-5 hrs',
          sleepHoursPerNight: sData.nightlySleepHours || pData.sleepHoursPerNight || '7-8 hrs',
          mentalHealthStatus: sData.mentalHealthState || pData.mentalHealthSelfReport || 'Good',
          addictions: parsedAddictions,
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const showPasswordFeedback = (msg) => {
    setPasswordFeedback(msg);
    setTimeout(() => setPasswordFeedback(null), 3000);
  };

  const handleChangePassword = async (passwords) => {
    try {
      await changePassword(passwords);
      showPasswordFeedback('Password updated successfully.');
      setIsPasswordModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to update password');
    }
  };

  const handleCheckboxChange = (field) => {
    setSurvey((prev) => {
      if (field === 'none') {
        return {
          ...prev,
          addictions: { socialMedia: false, gaming: false, substances: false, none: true },
        };
      }
      return {
        ...prev,
        addictions: {
          ...prev.addictions,
          [field]: !prev.addictions[field],
          none: false,
        },
      };
    });
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    setSubmittingSurvey(true);
    setStatusMsg('');

    try {
      const res = await fetch('/api/student/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(survey),
      });

      const data = await res.json();

      if (data.success) {
        setStatusMsg('Self-assessment survey submitted successfully!');
        setIsEditingSurvey(false); // Switch back to summary card
        await fetchProfile(); // Refetch profile to synchronize latest state
      } else {
        setStatusMsg(data.message || 'Error submitting survey. Please try again.');
      }
    } catch (err) {
      console.error('Submit Error:', err);
      setStatusMsg('Error submitting survey. Please check server logs.');
    } finally {
      setSubmittingSurvey(false);
    }
  };

  if (!profile) return <div className="p-8 text-slate-400 bg-slate-950 min-h-screen">Loading student profile...</div>;

  const isEvaluated = profile.riskEvaluated || (profile.riskLevel && profile.riskLevel !== 'Unevaluated');

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {profile.name || 'Student'}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Student ID: <span className="text-slate-300 font-medium">{profile.studentId || profile.user || 'N/A'}</span> | Dept: <span className="text-slate-300 font-medium">{profile.department || 'General'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-lg border border-slate-800 text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <KeyRound size={16} className="text-indigo-400" />
              Change Password
            </button>

            <button
              onClick={logout}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-lg border border-slate-800 text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <LogOut size={16} className="text-red-400" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Password Toast */}
        {passwordFeedback && (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="text-indigo-400" />
            {passwordFeedback}
          </div>
        )}

        {/* Top Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
            <Calendar className="text-indigo-400" size={32} />
            <div>
              <div className="text-xs text-slate-400 font-medium">Attendance</div>
              <div className="text-2xl font-bold">{profile.attendancePercentage || 0}%</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
            <BookOpen className="text-indigo-400" size={32} />
            <div>
              <div className="text-xs text-slate-400 font-medium">Latest Grade Average</div>
              <div className="text-2xl font-bold">{profile.cgpa ? (profile.cgpa * 10).toFixed(0) : 0}%</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
            {isEvaluated ? (
              <AlertTriangle
                className={
                  profile.riskLevel === 'High'
                    ? 'text-red-400'
                    : profile.riskLevel === 'Medium'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }
                size={32}
              />
            ) : (
              <Clock className="text-slate-500" size={32} />
            )}

            <div>
              <div className="text-xs text-slate-400 font-medium">Academic Risk Status</div>
              {isEvaluated ? (
                <div>
                  <div className="text-xl font-bold text-white">{profile.riskLevel} Risk</div>
                  {profile.riskCategory && (
                    <div className="text-[11px] text-indigo-300 font-medium mt-0.5">
                      Category: {profile.riskCategory}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-400">
                  Pending AI Evaluation
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Remedial Tasks */}
        {profile.assignedTasks && profile.assignedTasks.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
              <GraduationCap className="text-indigo-400" /> Assigned Remedial Tasks & Support
            </h2>

            <div className="space-y-3">
              {profile.assignedTasks.map((task, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-indigo-300">{task.title}</div>
                    <div className="text-xs text-slate-400">{task.description}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${task.completed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                    {task.completed ? 'Completed' : 'Pending Action'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPREHENSIVE DROPOUT RISK SURVEY */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Brain className="text-indigo-400" size={20} />
                Student Self-Assessment & Lifestyle Survey
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Structured metrics to help identify potential academic or wellness roadblocks early.
              </p>
            </div>
            {profile.surveyCompleted && (
              <span className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1 font-medium">
                <UserCheck size={14} /> Survey Status: Completed
              </span>
            )}
          </div>

          {statusMsg && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold">
              {statusMsg}
            </div>
          )}

          {/* COMPACT SUMMARY VIEW WHEN SURVEY IS COMPLETED & NOT EDITING */}
          {profile.surveyCompleted && !isEditingSurvey ? (
            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> Your response has been recorded.
                </div>
                <button
                  onClick={() => setIsEditingSurvey(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
                >
                  Update Response
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Money & Fee Worries</span>
                  <span className="text-slate-200 font-medium">{survey.financialStress}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Commute Time</span>
                  <span className="text-slate-200 font-medium">{survey.commuteTime}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sleep Hours</span>
                  <span className="text-slate-200 font-medium">{survey.sleepHoursPerNight}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mental Health State</span>
                  <span className="text-slate-200 font-medium">{survey.mentalHealthStatus}</span>
                </div>
              </div>
            </div>
          ) : (
            /* INPUT FORM VIEW WHEN PENDING OR EDITING */
            <form onSubmit={handleSurveySubmit} className="space-y-6">
              
              {/* 1. FINANCIAL & LOGISTICAL FACTORS */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <DollarSign size={14} /> Financial & Logistical Indicators
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Family Monthly Income (₹)</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={survey.familyIncome}
                      onChange={(e) => setSurvey({ ...survey, familyIncome: e.target.value })}
                    >
                      <option value="< 15,000">Below ₹15,000</option>
                      <option value="15,000 - 30,000">₹15,000 - ₹30,000</option>
                      <option value="30,000 - 60,000">₹30,000 - ₹60,000</option>
                      <option value="> 60,000">Above ₹60,000</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Money & Fee Worries</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={survey.financialStress}
                      onChange={(e) => setSurvey({ ...survey, financialStress: e.target.value })}
                    >
                      <option value="Low">Low (No issue)</option>
                      <option value="Moderate">Moderate (Manageable)</option>
                      <option value="High">High (Severe burden)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Living Situation</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={survey.livingSituation}
                      onChange={(e) => setSurvey({ ...survey, livingSituation: e.target.value })}
                    >
                      <option value="With Family">With Family</option>
                      <option value="Campus Hostel">Campus Hostel</option>
                      <option value="Rented PG / Flat">Rented PG / Flat</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Part-Time Work / Job</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={survey.partTimeJob}
                      onChange={(e) => setSurvey({ ...survey, partTimeJob: e.target.value })}
                    >
                      <option value="No">No Job</option>
                      <option value="Yes (< 20 hrs/wk)">Yes (&lt; 20 hrs/week)</option>
                      <option value="Yes (> 20 hrs/wk)">Yes (&gt; 20 hrs/week)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. ACADEMIC & DAILY ROUTINE */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <BookOpen size={14} /> Academic Load & Daily Schedule
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Daily Self-Study Hours</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={survey.studyHoursPerDay}
                      onChange={(e) => setSurvey({ ...survey, studyHoursPerDay: e.target.value })}
                    >
                      <option value="< 1 hr">Less than 1 hour</option>
                      <option value="1-2 hrs">1 - 2 hours</option>
                      <option value="3-5 hrs">3 - 5 hours</option>
                      <option value="> 5 hrs">More than 5 hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Daily Commute Time</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={survey.commuteTime}
                      onChange={(e) => setSurvey({ ...survey, commuteTime: e.target.value })}
                    >
                      <option value="< 30 mins">Less than 30 mins</option>
                      <option value="30-60 mins">30 - 60 mins</option>
                      <option value="1-2 hrs">1 - 2 hours</option>
                      <option value="> 2 hrs">More than 2 hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Active Backlogs / Failed Papers</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={survey.activeBacklogs}
                      onChange={(e) => setSurvey({ ...survey, activeBacklogs: e.target.value })}
                    >
                      <option value="0">0 Backlogs</option>
                      <option value="1-2">1 - 2 Backlogs</option>
                      <option value="3-4">3 - 4 Backlogs</option>
                      <option value="> 4">More than 4 Backlogs</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. HEALTH, SLEEP & BEHAVIORAL FACTORS */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Heart size={14} /> Wellness & Behavior
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nightly Sleep Hours</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={survey.sleepHoursPerNight}
                      onChange={(e) => setSurvey({ ...survey, sleepHoursPerNight: e.target.value })}
                    >
                      <option value="< 5 hrs">Less than 5 hours</option>
                      <option value="5-6 hrs">5 - 6 hours</option>
                      <option value="7-8 hrs">7 - 8 hours</option>
                      <option value="> 8 hrs">More than 8 hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Mental Health & Emotional State</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={survey.mentalHealthStatus}
                      onChange={(e) => setSurvey({ ...survey, mentalHealthStatus: e.target.value })}
                    >
                      <option value="Good">Good / Balanced</option>
                      <option value="Anxious">Anxious / Stressed</option>
                      <option value="Depressed">Low Mood / Feeling Down</option>
                      <option value="Burned Out">Completely Burned Out</option>
                    </select>
                  </div>
                </div>

                {/* Addictions / Behavioral Checkboxes */}
                <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-lg mt-3">
                  <label className="text-xs text-slate-400 block mb-2 font-medium">
                    Select any factors that impact your daily study routine:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={survey.addictions.socialMedia}
                        onChange={() => handleCheckboxChange('socialMedia')}
                        className="accent-indigo-500 rounded"
                      />
                      Excessive Social Media
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={survey.addictions.gaming}
                        onChange={() => handleCheckboxChange('gaming')}
                        className="accent-indigo-500 rounded"
                      />
                      Excessive Gaming
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={survey.addictions.substances}
                        onChange={() => handleCheckboxChange('substances')}
                        className="accent-indigo-500 rounded"
                      />
                      Substance / Alcohol Use
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={survey.addictions.none}
                        onChange={() => handleCheckboxChange('none')}
                        className="accent-indigo-500 rounded"
                      />
                      None of the Above
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submittingSurvey}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                >
                  <Send size={14} /> {submittingSurvey ? 'Submitting...' : 'Submit Self-Assessment Update'}
                </button>

                {isEditingSurvey && (
                  <button
                    type="button"
                    onClick={() => setIsEditingSurvey(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          onChangePassword={handleChangePassword}
        />
      </div>
    </div>
  );
}