// src/components/StudentRosterTable.jsx
import React from 'react';
import { Edit3, Trash2, Sparkles, CheckCircle2, Clock } from 'lucide-react';

export default function StudentRosterTable({
  students = [],
  loading,
  onOpenRecordModal,
  onDeleteStudent,
  onEvaluateRisk,
  showActions = true,
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider">
              <th className="p-4">Student</th>
              <th className="p-4">ID / Year</th>
              <th className="p-4">CGPA / Attendance</th>
              <th className="p-4">Survey Status</th>
              <th className="p-4">Risk Level</th>
              {showActions && <th className="p-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {loading ? (
              <tr>
                <td colSpan={showActions ? 6 : 5} className="p-8 text-center text-slate-500 italic">
                  Loading class roster...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 6 : 5} className="p-8 text-center text-slate-500 italic">
                  No students found for this filter.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const studentDbId = student._id || student.id;
                const displayStudentId = student.studentId || 'No ID Set';
                const displayYear = student.yearOfStudy || student.year || '1st Year';

                const cgpaVal = student.cgpa ?? null;
                const attendanceVal = student.attendancePercentage ?? student.attendance ?? null;

                // Robust check for Survey Completion across boolean/string formats
                const isSurveyDone =
                  student.surveyCompleted === true ||
                  student.surveyStatus === 'Completed' ||
                  student.isSurveyDone === true ||
                  Boolean(student.surveyData);

                // Robust check for Risk Evaluation completion
                const isRiskEvaluated =
                  student.riskEvaluated === true ||
                  (student.riskLevel &&
                    student.riskLevel !== 'Unevaluated' &&
                    student.riskLevel !== 'Pending');

                return (
                  <tr key={studentDbId} className="hover:bg-slate-800/40 transition">
                    {/* Student Info */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{student.name}</div>
                      <div className="text-xs text-slate-500">{student.email}</div>
                    </td>

                    {/* ID & Year of Study */}
                    <td className="p-4">
                      <div className="text-slate-300 font-mono text-xs">{displayStudentId}</div>
                      <div className="text-xs text-indigo-400 font-medium">{displayYear}</div>
                    </td>

                    {/* CGPA / Attendance */}
                    <td className="p-4">
                      <div className="text-xs text-slate-300">
                        CGPA: <span className="font-semibold text-white">{cgpaVal !== null ? cgpaVal : 'N/A'}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Attendance: {attendanceVal !== null ? `${attendanceVal}%` : 'N/A'}
                      </div>
                    </td>

                    {/* Survey Completion Status */}
                    <td className="p-4">
                      {isSurveyDone ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>

                    {/* Risk Level Badge */}
                    <td className="p-4">
                      {isRiskEvaluated ? (
                        <div>
                          <span
                            className={`px-3 py-1 text-xs rounded-full font-semibold border ${
                              student.riskLevel === 'High'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : student.riskLevel === 'Medium'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {student.riskLevel} Risk
                          </span>
                          {student.riskCategory && (
                            <div className="text-[11px] text-slate-400 mt-1 font-medium">
                              {student.riskCategory}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Not Evaluated
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    {showActions && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit Academic Marks */}
                          <button
                            onClick={() => onOpenRecordModal && onOpenRecordModal(student)}
                            className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                            title="Update CGPA and Attendance"
                          >
                            <Edit3 size={13} /> Edit Marks
                          </button>

                          {/* AI Evaluate Button */}
                          <button
                            onClick={() => onEvaluateRisk && onEvaluateRisk(studentDbId)}
                            disabled={!isSurveyDone}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                              isSurveyDone
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer shadow-sm'
                                : 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60'
                            }`}
                            title={
                              isSurveyDone
                                ? 'Run AI Risk Evaluation'
                                : 'Disabled: Student must complete survey first'
                            }
                          >
                            <Sparkles size={13} /> {isRiskEvaluated ? 'Re-evaluate' : 'AI Evaluate'}
                          </button>

                          {/* Delete Student */}
                          <button
                            onClick={() => onDeleteStudent && onDeleteStudent(studentDbId, student.name)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}