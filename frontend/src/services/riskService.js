const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Dynamically evaluates student risk using Google Gemini AI
 * @param {Object} studentData
 * @returns {Promise<Object>} Formatted evaluation containing riskLevel, riskCategory, and recommendations
 */
exports.evaluateStudentRiskWithGemini = async (studentData) => {
  try {
    const prompt = `
      Analyze the following student record and evaluate their risk of dropping out or failing:
      
      - Student Name: ${studentData.name}
      - Attendance: ${studentData.attendancePercentage}%
      - Latest Marks/Grades: ${studentData.latestMarks}%
      - Financial Stress Level: ${studentData.financialStress || 'Not Reported'}
      - Academic Workload Feeling: ${studentData.academicWorkload || 'Not Reported'}
      - Mental Wellbeing Self-Report: ${studentData.mentalHealthStatus || 'Not Reported'}
      - Teacher/Counselor Qualitative Notes: ${studentData.qualitativeNotes || 'None'}

      Provide a clinical and objective assessment based on these factors.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert AI educational risk evaluator. Analyze academic, attendance, financial, and wellness metrics to return an accurate dropout/academic failure risk score.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: {
              type: Type.STRING,
              enum: ['Low', 'Medium', 'High'],
              description: 'Overall calculated risk score for the student.',
            },
            riskCategory: {
              type: Type.STRING,
              enum: ['Academic', 'Attendance', 'Financial/Personal', 'None'],
              description: 'Primary driver triggering the risk flag.',
            },
            aiRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 actionable intervention steps for teachers/counselors.',
            },
            summaryReasoning: {
              type: Type.STRING,
              description: 'Brief 1-sentence justification for the score.',
            },
          },
          required: ['riskLevel', 'riskCategory', 'aiRecommendations', 'summaryReasoning'],
        },
      },
    });

    // Parse structured response text
    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error('Gemini AI Assessment Error:', error);
    // Safe fallback in case of API limits or errors
    return {
      riskLevel: studentData.attendancePercentage < 75 || studentData.latestMarks < 50 ? 'High' : 'Low',
      riskCategory: studentData.attendancePercentage < 75 ? 'Attendance' : 'Academic',
      aiRecommendations: ['Schedule an academic check-in.'],
      summaryReasoning: 'Fallback heuristic rule applied due to AI service unavailability.',
    };
  }
};