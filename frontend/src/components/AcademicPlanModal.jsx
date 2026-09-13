// src/components/AcademicPlanModal.jsx
import React, { useState } from 'react';
import { BookOpen, X, CheckCircle2, Award, UserPlus } from 'lucide-react';

export default function AcademicPlanModal({ student, isOpen, onClose, onSubmitPlan }) {
  const [selectedPlan, setSelectedPlan] = useState('remedial_classes');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !student) return null;

  const planOptions = [
    {
      id: 'remedial_classes',
      title: 'Remedial Classes & Tutoring',
      desc: 'Schedule weekly 1-on-1 tutoring sessions in core subjects.',
      icon: BookOpen,
    },
    {
      id: 'peer_mentor',
      title: 'Peer Mentor Matching',
      desc: 'Pair the student with a high-performing senior student.',
      icon: UserPlus,
    },
    {
      id: 'custom_quiz',
      title: 'Remedial Quiz & Practice Track',
      desc: 'Assign self-paced practice modules and diagnostic quizzes.',
      icon: Award,
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await onSubmitPlan({
      studentId: student._id || student.id,
      planType: selectedPlan,
      notes,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#080c14]">
          <div className="flex items-center gap-2.5 text-amber-400">
            <BookOpen size={20} />
            <h3 className="font-bold text-slate-100 text-lg">
              Academic Support Plan — {student.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-xs text-slate-400">
            Select an academic intervention track based on CGPA ({student.cgpa ?? 'N/A'}) and Attendance ({student.attendancePercentage ?? student.attendance ?? 'N/A'}%).
          </p>

          {/* Options */}
          <div className="space-y-3">
            {planOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedPlan === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedPlan(opt.id)}
                  className={`p-3.5 rounded-lg border transition cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/60 text-slate-100'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon size={18} className={isSelected ? 'text-amber-400' : 'text-slate-500'} />
                  <div className="flex-1">
                    <div className="font-semibold text-xs text-slate-200">{opt.title}</div>
                    <div className="text-[11px] text-slate-400">{opt.desc}</div>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-amber-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Teacher Instructions / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Focus on Math and Data Structures modules..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 placeholder:text-slate-600"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-lg transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Assigning...' : 'Assign Support Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}