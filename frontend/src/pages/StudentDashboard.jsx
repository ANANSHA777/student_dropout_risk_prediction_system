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
  UploadCloud,
  FileText,
  Loader2,
} from 'lucide-react';
import { changePassword } from '../services/authService';
import { uploadFinancialDocument, confirmCounselingSession } from '../services/studentService';
import ChangePasswordModal from '../components/ChangePasswordModal';
import StudentSurveyForm from '../components/StudentSurveyForm';

export default function StudentDashboard() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password Modal & Feedback State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Document Upload State
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFeedback, setDocFeedback] = useState(null);

  // Counseling Session Confirmation State
  const [confirmingSession, setConfirmingSession] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState(null);

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

  const handleConfirmSession = async () => {
    setConfirmingSession(true);
    try {
      await confirmCounselingSession();
      setProfile((prev) => ({
        ...prev,
        counseling_session: {
          ...(prev?.counseling_session || {}),
          status: 'CONFIRMED_BY_STUDENT',
        },
      }));
      setSessionFeedback('Counseling session attendance successfully confirmed!');
      setTimeout(() => setSessionFeedback(null), 4000);
      await fetchProfile();
    } catch (err) {
      alert(err.message || 'Failed to confirm counseling session attendance');
    } finally {
      setConfirmingSession(false);
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setDocFeedback({ type: 'error', message: 'File size exceeds 8MB limit.' });
      return;
    }

    setUploadingDoc(true);
    setDocFeedback(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        try {
          await uploadFinancialDocument({
            filename: file.name,
            fileData: dataUrl,
            url: dataUrl,
          });
          setDocFeedback({
            type: 'success',
            message: `Document "${file.name}" uploaded successfully for verification.`,
          });
          await fetchProfile();
        } catch (err) {
          setDocFeedback({ type: 'error', message: err.message || 'Failed to upload document.' });
        } finally {
          setUploadingDoc(false);
        }
      };
      reader.onerror = () => {
        setDocFeedback({ type: 'error', message: 'Failed to read file.' });
        setUploadingDoc(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setDocFeedback({ type: 'error', message: err.message || 'Error uploading file.' });
      setUploadingDoc(false);
    }
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

  const hasCounselor = Boolean(
    profile.assignedCounselorName ||
    profile.counselorName ||
    profile.assigned_counselor_id ||
    profile.counseling_session
  );
  const hasAcademicPlan = Boolean(
    profile.academic_remedial_plan &&
    (profile.academic_remedial_plan.status === 'IN_PROGRESS' || profile.academic_remedial_plan.status === 'COMPLETED')
  );
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

        {/* Counseling Session Scheduled Notification Banner */}
        {profile.counseling_session?.status === 'SCHEDULED' && (
          <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-900 border-2 border-purple-500/60 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                <HeartHandshake size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white">Counseling Session Scheduled</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-900/60 text-purple-300 border border-purple-500/40 animate-pulse">
                    Action Required: Confirm Attendance
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Counselor <strong>{profile.counseling_session.counselor_name || profile.assignedCounselorName || 'Assigned Counselor'}</strong> has scheduled a session for{' '}
                  <strong className="text-white">
                    {profile.counseling_session.date ? new Date(profile.counseling_session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming Date'}
                  </strong>{' '}
                  at <strong className="text-white">{profile.counseling_session.time || 'TBD'}</strong>.
                </p>
                {profile.counseling_session.notes && (
                  <p className="text-xs text-purple-200/80 italic mt-0.5">
                    Instructions: "{profile.counseling_session.notes}"
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirmSession}
              disabled={confirmingSession}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/30 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {confirmingSession ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Confirm Attendance</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Session Confirmation Toast */}
        {sessionFeedback && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {sessionFeedback}
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
        {(hasCounselor || hasFinancialRelief || hasInterventions || hasAcademicPlan) && (
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
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Assigned Counselor
                    </div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {profile.counseling_session?.counselor_name || profile.assignedCounselorName || profile.counselorName || 'Counselor'}
                    </div>
                    <div className="text-xs text-indigo-300 font-medium mt-1">
                      Case Status: <span className="text-slate-200">{profile.counselingStatus || 'Active Review'}</span>
                    </div>

                    {/* Live Counseling Session Status */}
                    {profile.counseling_session?.status && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-semibold">Session Status:</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                            profile.counseling_session.status === 'COMPLETED'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              : profile.counseling_session.status === 'CONFIRMED_BY_STUDENT'
                              ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                              : profile.counseling_session.status === 'SCHEDULED'
                              ? 'bg-purple-950/60 text-purple-300 border-purple-500/40 animate-pulse'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {profile.counseling_session.status === 'CONFIRMED_BY_STUDENT'
                              ? 'Attendance Confirmed by You'
                              : profile.counseling_session.status === 'COMPLETED'
                              ? 'Session Completed'
                              : profile.counseling_session.status}
                          </span>
                        </div>
                        {profile.counseling_session.date && (
                          <div className="text-[11px] text-slate-300">
                            Scheduled for {new Date(profile.counseling_session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {profile.counseling_session.time}
                          </div>
                        )}
                        {profile.counseling_session.status === 'COMPLETED' && profile.counseling_session.completion_notes && (
                          <div className="text-[11px] text-emerald-300/90 italic">
                            Notes: "{profile.counseling_session.completion_notes}"
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mt-1.5">
                      Your assigned counselor is available for confidential guidance and wellness support.
                    </p>
                  </div>
                </div>
              )}

              {/* Active Academic Remedial Plan Card */}
              {hasAcademicPlan && (
                <div className="bg-slate-950 p-4 rounded-lg border border-amber-500/40 flex items-start gap-3">
                  <GraduationCap className="text-amber-400 mt-0.5 shrink-0" size={22} />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Academic Remedial Plan
                      </div>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                        profile.academic_remedial_plan.status === 'COMPLETED'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/40 animate-pulse'
                      }`}>
                        {profile.academic_remedial_plan.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    <div className="text-base font-bold text-white">
                      {profile.academic_remedial_plan.plan_title || 'Academic Support Plan'}
                    </div>

                    <div className="text-xs text-slate-400">
                      Assigned by: <span className="text-slate-200 font-medium">{profile.academic_remedial_plan.assigned_by_teacher_name || 'Faculty Mentor'}</span>
                      {profile.academic_remedial_plan.assigned_at && (
                        <span> • {new Date(profile.academic_remedial_plan.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      )}
                    </div>

                    {profile.academic_remedial_plan.plan_details && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {profile.academic_remedial_plan.plan_details}
                      </p>
                    )}

                    {profile.academic_remedial_plan.target_metrics && (
                      <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-xs text-amber-300">
                        <span className="text-slate-400 font-semibold">Target Metrics: </span>
                        {profile.academic_remedial_plan.target_metrics}
                      </div>
                    )}

                    {profile.academic_remedial_plan.status === 'COMPLETED' && (
                      <div className="bg-emerald-950/40 p-2.5 rounded border border-emerald-800/40 text-xs space-y-0.5">
                        <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 size={12} /> Plan Completed
                        </span>
                        {profile.academic_remedial_plan.completion_notes && (
                          <p className="text-emerald-200/90 italic text-[11px]">
                            "{profile.academic_remedial_plan.completion_notes}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* Financial Aid Card */}
              {hasFinancialRelief && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <DollarSign className="text-emerald-400 mt-0.5 shrink-0" size={22} />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        College Financial Relief Fund
                      </div>
                      <div className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                        <span>
                          {profile.financial_relief_status === 'APPROVED'
                            ? 'Approved — Relief Authorized'
                            : profile.financial_relief_status === 'DISBURSED'
                            ? 'Funds Disbursed'
                            : profile.financial_relief_status === 'DOCUMENTS_REQUIRED'
                            ? 'Action Required: Proof Needed'
                            : profile.financial_relief_status === 'REJECTED'
                            ? 'Application Declined'
                            : 'Application Under Review'}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          profile.financial_relief_status === 'APPROVED' || profile.financial_relief_status === 'DISBURSED'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : profile.financial_relief_status === 'DOCUMENTS_REQUIRED'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 animate-pulse'
                            : profile.financial_relief_status === 'REJECTED'
                            ? 'bg-red-950/60 text-red-300 border-red-500/40'
                            : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                        }`}>
                          {profile.financial_relief_status || 'REQUESTED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {profile.financial_relief_status === 'APPROVED'
                          ? 'Emergency financial relief grant has been authorized by college administration.'
                          : profile.financial_relief_status === 'DISBURSED'
                          ? 'Relief funds have been credited toward your tuition / academic expenses.'
                          : profile.financial_relief_status === 'DOCUMENTS_REQUIRED'
                          ? 'Administrative review requires verification documents (income certificate, fee bill) to release funds.'
                          : profile.financial_relief_status === 'REJECTED'
                          ? 'Financial relief request was reviewed and closed by institutional administration.'
                          : 'Emergency grant request has been submitted to assist with tuition and educational fees.'}
                      </p>
                    </div>
                  </div>

                  {/* DOCUMENT UPLOAD COMPONENT FOR DOCUMENTS_REQUIRED */}
                  {profile.financial_relief_status === 'DOCUMENTS_REQUIRED' && (
                    <div className="mt-2 p-3.5 bg-slate-900 border border-amber-500/40 rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                          <UploadCloud size={16} className="text-amber-400" />
                          <span>Upload Financial Verification Proof</span>
                        </div>
                        <span className="text-[11px] text-slate-400">PDF, JPG, PNG (Max 8MB)</span>
                      </div>

                      <p className="text-[11px] text-slate-300">
                        Please upload supporting documentation so the administration can verify eligibility and disburse your relief funds.
                      </p>

                      {docFeedback && (
                        <div className={`p-2 rounded text-xs flex items-center gap-2 ${
                          docFeedback.type === 'success'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-950/60 text-red-300 border border-red-500/30'
                        }`}>
                          {docFeedback.type === 'success' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                          <span>{docFeedback.message}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <label className={`px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                          uploadingDoc ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                        }`}>
                          {uploadingDoc ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud size={13} />
                              <span>Select & Upload Document</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            onChange={handleFileUpload}
                            disabled={uploadingDoc}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Display uploaded documents */}
                      {Array.isArray(profile.financial_documents) && profile.financial_documents.length > 0 && (
                        <div className="pt-2 border-t border-slate-800 space-y-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Uploaded Documents for Admin Verification:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {profile.financial_documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.fileData || doc.url || '#'}
                                download={doc.filename || `document_${idx + 1}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 bg-slate-950 px-2 py-1 rounded border border-slate-800"
                              >
                                <FileText size={12} className="text-indigo-400" />
                                <span className="max-w-[170px] truncate">{doc.filename}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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