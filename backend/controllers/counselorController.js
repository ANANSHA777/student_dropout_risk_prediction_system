// backend/controllers/counselorController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CounselingSession = require('../models/CounselingSession');

// @desc    Get all students assigned to counselor or flagged for counselor review
// @route   GET /api/counselor/cases
// @access  Private (Counselor, Admin)
exports.getCounselorCases = async (req, res) => {
  try {
    const counselorId = req.user?._id || req.user?.id;

    // 1. Fetch all students
    const students = await User.find({ role: 'Student' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = students.map((s) => s._id);

    // 2. Fetch associated student profiles
    const profiles = await StudentProfile.find({ user: { $in: studentIds } }).lean();

    const profileMap = new Map();
    profiles.forEach((profile) => {
      if (profile.user) {
        profileMap.set(profile.user.toString(), profile);
      }
    });

    // 3. Fetch recent counseling sessions for context
    let sessions = [];
    if (CounselingSession) {
      sessions = await CounselingSession.find({ student: { $in: studentIds } })
        .sort({ createdAt: -1 })
        .lean();
    }
    const sessionMap = new Map();
    sessions.forEach((s) => {
      const sId = s.student?.toString();
      if (sId && !sessionMap.has(sId)) {
        sessionMap.set(sId, s);
      }
    });

    // 4. Combine and filter
    const cases = students
      .map((user) => {
        const profile = profileMap.get(user._id.toString()) || {};
        const session = sessionMap.get(user._id.toString()) || null;
        const rawRisk = profile.riskLevel || user.riskLevel || 'Unevaluated';

        const isDirectlyAssigned =
          (profile.assigned_counselor_id && profile.assigned_counselor_id.toString() === counselorId?.toString()) ||
          (profile.assignedCounselor && profile.assignedCounselor.toString() === counselorId?.toString()) ||
          (session && session.counselor && session.counselor.toString() === counselorId?.toString());

        const caseStatus = profile.counselingStatus || session?.status || 'Active Review';
        const mentalHealth = profile.mentalHealthSelfReport || profile.mentalHealthState || 'Moderate';
        const primaryConcern = profile.riskCategory && profile.riskCategory !== 'None'
          ? profile.riskCategory
          : profile.evaluationCase === 'CASE_A_WELLNESS_DISENGAGEMENT'
          ? 'Wellness & Mental Health'
          : 'Personal / Wellness';

        return {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          studentId: profile.studentId || user.studentId || '',
          department: profile.department || user.department || 'Computer Science',
          yearOfStudy: profile.yearOfStudy || user.yearOfStudy || '1st Year',
          riskLevel: rawRisk,
          riskCategory: primaryConcern,
          primaryRiskCategory: profile.primaryRiskCategory || 'NONE',
          concern: primaryConcern,
          status: mentalHealth,
          caseStatus: caseStatus,
          counselingStatus: caseStatus,
          isDirectlyAssigned,
          assignedCounselor: profile.assignedCounselor || profile.assigned_counselor_id,
          assigned_counselor_id: profile.assigned_counselor_id || profile.assignedCounselor,
          nonAcademicRisk: profile.nonAcademicRisk || {},
          evaluationCase: profile.evaluationCase || 'NONE',
          intervention_logs: profile.intervention_logs || [],
          qualitativeNotes: profile.qualitativeNotes || [],
          interventions: profile.interventions || [],
          cgpa: profile.cgpa ?? user.cgpa ?? null,
          attendance: profile.attendancePercentage ?? user.attendance ?? null,
          attendancePercentage: profile.attendancePercentage ?? user.attendance ?? null,
          surveyCompleted: Boolean(profile.surveyCompleted || user.surveyCompleted),
          surveyData: profile.surveyData || {},
          sessionContext: session?.studentBackgroundContext || null,
        };
      })
      .filter((student) => {
        if (student.isDirectlyAssigned) return true;
        const r = String(student.riskLevel || '').toLowerCase();
        const isHighOrMedium = r.includes('high') || r.includes('medium');
        const isCaseA = student.evaluationCase === 'CASE_A_WELLNESS_DISENGAGEMENT';
        return isHighOrMedium || isCaseA;
      });

    res.status(200).json({
      success: true,
      count: cases.length,
      cases,
      data: cases,
    });
  } catch (error) {
    console.error('Error in getCounselorCases:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching counselor cases',
      error: error.message,
    });
  }
};

// @desc    Log intervention note for a student and append to audit log
// @route   POST /api/counselor/students/:id/intervention
// @access  Private (Counselor, Admin)
exports.logInterventionNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionType, notes, status, actionPlan } = req.body;

    if (!notes && !actionPlan) {
      return res.status(400).json({
        success: false,
        message: 'Intervention notes or action plan is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Student ID format',
      });
    }

    const studentUser = await User.findOne({ _id: id, role: 'Student' });
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found',
      });
    }

    const targetStatus = status || 'In Progress';
    const counselorName = req.user?.name || 'Counselor';

    const newIntervention = {
      sessionType: sessionType || 'Counseling Session',
      notes: notes || actionPlan || '',
      status: targetStatus,
      actionPlan: actionPlan || '',
      date: new Date(),
      counselor: req.user?._id || req.user?.id,
    };

    const auditLogEntry = {
      action: `Counseling Note Logged (${sessionType || 'Session'})`,
      performed_by: counselorName,
      timestamp: new Date(),
      notes: notes || actionPlan || 'Counseling session notes recorded.',
    };

    const qualitativeNoteEntry = {
      authorRole: 'Counselor',
      note: `[${sessionType || 'Counseling'}] ${notes || actionPlan}`,
      category: 'Wellness',
      createdAt: new Date(),
    };

    // Update Student Profile
    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { user: id },
      {
        $set: { 
          counselingStatus: targetStatus,
          updatedAt: new Date(),
        },
        $push: {
          interventions: newIntervention,
          intervention_logs: auditLogEntry,
          qualitativeNotes: qualitativeNoteEntry,
        },
      },
      { new: true, upsert: true }
    );

    // Also update active session if present
    if (CounselingSession) {
      await CounselingSession.updateMany(
        { student: id, status: { $ne: 'Resolved' } },
        { 
          $set: { status: targetStatus },
          $push: {
            sessionNotes: {
              note: notes || actionPlan,
              addedBy: req.user?._id,
              addedAt: new Date(),
            },
          },
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Intervention logged and audit history updated successfully',
      intervention: newIntervention,
      profile: updatedProfile,
      intervention_logs: updatedProfile.intervention_logs,
    });
  } catch (error) {
    console.error('Error in logInterventionNote:', error);
    res.status(500).json({
      success: false,
      message: 'Server error logging intervention',
      error: error.message,
    });
  }
};

// @desc    Update student counseling case status (Active Review, In Progress, Resolved, Escalated)
// @route   PUT /api/counselor/students/:id/status
// @access  Private (Counselor, Admin)
exports.updateCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const validStatuses = ['Active Review', 'In Progress', 'Resolved', 'Escalated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Student ID format' });
    }

    const counselorName = req.user?.name || 'Counselor';

    const auditLogEntry = {
      action: `Case Status: ${status}`,
      performed_by: counselorName,
      timestamp: new Date(),
      notes: notes || `Counselor updated case status to "${status}".`,
    };

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { user: id },
      {
        $set: {
          counselingStatus: status,
          updatedAt: new Date(),
        },
        $push: {
          intervention_logs: auditLogEntry,
          qualitativeNotes: {
            authorRole: 'Counselor',
            note: `Status changed to ${status}. ${notes || ''}`,
            category: 'Wellness',
            createdAt: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );

    if (CounselingSession) {
      await CounselingSession.updateMany(
        { student: id },
        { $set: { status: status === 'Active Review' ? 'Assigned' : status } }
      );
    }

    // Requirement 6: Automated Risk Recovery
    // When an assigned counselor sets case status to Resolved, check: attendance >= 75% AND CGPA >= 6.0
    // If met, automatically set global risk status to Low Risk and append auto-recovery log
    if (status === 'Resolved') {
      const studentUser = await User.findById(id);
      const currentAttendance = updatedProfile.attendancePercentage ?? studentUser?.attendance ?? 0;
      const currentCgpa = updatedProfile.cgpa ?? studentUser?.cgpa ?? 0;

      if (currentAttendance >= 75 && currentCgpa >= 6.0) {
        const autoRecoveryLog = {
          action: 'System Auto-Recovery: Risk updated to Low Risk',
          performed_by: 'Automated Recovery Engine',
          timestamp: new Date(),
          notes: `System Auto-Recovery: Risk updated to Low Risk following case resolution and metric recovery (Attendance: ${currentAttendance}%, CGPA: ${currentCgpa}).`,
        };

        updatedProfile.riskLevel = 'Low Risk';
        updatedProfile.riskCategory = 'None';
        updatedProfile.primaryRiskCategory = 'NONE';
        updatedProfile.intervention_logs.push(autoRecoveryLog);
        await updatedProfile.save();

        if (studentUser) {
          studentUser.riskLevel = 'Low Risk';
          studentUser.riskCategory = 'None';
          studentUser.primaryRiskCategory = 'NONE';
          await studentUser.save();
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Case status successfully updated to ${status}`,
      status,
      intervention_logs: updatedProfile.intervention_logs,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error in updateCaseStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating case status',
      error: error.message,
    });
  }
};