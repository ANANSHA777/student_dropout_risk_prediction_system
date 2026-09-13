// backend/services/riskService.js
require('dotenv').config(); // MUST BE AT THE VERY TOP
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Evaluates student dropout risk considering BOTH academic performance AND survey responses.
 * @param {Object} studentData Complete payload containing CGPA, attendance, and all survey fields.
 * @returns {Promise<Object>} Formatted evaluation containing risk level, category, assigned role, and recommendations.
 */
exports.evaluateStudentRiskWithGemini = async (studentData) => {
  try {
    const prompt = `
You are an expert educational risk analyst, academic counselor, and diagnostic AI.
Analyze the student dataset below to evaluate academic, non-academic, and dropout risks.

STRICT NON-ACADEMIC & CAUSAL EVALUATION RULES:
1. Low Interest in Studies:
   - If caused by Mental Health / Stress -> Assign Category "Wellness & Mental Health" (WELLNESS), Route to "COUNSELOR".
   - If caused by Financial Strain (wants to study but cannot afford fees/books) -> Assign Category "Financial Strain" (FINANCIAL), Route to "FINANCIAL_AID".
   - If pure disengagement/lack of motivation -> Assign Category "Academic Disengagement" (DISENGAGEMENT), Route to "COUNSELOR".
2. Financial Issues (Interested but struggling financially):
   - High fee stress or job burden -> Assign Category "Financial Strain" (FINANCIAL), Route to "FINANCIAL_AID", Recommend College Emergency Fund / Financial Support Grant.
3. Pure Academic Concerns (Low CGPA/Attendance with no major non-academic stress):
   - Assign Category "Academic Concern" (ACADEMIC), Route to "TEACHER" for Academic Plan.

STUDENT DATASET:
${JSON.stringify(studentData, null, 2)}
`;

    // Enforce JSON structured output using responseSchema in config
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            riskLevel: {
              type: 'STRING',
              enum: ['High Risk', 'Medium Risk', 'Low Risk'],
            },
            riskCategory: {
              type: 'STRING',
              enum: [
                'Wellness & Mental Health',
                'Financial Strain',
                'Academic Disengagement',
                'Academic Concern',
                'None',
              ],
            },
            primaryRiskCategory: {
              type: 'STRING',
              enum: ['WELLNESS', 'FINANCIAL', 'DISENGAGEMENT', 'ACADEMIC', 'NONE'],
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

    // Sanitize response (Strip markdown ticks or control characters if any remain)
    const cleanedText = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsedAssessment = JSON.parse(cleanedText);

    return {
      riskLevel: parsedAssessment.riskLevel || 'Low Risk',
      riskCategory: parsedAssessment.riskCategory || 'None',
      primaryRiskCategory: parsedAssessment.primaryRiskCategory || 'NONE',
      assignedRole: parsedAssessment.assignedRole || 'TEACHER',
      aiRecommendations: Array.isArray(parsedAssessment.aiRecommendations)
        ? parsedAssessment.aiRecommendations
        : [],
    };
  } catch (error) {
    console.error(
      'Gemini AI Assessment Error, executing fallback evaluation:',
      error.message
    );

    // Dynamic Rule-based Fallback in case Gemini API is unreachable or fails parsing
    return evaluateFallbackRules(studentData);
  }
};

/**
 * Fallback Rule Engine if AI API call fails
 */
function evaluateFallbackRules(data) {
  const disengagement = data.disengagementReason || 'None';
  const financial = String(data.financialStress || data.moneyFeeWorries || '').toLowerCase();
  const cgpa = Number(data.cgpa || 0);

  if (disengagement === 'Mental Health Burden' || disengagement === 'Substance Impact') {
    return {
      riskLevel: 'High Risk',
      riskCategory: 'Wellness & Mental Health',
      primaryRiskCategory: 'WELLNESS',
      assignedRole: 'COUNSELOR',
      aiRecommendations: [
        'Assign dedicated mental health counselor.',
        'Schedule confidential check-in.',
      ],
    };
  }

  if (
    disengagement === 'Financial Stress' ||
    financial.includes('high') ||
    financial.includes('severe')
  ) {
    return {
      riskLevel: 'High Risk',
      riskCategory: 'Financial Strain',
      primaryRiskCategory: 'FINANCIAL',
      assignedRole: 'FINANCIAL_AID',
      aiRecommendations: [
        'Process College Financial Assistance / Tuition Support Grant.',
        'Connect with Financial Aid Officer.',
      ],
    };
  }

  if (
    disengagement === 'Low Study Interest' ||
    disengagement === 'Personal/Family Issue'
  ) {
    return {
      riskLevel: 'Medium Risk',
      riskCategory: 'Academic Disengagement',
      primaryRiskCategory: 'DISENGAGEMENT',
      assignedRole: 'COUNSELOR',
      aiRecommendations: [
        'Assign counselor for academic motivation assessment.',
        'Explore career guidance services.',
      ],
    };
  }

  return {
    riskLevel: cgpa < 5.5 ? 'Medium Risk' : 'Low Risk',
    riskCategory: cgpa < 5.5 ? 'Academic Concern' : 'None',
    primaryRiskCategory: cgpa < 5.5 ? 'ACADEMIC' : 'NONE',
    assignedRole: 'TEACHER',
    aiRecommendations: [
      'Monitor weekly attendance.',
      'Draft tailored academic remediation plan.',
    ],
  };
}