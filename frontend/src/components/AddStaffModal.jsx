import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';

const DEPARTMENTS = ['Computer Science','Business','Mathematics','English','Architecture','Commerce','Student Services'];

const AddStaffModal = ({ isOpen, onClose, onStaffAdded }) => {
  const [submitting, setSubmitting] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'Teacher',
    department: 'Computer Science',
    initialPassword: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onStaffAdded(newStaff);
      setNewStaff({
        name: '',
        email: '',
        role: 'Teacher',
        department: 'Computer Science',
        initialPassword: '',
      });
      onClose();
    } catch (err) {
      alert(`Error creating staff: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <UserPlus className="text-purple-400" size={20} />
          Provision Staff Account
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              placeholder="Dr. Alan Turing"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              placeholder="a.turing@university.edu"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Role</label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="Teacher">Teacher</option>
                <option value="Counselor">Counselor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Department</label>
              <select
                value={newStaff.department}
                onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Initial Password</label>
            <input
              type="password"
              required
              value={newStaff.initialPassword}
              onChange={(e) => setNewStaff({ ...newStaff, initialPassword: e.target.value })}
              placeholder="Temporary password..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition shadow-lg shadow-purple-500/20"
            >
              {submitting ? 'Provisioning...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffModal;