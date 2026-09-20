// backend/controllers/studentController.js
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path to models if needed
const StudentProfile = require('../models/StudentProfile');

/**
 * Helper to safely normalize and parse impact factors/addictions into a string array.
 * Prevents Mongoose CastError when objects or stringified JSON are received from the frontend.
 */
const normalizeImpactFactors = (rawFactors) => {
  if (!rawFactors) return ['None of the Above'];

  let parsed = rawFactors;

  // Handle case where frontend passes a stringified JSON array/object
  if (typeof rawFactors === 'string') {
    try {
      const trimmed = rawFactors.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        parsed = JSON.parse(trimmed);
      } else {
        return [trimmed];
      }
    } catch (e) {
      return [rawFactors];
    }
  }

  const cleanFactors = [];

  // Handle Array input
  if (Array.isArray(parsed)) {
    parsed.forEach((item) => {
      if (typeof item === 'string') {
        cleanFactors.push(item);
      } else if (typeof item === 'object' && item !== null) {
        if (item.socialMedia) cleanFactors.push('Excessive Social Media');
        if (item.gaming) cleanFactors.push('Excessive Gaming');
        if (item.substances) cleanFactors.push('Substance / Alcohol Use');
        if (item.none) cleanFactors.push('None of the Above');
      }
    });
  } 
  // Handle Object input
  else if (typeof parsed === 'object' && parsed !== null) {
    if (parsed.socialMedia) cleanFactors.push('Excessive Social Media');
    if (parsed.gaming) cleanFactors.push('Excessive Gaming');
    if (parsed.substances) cleanFactors.push('Substance / Alcohol Use');
    if (parsed.none) cleanFactors.push('None of the Above');
  }

  return cleanFactors.length > 0 ? cleanFactors : ['None of the Above'];
};

// @desc    Get current student's academic profile and risk indicators
// @route   GET /api/student/profile
// @access  Private (Student / Teacher)
exports.getStudentProfile = async (req, res) => {
  try {
    const rawUserId = req.user?._id || req.user?.id;
    if (!rawUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized request: Missing user context' });
    }

    const studentId = mongoose.Types.ObjectId.isValid(rawUserId)
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    // Fetch student profile document populated with user details
    let profile = await StudentProfile.findOne({ user: studentId }).lean();

    // Fallback if profile document does not exist yet
    if (!profile) {
      const user = await User.findById(studentId).select('-password').lean();
      return res.status(200).json({
        success: true,
        profile: {
          name: user ? user.name : req.user?.name || 'Student',
          email: user ? user.email : req.user?.email || '',
          attendancePercentage: null,
          cgpa: null,
          academicInterest: 'High (Interested & Motivated)',
          abilityToStudy: 'Full (Good Environment & Focus)',
          surveyCompleted: false,
          surveyStatus: 'Pending',
          riskLevel: 'Unevaluated',
          riskCategory: 'None',
          canEvaluate: false,
          aiRecommendations: ['Maintain regular class attendance.'],
          surveyData: {},
        },
      });
    }

    // Check if prerequisite conditions are met to enable the AI Evaluation Button on Frontend
    const hasTeacherMetrics = profile.cgpa !== null && profile.cgpa !== undefined &&
                              profile.attendancePercentage !== null && profile.attendancePercentage !== undefined;
    const hasStudentSurvey = Boolean(profile.surveyCompleted);
    const canEvaluate = hasTeacherMetrics && hasStudentSurvey;

    // Safely extract nested surveyData object (handling Maps or plain JS Objects)
    let sData = profile.surveyData || {};
    if (sData instanceof Map) {
      sData = Object.fromEntries(sData);
    }

    // Reconstruct normalized survey values with fallbacks across flat and nested schemas
    const normalizedSurveyData = {
      academicInterest: sData.academicInterest || profile.academicInterest || 'High (Interested & Motivated)',
      abilityToStudy: sData.abilityToStudy || profile.abilityToStudy || 'Full (Good Environment & Focus)',
      familyMonthlyIncome: sData.familyMonthlyIncome || profile.familyMonthlyIncome || profile.familyIncome || '',
      moneyFeeWorries: sData.moneyFeeWorries || profile.moneyFeeWorries || profile.financialStress || '',
      livingSituation: sData.livingSituation || profile.livingSituation || '',
      partTimeWork: sData.partTimeWork || profile.partTimeWork || profile.partTimeJob || '',
      dailySelfStudyHours: sData.dailySelfStudyHours || profile.dailySelfStudyHours || profile.studyHoursPerDay || '',
      dailyCommuteTime: sData.dailyCommuteTime || profile.dailyCommuteTime || profile.commuteTime || '',
      activeBacklogs: sData.activeBacklogs || profile.activeBacklogs || '',
      nightlySleepHours: sData.nightlySleepHours || profile.nightlySleepHours || profile.sleepHoursPerNight || '',
      mentalHealthState: sData.mentalHealthState || profile.mentalHealthState || profile.mentalHealthSelfReport || '',
      impactFactors: (sData.impactFactors && sData.impactFactors.length > 0)
        ? sData.impactFactors
        : (profile.impactFactors && profile.impactFactors.length > 0)
        ? profile.impactFactors
        : (profile.addictions && profile.addictions.length > 0)
        ? profile.addictions
        : ['None of the Above'],
    };

    let counselorName = null;
    const counselorId = profile.assigned_counselor_id || profile.assignedCounselor;
    if (counselorId) {
      const cUser = await User.findById(counselorId).select('name email department').lean();
      if (cUser) counselorName = cUser.name;
    }

    // Determine clean risk category
    let cleanCategory = profile.riskCategory || 'None';
    if (profile.evaluationCase === 'CASE_A_WELLNESS_DISENGAGEMENT' && (!cleanCategory || cleanCategory === 'None')) {
      cleanCategory = 'Wellness & Mental Health';
    }

    // Determine 14-day cooldown status
    const cooldownPeriodMs = 14 * 24 * 60 * 60 * 1000;
    const lastSubmission = profile.last_survey_submission_date || profile.lastSurveySubmittedAt;
    let cooldownActive = false;
    let daysRemaining = 0;
    if (lastSubmission && !profile.survey_cooldown_override) {
      const elapsed = Date.now() - new Date(lastSubmission).getTime();
      if (elapsed < cooldownPeriodMs) {
        cooldownActive = true;
        daysRemaining = Math.ceil((cooldownPeriodMs - elapsed) / (24 * 60 * 60 * 1000));
      }
    }

    res.status(200).json({
      success: true,
      profile: {
        ...profile,
        name: req.user?.name || profile.name,
        email: req.user?.email || profile.email,
        surveyCompleted: Boolean(profile.surveyCompleted),
        surveyStatus: profile.surveyCompleted ? 'Completed' : 'Pending',
        marks_submitted: hasTeacherMetrics,
        survey_submitted: Boolean(profile.surveyCompleted),
        cooldownActive,
        daysRemaining,
        survey_cooldown_override: Boolean(profile.survey_cooldown_override),
        last_survey_submission_date: lastSubmission,
        riskLevel: profile.riskLevel || 'Unevaluated',
        riskCategory: cleanCategory,
        primaryRiskCategory: profile.primaryRiskCategory || 'NONE',
        evaluationCase: profile.evaluationCase || 'NONE',
        assignedCounselorName: counselorName,
        counselorName: counselorName,
        assigned_counselor_id: counselorId,
        assignedCounselor: counselorId,
        counselingStatus: profile.counselingStatus || 'Active Review',
        counseling_session: profile.counseling_session || {
          status: 'PENDING_SCHEDULE',
          date: null,
          time: '',
          notes: '',
        },
        academic_remedial_plan: profile.academic_remedial_plan || {
          status: profile.assignedAcademicPlan ? 'IN_PROGRESS' : 'NOT_REQUIRED',
          plan_title: profile.assignedAcademicPlan || '',
          plan_details: profile.academicInterventionPlan?.studySchedule || '',
          target_metrics: 'Target CGPA: ≥ 6.0, Attendance: ≥ 75%',
        },
        financial_relief_status: profile.financial_relief_status || (profile.financialAidStatus === 'Pending Institutional Support' ? 'REQUESTED' : 'NONE'),
        financialAidStatus: profile.financialAidStatus || 'Paid',
        collegeFinancialAid: profile.collegeFinancialAid || {},
        financial_documents: profile.financial_documents || [],
        intervention_logs: profile.intervention_logs || [],
        canEvaluate, // Enable AI evaluate button ONLY if CGPA, Attendance, and Survey are complete
        academicInterest: normalizedSurveyData.academicInterest,
        abilityToStudy: normalizedSurveyData.abilityToStudy,
        financialStress: profile.financialStress || normalizedSurveyData.moneyFeeWorries,
        mentalHealthStatus: profile.mentalHealthSelfReport || normalizedSurveyData.mentalHealthState,
        studyHoursPerDay: profile.studyHoursPerDay || normalizedSurveyData.dailySelfStudyHours,
        surveyData: normalizedSurveyData,
      },
    });
  } catch (error) {
    console.error('Error in getStudentProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching student profile',
      error: error.message,
    });
  }
};

// @desc    Submit wellness, financial, and lifestyle self-assessment survey
// @route   POST /api/student/survey
// @access  Private (Student)
exports.submitStudentSurvey = async (req, res) => {
  try {
    const rawUserId = req.user?._id || req.user?.id;
    if (!rawUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized request: Missing user context' });
    }

    const studentId = mongoose.Types.ObjectId.isValid(rawUserId)
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    // Check 14-day cooldown unless overridden by teacher
    const existingProfile = await StudentProfile.findOne({ user: studentId });
    if (existingProfile) {
      const lastSubmission = existingProfile.last_survey_submission_date || existingProfile.lastSurveySubmittedAt;
      const cooldownPeriodMs = 14 * 24 * 60 * 60 * 1000;
      if (lastSubmission && !existingProfile.survey_cooldown_override) {
        const elapsed = Date.now() - new Date(lastSubmission).getTime();
        if (elapsed < cooldownPeriodMs) {
          const daysRemaining = Math.ceil((cooldownPeriodMs - elapsed) / (24 * 60 * 60 * 1000));
          return res.status(429).json({
            success: false,
            message: `14-Day Survey Cooldown Active: You may re-submit in ${daysRemaining} day(s). Contact a teacher for re-submission bypass if needed.`,
            cooldownActive: true,
            daysRemaining,
          });
        }
      }
    }

    // Support both flat fields & nested surveyData objects in req.body
    const bodySource = req.body.surveyData || req.body;

    const academicInterest = bodySource.academicInterest || req.body.academicInterest || 'High (Interested & Motivated)';
    const abilityToStudy = bodySource.abilityToStudy || req.body.abilityToStudy || 'Full (Good Environment & Focus)';
    const familyIncome = bodySource.familyIncome || bodySource.familyMonthlyIncome || '';
    const financialStress = bodySource.financialStress || bodySource.moneyFeeWorries || '';
    const livingSituation = bodySource.livingSituation || '';
    const commuteTime = bodySource.commuteTime || bodySource.dailyCommuteTime || '';
    const partTimeJob = bodySource.partTimeJob || bodySource.partTimeWork || '';
    const activeBacklogs = bodySource.activeBacklogs || '';
    const studyHoursPerDay = bodySource.studyHoursPerDay || bodySource.dailySelfStudyHours || bodySource.academicWorkload || '';
    const sleepHoursPerNight = bodySource.sleepHoursPerNight || bodySource.nightlySleepHours || '';
    const mentalHealthStatus = bodySource.mentalHealthStatus || bodySource.mentalHealthState || '';

    // Normalize impact factors/addictions array strictly to string array
    const rawFactors = bodySource.addictions || bodySource.impactFactors || req.body.addictions || req.body.impactFactors;
    const cleanImpactFactors = normalizeImpactFactors(rawFactors);

    // Structured nested survey object for schema persistence
    const surveyDataObject = {
      academicInterest,
      abilityToStudy,
      familyMonthlyIncome: familyIncome,
      moneyFeeWorries: financialStress,
      livingSituation,
      partTimeWork: partTimeJob,
      dailySelfStudyHours: studyHoursPerDay,
      dailyCommuteTime: commuteTime,
      activeBacklogs,
      nightlySleepHours: sleepHoursPerNight,
      mentalHealthState: mentalHealthStatus,
      impactFactors: cleanImpactFactors,
    };

    // Prepare profile update payload (Pure survey save without auto-evaluating risk)
    const updateData = {
      surveyCompleted: true,
      surveyStatus: 'Completed',
      lastSurveySubmittedAt: new Date(),
      last_survey_submission_date: new Date(),
      survey_cooldown_override: false,

      // Flat Survey Fields (For direct query access)
      academicInterest,
      abilityToStudy,
      familyIncome,
      familyMonthlyIncome: familyIncome,
      financialStress,
      moneyFeeWorries: financialStress,
      livingSituation,
      commuteTime,
      dailyCommuteTime: commuteTime,
      partTimeJob,
      partTimeWork: partTimeJob,
      activeBacklogs,
      studyHoursPerDay,
      dailySelfStudyHours: studyHoursPerDay,
      sleepHoursPerNight,
      nightlySleepHours: sleepHoursPerNight,
      mentalHealthSelfReport: mentalHealthStatus,
      mentalHealthState: mentalHealthStatus,
      addictions: cleanImpactFactors,
      impactFactors: cleanImpactFactors,

      // Nested survey object (For StudentProfile schema mapping)
      surveyData: surveyDataObject,
    };

    // 1. Sync User document completion flag
    await User.findByIdAndUpdate(studentId, { $set: { surveyCompleted: true } });

    // 2. Persist updated profile document
    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { user: studentId },
      { $set: updateData },
      { returnDocument: 'after', upsert: true, runValidators: false }
    ).lean();

    // Check evaluate condition for frontend UI state
    const hasTeacherMetrics = updatedProfile.cgpa !== null && updatedProfile.cgpa !== undefined && 
                              updatedProfile.attendancePercentage !== null && updatedProfile.attendancePercentage !== undefined;
    const canEvaluate = hasTeacherMetrics && true;

    // 3. Send normalized payload to prevent state mismatches in React
    res.status(200).json({
      success: true,
      message: 'Self-assessment survey recorded successfully. Pending teacher AI evaluation.',
      profile: {
        ...updatedProfile,
        surveyCompleted: true,
        surveyStatus: 'Completed',
        canEvaluate,
        academicInterest,
        abilityToStudy,
        financialStress,
        mentalHealthStatus,
        studyHoursPerDay,
        surveyData: surveyDataObject,
      },
    });
  } catch (error) {
    console.error('Error in submitStudentSurvey:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting self-assessment',
      error: error.message,
    });
  }
};

// @desc    Explicitly evaluate AI risk & classify student (Triggered only when Teacher clicks AI Evaluate)
// @route   POST /api/teacher/evaluate-student
// @access  Private (Teacher)
exports.evaluateStudentRisk = async (req, res) => {
  try {
    const { studentId, id } = req.body;
    const targetId = studentId || id || req.params.id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Student ID is required for evaluation.' });
    }

    const query = mongoose.Types.ObjectId.isValid(targetId) ? { _id: targetId } : { user: targetId };
    const profile = await StudentProfile.findOne(query);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Require both Teacher Metrics and Student Survey to be present before evaluating
    const hasTeacherMetrics = profile.cgpa !== null && profile.cgpa !== undefined && 
                              profile.attendancePercentage !== null && profile.attendancePercentage !== undefined;
    const hasStudentSurvey = profile.surveyCompleted === true;

    if (!hasTeacherMetrics || !hasStudentSurvey) {
      return res.status(400).json({
        success: false,
        message: 'Cannot evaluate risk. Teacher CGPA/Attendance AND Student Survey must be submitted first.',
      });
    }

    // Core Risk Classification Engine
    let riskLevel = 'Low Risk';
    let riskCategory = 'None';
    let assignedRole = 'TEACHER'; // 'TEACHER' for academic, 'COUNSELOR' for non-academic issues

    const cgpa = profile.cgpa || 0;
    const attendance = profile.attendancePercentage || 0;
    
    let sData = profile.surveyData || {};
    if (sData instanceof Map) {
      sData = Object.fromEntries(sData);
    }

    const mentalHealth = (sData.mentalHealthState || profile.mentalHealthState || profile.mentalHealthSelfReport || '').toLowerCase();
    const financial = (sData.moneyFeeWorries || profile.financialStress || '').toLowerCase();
    const interest = (sData.academicInterest || profile.academicInterest || '').toLowerCase();

    // 1. Academic Risk Checks
    if (cgpa < 6.0 || attendance < 75 || interest.includes('low') || interest.includes('disengaged')) {
      riskLevel = (cgpa < 4.5 || attendance < 60) ? 'High Risk' : 'Medium Risk';
      riskCategory = 'Academic Disengagement';
      assignedRole = 'TEACHER'; // Academic interventions assigned directly to teacher
    } 
    // 2. Wellness / Mental Health Risk Checks
    else if (mentalHealth.includes('anxious') || mentalHealth.includes('overwhelmed') || mentalHealth.includes('stressed')) {
      riskLevel = 'Medium Risk';
      riskCategory = 'Wellness & Mental Health';
      assignedRole = 'COUNSELOR'; // Route to Counselor
    } 
    // 3. Financial Risk Checks
    else if (financial.includes('high') || financial.includes('severe') || financial.includes('burden')) {
      riskLevel = 'Medium Risk';
      riskCategory = 'Financial Burden';
      assignedRole = 'COUNSELOR'; // Route to Counselor / Admin
    }

    // Save Evaluation Results
    profile.riskLevel = riskLevel;
    profile.riskCategory = riskCategory;
    profile.riskEvaluated = true;
    profile.evaluatedAt = new Date();
    profile.lastEvaluatedAt = new Date();
    profile.assignedRole = assignedRole;

    profile.recommendedActions = {
      assignTeacherMentor: assignedRole === 'TEACHER',
      escalateToCounselor: assignedRole === 'COUNSELOR',
      assignCounselor: assignedRole === 'COUNSELOR',
    };

    await profile.save();

    res.status(200).json({
      success: true,
      message: `Evaluation completed successfully. Assigned to ${assignedRole}.`,
      profile,
    });
  } catch (error) {
    console.error('Error in evaluateStudentRisk:', error);
    res.status(500).json({
      success: false,
      message: 'Server error running student evaluation',
      error: error.message,
    });
  }
};

// @desc    Upload proof documents for financial relief
// @route   POST /api/student/upload-document
// @access  Private (Student)
exports.uploadFinancialDocument = async (req, res) => {
  try {
    const rawUserId = req.user?._id || req.user?.id;
    if (!rawUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user context' });
    }
    const studentId = mongoose.Types.ObjectId.isValid(rawUserId)
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    const { filename, fileData, url } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'filename is required' });
    }

    const newDoc = {
      document_id: new mongoose.Types.ObjectId().toString(),
      filename,
      fileData: fileData || '',
      url: url || '',
      uploaded_at: new Date(),
    };

    const profile = await StudentProfile.findOneAndUpdate(
      { user: studentId },
      {
        $push: {
          financial_documents: newDoc,
          intervention_logs: {
            action: 'Proof Document Uploaded',
            performed_by: req.user?.name || 'Student',
            timestamp: new Date(),
            notes: `Student uploaded verification proof document: "${filename}".`,
          },
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Financial document uploaded successfully.',
      document: newDoc,
      financial_documents: profile.financial_documents,
      intervention_logs: profile.intervention_logs,
    });
  } catch (error) {
    console.error('Error in uploadFinancialDocument:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard summary for student (active survey, counseling, academic plan)
// @route   GET /api/student/dashboard-summary
// @access  Private (Student, Admin)
exports.getDashboardSummary = async (req, res) => {
  return exports.getStudentProfile(req, res);
};

// @desc    Student confirms attendance for scheduled counseling session
// @route   POST /api/student/confirm-session
// @access  Private (Student)
exports.confirmCounselingSession = async (req, res) => {
  try {
    const rawUserId = req.user?._id || req.user?.id;
    if (!rawUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized request: Missing user context' });
    }

    const studentId = mongoose.Types.ObjectId.isValid(rawUserId)
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    const profile = await StudentProfile.findOne({
      $or: [{ user: studentId }, { _id: studentId }],
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    if (!profile.counseling_session) {
      profile.counseling_session = {};
    }

    profile.counseling_session.status = 'CONFIRMED_BY_STUDENT';

    const logEntry = {
      action: 'Counseling Session Confirmed by Student',
      performed_by: req.user?.name || 'Student',
      timestamp: new Date(),
      notes: 'Student confirmed attendance for the scheduled counseling session.',
    };

    profile.intervention_logs.push(logEntry);
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Counseling session attendance confirmed successfully.',
      counseling_session: profile.counseling_session,
      intervention_logs: profile.intervention_logs,
    });
  } catch (error) {
    console.error('Error in confirmCounselingSession:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};