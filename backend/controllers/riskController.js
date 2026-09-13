// controllers/riskController.js
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const { evaluateStudentRiskWithGemini } = require('../services/riskService');

// @desc    Trigger AI Risk Evaluation checking ALL survey fields, body payloads, & database fields
// @route   POST /api/risk/evaluate
// @access  Private (Teacher, Counselor, Admin)
exports.evaluateStudentRisk = async (req, res) => {
  try {
    const { studentId, id, surveyData: incomingSurvey } = req.body;
    const targetId = studentId || id || req.params.id || req.params.studentId;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    // 1. Fetch User Document
    const query = targetId.match(/^[0-9a-fA-F]{24}$/) ? { _id: targetId } : { studentId: targetId };
    const user = await User.findOne(query).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student user not found' });
    }

    // 2. Fetch or initialize StudentProfile Document
    let profile = await StudentProfile.findOne({ user: user._id });
    if (!profile) {
      profile = new StudentProfile({ user: user._id });
    }

    // Sync incoming survey data into student profile memory & DB
    if (incomingSurvey && typeof incomingSurvey === 'object') {
      if (!profile.surveyData) profile.surveyData = new Map();
      
      Object.entries(incomingSurvey).forEach(([k, v]) => {
        if (profile.surveyData instanceof Map) {
          profile.surveyData.set(k, v);
        } else {
          profile.surveyData[k] = v;
        }
      });
    }

    // 3. Extract surveyData cleanly handling Mongoose Maps, plain Objects, and Request Body
    let dbSurvey = {};
    if (profile.surveyData) {
      dbSurvey = profile.surveyData instanceof Map 
        ? Object.fromEntries(profile.surveyData) 
        : profile.surveyData;
    }

    const survey = { ...dbSurvey, ...(incomingSurvey || {}) };

    // --- HELPER FUNCTION: Safely search across multiple key aliases ---
    const getField = (...keys) => {
      for (const key of keys) {
        if (survey[key] !== undefined && survey[key] !== null && survey[key] !== '') return survey[key];
        if (profile[key] !== undefined && profile[key] !== null && profile[key] !== '') return profile[key];
      }
      return null;
    };

    // Extract Academic & Attendance
    const cgpa = profile.cgpa ?? profile.latestMarks ?? getField('cgpa', 'latestMarks');
    const attendancePercentage = profile.attendancePercentage ?? profile.attendance ?? getField('attendancePercentage', 'attendance');

    // Extract All Survey Factors
    const academicInterest = getField('academicInterest', 'interest', 'motivationLevel') || 'Not Provided';
    const abilityToStudy = getField('abilityToStudy', 'studyEnvironment', 'studyAbility') || 'Not Provided';
    const familyMonthlyIncome = getField('familyMonthlyIncome', 'familyIncome', 'income') || 'Not Provided';
    const moneyFeeWorries = getField('moneyFeeWorries', 'financialStress', 'financialStatus', 'feeWorries') || 'Not Provided';
    const livingSituation = getField('livingSituation', 'residence', 'housing') || 'Not Provided';
    const partTimeWork = getField('partTimeWork', 'partTimeJob', 'workHours') || 'Not Provided';
    const dailySelfStudyHours = getField('dailySelfStudyHours', 'studyHoursPerDay', 'studyHours') || 'Not Provided';
    const dailyCommuteTime = getField('dailyCommuteTime', 'commuteTime', 'commute') || 'Not Provided';
    const activeBacklogs = getField('activeBacklogs', 'backlogs', 'failedSubjects') || 'Not Provided';
    const nightlySleepHours = getField('nightlySleepHours', 'sleepHoursPerNight', 'sleepHours', 'sleep') || 'Not Provided';
    const mentalHealthState = getField('mentalHealthState', 'mentalHealthSelfReport', 'mentalHealthStatus', 'mentalHealth') || 'Not Provided';
    
    let impactFactors = getField('impactFactors', 'addictions', 'distractions') || [];
    if (typeof impactFactors === 'string') impactFactors = [impactFactors];

    console.log(`[AI EVALUATION] Student: ${user.name} (${user._id})`);
    console.log(`[AI EVALUATION] Mental Health: "${mentalHealthState}" | Financial: "${moneyFeeWorries}"`);
    console.log(`[AI EVALUATION] Interest: "${academicInterest}" | Study Ability: "${abilityToStudy}"`);

    // 4. Construct Payload for AI Service
    const evaluationPayload = {
      studentName: user.name,
      academicPerformance: { cgpa, attendancePercentage, activeBacklogs },
      academicEngagement: { academicInterest, abilityToStudy, dailySelfStudyHours },
      financialAndLogistics: { familyMonthlyIncome, moneyFeeWorries, livingSituation, partTimeWork, dailyCommuteTime },
      wellnessAndLifestyle: { nightlySleepHours, mentalHealthState, impactFactors },
      qualitativeNotes: profile.qualitativeNotes || [],
    };

    // 5. Run AI Assessment via Gemini Service with Fallback
    let aiAssessment = { riskLevel: 'Low Risk', riskCategory: 'None', aiRecommendations: [] };
    try {
      if (typeof evaluateStudentRiskWithGemini === 'function') {
        aiAssessment = await evaluateStudentRiskWithGemini(evaluationPayload);
      }
    } catch (aiErr) {
      console.warn('[AI EVALUATION] Gemini API warning, applying local safeguards:', aiErr.message);
    }

    let finalRiskLevel = aiAssessment.riskLevel || 'Low Risk';
    let finalRiskCategory = aiAssessment.riskCategory || 'None';

    // Standardize Risk Level Formatting
    const lowerLevel = String(finalRiskLevel).toLowerCase();
    if (lowerLevel.includes('low')) finalRiskLevel = 'Low Risk';
    if (lowerLevel.includes('medium')) finalRiskLevel = 'Medium Risk';
    if (lowerLevel.includes('high')) finalRiskLevel = 'High Risk';

    // 6. SAFEGUARD RULE ENGINE (Rules apply on top of AI results)
    const mentalLower = String(mentalHealthState).toLowerCase();
    const financialLower = String(moneyFeeWorries).toLowerCase();
    const interestLower = String(academicInterest).toLowerCase();
    const abilityLower = String(abilityToStudy).toLowerCase();
    const studyHoursLower = String(dailySelfStudyHours).toLowerCase();
    const backlogsLower = String(activeBacklogs).toLowerCase();
    const sleepLower = String(nightlySleepHours).toLowerCase();
    const impactString = Array.isArray(impactFactors) ? impactFactors.join(' ').toLowerCase() : '';

    // Explicit check for student disinterest/apathy
    const isDisinterested =
      interestLower.includes('not interested') ||
      interestLower.includes('no interest') ||
      interestLower.includes('disinterested') ||
      interestLower.includes('hate') ||
      interestLower.includes('unmotivated') ||
      interestLower.includes('low');

    const isPoorMentalHealth =
      mentalLower.includes('anxious') ||
      mentalLower.includes('stressed') ||
      mentalLower.includes('depressed') ||
      mentalLower.includes('overwhelmed') ||
      mentalLower.includes('poor') ||
      sleepLower.includes('less than 5');

    const isPoorFinancial =
      financialLower.includes('high') ||
      financialLower.includes('severe') ||
      financialLower.includes('burden') ||
      financialLower.includes('moderate') ||
      financialLower.includes('manageable') ||
      financialLower.includes('yes');

    const isPoorAcademic =
      (cgpa !== null && Number(cgpa) < 6.5) ||
      (attendancePercentage !== null && Number(attendancePercentage) < 75) ||
      isDisinterested ||
      abilityLower.includes('partial') ||
      abilityLower.includes('distraction') ||
      studyHoursLower.includes('less than 1') ||
      backlogsLower.includes('1') ||
      backlogsLower.includes('2') ||
      backlogsLower.includes('3');

    const hasBehavioralRisk =
      impactString.includes('substance') ||
      impactString.includes('gaming') ||
      impactString.includes('social media') ||
      impactString.includes('addiction');

    // Categorization Priority Rules
    if (isPoorMentalHealth || hasBehavioralRisk) {
      finalRiskCategory = isPoorAcademic ? 'Academic & Mental Health Concern' : 'Wellness & Mental Health';
      if (finalRiskLevel === 'Low Risk') finalRiskLevel = 'Medium Risk';
      if (mentalLower.includes('depressed') || mentalLower.includes('overwhelmed')) {
        finalRiskLevel = 'High Risk';
      }
    } else if (isDisinterested && isPoorAcademic) {
      finalRiskCategory = 'Academic & Mental Health Concern';
      if (finalRiskLevel === 'Low Risk') finalRiskLevel = 'Medium Risk';
    } else if (isPoorFinancial) {
      finalRiskCategory = 'Financial Strain';
      if (finalRiskLevel === 'Low Risk') finalRiskLevel = 'Medium Risk';
    } else if (isPoorAcademic) {
      finalRiskCategory = 'Academic Concern';
      if (finalRiskLevel === 'Low Risk') finalRiskLevel = 'Medium Risk';

      if ((cgpa !== null && Number(cgpa) < 4.5) || backlogsLower.includes('3')) {
        finalRiskLevel = 'High Risk';
      }
    }

    // 7. Save Profile Updates
    profile.riskLevel = finalRiskLevel;
    profile.riskCategory = finalRiskCategory;
    profile.primaryRiskCategory =
      finalRiskCategory.includes('Wellness') || finalRiskCategory.includes('Mental Health') ? 'WELLNESS' :
      finalRiskCategory.includes('Financial') ? 'FINANCIAL' :
      finalRiskCategory.includes('Academic') ? 'ACADEMIC' : 'NONE';

    profile.riskEvaluated = true;
    profile.aiRecommendations = aiAssessment.aiRecommendations || profile.aiRecommendations || [];
    profile.lastEvaluatedAt = new Date();
    profile.lastAiAnalysisDate = new Date();

    // 8. Action Flags Assignment
    const isCounselorRequired =
      isPoorMentalHealth ||
      isPoorFinancial ||
      hasBehavioralRisk ||
      isDisinterested ||
      finalRiskLevel === 'Medium Risk' ||
      finalRiskLevel === 'High Risk';

    profile.recommendedActions = {
      enableRemedialQuiz: isPoorAcademic,
      matchPeerTutor: isPoorAcademic,
      assignTeacherMentor: finalRiskLevel !== 'Low Risk',
      escalateToCounselor: isCounselorRequired,
      assignCounselor: isCounselorRequired,
      escalateCounselor: isCounselorRequired,
    };

    profile.markModified('surveyData');
    profile.markModified('recommendedActions');

    await profile.save();

    console.log(`[AI EVALUATION COMPLETE] Level: ${finalRiskLevel} | Category: ${finalRiskCategory} | Counselor Escalation: ${isCounselorRequired}`);

    return res.status(200).json({
      success: true,
      message: 'Student risk evaluated with all survey details',
      assessment: {
        studentId: user._id,
        id: user._id,
        name: user.name,
        riskLevel: profile.riskLevel,
        riskCategory: profile.riskCategory,
        primaryRiskCategory: profile.primaryRiskCategory,
        riskEvaluated: profile.riskEvaluated,
        aiRecommendations: profile.aiRecommendations,
        recommendedActions: profile.recommendedActions,
        escalateToCounselor: isCounselorRequired,
        assignCounselor: isCounselorRequired,
      },
    });
  } catch (error) {
    console.error('Error in evaluateStudentRisk:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI risk evaluation',
      error: error.message,
    });
  }
};