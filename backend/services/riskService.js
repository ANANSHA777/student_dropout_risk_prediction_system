require('dotenv').config(); // MUST BE AT THE VERY TOP
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Evaluates student dropout risk considering BOTH academic performance AND survey responses.
 * @param {Object} studentData Complete payload containing CGPA, attendance, and all survey fields.
 * @returns {Promise<Object>} Formatted evaluation containing risk level, category, and recommendations.
 */
exports.evaluateStudentRiskWithGemini = async (studentData) => {
  try {
    const prompt = `
You are an expert educational risk analyst and academic counselor.
Analyze the provided student dataset to evaluate dropout and academic failure risk.

CRITICAL EVALUATION MANDATE:
You MUST give EQUAL WEIGHT to survey self-reports (Mental Health, Financial Strain, Sleep, Workload, Backlogs) alongside hard metrics (CGPA, Attendance).

STUDENT DATASET:
${JSON.stringify(studentData, null, 2)}

STRICT RISK SCORING RULES:
1. HIGH RISK (Risk Level = "High Risk"):
   - Student reports "Depressed / Overwhelmed" mental health OR "High (Severe Financial Strain)" fee worries.
   - CGPA is below 5.0 OR attendance is below 65%.
   - Student has "3+ Backlogs" or substance/addiction impact factors.

2. MEDIUM RISK (Risk Level = "Medium Risk"):
   - Student reports "Anxious / Stressed" mental health OR "Moderate (Manageable)" financial stress.
   - Low course interest ("Low / Lost Interest") or study focus issues.
   - Sleeps "Less than 5 hours" per night or works full-time hours.
   - CGPA is between 5.0 and 6.5 OR attendance is between 65% and 75%.
   - Active backlogs exist (1 - 2 Backlogs).

3. LOW RISK (Risk Level = "Low Risk"):
   - Balanced mental health, low financial stress, CGPA >= 6.5, attendance >= 75%, and no major impact factors.

OUTPUT REQUIREMENTS:
Return ONLY a strictly valid JSON object matching the exact structure below. Do NOT wrap the JSON in markdown code blocks (\`\`\`json). Do NOT add extra text.

{
  "riskLevel": "High Risk" | "Medium Risk" | "Low Risk",
  "riskCategory": "Wellness & Mental Health" | "Financial Strain" | "Academic Concern" | "None",
  "primaryRiskCategory": "WELLNESS" | "FINANCIAL" | "ACADEMIC" | "NONE",
  "aiRecommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3"
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawText = response.text || '';

    // Sanitize response (Strip markdown ticks if returned by the AI)
    const cleanedText = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsedAssessment = JSON.parse(cleanedText);

    return {
      riskLevel: parsedAssessment.riskLevel || 'Low Risk',
      riskCategory: parsedAssessment.riskCategory || 'None',
      primaryRiskCategory: parsedAssessment.primaryRiskCategory || 'NONE',
      aiRecommendations: Array.isArray(parsedAssessment.aiRecommendations) 
        ? parsedAssessment.aiRecommendations 
        : [],
    };
  } catch (error) {
    console.error('Gemini AI Assessment Error, executing fallback evaluation:', error.message);

    // Dynamic Rule-based Fallback in case Gemini API is unreachable or fails parsing
    return evaluateFallbackRules(studentData);
  }
};

/**
 * Fallback Rule Engine if AI API call fails
 */
function evaluateFallbackRules(data) {
  const mental = JSON.stringify(data.wellnessAndLifestyle || data.mentalHealthStatus || '').toLowerCase();
  const financial = JSON.stringify(data.financialAndLogistics || data.financialStress || '').toLowerCase();
  const academic = data.academicPerformance || {};

  const isCriticalMental = mental.includes('depressed') || mental.includes('overwhelmed') || mental.includes('anxious');
  const isCriticalFinancial = financial.includes('high') || financial.includes('severe');
  const isLowAcademic = (academic.cgpa && academic.cgpa < 5.5) || (academic.attendancePercentage && academic.attendancePercentage < 70);

  let riskLevel = 'Low Risk';
  let riskCategory = 'None';
  let primaryRiskCategory = 'NONE';

  if (isCriticalMental) {
    riskLevel = 'High Risk';
    riskCategory = 'Wellness & Mental Health';
    primaryRiskCategory = 'WELLNESS';
  } else if (isCriticalFinancial) {
    riskLevel = 'Medium Risk';
    riskCategory = 'Financial Strain';
    primaryRiskCategory = 'FINANCIAL';
  } else if (isLowAcademic) {
    riskLevel = 'Medium Risk';
    riskCategory = 'Academic Concern';
    primaryRiskCategory = 'ACADEMIC';
  }

  return {
    riskLevel,
    riskCategory,
    primaryRiskCategory,
    aiRecommendations: [
      'Schedule a 1-on-1 counselor check-in.',
      'Review daily study routine and attendance record.',
    ],
  };
}