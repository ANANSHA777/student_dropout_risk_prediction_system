// backend/controllers/academicPlanController.js
const mongoose = require('mongoose');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const { generateAcademicPlan, extractPureAcademicMetrics } = require('../services/academicPlanService');

/**
 * @desc    Generate a tailored academic plan strictly based on academic metrics
 * @route   POST /api/academic-plan/generate
 * @access  Private (Teacher, Admin)
 */
exports.generatePlan = async (req, res) => {
  try {
    const { studentId, id, cgpa, attendancePercentage, activeBacklogs, assignmentsSubmitted, assignmentsTotal } = req.body;
    const targetId = studentId || id;

    let academicData = {
      cgpa,
      attendancePercentage,
      activeBacklogs,
      assignmentsSubmitted,
      assignmentsTotal,
    };

    if (targetId) {
      const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
      const query = isObjectId ? { $or: [{ user: targetId }, { _id: targetId }] } : { studentId: targetId };
      const profile = await StudentProfile.findOne(query);

      if (profile) {
        academicData = {
          cgpa: profile.cgpa ?? academicData.cgpa,
          attendancePercentage: profile.attendancePercentage ?? academicData.attendancePercentage,
          activeBacklogs: profile.activeBacklogs || academicData.activeBacklogs,
          assignmentsSubmitted: profile.assignmentsSubmitted ?? academicData.assignmentsSubmitted,
          assignmentsTotal: profile.assignmentsTotal ?? academicData.assignmentsTotal,
        };
      }
    }

    const plan = generateAcademicPlan(academicData);

    return res.status(200).json({
      success: true,
      message: 'Academic plan generated successfully (Purely Academic)',
      plan,
    });
  } catch (error) {
    console.error('Error in generatePlan:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error generating academic plan',
      error: error.message,
    });
  }
};

/**
 * @desc    Assign generated or custom academic plan to student profile
 * @route   POST /api/academic-plan/assign
 * @access  Private (Teacher, Admin)
 */
exports.assignPlan = async (req, res) => {
  try {
    const { studentId, id, planType, notes, studySchedule, remedialClasses, backlogTracking } = req.body;
    const targetId = studentId || id || req.params.id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(targetId);
    let profile = await StudentProfile.findOne(
      isObjectId ? { $or: [{ user: targetId }, { _id: targetId }] } : { studentId: targetId }
    );

    if (!profile) {
      // Find user to initialize profile if missing
      const user = await User.findById(isObjectId ? targetId : null);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }
      profile = new StudentProfile({ user: user._id });
    }

    // Generate defaults if planType not provided
    const basePlan = generateAcademicPlan({
      cgpa: profile.cgpa,
      attendancePercentage: profile.attendancePercentage,
      activeBacklogs: profile.activeBacklogs,
      assignmentsSubmitted: profile.assignmentsSubmitted,
      assignmentsTotal: profile.assignmentsTotal,
    });

    const chosenPlanType = planType || basePlan.planType;
    const finalPlan = {
      planType: chosenPlanType,
      studySchedule: studySchedule || basePlan.studySchedule,
      remedialClasses: remedialClasses || basePlan.remedialClasses,
      backlogTracking: backlogTracking || basePlan.backlogTracking,
      cgpaRecoveryMilestones: basePlan.cgpaRecoveryMilestones,
      notes: notes || '',
      assignedAt: new Date(),
    };

    profile.assignedAcademicPlan = chosenPlanType;
    profile.academicPlan = chosenPlanType;
    profile.assignedPlan = chosenPlanType;
    profile.academic_remedial_plan = {
      plan_title: chosenPlanType,
      plan_details: notes || finalPlan.studySchedule || 'Remedial academic support plan assigned.',
      target_metrics: 'Target CGPA: ≥ 6.0, Attendance: ≥ 75%',
      assigned_by_teacher_name: req.user?.name || 'Teacher',
      assigned_at: new Date(),
      status: 'IN_PROGRESS',
      completion_notes: '',
      completed_at: null,
    };
    profile.academicInterventionPlan = {
      studySchedule: finalPlan.studySchedule,
      remedialClasses: finalPlan.remedialClasses,
      backlogTracking: finalPlan.backlogTracking,
      cgpaRecoveryMilestones: finalPlan.cgpaRecoveryMilestones,
      generatedAt: new Date(),
    };

    profile.intervention_logs.push({
      action: `Academic Plan Assigned: ${chosenPlanType}`,
      performed_by: req.user?.name || 'Teacher',
      timestamp: new Date(),
      notes: `Academic Remedial Plan set to IN_PROGRESS. Details: ${notes || chosenPlanType}`,
    });

    if (notes && notes.trim().length > 0) {
      profile.qualitativeNotes.push({
        authorRole: req.user?.role || 'Teacher',
        note: `Assigned Academic Plan: ${chosenPlanType}. Instructions: ${notes.trim()}`,
        category: 'Academic',
        createdAt: new Date(),
      });
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: `Successfully assigned academic plan: ${chosenPlanType}`,
      plan: finalPlan,
      profile,
    });
  } catch (error) {
    console.error('Error in assignPlan:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error assigning academic plan',
      error: error.message,
    });
  }
};

/**
 * @desc    Get assigned academic plan for student
 * @route   GET /api/academic-plan/student/:id
 * @access  Private
 */
exports.getAcademicPlan = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const profile = await StudentProfile.findOne(
      isObjectId ? { $or: [{ user: id }, { _id: id }] } : { studentId: id }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    return res.status(200).json({
      success: true,
      academicPlan: profile.academicPlan || profile.assignedAcademicPlan || null,
      academicInterventionPlan: profile.academicInterventionPlan || null,
      cgpa: profile.cgpa,
      attendancePercentage: profile.attendancePercentage,
      activeBacklogs: profile.activeBacklogs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
