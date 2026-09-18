// src/pages/CounselorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  FilePlus2,
  AlertCircle,
  Eye,
  Send,
  Loader2,
  Clock,
  UserCheck,
  Heart,
  X,
  Sparkles,
} from 'lucide-react';
import { changePassword } from '../services/authService';
import {
  fetchCounselorCases,
  logInterventionNote,
  updateCaseStatus,
} from '../services/counselorService';
import ChangePasswordModal from '../components/ChangePasswordModal';
import StudentDetailModal from '../components/StudentDetailModal';

export default function CounselorDashboard() {
  const { user, logout } = useAuth();

  // Dashboard Data States
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Feedback
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Intervention Modal State
  const [selectedStudentForIntervention, setSelectedStudentForIntervention] = useState(null);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [sessionType, setSessionType] = useState('Counseling Session');
  const [interventionStatus, setInterventionStatus] = useState('In Progress');
  const [interventionNotes, setInterventionNotes] = useState('');
  const [interventionActionPlan, setInterventionActionPlan] = useState('');
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);

  // Student Detail Modal State
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Load Counselor Intervention Cases from backend
  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCounselorCases();
      setCases(Array.isArray(data) ? data : data.cases || []);
    } catch (err) {
      console.error('Failed to load counselor cases:', err);
      setError(err.message || 'Failed to fetch counselor caseload');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
    // 15-second polling loop for real-time caseload notifications
    const interval = setInterval(() => {
      loadCases();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const showFeedback = (msg) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Change Password Handler
  const handleChangePassword = async (passwords) => {
    try {
      await changePassword(passwords);
      showFeedback('Password updated successfully.');
      setIsPasswordModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to update password');
    }
  };

  // Status Change Handler
  const handleStatusChange = async (studentId, newStatus) => {
    try {
      await updateCaseStatus(studentId, newStatus);
      showFeedback(`Case status updated to "${newStatus}"`);
      // Update locally immediately
      setCases((prev) =>
        prev.map((c) =>
          (c._id === studentId || c.id === studentId)
            ? { ...c, caseStatus: newStatus, counselingStatus: newStatus }
            : c
        )
      );
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Open Log Intervention Modal
  const handleOpenInterventionModal = (student) => {
    setSelectedStudentForIntervention(student);
    setSessionType('Counseling Session');
    setInterventionStatus(student.caseStatus || 'In Progress');
    setInterventionNotes('');
    setInterventionActionPlan('');
    setIsInterventionModalOpen(true);
  };

  // Submit Intervention Form
  const handleSubmitIntervention = async (e) => {
    e.preventDefault();
    if (!selectedStudentForIntervention) return;

    setIsSubmittingIntervention(true);
    const targetId = selectedStudentForIntervention._id || selectedStudentForIntervention.id;
    try {
      await logInterventionNote(targetId, {
        sessionType,
        notes: interventionNotes,
        status: interventionStatus,
        actionPlan: interventionActionPlan,
      });

      showFeedback(`Intervention logged for ${selectedStudentForIntervention.name}`);
      setIsInterventionModalOpen(false);
      setSelectedStudentForIntervention(null);
      await loadCases();
    } catch (err) {
      alert(`Error logging intervention: ${err.message}`);
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  // Stats Counters
  const activeCasesCount = cases.filter((c) => c.caseStatus !== 'Resolved').length;
  const criticalCount = cases.filter((c) => {
    const r = String(c.riskLevel || '').toLowerCase();
    const st = String(c.status || '').toLowerCase();
    return r.includes('high') || st.includes('critical') || st.includes('depressed') || st.includes('severe');
  }).length;
  const resolvedCount = cases.filter((c) => c.caseStatus === 'Resolved').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HeartHandshake className="text-emerald-400" />
            Counselor Intervention Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Logged in as <span className="text-emerald-300 font-medium">{user?.name || 'Counselor'}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-lg border border-slate-800 text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <KeyRound size={16} className="text-emerald-400" />
            Change Password
          </button>

          <button
            onClick={logout}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-lg border border-slate-800 text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="max-w-7xl mx-auto mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {actionFeedback}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
          <button onClick={loadCases} className="underline text-xs hover:text-white cursor-pointer">
            Retry
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto space-y-8">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Active Cases */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HeartHandshake size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{activeCasesCount}</div>
              <div className="text-xs text-slate-400 font-medium">Active Assigned Cases</div>
            </div>
          </div>

          {/* Card 2: High Priority */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{criticalCount}</div>
              <div className="text-xs text-slate-400 font-medium">High Risk / Critical Priority</div>
            </div>
          </div>

          {/* Card 3: Interventions Resolved */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{resolvedCount}</div>
              <div className="text-xs text-slate-400 font-medium">Interventions Resolved</div>
            </div>
          </div>
        </div>

        {/* Intervention Cases Table Section */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Student Wellness & Non-Academic Caseload</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time synchronized student cases requiring supportive counseling and action steps
              </p>
            </div>
            <button
              onClick={loadCases}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition cursor-pointer flex items-center gap-2 text-xs font-semibold"
              title="Refresh Cases"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Caseload</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-950/40">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Risk Tier</th>
                  <th className="p-3.5">Primary Concern</th>
                  <th className="p-3.5">Self-Reported Status</th>
                  <th className="p-3.5">Case Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500 italic">
                      No wellness intervention cases assigned yet.
                    </td>
                  </tr>
                ) : (
                  cases.map((item) => {
                    const studentId = item._id || item.id;
                    const isHigh = String(item.riskLevel || '').toLowerCase().includes('high');
                    const isMedium = String(item.riskLevel || '').toLowerCase().includes('medium');

                    return (
                      <tr key={studentId} className="hover:bg-slate-800/30 transition">
                        {/* Student */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-200">{item.name}</div>
                          <div className="text-xs text-slate-400">{item.email}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {item.studentId} • {item.department}
                          </div>
                        </td>

                        {/* Risk Tier */}
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              isHigh
                                ? 'bg-red-950/60 text-red-400 border-red-500/40'
                                : isMedium
                                ? 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                                : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                            }`}
                          >
                            {item.riskLevel || 'Unevaluated'}
                          </span>
                        </td>

                        {/* Primary Concern */}
                        <td className="p-3.5">
                          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/50">
                            {item.concern || item.riskCategory || 'Wellness & Mental Health'}
                          </span>
                        </td>

                        {/* Self-Reported Status */}
                        <td className="p-3.5">
                          <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                            <Heart size={13} className="text-rose-400 shrink-0" />
                            <span>{item.status || 'Anxious / Stressed'}</span>
                          </span>
                        </td>

                        {/* Case Status Dropdown */}
                        <td className="p-3.5">
                          <select
                            value={item.caseStatus || 'Active Review'}
                            onChange={(e) => handleStatusChange(studentId, e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer text-slate-200"
                          >
                            <option value="Active Review">Active Review</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Escalated">Escalated</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedStudentForDetail(item);
                                setIsDetailModalOpen(true);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                              title="View full student background and audit history"
                            >
                              <Eye size={13} />
                              <span>Details</span>
                            </button>

                            <button
                              onClick={() => handleOpenInterventionModal(item)}
                              className="bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/60 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <FilePlus2 size={13} />
                              <span>Log Intervention</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onChangePassword={handleChangePassword}
      />

      {/* Student Details Modal */}
      <StudentDetailModal
        student={selectedStudentForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedStudentForDetail(null);
        }}
        onUpdateSuccess={() => loadCases()}
      />

      {/* Log Intervention Modal */}
      {isInterventionModalOpen && selectedStudentForIntervention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-[#080c14] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FilePlus2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Log Counseling Intervention</h3>
                  <p className="text-xs text-slate-400">
                    Student: <span className="text-emerald-300 font-semibold">{selectedStudentForIntervention.name}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsInterventionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitIntervention} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Session Type</label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Counseling Session">Counseling Session</option>
                    <option value="Wellness Check">Wellness Check</option>
                    <option value="Academic Disengagement Intervention">Academic Disengagement Intervention</option>
                    <option value="Crisis Support">Crisis Support</option>
                    <option value="Financial Guidance">Financial Guidance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Update Case Status</label>
                  <select
                    value={interventionStatus}
                    onChange={(e) => setInterventionStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Active Review">Active Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Counseling Notes & Observations <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={interventionNotes}
                  onChange={(e) => setInterventionNotes(e.target.value)}
                  placeholder="Record confidential session observations, emotional state, discussions..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Action Plan & Next Steps</label>
                <textarea
                  rows={2}
                  value={interventionActionPlan}
                  onChange={(e) => setInterventionActionPlan(e.target.value)}
                  placeholder="e.g. Schedule follow-up in 7 days, refer for stress management workshop..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInterventionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIntervention}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isSubmittingIntervention ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Log Intervention & Update Audit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}