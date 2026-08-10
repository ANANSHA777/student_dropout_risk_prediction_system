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
} from 'lucide-react';
import { changePassword } from '../services/authService';
import ChangePasswordModal from '../components/ChangePasswordModal';
// Import your counselor API services here (e.g., fetchCounselorCases, logIntervention)

export default function CounselorDashboard() {
  const { user, logout } = useAuth();

  // Dashboard Data States
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Feedback
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Load Counselor Intervention Cases
  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace with your API service function
      // const data = await fetchCounselorCases();
      // setCases(data);
      setCases([
        { id: 1, name: 'Ram', email: 'ram@university.edu', concern: 'Personal / Wellness', status: 'Moderate', caseStatus: 'Active Review' },
        { id: 2, name: 'Ramya', email: 'ramya@university.edu', concern: 'Personal / Wellness', status: 'Moderate', caseStatus: 'Active Review' },
        { id: 3, name: 'Hiba', email: 'hiba@university.edu', concern: 'Personal / Wellness', status: 'Moderate', caseStatus: 'Active Review' },
        { id: 4, name: 'Ziya', email: 'ziya@university.edu', concern: 'Personal / Wellness', status: 'Moderate', caseStatus: 'Active Review' },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const showFeedback = (msg) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
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

  // Stats Counters
  const activeCasesCount = cases.length;
  const criticalCount = cases.filter((c) => c.status === 'Critical' || c.status === 'High').length;
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
            Logged in as <span className="text-emerald-300 font-medium">{user?.name || 'Sam'}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Change Password Button */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-lg border border-slate-800 text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <KeyRound size={16} className="text-emerald-400" />
            Change Password
          </button>

          {/* Sign Out Button */}
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
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HeartHandshake size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{activeCasesCount}</div>
              <div className="text-xs text-slate-400 font-medium">Active Assigned Cases</div>
            </div>
          </div>

          {/* Card 2: High Priority */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{criticalCount}</div>
              <div className="text-xs text-slate-400 font-medium">Critical / High Priority</div>
            </div>
          </div>

          {/* Card 3: Interventions Resolved */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex items-center gap-4">
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Student Wellness & Financial Intervention Cases</h2>
              <p className="text-xs text-slate-400 mt-0.5">Track survey disclosures, risk categories, and wellness notes</p>
            </div>
            <button
              onClick={loadCases}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition cursor-pointer"
              title="Refresh Cases"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-950/40">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Primary Concern</th>
                  <th className="p-3.5">Self-Reported Status</th>
                  <th className="p-3.5">Case Status</th>
                  <th className="p-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500 italic">
                      No wellness intervention cases assigned.
                    </td>
                  </tr>
                ) : (
                  cases.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.email}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/50">
                          {item.concern}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                          <span className="text-red-400">♡</span> {item.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {item.caseStatus}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button className="bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/60 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer">
                          <FilePlus2 size={14} /> Log Intervention
                        </button>
                      </td>
                    </tr>
                  ))
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
    </div>
  );
}