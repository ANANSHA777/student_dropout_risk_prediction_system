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