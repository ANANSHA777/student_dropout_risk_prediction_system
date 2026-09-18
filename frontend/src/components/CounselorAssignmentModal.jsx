// frontend/src/components/CounselorAssignmentModal.jsx
import React, { useState, useEffect } from 'react';
import { X, UserCheck, Heart, AlertCircle, Sparkles, Loader2, Mail, Building } from 'lucide-react';
import { fetchCounselors, assignCounselorToStudent } from '../services/teacherService';

export default function CounselorAssignmentModal({ student, isOpen, onClose, onAssignSuccess }) {
  const [counselors, setCounselors] = useState([]);
  const [loadingCounselors, setLoadingCounselors] = useState(true);
  const [selectedCounselorId, setSelectedCounselorId] = useState('');
  const [referralReason, setReferralReason] = useState(
    'Supportive counseling for wellness, motivation, and academic re-engagement.'
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadCounselors = async () => {
      setLoadingCounselors(true);
      setErrorMessage(null);
      try {
        const res = await fetchCounselors();
        const list = res?.counselors || res?.data || (Array.isArray(res) ? res : []);
        if (isMounted) {
          setCounselors(list);
          if (list.length > 0) {
            setSelectedCounselorId(list[0]._id || list[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage('Unable to load counselors from directory. Please verify server connection.');
        }
      } finally {
        if (isMounted) setLoadingCounselors(false);
      }
    };

    loadCounselors();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const studentId = student._id || student.id || student.studentId;
  const survey = student.surveyData || {};
  const mentalHealth = student.mentalHealthSelfReport || student.mentalHealthState || survey.mentalHealthState || 'Anxious / Stressed';
  const disengagementReason = student.disengagementReason || survey.disengagementReason || 'Mental Health / Disengagement';
  const isCaseA = student.evaluationCase === 'CASE_A_WELLNESS_DISENGAGEMENT' || student.recommendedActions?.suppressAcademicPenalty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCounselorId) {
      setErrorMessage('Please select a registered counselor.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const selectedCounselor = counselors.find(
        (c) => (c._id || c.id) === selectedCounselorId
      );

      const result = await assignCounselorToStudent({
        studentId,
        counselorId: selectedCounselorId,
        referralReason,
        notes,
        category: 'Wellness & Mental Health',
        riskCategory: student.primaryRiskCategory || 'WELLNESS',
      });

      if (onAssignSuccess) {
        onAssignSuccess({
          studentId,
          counselor: selectedCounselor,
          result,
        });
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to assign counselor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#080c14] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <UserCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Assign Registered Counselor</h3>
              <p className="text-xs text-purple-300">
                Supportive Referral Workflow — <span className="text-white font-medium">{student.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Strict Isolation Notice for Case A */}
        {isCaseA && (
          <div className="p-4 bg-purple-950/40 border-b border-purple-800/40 flex items-start gap-3 text-xs text-purple-200">
            <Heart size={16} className="text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-purple-300">Strict Isolation Enforced:</span> Academic penalty plan is suppressed for this student. Student is redirected to supportive counseling first to address non-academic distress.
            </div>
          </div>
        )}

        {/* Student Background Context Card */}
        <div className="p-5 bg-slate-900/60 border-b border-slate-800/80 space-y-2 text-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Student Background Context for Counselor
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Academic Standing:</span>
              CGPA: <strong className="text-white">{student.cgpa ?? 'N/A'}</strong> | Attendance: <strong className="text-white">{student.attendancePercentage ?? student.attendance ?? 'N/A'}%</strong>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Mental Wellness:</span>
              <strong className="text-rose-400">{mentalHealth}</strong>
            </div>
          </div>
          {disengagementReason && disengagementReason !== 'None' && (
            <div className="bg-purple-950/30 p-2 rounded-lg border border-purple-900/40 text-[11px] text-purple-300">
              Disengagement Root Cause: <strong className="text-white">{disengagementReason}</strong>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dynamic Dropdown from /api/counselors */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
              <span>Select Counselor from Registered Directory (/api/counselors)</span>
              {loadingCounselors && (
                <span className="flex items-center gap-1 text-[11px] text-purple-400">
                  <Loader2 size={12} className="animate-spin" /> Loading directory...
                </span>
              )}
            </label>

            {loadingCounselors ? (
              <div className="h-10 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
            ) : counselors.length === 0 ? (
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                No counselors found in directory. Counselors can be registered by Admin.
              </div>
            ) : (
              <select
                value={selectedCounselorId}
                onChange={(e) => setSelectedCounselorId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {counselors.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name} — {c.department || 'Counseling Center'} ({c.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Reason for Referral */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Referral Reason / Objectives
            </label>
            <input
              type="text"
              required
              value={referralReason}
              onChange={(e) => setReferralReason(e.target.value)}
              placeholder="e.g. Wellness check-in, stress reduction, academic motivation"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Confidential Notes for Counselor */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Confidential Background Context & Faculty Observations
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide background context for the counselor to review prior to the session..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500 placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingCounselors || counselors.length === 0}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Dispatching Log...
                </>
              ) : (
                <>
                  <UserCheck size={14} />
                  Assign Counselor & Create Log
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
