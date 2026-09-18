// backend/services/riskService.js
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini Client safely
let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  } catch (err) {
    console.warn('[riskService] Gemini initialization skipped:', err.message);
  }
}

/**
 * Calculates deterministic risk scores and evaluations for the 3 non-academic categories:
 * 1. Wellness / Mental Health
 * 2. Academic Disengagement / Disinterest (differentiating root causes)
 * 3. Financial / External Stressors
 */
function evaluateNonAcademicCategories(data = {}) {
  const survey = data.surveyData || data.survey || {};
  const getField = (...keys) => {
    for (const key of keys) {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') return data[key];
      if (survey[key] !== undefined && survey[key] !== null && survey[key] !== '') return survey[key];
    }
    return '';
  };

  const mentalHealth = String(getField('mentalHealthSelfReport', 'mentalHealthState', 'mentalHealthStatus', 'mentalHealth')).toLowerCase();
  const sleepHours = String(getField('nightlySleepHours', 'sleepHoursPerNight', 'sleepHours', 'sleep')).toLowerCase();
  const disengagementReason = getField('disengagementReason') || 'None';
  const academicInterest = String(getField('academicInterest', 'interest', 'motivationLevel') || 'High (Interested & Motivated)');
  const interestLower = academicInterest.toLowerCase();
  const abilityToStudy = String(getField('abilityToStudy', 'studyAbility') || '').toLowerCase();
  const financialStress = String(getField('financialStress', 'moneyFeeWorries', 'feeWorries')).toLowerCase();
  const familyIncome = String(getField('familyIncome', 'familyMonthlyIncome', 'income')).toLowerCase();
  const commuteTime = String(getField('commuteTime', 'dailyCommuteTime', 'commute')).toLowerCase();
  const partTimeJob = String(getField('partTimeJob', 'partTimeWork', 'job')).toLowerCase();

  let impactFactors = getField('impactFactors', 'addictions') || [];
  if (typeof impactFactors === 'string') impactFactors = [impactFactors];
  const impactStr = Array.isArray(impactFactors) ? impactFactors.join(' ').toLowerCase() : '';

  // 1. Wellness / Mental Health (Stress, anxiety, lack of motivation, personal issues, sleep deficit)
  let wellnessScore = 15;
  let wellnessLevel = 'Low';
  const wellnessFlags = [];

  if (mentalHealth.includes('depressed') || mentalHealth.includes('overwhelmed') || mentalHealth.includes('severe')) {
    wellnessScore += 65;
    wellnessFlags.push('Severe mental health distress reported (Depression/Overwhelmed)');
  } else if (mentalHealth.includes('anxious') || mentalHealth.includes('stressed') || mentalHealth.includes('poor')) {
    wellnessScore += 45;
    wellnessFlags.push('Moderate anxiety/stress reported');
  }

  if (sleepHours.includes('less than 5') || sleepHours.includes('< 5')) {
    wellnessScore += 20;
    wellnessFlags.push('Severe sleep deficit (< 5 hours/night)');
  }

  if (impactStr.includes('substance') || impactStr.includes('alcohol')) {
    wellnessScore += 25;
    wellnessFlags.push('Substance impact identified');
  }

  if (disengagementReason === 'Mental Health Burden' || disengagementReason === 'Personal/Family Issue') {
    wellnessScore += 30;
    wellnessFlags.push(`Disengagement root cause: ${disengagementReason}`);
  }

  wellnessScore = Math.min(100, wellnessScore);
  wellnessLevel = wellnessScore >= 60 ? 'High' : wellnessScore >= 35 ? 'Medium' : 'Low';

  // 2. Academic Disengagement / Disinterest (Differentiating root causes)
  let disengagementScore = 10;
  let disengagementLevel = 'Low';
  let rootCause = disengagementReason !== 'None' ? disengagementReason : 'None';
  const disengagementFlags = [];

  const isExplicitDisinterest =
    interestLower.includes('low') ||
    interestLower.includes('lost') ||
    interestLower.includes('disengaged') ||
    interestLower.includes('hate') ||
    interestLower.includes('not interested') ||
    interestLower.includes('no interest') ||
    disengagementReason === 'Low Study Interest';

  if (isExplicitDisinterest) {
    disengagementScore += 50;
    disengagementFlags.push('Loss of study motivation / disengagement');
    if (rootCause === 'None') rootCause = 'Low Study Interest';
  }

  if (disengagementReason === 'Mental Health Burden') {
    disengagementScore += 40;
    rootCause = 'Mental Health Burden';
    disengagementFlags.push('Disengagement rooted in emotional distress');
  } else if (disengagementReason === 'Financial Stress') {
    disengagementScore += 35;
    rootCause = 'Financial Stress';
    disengagementFlags.push('Disengagement rooted in fee / financial inability');
  } else if (disengagementReason === 'Personal/Family Issue') {
    disengagementScore += 30;
    rootCause = 'Personal/Family Issue';
    disengagementFlags.push('Disengagement rooted in external personal obligations');
  }

  if (abilityToStudy.includes('struggling') || abilityToStudy.includes('distraction') || abilityToStudy.includes('poor environment')) {
    disengagementScore += 15;
    disengagementFlags.push('Impaired study environment');
  }

  disengagementScore = Math.min(100, disengagementScore);
  disengagementLevel = disengagementScore >= 60 ? 'High' : disengagementScore >= 35 ? 'Medium' : 'Low';

  // 3. Financial / External Stressors (Tuition, living expenses, family obligations, commute/work)
  let financialScore = 10;
  let financialLevel = 'Low';
  const financialFlags = [];

  if (financialStress.includes('severe') || financialStress.includes('critical') || financialStress.includes('high')) {
    financialScore += 60;
    financialFlags.push('High / severe tuition and fee anxiety');
  } else if (financialStress.includes('moderate') || financialStress.includes('manageable') || financialStress.includes('yes')) {
    financialScore += 30;
    financialFlags.push('Moderate financial stress');
  }

  if (familyIncome.includes('below') || familyIncome.includes('15,000') || familyIncome.includes('30,000') || familyIncome.includes('poor')) {
    financialScore += 25;
    financialFlags.push('Constrained family income bracket');
  }

  if (partTimeJob.includes('full') || partTimeJob.includes('heavy') || partTimeJob.includes('20+')) {
    financialScore += 20;
    financialFlags.push('Heavy part-time employment workload');
  }

  if (commuteTime.includes('more than 2') || commuteTime.includes('2 hours')) {
    financialScore += 15;
    financialFlags.push('Long daily commute burden (> 2 hours)');
  }

  financialScore = Math.min(100, financialScore);
  financialLevel = financialScore >= 60 ? 'High' : financialScore >= 35 ? 'Medium' : 'Low';

  return {
    wellness: {
      score: wellnessScore,
      level: wellnessLevel,
      details: wellnessFlags.join('; ') || 'Normal wellness indicators',
    },
    disengagement: {
      score: disengagementScore,
      level: disengagementLevel,
      details: disengagementFlags.join('; ') || 'Active engagement',
      rootCause,
    },
    financial: {
      score: financialScore,
      level: financialLevel,
      details: financialFlags.join('; ') || 'Stable financial standing',
    },
    raw: {
      isExplicitDisinterest,
      hasWellnessDistress: wellnessLevel !== 'Low' || mentalHealth.includes('anxious') || mentalHealth.includes('stressed') || mentalHealth.includes('depressed') || sleepHours.includes('less than 5'),
      hasFinancialStress: financialLevel !== 'Low' || disengagementReason === 'Financial Stress',
      hasStudyInterest: !interestLower.includes('low') && !interestLower.includes('lost') && !interestLower.includes('disengaged') && disengagementReason !== 'Low Study Interest',
      rootCause,
    },
  };
}

/**
 * Runs the Decision Matrix conditionals to assign automated workflows:
 * Case A: Lack of Interest / Mental Health / Disengagement -> Assign Counselor, Create Log, Strict Isolation (no academic penalty)
 * Case B: Student has Interest, but cannot study due to Financial Issues -> College Fund Allocation, "Pending Institutional Support"
 * Case C: Mixed / Purely Academic Issues -> Route to Academic Plan Module
 */
function evaluateDecisionMatrix(data, nonAcademic) {
  const cgpa = Number(data.cgpa ?? data.latestMarks ?? 0);
  const attendance = Number(data.attendancePercentage ?? data.attendance ?? 100);
  const backlogs = String(data.activeBacklogs || '');
  const isBacklogPresent = backlogs.includes('1') || backlogs.includes('2') || backlogs.includes('3') || backlogs.includes('backlog');
  const isAcademicIssue = cgpa < 6.5 || attendance < 75 || isBacklogPresent;

  const { raw, wellness, disengagement, financial } = nonAcademic;

  // -------------------------------------------------------------
  // Case A: Lack of Interest due to Non-Academic Reasons / Mental Health / Disengagement
  // Condition: Student shows lack of interest, low engagement, or mental wellness struggles.
  // -------------------------------------------------------------
  const isCaseA = raw.hasWellnessDistress || raw.isExplicitDisinterest || raw.rootCause === 'Mental Health Burden' || raw.rootCause === 'Low Study Interest' || raw.rootCause === 'Personal/Family Issue';

  if (isCaseA) {
    const isSevere = wellness.level === 'High' || disengagement.level === 'High';
    const riskLevel = isSevere ? 'High Risk' : 'Medium Risk';
    const riskCategory = wellness.score >= disengagement.score ? 'Wellness & Mental Health' : 'Academic Disengagement';
    const primaryRiskCategory = wellness.score >= disengagement.score ? 'WELLNESS' : 'DISENGAGEMENT';

    return {
      evaluationCase: 'CASE_A_WELLNESS_DISENGAGEMENT',
      riskLevel,
      riskCategory,
      primaryRiskCategory,
      assignedRole: 'COUNSELOR',
      nonAcademicRisk: { wellness, disengagement, financial },
      recommendedActions: {
        assignCounselor: true,
        escalateToCounselor: true,
        createCounselingLog: true,
        // Strict Isolation: Do NOT trigger an academic penalty plan; redirect to supportive counseling first
        suppressAcademicPenalty: true,
        routeToAcademicPlan: false,
        enableRemedialQuiz: false,
        matchPeerTutor: false,
        assignTeacherMentor: true,
        grantFinancialAid: false,
        requestCollegeFund: false,
      },
      aiRecommendations: [
        'Assign dedicated Counselor from registered roster.',
        'Create confidential Counseling Log with student background context.',
        'Strict Isolation Enforced: Academic penalties suppressed — redirecting to supportive counseling first.',
      ],
    };
  }

  // -------------------------------------------------------------
  // Case B: Student has Interest, but cannot study due to Financial Issues
  // Condition: Student displays interest/motivation, but performance/attendance is dropping due to verified financial stress.
  // -------------------------------------------------------------
  const isCaseB = (raw.hasStudyInterest || raw.rootCause === 'Financial Stress') && raw.hasFinancialStress;

  if (isCaseB) {
    const isHigh = financial.level === 'High';
    return {
      evaluationCase: 'CASE_B_FINANCIAL_STRESS',
      riskLevel: isHigh ? 'High Risk' : 'Medium Risk',
      riskCategory: 'Financial Strain',
      primaryRiskCategory: 'FINANCIAL',
      assignedRole: 'FINANCIAL_AID',
      nonAcademicRisk: { wellness, disengagement, financial },
      recommendedActions: {
        assignCounselor: false,
        escalateToCounselor: false,
        // Trigger College Fund Allocation & mark status as "Pending Institutional Support"
        requestCollegeFund: true,
        grantFinancialAid: true,
        markPendingInstitutionalSupport: true,
        routeToAcademicPlan: false,
        suppressAcademicPenalty: true,
        enableRemedialQuiz: false,
        matchPeerTutor: false,
        assignTeacherMentor: false,
      },
      aiRecommendations: [
        'Allocate Emergency College Fund / Tuition Relief Grant.',
        'Mark student status as "Pending Institutional Support" to protect enrollment.',
        'Expedite financial relief review with College Administration.',
      ],
    };
  }

  // -------------------------------------------------------------
  // Case C: Mixed / Purely Academic Issues
  // Condition: Student issues are strictly related to subject difficulty, attendance gaps, or failing marks.
  // -------------------------------------------------------------
  if (isAcademicIssue) {
    const isCritical = cgpa < 4.5 || attendance < 60 || backlogs.includes('3');
    return {
      evaluationCase: 'CASE_C_PURE_ACADEMIC',
      riskLevel: isCritical ? 'High Risk' : 'Medium Risk',
      riskCategory: 'Academic Concern',
      primaryRiskCategory: 'ACADEMIC',
      assignedRole: 'TEACHER',
      nonAcademicRisk: { wellness, disengagement, financial },
      recommendedActions: {
        // Route student data directly to Academic Plan Module for CGPA recovery and backlog tracking
        routeToAcademicPlan: true,
        enableRemedialQuiz: true,
        matchPeerTutor: true,
        assignTeacherMentor: true,
        assignCounselor: false,
        escalateToCounselor: false,
        requestCollegeFund: false,
        grantFinancialAid: false,
        suppressAcademicPenalty: false,
      },
      aiRecommendations: [
        'Route directly to Academic Plan Module for customized study schedule.',
        'Enroll in core subject remedial classes and backlog recovery milestones.',
        'Assign peer mentor and weekly CGPA tracking.',
      ],
    };
  }

  // Case: No Policy Risk / Stable Student
  return {
    evaluationCase: 'NONE',
    riskLevel: 'Low Risk',
    riskCategory: 'None',
    primaryRiskCategory: 'NONE',
    assignedRole: 'TEACHER',
    nonAcademicRisk: { wellness, disengagement, financial },
    recommendedActions: {
      routeToAcademicPlan: false,
      assignCounselor: false,
      escalateToCounselor: false,
      requestCollegeFund: false,
      grantFinancialAid: false,
      suppressAcademicPenalty: false,
      enableRemedialQuiz: false,
      matchPeerTutor: false,
      assignTeacherMentor: false,
    },
    aiRecommendations: ['Maintain standard academic schedule and class participation.'],
  };
}

/**
 * Evaluates student dropout risk considering non-academic categories and running the Decision Matrix.
 * Integrates Gemini AI with fallback to deterministic rule engine.
 */
exports.evaluateStudentRiskWithGemini = async (studentData) => {
  // 1. Calculate non-academic scores and local matrix check
  const nonAcademic = evaluateNonAcademicCategories(studentData);
  const matrixResult = evaluateDecisionMatrix(studentData, nonAcademic);

  // If Gemini AI client is unavailable or API key missing, return deterministic matrix result directly
  if (!ai || !process.env.GEMINI_API_KEY) {
    return matrixResult;
  }

  try {
    const prompt = `
You are an expert educational risk diagnostic engine and student support coordinator.
Evaluate the student dataset strictly adhering to these 3 non-academic categories and decision matrix cases:

NON-ACADEMIC CATEGORIES:
1. Wellness / Mental Health (stress, anxiety, personal issues, sleep deficit)
2. Academic Disengagement / Disinterest (loss of motivation, differentiating root causes)
3. Financial / External Stressors (inability to afford tuition/books, fee worries, commute)

DECISION MATRIX RULES:
- CASE A: Lack of Interest due to Non-Academic Reasons / Mental Health / Disengagement:
  Must assign role "COUNSELOR", set primaryRiskCategory to "WELLNESS" or "DISENGAGEMENT", and specify strict isolation (do NOT assign academic penalty plan).
- CASE B: Student has Interest, but cannot study due to Financial Issues:
  Must assign role "FINANCIAL_AID", set primaryRiskCategory to "FINANCIAL", recommend College Fund Allocation and "Pending Institutional Support".
- CASE C: Purely Academic Issues (Low CGPA/attendance/backlogs with NO major non-academic distress):
  Must assign role "TEACHER", set primaryRiskCategory to "ACADEMIC", route to Academic Plan Module for CGPA recovery.

STUDENT DATASET:
${JSON.stringify(studentData, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            evaluationCase: {
              type: 'STRING',
              enum: ['CASE_A_WELLNESS_DISENGAGEMENT', 'CASE_B_FINANCIAL_STRESS', 'CASE_C_PURE_ACADEMIC', 'NONE'],
            },
            riskLevel: {
              type: 'STRING',
              enum: ['High Risk', 'Medium Risk', 'Low Risk'],
            },
            riskCategory: {
              type: 'STRING',
              enum: [
                'Wellness & Mental Health',
                'Academic Disengagement',
                'Financial Strain',
                'Academic Concern',
                'None',
              ],
            },
            primaryRiskCategory: {
              type: 'STRING',
              enum: ['WELLNESS', 'DISENGAGEMENT', 'FINANCIAL', 'ACADEMIC', 'NONE'],
            },
            assignedRole: {
              type: 'STRING',
              enum: ['COUNSELOR', 'FINANCIAL_AID', 'TEACHER'],
            },
            aiRecommendations: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
          },
          required: [
            'evaluationCase',
            'riskLevel',
            'riskCategory',
            'primaryRiskCategory',
            'assignedRole',
            'aiRecommendations',
          ],
        },
      },
    });

    const rawText = response.text || '';
    const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    // Merge AI insights with calibrated decision matrix actions
    return {
      evaluationCase: parsed.evaluationCase || matrixResult.evaluationCase,
      riskLevel: parsed.riskLevel || matrixResult.riskLevel,
      riskCategory: parsed.riskCategory || matrixResult.riskCategory,
      primaryRiskCategory: parsed.primaryRiskCategory || matrixResult.primaryRiskCategory,
      assignedRole: parsed.assignedRole || matrixResult.assignedRole,
      nonAcademicRisk: nonAcademic,
      recommendedActions: matrixResult.recommendedActions,
      aiRecommendations: Array.isArray(parsed.aiRecommendations) && parsed.aiRecommendations.length > 0
        ? parsed.aiRecommendations
        : matrixResult.aiRecommendations,
    };
  } catch (error) {
    console.warn('[riskService] Gemini AI API encountered error, using deterministic decision matrix:', error.message);
    return matrixResult;
  }
};

exports.evaluateNonAcademicCategories = evaluateNonAcademicCategories;
exports.evaluateDecisionMatrix = evaluateDecisionMatrix;
exports.evaluateFallbackRules = (data) => {
  const nonAcademic = evaluateNonAcademicCategories(data);
  return evaluateDecisionMatrix(data, nonAcademic);
};