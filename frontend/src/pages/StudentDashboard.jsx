// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Calendar,
  AlertTriangle,
  GraduationCap,
  KeyRound,
  LogOut,
  CheckCircle2,
  Clock,
  HeartHandshake,
  UserCheck,
  DollarSign,
  Activity,
} from 'lucide-react';
import { changePassword } from '../services/authService';
import ChangePasswordModal from '../components/ChangePasswordModal';
import StudentSurveyForm from '../components/StudentSurveyForm';

export default function StudentDashboard() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password Modal & Feedback State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/student/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();

      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const handleSurveySubmitted = async (updatedProfile) => {
    if (updatedProfile) {
      setProfile((prev) => ({
        ...prev,
        ...updatedProfile,
        surveyCompleted: true,
      }));
    }
    await fetchProfile();
  };

  if (loading) {
    return (
      <div className="p-8 text-slate-400 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Clock className="animate-spin text-indigo-400" size={20} />
          <span>Loading student profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-slate-400 bg-slate-950 min-h-screen flex items-center justify-center">
        <p>Failed to load profile. Please try logging in again.</p>
      </div>
    );
  }

  const isEvaluated = profile.riskEvaluated || (profile.riskLevel && profile.riskLevel !== 'Unevaluated');

  // Normalize risk display cleanly (avoid duplicate "Risk Risk" and handle case-insensitive matching)
  const rawRisk = profile.riskLevel || 'Unevaluated';
  const isHighRisk = rawRisk.toLowerCase().includes('high');
  const isMediumRisk = rawRisk.toLowerCase().includes('medium');
  const isLowRisk = rawRisk.toLowerCase().includes('low');

  const cleanRiskLevel = isHighRisk
    ? 'High Risk'
    : isMediumRisk
    ? 'Medium Risk'
    : isLowRisk
    ? 'Low Risk'
    : rawRisk;

  const hasCounselor = Boolean(profile.assignedCounselorName || profile.counselorName);
  const hasFinancialRelief = (profile.financial_relief_status && profile.financial_relief_status !== 'NONE') ||
    (profile.financialAidStatus === 'Pending Institutional Support');
  const hasInterventions = Array.isArray(profile.intervention_logs) && profile.intervention_logs.length > 0;

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
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-lg flex items-center gap-2 animate-in fade-in">
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
              <div className="text-2xl font-bold">{profile.attendancePercentage ?? 0}%</div>
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
                  isHighRisk
                    ? 'text-red-400'
                    : isMediumRisk
                    ? 'text-amber-400'
                    : isLowRisk
                    ? 'text-emerald-400'
                    : 'text-indigo-400'
                }
                size={32}
              />
            ) : (
              <Clock className="text-slate-500" size={32} />
            )}

            <div>
              <div className="text-xs text-slate-400 font-medium">Overall Risk Status</div>
              {isEvaluated ? (
                <div>
                  <div className="text-xl font-bold text-white">{cleanRiskLevel}</div>
                  {profile.riskCategory && profile.riskCategory !== 'None' && profile.riskCategory !== 'NONE' && (
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

        {/* Active Support Status & Institutional Care */}
        {(hasCounselor || hasFinancialRelief || hasInterventions) && (
          <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <HeartHandshake className="text-indigo-400" size={20} />
                Active Support Status & Student Care
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium">
                Institutional Care Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Counselor Support Card */}
              {hasCounselor && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-start gap-3">
                  <UserCheck className="text-indigo-400 mt-0.5 shrink-0" size={22} />
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Assigned Counselor
                    </div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {profile.assignedCounselorName || profile.counselorName}
                    </div>
                    <div className="text-xs text-indigo-300 font-medium mt-1">
                      Case Status: <span className="text-slate-200">{profile.counselingStatus || 'Active Review'}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Your assigned counselor is available for confidential guidance and wellness support.
                    </p>
                  </div>
                </div>
              )}

              {/* Financial Aid Card */}
              {hasFinancialRelief && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-start gap-3">
                  <DollarSign className="text-emerald-400 mt-0.5 shrink-0" size={22} />
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      College Financial Relief Fund
                    </div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {profile.financial_relief_status === 'APPROVED'
                        ? 'Approved'
                        : profile.financial_relief_status === 'DISBURSED'
                        ? 'Disbursed'
                        : 'Application Under Review'}
                    </div>
                    <div className="text-xs text-emerald-300 font-medium mt-1">
                      Status: {profile.financial_relief_status || 'REQUESTED'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {profile.financial_relief_status === 'APPROVED' || profile.financial_relief_status === 'DISBURSED'
                        ? 'Emergency financial relief has been authorized by college administration.'
                        : 'Emergency grant request has been submitted to assist with tuition and educational fees.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Latest Support Activity Timeline */}
            {hasInterventions && (
              <div className="border-t border-slate-800 pt-4 mt-2">
                <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Activity size={14} className="text-indigo-400" />
                  Recent Support & Action Updates
                </div>
                <div className="space-y-2">
                  {profile.intervention_logs.slice(-3).reverse().map((log, idx) => (
                    <div key={idx} className="text-xs bg-slate-950/60 p-3 rounded-md border border-slate-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                      <div>
                        <span className="font-semibold text-slate-200">{log.action || 'Support Action Logged'}</span>
                        {log.notes && (
                          <span className="text-slate-400 ml-1.5">— {log.notes}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* Self-Assessment & Lifestyle Survey Form */}
        <StudentSurveyForm
          initialData={profile}
          onSurveySubmitted={handleSurveySubmitted}
          studentId={profile._id || profile.id}
        />

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