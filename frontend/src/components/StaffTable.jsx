// src/components/StaffTable.jsx
import React from 'react';
import { RefreshCw, Trash2, Shield, UserCheck, Building } from 'lucide-react';

export default function StaffTable({
  filteredStaff,
  loading,
  activeTab = 'all',
  deptFilter,
  setDeptFilter,
  onRefresh,
  onDeleteStaff,
}) {
  // Academic departments specifically for Teachers
  const teacherDepartments = [
    'Computer Science',
    'Business',
    'Mathematics',
    'English',
    'Architecture',
    'Commerce',
  ];

  // All departments used when viewing 'All Staff'
  const allDepartments = [...teacherDepartments, 'Student Services'];

  // Select which department list to show based on the active view
  const availableDepartments = activeTab === 'teachers' ? teacherDepartments : allDepartments;

  // Group staff members by department for the Teachers tab
  const groupedByDepartment = filteredStaff.reduce((acc, staff) => {
    const dept = staff.department || 'General Academics';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(staff);
    return acc;
  }, {});

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield size={18} className="text-purple-400" />
          {activeTab === 'teachers'
            ? 'Teachers Directory'
            : activeTab === 'counselors'
            ? 'Counselors Directory'
            : 'All Staff Members'}
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Hide Department Dropdown completely when viewing Counselors */}
          {activeTab !== 'counselors' && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="All">All Departments</option>
              {availableDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-xs transition"
            title="Refresh Directory"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Directory Content */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500 italic">
            Loading staff members...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-8 text-center text-slate-500 italic">
            No staff members found matching the selected filters.
          </div>
        ) : activeTab === 'teachers' && deptFilter === 'All' ? (
          /* Teachers View: Grouped Department-Wise */
          <div className="space-y-6 p-4">
            {Object.entries(groupedByDepartment).map(([department, teachers]) => (
              <div key={department} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
                <div className="bg-slate-950/70 p-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-indigo-400 text-sm flex items-center gap-2">
                    <Building size={16} /> {department}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{teachers.length} Teacher(s)</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {teachers.map((staff) => {
                      const staffId = staff._id || staff.id;
                      return (
                        <tr key={staffId} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-semibold text-slate-200">{staff.name}</td>
                          <td className="p-3 text-slate-400">{staff.email}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                              Teacher
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                              <UserCheck size={12} /> Active
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onDeleteStaff(staffId, staff.name, staff.role)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                              title="Remove Staff"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          /* Standard Flat Table View for 'All', 'Counselors', or Specific Department Filters */
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Department</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredStaff.map((staff) => {
                const staffId = staff._id || staff.id;
                return (
                  <tr key={staffId} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-semibold text-slate-200">{staff.name}</td>
                    <td className="p-4 text-slate-400">{staff.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full font-semibold border ${
                          staff.role === 'Teacher'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {staff.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{staff.department || 'General'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                        <UserCheck size={12} /> Active
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onDeleteStaff(staffId, staff.name, staff.role)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Remove Staff"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}