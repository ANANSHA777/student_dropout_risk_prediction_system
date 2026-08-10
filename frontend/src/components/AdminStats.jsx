import React from 'react';
import { Users, GraduationCap, HeartHandshake } from 'lucide-react';

const AdminStats = ({ totalCount, teacherCount, counselorCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
          <Users size={22} />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{totalCount}</div>
          <div className="text-xs text-slate-400 font-medium">Total Staff Members</div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <GraduationCap size={22} />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{teacherCount}</div>
          <div className="text-xs text-slate-400 font-medium">Teachers Registered</div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <HeartHandshake size={22} />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{counselorCount}</div>
          <div className="text-xs text-slate-400 font-medium">Counselors Registered</div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;