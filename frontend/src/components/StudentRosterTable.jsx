// src/components/StudentRosterTable.jsx
import React from 'react';
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
  DollarSign,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export default function StudentRosterTable({
  students = [],
  loading,
  evaluatingStudentId,
  onOpenRecordModal,
  onDeleteStudent,
  onEvaluateRisk,
  onAssignCounselor,
  onAcademicIntervention,
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
              <th className="p-4">Risk Evaluation</th>
              <th className="p-4">
                {showActions ? 'Recommended Intervention' : 'Actions / Interventions Logged'}
              </th>
              {showActions && <th className="p-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {loading ? (
              <tr>
                <td colSpan={showActions ? 7 : 6} className="p-8 text-center text-slate-500 italic">
                  Loading class roster...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 7 : 6} className="p-8 text-center text-slate-500 italic">
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

                // 1. Academic Record Check
                const isAcademicRecordAdded = cgpaVal !== null && attendanceVal !== null;

                // 2. Survey Completion Check
                const isSurveyDone =
                  student.surveyCompleted === true ||
                  student.surveyStatus === 'Completed' ||
                  student.isSurveyDone === true ||
                  Boolean(student.surveyData);

                // 3. Evaluation Eligibility
                const canEvaluate = isSurveyDone && isAcademicRecordAdded;

                // Risk Evaluation Completion
                const isRiskEvaluated =
                  student.riskEvaluated === true ||
                  (student.riskLevel &&
                    student.riskLevel !== 'Unevaluated' &&
                    student.riskLevel !== 'Pending');

                const isEvaluatingThisStudent = evaluatingStudentId === studentDbId;

                // Priority 1: Use backend risk category directly
                // Priority 2: Fallback to metrics if category is missing
                let effectiveCategory = student.riskCategory;

                if (!effectiveCategory || effectiveCategory === 'None') {
                  if (isSurveyDone && (student.riskLevel === 'High' || student.riskLevel === 'Medium')) {
                    effectiveCategory = 'Wellness & Mental Health';
                  } else if (cgpaVal !== null && (cgpaVal < 6.0 || attendanceVal < 75)) {
                    effectiveCategory = 'Academic Concern';
                  } else {
                    effectiveCategory = null;
                  }
                }

                // Check intervention requirements
                const categoryLower = (effectiveCategory || '').toLowerCase();

                const isPersonalOrWellnessRisk =
                  categoryLower.includes('wellness') ||
                  categoryLower.includes('mental') ||
                  categoryLower.includes('personal') ||
                  categoryLower.includes('financial') ||
                  categoryLower.includes('counsel');

                const isAcademicRisk =
                  categoryLower.includes('academic') ||
                  (cgpaVal !== null && cgpaVal < 6.5) ||
                  (attendanceVal !== null && attendanceVal < 75);

                // Extract comments/actions for Admin read-only mode
                const actionComment = student.actionTaken || student.interventionStatus || student.notes || student.comment;
                const assignedCounselor = student.assignedCounselor || student.counselor;

                // Helper for tooltip explanations
                const getEvaluateTooltip = () => {
                  if (canEvaluate) return 'Run AI Risk Evaluation';
                  if (!isSurveyDone && !isAcademicRecordAdded)
                    return 'Disabled: Student survey & Academic marks both missing';
                  if (!isSurveyDone) return 'Disabled: Student must complete survey first';
                  if (!isAcademicRecordAdded) return 'Disabled: Teacher must add CGPA & Attendance marks first';
                  return 'Disabled';
                };

                return (
                  <tr key={studentDbId} className="hover:bg-slate-800/40 transition">
                    {/* Student Info */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{student.name}</div>
                      <div className="text-xs text-slate-500">{student.email}</div>
                    </td>

                    {/* ID & Year */}
                    <td className="p-4">
                      <div className="text-slate-300 font-mono text-xs">{displayStudentId}</div>
                      <div className="text-xs text-indigo-400 font-medium">{displayYear}</div>
                    </td>

                    {/* CGPA / Attendance */}
                    <td className="p-4">
                      <div className="text-xs text-slate-300">
                        CGPA:{' '}
                        {cgpaVal !== null ? (
                          <span className="font-semibold text-white">{cgpaVal}</span>
                        ) : (
                          <span className="text-amber-400/90 font-medium">Missing</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        Attendance:{' '}
                        {attendanceVal !== null ? (
                          `${attendanceVal}%`
                        ) : (
                          <span className="text-amber-400/90 font-medium">Missing</span>
                        )}
                      </div>
                    </td>

                    {/* Survey Status */}
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

                    {/* Risk Badge & Category */}
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

                          {effectiveCategory && (
                            <div className="text-[11px] text-slate-400 mt-1.5 font-medium flex items-center gap-1">
                              {isAcademicRisk && <BookOpen size={11} className="text-amber-400" />}
                              {isPersonalOrWellnessRisk && <HeartPulse size={11} className="text-purple-400" />}
                              {!isAcademicRisk && !isPersonalOrWellnessRisk && <AlertTriangle size={11} className="text-slate-400" />}
                              {effectiveCategory}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Not Evaluated
                        </span>
                      )}
                    </td>

                    {/* Recommended Interventions / Read-Only Comments */}
                    <td className="p-4">
                      {showActions ? (
                        /* TEACHER / COUNSELOR VIEW: INTERACTIVE BUTTONS */
                        isRiskEvaluated ? (
                          <div className="flex flex-wrap gap-1.5">
                            {/* Assign Counselor Button */}
                            {(isPersonalOrWellnessRisk || (!isAcademicRisk && student.riskLevel !== 'Low')) && (
                              <button
                                onClick={() =>
                                  onAssignCounselor
                                    ? onAssignCounselor(student)
                                    : alert(`Assigned student ${student.name} to Psychological Counselor`)
                                }
                                className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm"
                                title="Refer Student to Guidance & Psychological Counseling"
                              >
                                <UserCheck size={12} /> Assign Counselor
                              </button>
                            )}

                            {/* Academic Plan Button */}
                            {isAcademicRisk && (
                              <button
                                onClick={() =>
                                  onAcademicIntervention
                                    ? onAcademicIntervention(student)
                                    : alert(`Initiated Academic Support Plan for ${student.name}`)
                                }
                                className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm"
                                title="Schedule Remedial / Academic Support Plan"
                              >
                                <BookOpen size={12} /> Academic Plan
                              </button>
                            )}

                            {/* Fallback if low risk */}
                            {!isAcademicRisk && !isPersonalOrWellnessRisk && (
                              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                                <ShieldCheck size={13} /> No action needed
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Pending prerequisite data</span>
                        )
                      ) : (
                        /* ADMIN VIEW: READ-ONLY TEXT AND STATUS BADGES (NO BUTTONS) */
                        <div className="space-y-1">
                          {actionComment ? (
                            <div className="flex items-start gap-1.5 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                              <MessageSquare size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                              <span className="leading-tight">{actionComment}</span>
                            </div>
                          ) : assignedCounselor ? (
                            <div className="inline-flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md">
                              <UserCheck size={12} />
                              Assigned to {assignedCounselor}
                            </div>
                          ) : isRiskEvaluated && student.riskLevel === 'Low' ? (
                            <span className="text-xs text-emerald-400/80 font-medium flex items-center gap-1">
                              <ShieldCheck size={13} /> Clear / No Intervention Required
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 italic">
                              <Clock size={12} />
                              No intervention logged / Pending action
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions Column (Hidden for Admin when showActions={false}) */}
                    {showActions && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit Marks */}
                          <button
                            onClick={() => onOpenRecordModal && onOpenRecordModal(student)}
                            className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                            title="Update CGPA and Attendance"
                          >
                            <Edit3 size={13} /> Edit Marks
                          </button>

                          {/* AI Evaluate */}
                          <button
                            onClick={() => onEvaluateRisk && onEvaluateRisk(studentDbId)}
                            disabled={!canEvaluate || isEvaluatingThisStudent}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                              canEvaluate
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer shadow-sm'
                                : 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                            }`}
                            title={getEvaluateTooltip()}
                          >
                            {isEvaluatingThisStudent ? (
                              <>
                                <Loader2 size={13} className="animate-spin text-amber-300" />
                                Evaluating...
                              </>
                            ) : (
                              <>
                                <Sparkles size={13} />
                                {isRiskEvaluated ? 'Re-evaluate' : 'AI Evaluate'}
                              </>
                            )}
                          </button>

                          {/* Delete */}
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