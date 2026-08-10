import React, { useState } from 'react';
import API from '../api/axios';
import { UserPlus, X, AlertCircle } from 'lucide-react';

const AddStudentForm = ({ isOpen, onClose, onStudentAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    department: 'Computer Science',
    gpa: '',
    attendancePercentage: '',
    assignmentsSubmitted: '',
    assignmentsTotal: '10',
    financialAidStatus: 'Paid',
    note: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Structure payload for backend registration + profile creation
      const payload = {
        name: formData.name,
        email: formData.email,
        studentId: formData.studentId,
        department: formData.department,
        gpa: parseFloat(formData.gpa),
        attendancePercentage: parseFloat(formData.attendancePercentage),
        assignmentsSubmitted: parseInt(formData.assignmentsSubmitted, 10),
        assignmentsTotal: parseInt(formData.assignmentsTotal, 10),
        financialAidStatus: formData.financialAidStatus,
        qualitativeNotes: formData.note
          ? [{ authorRole: 'Teacher', note: formData.note, category: 'Academic' }]
          : [],
      };

      const res = await API.post('/students', payload);
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        studentId: '',
        department: 'Computer Science',
        gpa: '',
        attendancePercentage: '',
        assignmentsSubmitted: '',
        assignmentsTotal: '10',
        financialAidStatus: 'Paid',
        note: '',
      });

      if (onStudentAdded) {
        onStudentAdded(res.data.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student profile. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
          <div className="flex items-center gap-2 text-indigo-400">
            <UserPlus size={22} />
            <h2 className="text-xl font-bold text-white">Add New Student Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="student@univ.edu"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Student ID</label>
              <input
                type="text"
                name="studentId"
                required
                value={formData.studentId}
                onChange={handleChange}
                placeholder="CS202610"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>
          </div>

          {/* Row 3: Academic & Attendance Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">GPA (0 - 4.0)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                name="gpa"
                required
                value={formData.gpa}
                onChange={handleChange}
                placeholder="2.5"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Attendance (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                name="attendancePercentage"
                required
                value={formData.attendancePercentage}
                onChange={handleChange}
                placeholder="75"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Assignments Done</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  name="assignmentsSubmitted"
                  required
                  value={formData.assignmentsSubmitted}
                  onChange={handleChange}
                  placeholder="7"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-slate-400">/</span>
                <input
                  type="number"
                  name="assignmentsTotal"
                  required
                  value={formData.assignmentsTotal}
                  onChange={handleChange}
                  className="w-16 rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Financial Aid Status */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Financial Aid / Fee Status</label>
            <select
              name="financialAidStatus"
              value={formData.financialAidStatus}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="Paid">Paid / Clear</option>
              <option value="Pending">Pending Payment</option>
              <option value="Emergency Assistance Requested">Emergency Financial Aid Requested</option>
            </select>
          </div>

          {/* Row 5: Initial Observation / Note */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Qualitative Observation (Optional)</label>
            <textarea
              name="note"
              rows="3"
              value={formData.note}
              onChange={handleChange}
              placeholder="e.g. Frequently absent during early morning lab modules..."
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
            ></textarea>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 px-5 py-2 rounded-lg text-sm font-semibold text-white transition shadow-lg shadow-indigo-500/20"
            >
              {loading ? 'Creating...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentForm;