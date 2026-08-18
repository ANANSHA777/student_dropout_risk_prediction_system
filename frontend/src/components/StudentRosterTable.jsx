// src/components/StudentRosterTable.jsx
import React, { useMemo } from 'react';
import {
  Edit3,
  Trash2,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2,
  UserCheck,
  BookOpen,
  HeartPulse,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export default function StudentRosterTable({
  students = [],
  loading = false,
  evaluatingStudentId = null,
  onOpenRecordModal,
  onDeleteStudent,
  onEvaluateRisk,
  onAssignCounselor,
  onAcademicIntervention,
  showActions = true,
}) {
  const totalColumns = useMemo(() => (showActions ? 7 : 6), [showActions]);

  return (
    <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-[#080c14] text-slate-400 text-xs font-semibold uppercase tracking-wider select-none">
              <th className="py-4 px-5">Student</th>
              <th className="py-4 px-5">ID / Year</th>
              <th className="py-4 px-5">CGPA / Attendance</th>
              <th className="py-4 px-5">Survey Status</th>
              <th className="py-4 px-5">Risk Evaluation</th>
              <th className="py-4 px-5">
                {showActions ? 'Recommended Intervention' : 'Actions / Interventions Logged'}
              </th>
              {showActions && <th className="py-4 px-5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {loading ? (
              <tr>
                <td colSpan={totalColumns} className="py-12 text-center text-slate-400 italic">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin text-indigo-400" />
                    <span>Loading class roster...</span>
                  </div>
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="py-12 text-center text-slate-500 italic">
                  No students found matching the selected filter.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const studentDbId = student._id || student.id;
                const displayStudentId = student.studentId || 'STU-201';
                const displayYear = student.yearOfStudy || student.year || '2nd Year';

                const cgpaVal = student.cgpa ?? null;
                const attendanceVal = student.attendancePercentage ?? student.attendance ?? null;

                const isAcademicRecordAdded = cgpaVal !== null && attendanceVal !== null;
                const isSurveyDone =
                  student.surveyCompleted === true ||
                  student.surveyStatus === 'Completed' ||
                  student.isSurveyDone === true ||
                  Boolean(student.surveyData);

                const canEvaluate = isSurveyDone && isAcademicRecordAdded;
                const isRiskEvaluated =
                  student.riskEvaluated === true ||
                  (student.riskLevel &&
                    student.riskLevel !== 'Unevaluated' &&
                    student.riskLevel !== 'Pending');

                const isEvaluatingThisStudent = evaluatingStudentId === studentDbId;

                // Category Detection
                let effectiveCategory = student.riskCategory;
                if (!effectiveCategory || effectiveCategory === 'None') {
                  if (cgpaVal !== null && cgpaVal < 6.5) {
                    effectiveCategory = 'Academic Concern';
                  } else if (student.riskLevel === 'High' || student.riskLevel === 'Medium') {
                    effectiveCategory = 'Wellness & Mental Health';
                  } else {
                    effectiveCategory = null;
                  }
                }

                const categoryLower = (effectiveCategory || '').toLowerCase();

                // Dynamic Action Button Visibility Flags
                const showAcademicBtn =
                  categoryLower.includes('academic') ||
                  (cgpaVal !== null && cgpaVal < 6.5) ||
                  (attendanceVal !== null && attendanceVal < 75);

                const showCounselorBtn =
                  categoryLower.includes('wellness') ||
                  categoryLower.includes('mental') ||
                  categoryLower.includes('personal') ||
                  categoryLower.includes('psychological');

                const actionComment =
                  student.actionTaken || student.interventionStatus || student.notes || student.comment;
                const assignedCounselor = student.assignedCounselor || student.counselor;

                const getEvaluateTooltip = () => {
                  if (canEvaluate) return 'Run AI Risk Evaluation';
                  if (!isSurveyDone && !isAcademicRecordAdded)
                    return 'Disabled: Missing Student Survey and CGPA/Attendance';
                  if (!isSurveyDone) return 'Disabled: Complete survey first';
                  if (!isAcademicRecordAdded) return 'Disabled: CGPA & Attendance required';
                  return 'Disabled';
                };

                return (
                  <tr key={studentDbId} className="hover:bg-slate-800/30 transition-colors">
                    {/* Student Info */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-100">{student.name}</div>
                      <div className="text-xs text-slate-400">{student.email}</div>
                    </td>

                    {/* ID / Year */}
                    <td className="py-4 px-5">
                      <div className="text-slate-300 font-mono text-xs font-semibold">{displayStudentId}</div>
                      <div className="text-xs text-indigo-400 font-semibold">{displayYear}</div>
                    </td>

                    {/* CGPA / Attendance */}
                    <td className="py-4 px-5">
                      <div className="text-xs text-slate-300">
                        <span className="text-slate-400">CGPA:</span>{' '}
                        {cgpaVal !== null ? (
                          <span className="font-bold text-white">{cgpaVal}</span>
                        ) : (
                          <span className="text-amber-400 font-medium">Missing</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="text-slate-400">Attendance:</span>{' '}
                        {attendanceVal !== null ? (
                          <span className="font-bold text-white">{attendanceVal}%</span>
                        ) : (
                          <span className="text-amber-400 font-medium">Missing</span>
                        )}
                      </div>
                    </td>

                    {/* Survey Status */}
                    <td className="py-4 px-5">
                      {isSurveyDone ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={13} className="text-emerald-400" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                          <Clock size={13} /> Pending
                        </span>
                      )}
                    </td>

                    {/* Risk Evaluation */}
                    <td className="py-4 px-5">
                      {isRiskEvaluated ? (
                        <div className="space-y-1.5">
                          <span
                            className={`inline-block px-3.5 py-1 text-xs rounded-full font-semibold border ${
                              student.riskLevel === 'High'
                                ? 'bg-red-950/60 text-red-400 border-red-500/40'
                                : student.riskLevel === 'Medium'
                                ? 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                                : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                            }`}
                          >
                            {student.riskLevel} Risk
                          </span>

                          {effectiveCategory && (
                            <div className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                              <BookOpen size={12} className="text-amber-400 shrink-0" />
                              <HeartPulse size={12} className="text-purple-400 shrink-0" />
                              <span>{effectiveCategory}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block px-3 py-1 text-xs rounded-full font-medium bg-slate-800/80 text-slate-400 border border-slate-700">
                          Not Evaluated
                        </span>
                      )}
                    </td>

                    {/* Recommended Interventions (Filtered dynamically based on Risk Type) */}
                    <td className="py-4 px-5">
                      {showActions ? (
                        isRiskEvaluated ? (
                          <div className="flex flex-col gap-2 max-w-[170px]">
                            {/* Assign Counselor Button - Rendered only for Wellness/Mental/Personal Risks */}
                            {showCounselorBtn && (
                              <button
                                type="button"
                                onClick={() =>
                                  onAssignCounselor
                                    ? onAssignCounselor(student)
                                    : alert(`Assigned ${student.name} to Psychological Counselor`)
                                }
                                className="w-full px-3 py-1.5 bg-purple-900/40 text-purple-200 border border-purple-500/50 hover:bg-purple-800/50 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
                              >
                                <UserCheck size={13} className="text-purple-300 shrink-0" />
                                <span>Assign Counselor</span>
                              </button>
                            )}

                            {/* Academic Plan Button - Rendered only for Academic Risks */}
                            {showAcademicBtn && (
                              <button
                                type="button"
                                onClick={() =>
                                  onAcademicIntervention
                                    ? onAcademicIntervention(student)
                                    : alert(`Initiated Academic Support Plan for ${student.name}`)
                                }
                                className="w-full px-3 py-1.5 bg-amber-900/30 text-amber-200 border border-amber-500/40 hover:bg-amber-800/40 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
                              >
                                <BookOpen size={13} className="text-amber-300 shrink-0" />
                                <span>Academic Plan</span>
                              </button>
                            )}

                            {/* Fallback if neither condition triggered but risk is elevated */}
                            {!showAcademicBtn && !showCounselorBtn && (
                              <span className="text-xs text-slate-400 italic">No action required</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Pending evaluation</span>
                        )
                      ) : (
                        /* Read-Only Admin Display */
                        <div className="space-y-1">
                          {actionComment ? (
                            <div className="flex items-start gap-1.5 text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                              <MessageSquare size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                              <span>{actionComment}</span>
                            </div>
                          ) : assignedCounselor ? (
                            <div className="inline-flex items-center gap-1.5 text-xs text-purple-300 bg-purple-950/50 border border-purple-500/30 px-2.5 py-1 rounded-md">
                              <UserCheck size={12} />
                              Assigned to {assignedCounselor}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">No intervention logged</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    {showActions && (
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Edit Marks Button */}
                          <button
                            type="button"
                            onClick={() => onOpenRecordModal && onOpenRecordModal(student)}
                            className="px-3.5 py-2 bg-[#1e1c3b] hover:bg-[#28254f] text-[#a5b4fc] border border-[#3b3566] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md min-w-[96px]"
                            title="Edit CGPA and Attendance Marks"
                          >
                            <Edit3 size={15} className="text-[#818cf8] shrink-0" />
                            <span className="text-left leading-tight font-medium">
                              Edit
                              <br />
                              Marks
                            </span>
                          </button>

                          {/* Re-evaluate / AI Evaluate Button */}
                          <button
                            type="button"
                            onClick={() => onEvaluateRisk && onEvaluateRisk(studentDbId)}
                            disabled={!canEvaluate || isEvaluatingThisStudent}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 min-w-[105px] ${
                              canEvaluate
                                ? 'bg-[#26180b] hover:bg-[#38220f] text-[#fde047] border border-[#78350f] cursor-pointer shadow-md active:scale-95'
                                : 'bg-slate-900/50 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                            }`}
                            title={getEvaluateTooltip()}
                          >
                            {isEvaluatingThisStudent ? (
                              <Loader2 size={15} className="animate-spin text-amber-300 shrink-0" />
                            ) : (
                              <Sparkles size={15} className="text-[#facc15] shrink-0" />
                            )}
                            <span className="text-left leading-tight font-medium">
                              {isEvaluatingThisStudent
                                ? 'Evaluating...'
                                : isRiskEvaluated
                                ? 'Re-\nevaluate'
                                : 'AI Evaluate'}
                            </span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => onDeleteStudent && onDeleteStudent(studentDbId, student.name)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/40 rounded-lg transition cursor-pointer active:scale-95 ml-1"
                            title="Delete Student"
                          >
                            <Trash2 size={16} />
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