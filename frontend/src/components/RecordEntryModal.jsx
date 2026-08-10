// src/components/RecordEntryModal.jsx
import React, { useState, useEffect } from 'react';
import { X, BookOpen, Award, Percent } from 'lucide-react';

export default function RecordEntryModal({ isOpen, student, onClose, onSave }) {
  const [cgpa, setCgpa] = useState('');
  const [attendance, setAttendance] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setCgpa(student.cgpa !== null && student.cgpa !== undefined ? student.cgpa : '');
      setAttendance(student.attendancePercentage ?? student.attendance ?? '');
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const studentDbId = student._id || student.id;
      const parsedCgpa = cgpa !== '' ? parseFloat(cgpa) : null;
      const parsedAttendance = attendance !== '' ? parseFloat(attendance) : null;

      await onSave(studentDbId, {
        cgpa: parsedCgpa,
        attendance: parsedAttendance,
      });

      onClose();
    } catch (err) {
      console.error('Error saving academic details:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <BookOpen size={20} />
            <div>
              <h3 className="text-lg font-bold text-white">Update Student Marks</h3>
              <p className="text-xs text-slate-400">Updating records for <span className="text-slate-200 font-semibold">{student.name}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form: ONLY CGPA and Attendance */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            
            {/* CGPA Input */}
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 block mb-1">
                CGPA (0.00 - 10.00)
              </label>
              <div className="relative">
                <Award size={16} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  placeholder="e.g. 8.5"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Attendance Input */}
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 block mb-1">
                Attendance (%)
              </label>
              <div className="relative">
                <Percent size={16} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 87"
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}