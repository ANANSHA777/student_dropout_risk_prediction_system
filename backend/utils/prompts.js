/**
 * Builds the structured prompt for Gemini AI to evaluate dropout risk.
 * 
 * @param {Object} student - Student profile document from MongoDB
 * @param {Array} qualitativeNotes - Array of notes from teachers/counselors
 * @param {Object|null} survey - Latest student self-survey response
 * @returns {String} Formatted prompt string for Gemini API
 */
exports.buildRiskAnalysisPrompt = (student, qualitativeNotes = [], survey = null) => {
  // Format qualitative notes if available
  const formattedNotes = qualitativeNotes.length > 0
    ? qualitativeNotes.map(n => `- [${n.authorRole} | ${n.category}]: ${n.note}`).join('\n')
    : 'No qualitative notes recorded.';

  // Format student self-survey metrics
  const formattedSurvey = survey
    ? `
      - Stress Level (1-5): ${survey.stressLevel || 'N/A'}
      - Financial Stress Level (1-5): ${survey.financialStress || 'N/A'}
      - Personal/Substance Usage: ${survey.personalSubstanceUsage || 'None reported'}
      - Mental Health Self-Report: ${survey.mentalHealthSelfReport || 'N/A'}
      - Additional Personal Notes: ${survey.additionalNotes || 'None'}
    `
    : 'No student self-survey submitted yet.';

  return `
You are an expert AI educational risk diagnostic engine. Analyze the following student profile and self-reported survey to determine their dropout risk level and primary risk category.

### STUDENT DATA
1. **Academic Performance:**
   - GPA: ${student.gpa} / 4.0
   - Attendance Rate: ${student.attendancePercentage}%
   - Assignments Submitted: ${student.assignmentsSubmitted} / ${student.assignmentsTotal}
   - Financial Aid Status: ${student.financialAidStatus}

2. **Teacher & Counselor Qualitative Notes:**
${formattedNotes}

3. **Student Self-Reported Survey (Personal/Stress/Addictions):**
${formattedSurvey}

---

### INSTRUCTIONS FOR EVALUATION:
1. Calculate a \`riskScore\` from 0 to 100 (where 0 is lowest risk and 100 is critical dropout risk).
2. Assign a \`riskLevel\` based on the score:
   - "Low" (0-30)
   - "Medium" (31-65)
   - "High" (66-100)
3. Identify the **\`primaryRiskCategory\`**. You MUST choose strictly from one of these exact uppercase string values:
   - "ACADEMIC" (primarily driven by poor GPA, failed assignments, or learning gaps)
   - "ATTENDANCE" (primarily driven by poor attendance rates)
   - "FINANCIAL" (primarily driven by unpaid fees or financial stress)
   - "PERSONAL" (primarily driven by stress, mental health, substance/addiction issues, or personal notes)
   - "NONE" (if risk is negligible/low)
4. Provide a concise \`summary\` (2-3 sentences) explaining the primary risk drivers.
5. List 2-3 specific \`recommendations\` for institutional intervention.

---

### REQUIRED OUTPUT FORMAT:
You MUST respond strictly with valid JSON. Do not include markdown code block backticks outside the raw JSON object.

{
  "riskScore": 75,
  "riskLevel": "High",
  "primaryRiskCategory": "PERSONAL",
  "summary": "Student exhibits elevated dropout risk due to high self-reported stress levels and personal mental health burdens, despite maintaining moderate academic performance.",
  "recommendations": [
    "Schedule an urgent 1-on-1 counseling session",
    "Provide stress management resources"
  ]
}
  `.trim();
};